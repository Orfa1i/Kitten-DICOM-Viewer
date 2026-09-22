"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

const MAX_DPR = 2
const MAX_BANDS = 12

const VERT_SRC = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform float uHover;
uniform vec3  uBg;
uniform vec3  uTint;
uniform vec3  uFilCol;
uniform float uBands;
uniform float uWidth;
uniform float uFlow;
uniform float uSheen;
uniform float uFilament;

float sat(float x) { return clamp(x, 0.0, 1.0); }

vec3 env(vec3 r) {
    float y = r.y * 0.5 + 0.5;
    vec3 c = mix(vec3(0.90, 0.925, 0.955), vec3(0.455, 0.520, 0.610), pow(sat(1.0 - y), 1.25));
    c = mix(c, vec3(1.0), pow(sat(1.0 - abs(r.y - 0.26) * 3.2), 3.0) * 0.95);
    c = mix(c, vec3(0.300, 0.355, 0.435), pow(sat(1.0 - abs(r.y + 0.42) * 2.6), 2.0) * 0.85);
    c = mix(c, vec3(0.80, 0.845, 0.90), pow(sat(1.0 - abs(r.y + 0.88) * 3.0), 2.0) * 0.5);
    return c;
}

void main() {
    float ar = uRes.x / max(uRes.y, 1.0);
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);
    float t = uTime * 0.16 * uFlow;

    vec3 L = normalize(vec3(
        mix(-0.55, 0.55, uMouse.x) * (0.35 + uHover * 0.65),
        mix(-0.45, 0.75, uMouse.y) * (0.35 + uHover * 0.65) + 0.35,
        0.82
    ));

    vec3 col = mix(uBg, uBg * 0.92, sat(uv.y * 0.9 + 0.05));
    col = mix(col, min(uBg * 1.06, vec3(1.0)), pow(sat(1.0 - length(p - vec2(-0.25, 0.22)) * 1.1), 2.0) * 0.5);

    for (int i = 0; i < ${MAX_BANDS}; i++) {
        if (float(i) >= uBands) break;
        float fi = float(i);
        float ph = fi * 2.6;
        float amp = pow(0.86, fi);

        float py = 0.105 * sin(p.x * 2.15 + 0.6 + ph + t) + 0.185 * sin(p.x * 1.05 - 1.2 + ph * 0.7 - t * 0.6);
        float spacing = 0.62 / max(uBands - 1.0, 1.0);
        py += (fi - (uBands - 1.0) * 0.5) * spacing;
        float dpdx = 0.105 * 2.15 * cos(p.x * 2.15 + 0.6 + ph + t)
                   + 0.185 * 1.05 * cos(p.x * 1.05 - 1.2 + ph * 0.7 - t * 0.6);

        float w = uWidth * (0.190 + 0.070 * sin(p.x * 1.7 + 2.0 + ph)) * amp;
        float s = (p.y - py) / max(w, 1e-3);
        float cov = 1.0 - smoothstep(0.94, 1.0, abs(s));
        if (cov <= 0.001) continue;

        float sc = clamp(s, -1.0, 1.0);
        float nz = sqrt(max(1.0 - sc * sc, 0.0));
        vec2 T2 = normalize(vec2(1.0, dpdx));
        vec3 along = vec3(T2, 0.0);
        vec3 across = vec3(-T2.y, T2.x, 0.0);
        float na = 0.42 * sin(p.x * 6.5 + sc * 2.0 + ph) + 0.16 * sin(p.x * 17.0 - t * 3.0);
        vec3 N = normalize(across * sc + vec3(0.0, 0.0, 1.0) * nz + along * na);

        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 R = reflect(-V, N);
        vec3 base = env(R) * uTint;
        float spec = pow(sat(dot(reflect(-L, N), V)), 48.0);
        float sheen = pow(sat(1.0 - abs(dot(N, V))), 2.4);

        vec3 body = base * (0.86 + 0.18 * sat(dot(N, L)))
                  + vec3(1.0) * spec * 0.85 * uSheen
                  + vec3(0.98, 0.99, 1.0) * sheen * 0.16 * uSheen;

        float k = abs(sc);
        float fil = 0.0;
        fil += exp(-pow((k - 0.885) / 0.014, 2.0));
        fil += 0.70 * exp(-pow((k - 0.945) / 0.009, 2.0));
        fil += 0.45 * exp(-pow((k - 0.560) / 0.010, 2.0));
        fil += 0.30 * exp(-pow((k - 0.330) / 0.008, 2.0));
        fil *= uFilament;
        float lit = 0.35 + 0.65 * sat(dot(N, L));
        body += uFilCol * fil * lit * 1.15;
        body += mix(uFilCol, vec3(1.0), 0.45) * fil * spec * 1.4;

        body *= 0.86 + 0.30 * pow(sat(1.0 - k), 0.7);
        col = mix(col, body, cov * pow(0.92, fi));
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function parseColor(input: string | undefined, fb: [number, number, number]): [number, number, number] {
    if (!input) return fb
    const str = String(input).trim()
    if (str.charAt(0) === "#") {
        let hex = str.slice(1)
        if (hex.length === 3 || hex.length === 4) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        }
        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return [r / 255, g / 255, b / 255]
        }
        return fb
    }
    const m = str.match(/[\d.]+/g)
    if (m && m.length >= 3) {
        return [
            Math.min(255, parseFloat(m[0])) / 255,
            Math.min(255, parseFloat(m[1])) / 255,
            Math.min(255, parseFloat(m[2])) / 255,
        ]
    }
    return fb
}

