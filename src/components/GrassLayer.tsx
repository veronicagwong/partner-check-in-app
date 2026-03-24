import React from 'react';

// ── Blade definitions ─────────────────────────────────────────────────────────

interface BladeConfig {
  xPct:       number;  // horizontal position 0–100%
  h:          number;  // height in px
  w:          number;  // base width in px
  lean:       number;  // tip lean: negative = left, positive = right
  swayDur:    number;  // sway period in seconds
  swayAmp:    number;  // sway amplitude in degrees
  swayPhase:  number;  // delay offset so blades don't sway in sync
}

const BLADES: BladeConfig[] = [
  { xPct:  3,  h: 68, w:  9, lean: -0.30, swayDur: 3.2, swayAmp: 4, swayPhase: 0.00 },
  { xPct: 12,  h: 82, w: 10, lean:  0.20, swayDur: 2.8, swayAmp: 3, swayPhase: 0.50 },
  { xPct: 23,  h: 50, w:  7, lean: -0.15, swayDur: 3.5, swayAmp: 5, swayPhase: 1.10 },
  { xPct: 36,  h: 88, w: 11, lean:  0.40, swayDur: 2.6, swayAmp: 3, swayPhase: 0.30 },
  { xPct: 50,  h: 60, w:  8, lean: -0.25, swayDur: 3.8, swayAmp: 4, swayPhase: 0.80 },
  { xPct: 63,  h: 75, w: 10, lean:  0.30, swayDur: 2.9, swayAmp: 3, swayPhase: 0.15 },
  { xPct: 77,  h: 45, w:  6, lean: -0.10, swayDur: 3.3, swayAmp: 5, swayPhase: 0.90 },
  { xPct: 88,  h: 85, w: 11, lean:  0.35, swayDur: 2.7, swayAmp: 4, swayPhase: 0.60 },
  { xPct: 96,  h: 55, w:  8, lean: -0.20, swayDur: 3.6, swayAmp: 3, swayPhase: 0.25 },
];

const BLADE_COLOR  = '#7D9164';   // soft sage/olive
const GROW_DUR     = 0.65;        // seconds for the spring-grow animation
const STAGGER      = 0.08;        // seconds between each blade's grow start

// ── SVG path helper ───────────────────────────────────────────────────────────
// Blade base is always centred in the SVG so transformOrigin:'bottom center'
// pivots exactly from the blade root.

function getBladeSVG(h: number, w: number, lean: number) {
  const tipOffsetX = lean * h * 0.35;
  const halfBase   = w / 2;
  const pad        = 6;
  // Expand half-width enough to contain the leaning tip
  const halfSVG    = Math.max(halfBase + Math.abs(tipOffsetX), halfBase) + pad;
  const svgW       = halfSVG * 2;

  // In SVG coords: base centre at (halfSVG, h)
  const cx   = halfSVG;
  const tipX = cx + tipOffsetX;

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

// ── Component ─────────────────────────────────────────────────────────────────
// Hardcoded to 'happy' for now — emotion wiring comes next.

export function GrassLayer() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 0,          // zero height; blades overflow upward
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {BLADES.map((blade, i) => {
        const { path, svgW, halfSVG, viewBox } = getBladeSVG(blade.h, blade.w, blade.lean);
        const growDelay = i * STAGGER;
        const swayDelay = growDelay + GROW_DUR + 0.1; // start sway after grow settles

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              // Centre the SVG (and thus the blade base) at xPct
              left: `calc(${blade.xPct}% - ${halfSVG.toFixed(1)}px)`,
            }}
          >
            {/* ── Grow layer — scaleY spring from bottom ── */}
            <div
              style={{
                transformOrigin: 'bottom center',
                animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
              }}
            >
              {/* ── Sway layer — gentle looping rotation ── */}
              <div
                style={{
                  transformOrigin: 'bottom center',
                  // CSS custom property consumed by the @keyframes
                  '--sway-amp': `${blade.swayAmp}deg`,
                  animation: `blade-sway ${blade.swayDur}s ease-in-out ${swayDelay + blade.swayPhase}s infinite`,
                } as React.CSSProperties}
              >
                <svg
                  width={svgW}
                  height={blade.h}
                  viewBox={viewBox}
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: 'block' }}
                >
                  <path d={path} fill={BLADE_COLOR} />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
