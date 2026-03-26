import React, { useMemo } from 'react';

// ── Wilt state ─────────────────────────────────────────────────────────────────
// idle       — normal upright state
// wilted     — blades have drooped into a fishhook shape + greyscale
// recovering — blades returning to upright, colour restoring

export type WiltState = 'idle' | 'wilted' | 'recovering';

// ── Constants ─────────────────────────────────────────────────────────────────

const BACK_BASE      = '#9AB882';
const BACK_TIP       = '#D0E4B0';
const MIDBACK_BASE   = '#7A9C65';
const MIDBACK_TIP    = '#B8D498';
const FRONT_BASE     = '#4D6638';
const FRONT_TIP      = '#82A85E';
const NEAR_BASE      = '#304520';
const NEAR_TIP       = '#4E7030';

const GROW_DUR = 0.65;
const STAGGER  = 0.08;

// ── Blade config ──────────────────────────────────────────────────────────────

interface BladeConfig {
  xPct:      number;
  h:         number;
  w:         number;
  lean:      number;
  swayDur:   number;
  swayAmp:   number;
  swayPhase: number;
}

// Back layer
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

// Mid-back layer
const MIDBACK_BLADES: BladeConfig[] = [
  { xPct: 19,  h: 26, w:  5, lean:  0.18, swayDur: 3.1, swayAmp: 3, swayPhase: 0.20 },
  { xPct: 29,  h: 40, w:  7, lean: -0.22, swayDur: 2.9, swayAmp: 4, swayPhase: 0.80 },
  { xPct: 41,  h: 52, w:  8, lean:  0.12, swayDur: 3.4, swayAmp: 3, swayPhase: 0.40 },
  { xPct: 53,  h: 58, w:  8, lean: -0.08, swayDur: 2.7, swayAmp: 4, swayPhase: 1.00 },
  { xPct: 65,  h: 46, w:  7, lean:  0.25, swayDur: 3.2, swayAmp: 3, swayPhase: 0.60 },
  { xPct: 80,  h: 30, w:  6, lean: -0.18, swayDur: 3.0, swayAmp: 4, swayPhase: 0.10 },
];

// Near-front layer
const NEARFRONT_BLADES: BladeConfig[] = [
  { xPct: 25,  h: 62, w: 10, lean: -0.28, swayDur: 3.3, swayAmp: 5, swayPhase: 0.50 },
  { xPct: 38,  h: 80, w: 12, lean:  0.18, swayDur: 2.8, swayAmp: 4, swayPhase: 0.00 },
  { xPct: 51,  h: 90, w: 13, lean: -0.10, swayDur: 3.0, swayAmp: 4, swayPhase: 0.75 },
  { xPct: 63,  h: 76, w: 11, lean:  0.30, swayDur: 3.6, swayAmp: 5, swayPhase: 0.30 },
  { xPct: 75,  h: 58, w:  9, lean: -0.20, swayDur: 2.9, swayAmp: 4, swayPhase: 1.10 },
];

// Front layer
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

// ── SVG path helpers ───────────────────────────────────────────────────────────

function getBladeGeometry(h: number, w: number, lean: number) {
  const tipOffsetX = lean * h * 0.35;
  const halfBase   = w / 2;
  const pad        = 8;
  const halfSVG    = Math.max(halfBase + Math.abs(tipOffsetX), halfBase) + pad;
  const svgW       = halfSVG * 2;
  const cx         = halfSVG;
  return { halfBase, halfSVG, svgW, cx, viewBox: `0 0 ${svgW.toFixed(1)} ${h}` };
}

function getHealthyPath(h: number, w: number, lean: number, cx: number, halfBase: number): string {
  const tipX = cx + lean * h * 0.35;
  const f = (n: number) => n.toFixed(1);
  return [
    `M ${f(cx - halfBase)},${h}`,
    `C ${f(cx - halfBase * 1.1)},${f(h * 0.65)} ${f(tipX - w * 0.10)},${f(h * 0.12)} ${f(tipX)},0`,
    `C ${f(tipX + w * 0.10)},${f(h * 0.12)} ${f(cx + halfBase * 1.1)},${f(h * 0.65)} ${f(cx + halfBase)},${h}`,
    'Z',
  ].join(' ');
}

