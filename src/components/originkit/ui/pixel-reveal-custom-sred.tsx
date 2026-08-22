// Originkit preset `custom-sred` — calibrated for Kitten Medical Workstation.
"use client"

import { useEffect, useRef } from "react"

const FALLBACK_IMG = "/assets/images/model_knee_osteoarthritis.png"

// One place every control default lives, so the panel and defaultProps agree.
const DEFAULTS = {
    background: "#8D321F",
    yPosition: 50,
    columns: 48,
    radius: 220,
    fade: 18,
    zoom: 105,
    palette: ["#FFFFFF", "#F5EBE6", "#444345", "#2C120C"],
}

// A cell's energy decides what is drawn there: the image at the top of the
// range, the palette across the band below it, then nothing.
const IMAGE_AT = 0.45
const BLOCK_FLOOR = 0.24
// Only this share of the faintest cells light up at all, which is what keeps
// the edge of the trail ragged instead of a clean disc.
const INK_CHANCE = 0.3
// Energy lost per second at each end of the Fade slider.
const FADE_MIN = 0.1
const FADE_MAX = 2
const MAX_COLORS = 5
// Cells overlap by a fraction of a pixel — a seam shows between them otherwise.
const OVERLAP = 0.4

// A cell's fixed random value. Deterministic, so the same cell keeps the same
// brightness and the same place in the ragged edge from frame to frame.
function hash(x: number, y: number, s: number) {
    let h =
        Math.imul(x | 0, 374761393) +
        Math.imul(y | 0, 668265263) +
        Math.imul(s | 0, 1274126177)
    h = Math.imul(h ^ (h >>> 13), 1103515245)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
}

function clamp(n: any, min: number, max: number, fallback: number) {
    const v = typeof n === "number" ? n : parseFloat(n)
    if (!Number.isFinite(v)) return fallback
    return Math.min(max, Math.max(min, v))
}

function imageURL(value: any): string {
    if (!value) return ""
    if (typeof value === "string") return value
    return value.src || value.url || ""
}

function settingsFor(p: any) {
    return {
        background: p?.background ?? DEFAULTS.background,
        columns: Math.round(clamp(p?.columns, 8, 64, DEFAULTS.columns)),
        radius: clamp(p?.radius, 40, 450, DEFAULTS.radius),
        fade:
            FADE_MIN +
            ((clamp(p?.fade, 1, 50, DEFAULTS.fade) - 1) / 49) *
                (FADE_MAX - FADE_MIN),
        zoom: clamp(p?.zoom, 100, 150, DEFAULTS.zoom) / 100,
        yPosition: clamp(p?.yPosition, 0, 100, DEFAULTS.yPosition) / 100,
        palette: paletteOf(p?.palette),
    }
}

function paletteOf(value: any): string[] {
    const list = (Array.isArray(value) ? value : DEFAULTS.palette)
        .slice(0, MAX_COLORS)
        .filter((c: any) => typeof c === "string" && c)
    return list.length ? list : DEFAULTS.palette
}

interface PixelRevealProps {
    image?: string | { src?: string; url?: string; alt?: string }
    yPosition?: number
    palette?: string[]
    background?: string
    columns?: number
    radius?: number
    fade?: number
    zoom?: number
    style?: React.CSSProperties
}

/**
 * Pixel Reveal — interactive canvas background for Kitten Medical Landing Page.
 */