function num(v: unknown, fb: number): number {
    return typeof v === "number" && isFinite(v) ? v : fb
}

function clampN(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("SatinRibbon shader:", gl.getShaderInfoLog(sh))
        gl.deleteShader(sh)
        return null
    }
    return sh
}

interface RibbonGroup {
    ribbonWidth?: number
    flow?: number
    sheen?: number
    filament?: number
}

interface SatinRibbonProps {
    style?: React.CSSProperties
    background?: string
    ribbonColor?: string
    filamentColor?: string
    bands?: number
    speed?: number
    ribbon?: RibbonGroup
    hover?: number
    width?: number
    height?: number
}

// ribbonWidth, not width — Framer injects a numeric `width` prop of its own.
const RIBBON_DEFAULTS: Required<RibbonGroup> = {
    ribbonWidth: 100,
    flow: 100,
    sheen: 100,
    filament: 100,
}

export default function SatinRibbon(props: SatinRibbonProps) {
    const {
        style,
        background = "#000000",
        ribbonColor = "#9C00FA",
        filamentColor = "#DBA84E",
        bands = 4,
        speed = 51,
        ribbon,
        hover = 200,
        width,
        height,
    } = props

    const rib = { ...RIBBON_DEFAULTS, ...(ribbon || {}) }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const sizeRef = useRef({ w: 0, h: 0 })
    sizeRef.current = { w: num(width, 0), h: num(height, 0) }

    const vRef = useRef({
        bg: "#E9EEF4",
        tint: "#F2F6FA",
        fil: "#DBA84E",
        bands: 2,
        speed: 1,
        rw: 1,
        flow: 1,
        sheen: 1,
        filament: 1,
        hover: 1,
    })
    vRef.current = {
        bg: background,
        tint: ribbonColor,
        fil: filamentColor,
        bands: Math.round(clampN(num(bands, 10), 1, MAX_BANDS)),
        speed: clampN(num(speed, 50), 0, 100) / 50,
        rw: clampN(num(rib.ribbonWidth, 100), 40, 220) / 100,
        flow: clampN(num(rib.flow, 100), 0, 250) / 100,
        sheen: clampN(num(rib.sheen, 100), 0, 200) / 100,
        filament: clampN(num(rib.filament, 100), 0, 200) / 100,
        hover: clampN(num(hover, 100), 0, 200) / 100,
    }

    const ptrRef = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: 0, onTarget: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false })
        if (!gl) {
            console.error("SatinRibbon: WebGL unavailable")
            return
        }

        const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC)
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
        if (!vs || !fs) return
        const prog = gl.createProgram()
        if (!prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error("SatinRibbon link:", gl.getProgramInfoLog(prog))
            return
        }
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const posLoc = gl.getAttribLocation(prog, "a_pos")
        gl.enableVertexAttribArray(posLoc)
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

        const locs: Record<string, WebGLUniformLocation | null> = {}
        const u = (name: string) => {
            if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name)
            return locs[name]
        }

        let raf = 0
        let last = performance.now()
        let clock = 0

        const render = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const v = vRef.current

            clock = (clock + dt * v.speed) % 3600

            const ptr = ptrRef.current
            const k = 1 - Math.exp(-6 * dt)
            ptr.on += (ptr.onTarget - ptr.on) * k
            ptr.x += ((ptr.onTarget > 0 ? ptr.tx : 0.5) - ptr.x) * k
            ptr.y += ((ptr.onTarget > 0 ? ptr.ty : 0.5) - ptr.y) * k

            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
            const cw = sizeRef.current.w || canvas.clientWidth || 1200
            const ch = sizeRef.current.h || canvas.clientHeight || 800
            const bw = Math.max(1, Math.round(cw * dpr))
            const bh = Math.max(1, Math.round(ch * dpr))
            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw
                canvas.height = bh
            }
            gl.viewport(0, 0, bw, bh)

            const bg = parseColor(v.bg, [0.914, 0.933, 0.957])
            const tint = parseColor(v.tint, [0.949, 0.965, 0.98])
            const fil = parseColor(v.fil, [0.859, 0.659, 0.306])

            gl.uniform2f(u("uRes"), bw, bh)
            gl.uniform1f(u("uTime"), clock)
            gl.uniform2f(u("uMouse"), ptr.x, 1 - ptr.y)
            gl.uniform1f(u("uHover"), Math.min(1, ptr.on) * v.hover)
            gl.uniform3f(u("uBg"), bg[0], bg[1], bg[2])
            gl.uniform3f(u("uTint"), tint[0], tint[1], tint[2])
            gl.uniform3f(u("uFilCol"), fil[0], fil[1], fil[2])
            gl.uniform1f(u("uBands"), v.bands)
            gl.uniform1f(u("uWidth"), v.rw)
            gl.uniform1f(u("uFlow"), v.flow)
            gl.uniform1f(u("uSheen"), v.sheen)
            gl.uniform1f(u("uFilament"), v.filament)

            gl.drawArrays(gl.TRIANGLES, 0, 3)
            raf = requestAnimationFrame(render)
        }

        const track = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            if (r.width <= 0 || r.height <= 0) return
            ptrRef.current.tx = clampN((e.clientX - r.left) / r.width, 0, 1)
            ptrRef.current.ty = clampN((e.clientY - r.top) / r.height, 0, 1)
            ptrRef.current.onTarget = 1
        }
        const onLeave = () => {
            ptrRef.current.onTarget = 0
        }

        canvas.addEventListener("pointermove", track)
        canvas.addEventListener("pointerenter", track)
        canvas.addEventListener("pointerleave", onLeave)
        raf = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(raf)
            canvas.removeEventListener("pointermove", track)
            canvas.removeEventListener("pointerenter", track)
            canvas.removeEventListener("pointerleave", onLeave)
        }
    }, [])

    return (
        <div
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                minWidth: 1200,
                minHeight: 800,
                width: typeof width === "number" && width > 0 ? width : "100%",
                height: typeof height === "number" && height > 0 ? height : "100%",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}