// Wilted — open stroked center-line in a shepherd's-crook / fishhook shape.
//
// Using a stroked path instead of a filled closed shape means both "edges"
// follow exactly the same curve, so the blade stays uniformly thin throughout
// the hook — no fat belly, no twisting artefacts.
//
// The hook always curves LEFT (curlDir = -1) to prevent inter-layer crossing.
// droopFactor (0.85/1.00/1.15) varies the hook radius per blade for an organic look.
function getWiltedCenterLine(
  h: number, lean: number, cx: number,
  curlDir: number, droopFactor: number,
): string {
  const f = (n: number) => n.toFixed(1);
  const d = droopFactor;

  // Top of the hook arc (furthest point in the curl direction)
  const apexX = cx + curlDir * h * 0.28 * d;
  const apexY = h * 0.02;

  // Tip of hook (where it points back downward)
  const tipX = cx + curlDir * h * 0.38 * d;
  const tipY = h * (0.42 + d * 0.10);

  // Segment 1: base → apex
  //   CP1 near base x (blade rises nearly straight for bottom ~65%)
  //   CP2 near stem top following lean, before the hook starts
  const seg1cp1x = cx + lean * h * 0.05;
  const seg1cp1y = h * 0.60;
  const seg1cp2x = cx + lean * h * 0.08;
  const seg1cp2y = h * 0.12;

  // Segment 2: apex → tip (the hook arc)
  //   CP1 extends past apex in the curl direction (top of the J-curve)
  //   CP2 directly below CP1 → bezier arrives at tip nearly vertically (tip points down)
  const hookCpX = cx + curlDir * h * 0.44 * d;
  const seg2cp1y = h * 0.01;
  const seg2cp2y = h * 0.35;

  return (
    `M ${f(cx)},${h} ` +
    `C ${f(seg1cp1x)},${f(seg1cp1y)} ${f(seg1cp2x)},${f(seg1cp2y)} ${f(apexX)},${f(apexY)} ` +
    `C ${f(hookCpX)},${f(seg2cp1y)} ${f(hookCpX)},${f(seg2cp2y)} ${f(tipX)},${f(tipY)}`
  );
}

// ── Blade renderer ────────────────────────────────────────────────────────────

