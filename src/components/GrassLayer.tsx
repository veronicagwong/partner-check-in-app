import React from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const BACK_COLOR  = '#A6B886';  // lighter, muted sage — recedes into background
const FRONT_COLOR = '#5E7848';  // darker, richer green — pops into foreground
const GROW_DUR    = 0.65;
const STAGGER     = 0.08;

// ── Blade config ──────────────────────────────────────────────────────────────

interface BladeConfig {
  xPct:      number;   // horizontal position 0–100% of screen
  h:         number;   // height px
  w:         number;   // base width px
  lean:      number;   // tip lean (negative = left, positive = right)
  swayDur:   number;   // sway period s
  swayAmp:   number;   // sway amplitude deg
  swayPhase: number;   // phase offset s so blades don't move in sync
}

// Back layer — bell curve heights: tallest at center, shortest at edges
const BACK_BLADES: BladeConfig[] = [
  { xPct: 15,  h: 26, w: 5, lean: -0.20, swayDur: 3.2, swayAmp: 3, swayPhase: 0.00 },
  { xPct: 22,  h: 33, w: 6, lean:  0.15, swayDur: 2.9, swayAmp: 4, swayPhase: 0.50 },
  { xPct: 31,  h: 40, w: 6, lean: -0.10, swayDur: 3.5, swayAmp: 3, swayPhase: 1.00 },
  { xPct: 40,  h: 46, w: 7, lean:  0.25, swayDur: 2.7, swayAmp: 4, swayPhase: 0.30 },
  { xPct: 50,  h: 50, w: 7, lean: -0.15, swayDur: 3.8, swayAmp: 3, swayPhase: 0.70 },
  { xPct: 60,  h: 45, w: 7, lean:  0.10, swayDur: 3.0, swayAmp: 4, swayPhase: 0.20 },
  { xPct: 69,  h: 38, w: 6, lean: -0.20, swayDur: 3.3, swayAmp: 3, swayPhase: 0.90 },
  { xPct: 78,  h: 30, w: 5, lean:  0.30, swayDur: 2.8, swayAmp: 4, swayPhase: 0.40 },
  { xPct: 85,  h: 24, w: 5, lean: -0.12, swayDur: 3.6, swayAmp: 3, swayPhase: 0.60 },
];

// Front layer — bell curve heights: tallest at center, shortest at edges
const FRONT_BLADES: BladeConfig[] = [
  { xPct: 18,  h: 52, w:  8, lean: -0.30, swayDur: 3.2, swayAmp: 4, swayPhase: 0.10 },
  { xPct: 27,  h: 72, w: 10, lean:  0.20, swayDur: 2.8, swayAmp: 3, swayPhase: 0.60 },
  { xPct: 37,  h: 90, w: 11, lean: -0.15, swayDur: 3.0, swayAmp: 3, swayPhase: 1.20 },
  { xPct: 47,  h: 100,w: 12, lean:  0.10, swayDur: 2.6, swayAmp: 3, swayPhase: 0.40 },
  { xPct: 57,  h: 96, w: 12, lean:  0.20, swayDur: 3.4, swayAmp: 4, swayPhase: 0.90 },
  { xPct: 67,  h: 80, w: 10, lean:  0.35, swayDur: 2.9, swayAmp: 3, swayPhase: 0.20 },
  { xPct: 76,  h: 60, w:  9, lean: -0.25, swayDur: 3.5, swayAmp: 5, swayPhase: 0.70 },
  { xPct: 84,  h: 44, w:  7, lean:  0.15, swayDur: 3.1, swayAmp: 4, swayPhase: 0.30 },
];

// ── SVG path helper ───────────────────────────────────────────────────────────

function getBladeSVG(h: number, w: number, lean: number) {
  const tipOffsetX = lean * h * 0.35;
  const halfBase   = w / 2;
  const pad        = 6;
  const halfSVG    = Math.max(halfBase + Math.abs(tipOffsetX), halfBase) + pad;
  const svgW       = halfSVG * 2;
  const cx         = halfSVG;
  const tipX       = cx + tipOffsetX;

  const f = (n: number) => n.toFixed(1);
  const path = [
    `M ${f(cx - halfBase)},${h}`,
    `C ${f(cx - halfBase)},${f(h * 0.55)}`,
    `  ${f(tipX - w * 0.18)},${f(h * 0.18)}`,
    `  ${f(tipX)},0`,
    `C ${f(tipX + w * 0.18)},${f(h * 0.18)}`,
    `  ${f(cx + halfBase)},${f(h * 0.55)}`,
    `  ${f(cx + halfBase)},${h}`,
    'Z',
  ].join(' ');

  return { path, svgW, halfSVG, viewBox: `0 0 ${f(svgW)} ${h}` };
}

// ── Blade renderer ────────────────────────────────────────────────────────────

function Blade({
  xPct, h, w, lean, swayDur, swayAmp, swayPhase, growDelay, color,
}: BladeConfig & { growDelay: number; color: string }) {
  const { path, svgW, halfSVG, viewBox } = getBladeSVG(h, w, lean);
  const swayDelay = growDelay + GROW_DUR + 0.1;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: `calc(${xPct}% - ${halfSVG.toFixed(1)}px)`,
    }}>
      <div style={{
        transformOrigin: 'bottom center',
        animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
      }}>
        <div style={{
          transformOrigin: 'bottom center',
          '--sway-amp': `${swayAmp}deg`,
          animation: `blade-sway ${swayDur}s ease-in-out ${swayDelay + swayPhase}s infinite`,
        } as React.CSSProperties}>
          <svg width={svgW} height={h} viewBox={viewBox} fill="none" style={{ display: 'block' }}>
            <path d={path} fill={color} />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// Two layers at the screen bottom — back grows first, front grows 0.3s later.
// The blob floats above independently; the grass is a ground plane only.

export function GrassLayer() {
  return (
    <>
      {/* Back layer — short, muted, full width */}
      <div style={{
        position: 'absolute',
        bottom: '28%',
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1,
      }}>
        {BACK_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            color={BACK_COLOR}
            growDelay={i * STAGGER}
          />
        ))}
      </div>

      {/* Front layer — tall, rich, centered more toward middle */}
      <div style={{
        position: 'absolute',
        bottom: '28%',
        left: 0,
        right: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        {FRONT_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            color={FRONT_COLOR}
            growDelay={0.3 + i * STAGGER}
          />
        ))}
      </div>
    </>
  );
}
