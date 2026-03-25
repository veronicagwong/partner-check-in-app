import React from 'react';

// ── Wilt state ─────────────────────────────────────────────────────────────────
// idle      — normal upright state, no transition in effect
// wilted    — blades have drooped; ease-in over per-layer wiltDuration
// recovering — blades returning to upright; ease-out 3s

export type WiltState = 'idle' | 'wilted' | 'recovering';

// ── Constants ─────────────────────────────────────────────────────────────────

// Four depth layers — colours darken and saturate as you move to the foreground,
// simulating atmospheric perspective (far = pale/muted, near = rich/dark).
const BACK_BASE      = '#9AB882';  // far back — very pale sage root
const BACK_TIP       = '#D0E4B0';  // far back — airy yellow-green tip
const MIDBACK_BASE   = '#7A9C65';  // mid-back root
const MIDBACK_TIP    = '#B8D498';  // mid-back tip
const FRONT_BASE     = '#4D6638';  // mid-front root
const FRONT_TIP      = '#82A85E';  // mid-front tip
const NEAR_BASE      = '#304520';  // near-front — deep shadowed root
const NEAR_TIP       = '#4E7030';  // near-front — rich dark tip
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

// Mid-back layer — bell curve heights: tallest at center, shortest at edges
const MIDBACK_BLADES: BladeConfig[] = [
  { xPct: 19,  h: 26, w:  5, lean:  0.18, swayDur: 3.1, swayAmp: 3, swayPhase: 0.20 },
  { xPct: 29,  h: 40, w:  7, lean: -0.22, swayDur: 2.9, swayAmp: 4, swayPhase: 0.80 },
  { xPct: 41,  h: 52, w:  8, lean:  0.12, swayDur: 3.4, swayAmp: 3, swayPhase: 0.40 },
  { xPct: 53,  h: 58, w:  8, lean: -0.08, swayDur: 2.7, swayAmp: 4, swayPhase: 1.00 },
  { xPct: 65,  h: 46, w:  7, lean:  0.25, swayDur: 3.2, swayAmp: 3, swayPhase: 0.60 },
  { xPct: 80,  h: 30, w:  6, lean: -0.18, swayDur: 3.0, swayAmp: 4, swayPhase: 0.10 },
];

// Near-front layer — bell curve heights: tallest at center, shortest at edges
const NEARFRONT_BLADES: BladeConfig[] = [
  { xPct: 25,  h: 62, w: 10, lean: -0.28, swayDur: 3.3, swayAmp: 5, swayPhase: 0.50 },
  { xPct: 38,  h: 80, w: 12, lean:  0.18, swayDur: 2.8, swayAmp: 4, swayPhase: 0.00 },
  { xPct: 51,  h: 90, w: 13, lean: -0.10, swayDur: 3.0, swayAmp: 4, swayPhase: 0.75 },
  { xPct: 63,  h: 76, w: 11, lean:  0.30, swayDur: 3.6, swayAmp: 5, swayPhase: 0.30 },
  { xPct: 75,  h: 58, w:  9, lean: -0.20, swayDur: 2.9, swayAmp: 4, swayPhase: 1.10 },
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
    // Left edge: control pts bow slightly outward at lower third then taper sharply to tip
    `C ${f(cx - halfBase * 1.1)},${f(h * 0.65)}`,
    `  ${f(tipX - w * 0.10)},${f(h * 0.12)}`,
    `  ${f(tipX)},0`,
    // Right edge: mirror
    `C ${f(tipX + w * 0.10)},${f(h * 0.12)}`,
    `  ${f(cx + halfBase * 1.1)},${f(h * 0.65)}`,
    `  ${f(cx + halfBase)},${h}`,
    'Z',
  ].join(' ');

  return { path, svgW, halfSVG, viewBox: `0 0 ${f(svgW)} ${h}` };
}

// ── Blade renderer ────────────────────────────────────────────────────────────