function Blade({
  xPct, h, w, lean, swayDur, swayAmp, swayPhase,
  growDelay, bladeIndex, baseColor, tipColor, gradId,
  wiltState, wiltDuration,
}: BladeConfig & {
  growDelay:    number;
  bladeIndex:   number;
  baseColor:    string;
  tipColor:     string;
  gradId:       string;
  wiltState:    WiltState;
  wiltDuration: number;
}) {
  const { halfBase, halfSVG, svgW, cx, viewBox } = getBladeGeometry(h, w, lean);
  const healthyPath = useMemo(() => getHealthyPath(h, w, lean, cx, halfBase), [h, w, lean, cx, halfBase]);

  // All blades curl the same direction (left) — prevents inter-layer crossing.
  const curlDir     = -1;
  const droopFactor = 0.85 + (bladeIndex % 3) * 0.15;
  const wiltedLine  = useMemo(
    () => getWiltedCenterLine(h, lean, cx, curlDir, droopFactor),
    [h, lean, cx, droopFactor],
  );

  const swayDelay = growDelay + GROW_DUR + 0.1;
  const wiltDelay = bladeIndex * 0.08; // stagger blades 80 ms apart

  // ── Crossfade: healthy fades out, wilted hook fades in ───────────────────
  // No path interpolation needed — each shape is independently correct.
  const isWilted     = wiltState === 'wilted';
  const isRecovering = wiltState === 'recovering';

  const healthyOpacity = isWilted ? 0 : 1;
  const wiltedOpacity  = isWilted ? 1 : 0;

  let opacityTransition: string;
  if (isWilted) {
    opacityTransition = `opacity ${wiltDuration}s ease-in ${wiltDelay}s`;
  } else if (isRecovering) {
    opacityTransition = 'opacity 3s ease-out';
  } else {
    opacityTransition = 'none';
  }

  // ── Colour desaturation ──────────────────────────────────────────────────
  let filterStyle: string;
  let filterTransition: string;
  if (wiltState === 'wilted') {
    filterStyle      = 'grayscale(1) brightness(0.70)';
    filterTransition = `filter ${wiltDuration}s ease-in ${wiltDelay}s`;
  } else if (wiltState === 'recovering') {
    filterStyle      = 'grayscale(0) brightness(1)';
    filterTransition = 'filter 3s ease-out';
  } else {
    filterStyle      = 'grayscale(0) brightness(1)';
    filterTransition = 'none';
  }

  const strokeWidth = w * 0.75;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: `calc(${xPct}% - ${halfSVG.toFixed(1)}px)`,
    }}>
      {/* spring grow-in on mount */}
      <div style={{
        transformOrigin: 'bottom center',
        animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
      }}>
        {/* sway + grayscale filter */}
        <div style={{
          transformOrigin: 'bottom center',
          '--sway-amp': `${swayAmp}deg`,
          animation: `blade-sway ${swayDur}s ease-in-out ${swayDelay + swayPhase}s infinite`,
          filter: filterStyle,
          transition: filterTransition,
        } as React.CSSProperties}>
          <svg
            width={svgW}
            height={h}
            viewBox={viewBox}
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Gradient for healthy filled blade (objectBoundingBox, y-axis) */}
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"   stopColor={baseColor} />
                <stop offset="100%" stopColor={tipColor}  />
              </linearGradient>
              {/* Gradient for wilted stroked path (userSpaceOnUse so it maps to actual y coords) */}
              <linearGradient id={`${gradId}-w`} gradientUnits="userSpaceOnUse"
                x1={cx.toFixed(1)} y1={h} x2={cx.toFixed(1)} y2="0">
                <stop offset="0%"   stopColor={baseColor} />
                <stop offset="100%" stopColor={tipColor}  />
              </linearGradient>
            </defs>

            {/* Healthy blade — filled closed path, fades out on wilt */}
            <path
              d={healthyPath}
              fill={`url(#${gradId})`}
              style={{ opacity: healthyOpacity, transition: opacityTransition }}
            />

            {/* Wilted hook — stroked open center-line, fades in on wilt.
                A stroked path keeps blade thickness uniform around the hook arc
                — no fat belly, no path self-intersection. */}
            <path
              d={wiltedLine}
              fill="none"
              stroke={`url(#${gradId}-w)`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: wiltedOpacity, transition: opacityTransition }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
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
      <div style={{ ...layerStyle, zIndex: 1 }}>
        {BACK_BLADES.map((blade, i) => (
          <Blade key={i} {...blade} baseColor={BACK_BASE} tipColor={BACK_TIP}
            gradId={`back-blade-${i}`} growDelay={i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.5} />
        ))}
      </div>

      <div style={{ ...layerStyle, zIndex: 2 }}>
        {MIDBACK_BLADES.map((blade, i) => (
          <Blade key={i} {...blade} baseColor={MIDBACK_BASE} tipColor={MIDBACK_TIP}
            gradId={`midback-blade-${i}`} growDelay={0.15 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.8} />
        ))}
      </div>

      <div style={{ ...layerStyle, zIndex: 3 }}>
        {FRONT_BLADES.map((blade, i) => (
          <Blade key={i} {...blade} baseColor={FRONT_BASE} tipColor={FRONT_TIP}
            gradId={`front-blade-${i}`} growDelay={0.3 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.1} />
        ))}
      </div>

      <div style={{ ...layerStyle, zIndex: 4 }}>
        {NEARFRONT_BLADES.map((blade, i) => (
          <Blade key={i} {...blade} baseColor={NEAR_BASE} tipColor={NEAR_TIP}
            gradId={`near-blade-${i}`} growDelay={0.5 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.5} />
        ))}
      </div>
    </>
  );
}