function __OriginkitBase_PixelReveal(props: PixelRevealProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const isStatic = false

    const propsRef = useRef(props)
    propsRef.current = props

    const apiRef = useRef<{
        redrawImage: () => void
        rebuildGrid: () => void
        seedTrail: () => void
    } | null>(null)

    const imageSrc = imageURL(props.image) || FALLBACK_IMG
    const S = settingsFor(props)

    useEffect(() => {
        const root = rootRef.current
        const canvas = canvasRef.current
        if (!root || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const SEED = 1

        let W = 0
        let H = 0
        let dpr = 1
        let cols = 0
        let rows = 0
        let cell = 0
        let energies = new Float32Array(0)
        let ready = false
        let interacted = false

        const pointer = { x: -1e4, y: -1e4, active: false }
        const off = document.createElement("canvas")
        let img = new Image()

        function redrawImage() {
            if (!ready || !W) return
            const c = off.getContext("2d")
            if (!c) return
            const L = settingsFor(propsRef.current)
            c.setTransform(dpr, 0, 0, dpr, 0, 0)
            c.clearRect(0, 0, W, H)

            const base =
                Math.max(W / (img.naturalWidth || 800), H / (img.naturalHeight || 600)) * L.zoom
            const dw = (img.naturalWidth || 800) * base
            const dh = (img.naturalHeight || 600) * base
            c.drawImage(
                img,
                W / 2 - dw / 2,
                H * L.yPosition - dh * L.yPosition,
                dw,
                dh
            )
        }

        function rebuildGrid() {
            if (!W || !H) return
            cols = settingsFor(propsRef.current).columns
            cell = W / cols
            rows = Math.ceil(H / cell)
            energies = new Float32Array(cols * rows)
        }

        function resize() {
            if (!root || !canvas || !ctx) return
            const r = root.getBoundingClientRect()
            if (!r.width || !r.height) return
            dpr = Math.min(2, window.devicePixelRatio || 1)
            W = r.width
            H = r.height
            canvas.width = Math.round(W * dpr)
            canvas.height = Math.round(H * dpr)
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            off.width = canvas.width
            off.height = canvas.height
            rebuildGrid()
            redrawImage()
            if (isStatic || !interacted) seedTrail()
        }

        function injectAt(px: number, py: number, strength: number) {
            const radius = settingsFor(propsRef.current).radius
            for (let iy = 0; iy < rows; iy++)
                for (let ix = 0; ix < cols; ix++) {
                    const cx = (ix + 0.5) * cell
                    const cy = (iy + 0.5) * cell
                    const dist = Math.hypot(cx - px, cy - py)
                    const r = hash(ix, iy, SEED)
                    const e =
                        clamp(1 - dist / radius, 0, 1, 0) *
                        (0.75 + r * 0.5) *
                        strength
                    const i = iy * cols + ix
                    if (e > energies[i]) energies[i] = e
                }
        }

        function render(dt: number) {
            if (!ctx) return
            ctx.clearRect(0, 0, W, H)
            if (!ready) return
            const L = settingsFor(propsRef.current)

            for (let iy = 0; iy < rows; iy++)
                for (let ix = 0; ix < cols; ix++) {
                    const i = iy * cols + ix
                    let e = energies[i]

                    if (pointer.active) {
                        const cx = (ix + 0.5) * cell
                        const cy = (iy + 0.5) * cell
                        const dist = Math.hypot(
                            cx - pointer.x,
                            cy - pointer.y
                        )
                        const r = hash(ix, iy, SEED)
                        e = Math.max(
                            e,
                            clamp(1 - dist / L.radius, 0, 1, 0) *
                                (0.75 + r * 0.5)
                        )
                    }

                    e = Math.max(0, e - dt * L.fade)
                    energies[i] = e
                    if (e <= BLOCK_FLOOR) continue

                    const x = ix * cell
                    const y = iy * cell
                    if (e > IMAGE_AT) {
                        ctx.drawImage(
                            off,
                            x * dpr,
                            y * dpr,
                            cell * dpr,
                            cell * dpr,
                            x,
                            y,
                            cell + OVERLAP,
                            cell + OVERLAP
                        )
                    } else {
                        const n = L.palette.length
                        const t = (e - BLOCK_FLOOR) / (IMAGE_AT - BLOCK_FLOOR)
                        const step = Math.min(
                            n - 1,
                            Math.max(0, Math.floor((1 - t) * n))
                        )
                        const thinBelow = n === 1 ? 0.5 : 1 / n
                        if (t < thinBelow && hash(ix, iy, SEED) >= INK_CHANCE)
                            continue
                        ctx.fillStyle = L.palette[step]
                        ctx.fillRect(x, y, cell + OVERLAP, cell + OVERLAP)
                    }
                }
        }

        function seedTrail() {
            if (!ready || !W || !energies.length) return
            energies.fill(0)
            const steps = 34
            for (let k = 0; k < steps; k++) {
                const u = k / (steps - 1)
                const px = W * (0.18 + 0.64 * u)
                const py =
                    H * (0.55 - 0.25 * u + 0.12 * Math.sin(u * Math.PI * 1.6))
                injectAt(px, py, 0.45 + 0.55 * u)
            }
            if (isStatic) {
                pointer.active = false
                render(0)
            }
        }

        apiRef.current = { redrawImage, rebuildGrid, seedTrail }

        function loadImage(src: string) {
            ready = false
            const next = new Image()
            next.onload = () => {
                img = next
                ready = true
                redrawImage()
                if (isStatic || !interacted) seedTrail()
            }
            next.onerror = () => {
                if (src === FALLBACK_IMG) return
                loadImage(FALLBACK_IMG)
            }
            next.src = src
        }
        loadImage(imageURL(propsRef.current?.image) || FALLBACK_IMG)

        const ro = new ResizeObserver(resize)
        ro.observe(root)
        resize()

        const onMove = (e: PointerEvent) => {
            interacted = true
            const r = canvas.getBoundingClientRect()
            pointer.x = e.clientX - r.left
            pointer.y = e.clientY - r.top
            pointer.active = true
        }
        const onLeave = () => {
            pointer.active = false
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)

        let raf = 0
        let last = performance.now()
        function loop(now: number) {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            render(dt)
            raf = window.requestAnimationFrame(loop)
        }
        raf = window.requestAnimationFrame(loop)

        return () => {
            window.cancelAnimationFrame(raf)
            ro.disconnect()
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            apiRef.current = null
        }
    }, [isStatic, imageSrc])

    useEffect(() => {
        apiRef.current?.rebuildGrid()
        apiRef.current?.seedTrail()
    }, [S.columns])

    useEffect(() => {
        apiRef.current?.redrawImage()
    }, [S.zoom, S.yPosition])

    return (
        <div
            ref={rootRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: S.background,
                ...(props.style || {}),
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

PixelReveal.displayName = "Pixel Reveal"
PixelReveal.defaultProps = { ...DEFAULTS }

const __originkitPresetProps = {
  "image": {
    "alt": "Kitten Diagnostic Radiograph",
    "src": "/assets/images/model_knee_osteoarthritis.png"
  },
  "yPosition": 50,
  "palette": [
    "#FFFFFF",
    "#F5EBE6",
    "#D97706",
    "#444345"
  ],
  "background": "#8D321F",
  "columns": 48,
  "radius": 220,
  "fade": 18,
  "zoom": 105
};

export default function PixelReveal(props: Record<string, unknown>) {
  return <__OriginkitBase_PixelReveal {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