function Blade({
  xPct, h, w, lean, swayDur, swayAmp, swayPhase, growDelay, baseColor, tipColor, gradId,
  wiltState, wiltDuration,
}: BladeConfig & {
  growDelay: number; baseColor: string; tipColor: string; gradId: string;
  wiltState: WiltState; wiltDuration: number;
}) {
  const { path, svgW, halfSVG, viewBox } = getBladeSVG(h, w, lean);
  const swayDelay = growDelay + GROW_DUR + 0.1;

  // Blades droop in their existing lean direction so the motion feels natural
  const dropDeg = (lean >= 0 ? 1 : -1) * 52;

  let wiltTransform: string;
  let wiltFilter: string;
  let wiltTransition: string;

  if (wiltState === 'wilted') {
    // Droop: compress to 35% height, rotate heavily in lean direction, desaturate
    wiltTransform  = `scaleY(0.35) rotate(${dropDeg}deg)`;
    wiltFilter     = 'saturate(0.28) brightness(0.80) sepia(0.20)';
    wiltTransition = `transform ${wiltDuration}s ease-in, filter ${wiltDuration}s ease-in`;
  } else if (wiltState === 'recovering') {
    // Return upright, slow ease-out, restore colour
    wiltTransform  = 'scaleY(1) rotate(0deg)';
    wiltFilter     = 'saturate(1) brightness(1) sepia(0)';
    wiltTransition = 'transform 3s ease-out, filter 3s ease-out';
  } else {
    // idle — no transition so the next wilt fires without inheriting a stale easing
    wiltTransform  = 'scaleY(1) rotate(0deg)';
    wiltFilter     = 'saturate(1) brightness(1) sepia(0)';
    wiltTransition = 'none';
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: `calc(${xPct}% - ${halfSVG.toFixed(1)}px)`,
    }}>
      {/* Layer 1 — spring grow-in (scaleY 0 → 1) */}
      <div style={{
        transformOrigin: 'bottom center',
        animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
      }}>
        {/* Layer 2 — wilt/recovery (CSS transition, not keyframe) */}
        <div style={{
          transformOrigin: 'bottom center',
          transform: wiltTransform,
          filter: wiltFilter,
          transition: wiltTransition,
        }}>
          {/* Layer 3 — gentle sway (infinite keyframe rotate) */}
          <div style={{
            transformOrigin: 'bottom center',
            '--sway-amp': `${swayAmp}deg`,
            animation: `blade-sway ${swayDur}s ease-in-out ${swayDelay + swayPhase}s infinite`,
          } as React.CSSProperties}>
            <svg width={svgW} height={h} viewBox={viewBox} fill="none" style={{ display: 'block' }}>
              <defs>
                {/* bottom → top: dark base to light tip */}
                <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%"   stopColor={baseColor} />
                  <stop offset="100%" stopColor={tipColor}  />
                </linearGradient>
              </defs>
              <path d={path} fill={`url(#${gradId})`} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
// Four depth layers at the screen bottom.
// wiltState is driven by the parent (EmotionMirrorDrawer) based on sad-hold timer.
// Each closer layer wilts slightly more slowly, reinforcing the depth illusion.
//
//  Layer │ z │ wilt duration  │ grow offset
//  ──────┼───┼────────────────┼────────────
//  back  │ 1 │ 2.5 s ease-in  │ 0.00 s
//  mid   │ 2 │ 2.8 s ease-in  │ 0.15 s
//  front │ 3 │ 3.1 s ease-in  │ 0.30 s
//  near  │ 4 │ 3.5 s ease-in  │ 0.50 s

interface GrassLayerProps {
  wiltState: WiltState;
}

export function GrassLayer({ wiltState }: GrassLayerProps) {
  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '28%',
    left: 0,
    right: 0,
    height: 0,
    overflow: 'visible',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Layer 1 — back: short, pale */}
      <div style={{ ...layerStyle, zIndex: 1 }}>
        {BACK_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            baseColor={BACK_BASE}
            tipColor={BACK_TIP}
            gradId={`back-blade-${i}`}
            growDelay={i * STAGGER}
            wiltState={wiltState}
            wiltDuration={2.5}
          />
        ))}
      </div>

      {/* Layer 2 — mid-back: medium, muted-green */}
      <div style={{ ...layerStyle, zIndex: 2 }}>
        {MIDBACK_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            baseColor={MIDBACK_BASE}
            tipColor={MIDBACK_TIP}
            gradId={`midback-blade-${i}`}
            growDelay={0.15 + i * STAGGER}
            wiltState={wiltState}
            wiltDuration={2.8}
          />
        ))}
      </div>

      {/* Layer 3 — front: tall, rich green */}
      <div style={{ ...layerStyle, zIndex: 3 }}>
        {FRONT_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            baseColor={FRONT_BASE}
            tipColor={FRONT_TIP}
            gradId={`front-blade-${i}`}
            growDelay={0.3 + i * STAGGER}
            wiltState={wiltState}
            wiltDuration={3.1}
          />
        ))}
      </div>

      {/* Layer 4 — near-front: tallest, deep shadowed */}
      <div style={{ ...layerStyle, zIndex: 4 }}>
        {NEARFRONT_BLADES.map((blade, i) => (
          <Blade
            key={i}
            {...blade}
            baseColor={NEAR_BASE}
            tipColor={NEAR_TIP}
            gradId={`near-blade-${i}`}
            growDelay={0.5 + i * STAGGER}
            wiltState={wiltState}
            wiltDuration={3.5}
          />
        ))}
      </div>
    </>
  );
}
