import React, { useMemo } from 'react';

// ── Wilt state ─────────────────────────────────────────────────────────────────
// idle       — normal upright state
// wilted     — blades shrink down + turn greyscale
// recovering — blades grow back, colour restoring

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
  const bladePath = useMemo(() => getHealthyPath(h, w, lean, cx, halfBase), [h, w, lean, cx, halfBase]);

  const swayDelay = growDelay + GROW_DUR + 0.1;
  const wiltDelay = bladeIndex * 0.08;

  // ── Shrink + grey on wilt ────────────────────────────────────────────────
  let scaleY: number;
  let filterStyle: string;
  let wiltTransition: string;

  if (wiltState === 'wilted') {
    scaleY           = 0.12;
    filterStyle      = 'grayscale(1) brightness(0.65)';
    wiltTransition   = `transform ${wiltDuration}s ease-in ${wiltDelay}s, filter ${wiltDuration}s ease-in ${wiltDelay}s`;
  } else if (wiltState === 'recovering') {
    scaleY           = 1;
    filterStyle      = 'grayscale(0) brightness(1)';
    wiltTransition   = 'transform 2.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 2.5s ease-out';
  } else {
    scaleY           = 1;
    filterStyle      = 'grayscale(0) brightness(1)';
    wiltTransition   = 'none';
  }

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
        {/* sway + wilt (shrink + grey) */}
        <div style={{
          transformOrigin: 'bottom center',
          '--sway-amp': `${swayAmp}deg`,
          animation: `blade-sway ${swayDur}s ease-in-out ${swayDelay + swayPhase}s infinite`,
          transform: `scaleY(${scaleY})`,
          filter: filterStyle,
          transition: wiltTransition,
        } as React.CSSProperties}>
          <svg
            width={svgW}
            height={h}
            viewBox={viewBox}
            fill="none"
            style={{ display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%"   stopColor={baseColor} />
                <stop offset="100%" stopColor={tipColor}  />
              </linearGradient>
            </defs>
            <path d={bladePath} fill={`url(#${gradId})`} />
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
