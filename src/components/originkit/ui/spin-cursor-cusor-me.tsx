// Originkit preset `cusor-me` — calibrated for Kitten Medical Platform.
"use client";

import { useEffect, useMemo, useRef } from "react";

type MagicCursorProps = {
  label?: boolean;
  labelText?: string;
  labelColor?: string;
  labelFont?: React.CSSProperties;
  fillColor?: string;
  cursorSize?: number;
  enableStretch?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  glowIntensity?: number;
  style?: React.CSSProperties;
};

const DEFAULT_LABEL_FONT: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "48px",
  lineHeight: "1.5em",
  letterSpacing: "0em",
  textAlign: "left",
};

const CLICK_EFFECT = true;
const GLOW_CORE_PX = 6;
const GLOW_BLOOM_PX = 18;

const FOLLOW_TAU = 0.02;
const VELOCITY_TAU = 0.05;

const ARROW = "M0,0 L18,11 L9,13 L6,21 Z";
const ARROW_W = 18;
const ARROW_H = 21;
const ARROW_REST = Math.atan2(-15, -12);

function angleDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function __OriginkitBase_MagicCursor({
  fillColor = "#FFFFFF",
  cursorSize = 32,
  enableStretch = true,
  enableGlow = true,
  glowColor = "#8D321F",
  glowIntensity = 65,
  label = false,
  labelText = "",
  labelColor = "rgba(255, 255, 255)",
  labelFont,
  style,
}: MagicCursorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const glowFilter = useMemo(() => {
    if (!enableGlow) return "none";
    const t = Math.max(0, Math.min(100, glowIntensity)) / 100;
    const core = (GLOW_CORE_PX * t).toFixed(2);
    const bloom = (GLOW_BLOOM_PX * t).toFixed(2);
    return `drop-shadow(0 0 ${core}px ${glowColor}) drop-shadow(0 0 ${bloom}px ${glowColor})`;
  }, [enableGlow, glowColor, glowIntensity]);

  const live = useRef({ cursorSize, enableStretch });
  live.current = { cursorSize, enableStretch };

  const resolvedLabelFont = { ...DEFAULT_LABEL_FONT, ...labelFont };

  useEffect(() => {
    const host = hostRef.current;
    const frameEl = frameRef.current;
    if (!host || !frameEl) return;

    const tag = document.createElement("style");
    tag.textContent = `*, a, button, [role="button"] { cursor: none !important; }`;
    let cursorHidden = false;
    const hideNativeCursor = (hide: boolean) => {
      if (hide === cursorHidden) return;
      cursorHidden = hide;
      if (hide) document.head.appendChild(tag);
      else tag.remove();
    };

    let targetX = -9999;
    let targetY = -9999;
    let x = targetX;
    let y = targetY;
    let vx = 0;
    let vy = 0;
    let angle = 0;
    let pressed = 0;
    let down = false;
    let seen = false;
    let inside = false;

    const onMove = (e: PointerEvent) => {
      const rect = frameEl.getBoundingClientRect();
      const over =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      hideNativeCursor(over);
      if (!over) {
        inside = false;
        return;
      }
      const sx = rect.width > 0 ? frameEl.clientWidth / rect.width : 1;
      const sy = rect.height > 0 ? frameEl.clientHeight / rect.height : 1;
      targetX = (e.clientX - rect.left) * sx;
      targetY = (e.clientY - rect.top) * sy;
      if (!seen || !inside) {
        x = targetX;
        y = targetY;
        vx = 0;
        vy = 0;
        seen = true;
      }
      inside = true;
    };
    const onWindowLeave = () => {
      inside = false;
      hideNativeCursor(false);
    };
    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onWindowLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const p = live.current;

      const followEase = 1 - Math.exp(-dt / FOLLOW_TAU);
      const prevX = x;
      const prevY = y;
      x += (targetX - x) * followEase;
      y += (targetY - y) * followEase;

      if (dt > 0) {
        const vEase = 1 - Math.exp(-dt / VELOCITY_TAU);
        vx += ((x - prevX) / dt - vx) * vEase;
        vy += ((y - prevY) / dt - vy) * vEase;
      }

      const speed = Math.hypot(vx, vy);

      if (speed > 40) {
        const target = Math.atan2(vy, vx) - ARROW_REST;
        angle += angleDelta(angle, target) * (1 - Math.exp(-dt / 0.06));
      }

      const stretch = p.enableStretch ? 1 + Math.min(speed / 3000, 0.35) : 1;
      const squash = p.enableStretch ? 1 / Math.sqrt(stretch) : 1;

      const clickTarget = CLICK_EFFECT && down ? 1 : 0;
      pressed += (clickTarget - pressed) * (1 - Math.exp(-dt / 0.05));
      const press = 1 - pressed * 0.2;

      const s = (p.cursorSize / ARROW_H) * press;
      host.style.opacity = seen && inside ? "1" : "0";
      host.style.transform =
        `translate(${x}px, ${y}px) ` +
        `rotate(${angle}rad) ` +
        `scale(${s * squash}, ${s * stretch})`;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      hideNativeCursor(false);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onWindowLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const arrow = (
    <svg
      width={ARROW_W}
      height={ARROW_H}
      viewBox={`0 0 ${ARROW_W} ${ARROW_H}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d={ARROW}
        fill={fillColor}
        stroke="rgba(0,0,0,0.22)"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
    </svg>
  );

  const labelNode = label && labelText ? (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        whiteSpace: "pre",
        pointerEvents: "none",
        userSelect: "none",
        ...resolvedLabelFont,
        color: labelColor,
      }}
    >
      {labelText}
    </div>
  ) : null;

  return (
    <div
      ref={frameRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
        ...style,
      }}
    >
      {labelNode}
      <div
        ref={hostRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transformOrigin: "0 0",
          opacity: 0,
          pointerEvents: "none",
          willChange: "transform",
          filter: glowFilter,
        }}
      >
        {arrow}
      </div>
    </div>
  );
}

const __originkitPresetProps = {
  fillColor: "#FFFFFF",
  cursorSize: 32,
  enableStretch: true,
  enableGlow: true,
  glowColor: "#8D321F",
  glowIntensity: 65,
  label: false,
  labelText: "",
  labelColor: "#FFFFFF",
  labelFont: {
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
  } as React.CSSProperties,
};

export default function MagicCursor(props: Record<string, unknown>) {
  return <__OriginkitBase_MagicCursor {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
