import React from 'react';
import type { WiltState } from './GrassLayer';

const GROW_DUR = 0.65;
const STAGGER  = 0.08;
const BLUE     = '#3A44DC';

// ── Blade config ──────────────────────────────────────────────────────────────
interface BladeCfg {
  xPct:      number;
  h:         number;
  w:         number;
  lean:      number;   // –1..+1 tip curve direction
  swayDur:   number;
  swayAmp:   number;
}

// Same positions / sizes as GrassLayer so the two layers line up when switched.
// swayPhase is computed below as xPct * 0.022 so the wave visually rolls
// left → right across the full screen.
const BACK_BLADES: BladeCfg[] = [
  { xPct: 15,  h:  64, w:  8, lean: -0.20, swayDur: 3.2, swayAmp: 3 },
  { xPct: 22,  h:  72, w:  9, lean:  0.15, swayDur: 2.9, swayAmp: 4 },
  { xPct: 31,  h:  80, w:  9, lean: -0.10, swayDur: 3.5, swayAmp: 3 },
  { xPct: 40,  h:  90, w: 10, lean:  0.25, swayDur: 2.7, swayAmp: 4 },
  { xPct: 50,  h:  96, w: 10, lean: -0.15, swayDur: 3.8, swayAmp: 3 },
  { xPct: 60,  h:  88, w: 10, lean:  0.10, swayDur: 3.0, swayAmp: 4 },
  { xPct: 69,  h:  76, w:  9, lean: -0.20, swayDur: 3.3, swayAmp: 3 },
  { xPct: 78,  h:  68, w:  8, lean:  0.30, swayDur: 2.8, swayAmp: 4 },
  { xPct: 85,  h:  60, w:  8, lean: -0.12, swayDur: 3.6, swayAmp: 3 },
];

const MIDBACK_BLADES: BladeCfg[] = [
  { xPct: 19,  h:  66, w:  9, lean:  0.18, swayDur: 3.1, swayAmp: 3 },
  { xPct: 29,  h:  82, w: 10, lean: -0.22, swayDur: 2.9, swayAmp: 4 },
  { xPct: 41,  h:  96, w: 11, lean:  0.12, swayDur: 3.4, swayAmp: 3 },
  { xPct: 53,  h: 104, w: 11, lean: -0.08, swayDur: 2.7, swayAmp: 4 },
  { xPct: 65,  h:  90, w: 10, lean:  0.25, swayDur: 3.2, swayAmp: 3 },
  { xPct: 80,  h:  70, w:  9, lean: -0.18, swayDur: 3.0, swayAmp: 4 },
];

const FRONT_BLADES: BladeCfg[] = [
  { xPct: 18,  h:  94, w: 11, lean: -0.30, swayDur: 3.2, swayAmp: 4 },
  { xPct: 27,  h: 110, w: 12, lean:  0.20, swayDur: 2.8, swayAmp: 3 },
  { xPct: 37,  h: 118, w: 13, lean: -0.15, swayDur: 3.0, swayAmp: 3 },
  { xPct: 47,  h: 120, w: 14, lean:  0.10, swayDur: 2.6, swayAmp: 3 },
  { xPct: 57,  h: 116, w: 14, lean:  0.20, swayDur: 3.4, swayAmp: 4 },
  { xPct: 67,  h: 108, w: 12, lean:  0.35, swayDur: 2.9, swayAmp: 3 },
  { xPct: 76,  h:  98, w: 11, lean: -0.25, swayDur: 3.5, swayAmp: 5 },
  { xPct: 84,  h:  82, w: 10, lean:  0.15, swayDur: 3.1, swayAmp: 4 },
];

const NEARFRONT_BLADES: BladeCfg[] = [
  { xPct: 25,  h: 108, w: 13, lean: -0.28, swayDur: 3.3, swayAmp: 5 },
  { xPct: 38,  h: 118, w: 14, lean:  0.18, swayDur: 2.8, swayAmp: 4 },
  { xPct: 51,  h: 120, w: 14, lean: -0.10, swayDur: 3.0, swayAmp: 4 },
  { xPct: 63,  h: 114, w: 13, lean:  0.30, swayDur: 3.6, swayAmp: 5 },
  { xPct: 75,  h: 100, w: 12, lean: -0.20, swayDur: 2.9, swayAmp: 4 },
];

// ── Blade component ───────────────────────────────────────────────────────────

interface BladeProps extends BladeCfg {
  growDelay:    number;
  bladeIndex:   number;
  wiltState:    WiltState;
  wiltDuration: number;
  strokeWidth:  number;
  opacity:      number;
}

function LineBlade({
  xPct, h, w, lean, swayDur, swayAmp,
  growDelay, bladeIndex,
  wiltState, wiltDuration,
  strokeWidth, opacity,
}: BladeProps) {

  // swayPhase: left→right wave — xPct * 0.022 gives 0.33–1.87s range
  const swayPhase = xPct * 0.022;
  const swayDelay = growDelay + GROW_DUR + 0.1 + swayPhase;
  const wiltDelay = bladeIndex * 0.08;

  // Curved blade path: starts at (w/2, h), curves toward tip at lean direction
  const bx  = w / 2;
  const d   = `M${bx},${h} C${bx + lean * 8},${h * 0.65} ${bx + lean * 22},${h * 0.30} ${bx + lean * 34},0`;

  let scaleY    = 1;
  let filter    = 'none';
  let transition = 'none';

  if (wiltState === 'wilted') {
    scaleY     = 0.12;
    filter     = 'grayscale(1) brightness(0.55)';
    transition = `transform ${wiltDuration}s ease-in ${wiltDelay}s, filter ${wiltDuration}s ease-in ${wiltDelay}s`;
  } else if (wiltState === 'recovering') {
    scaleY     = 1;
    filter     = 'none';
    transition = 'transform 2.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 2.5s ease-out';
  }

  return (
    <div style={{ position: 'absolute', bottom: 0, left: `${xPct}%`, transform: 'translateX(-50%)' }}>
      {/* ── spring grow-in ── */}
      <div style={{
        transformOrigin: 'bottom center',
        animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
      }}>
        {/* ── sway + wilt ── */}
        <div style={{
          transformOrigin: 'bottom center',
          '--sway-amp':    `${swayAmp}deg`,
          animation:       `blade-sway ${swayDur}s ease-in-out ${swayDelay}s infinite`,
          transform:       `scaleY(${scaleY})`,
          filter,
          transition,
        } as React.CSSProperties}>

          {/* ── SVG blade stroke ── */}
          <svg
            width={w} height={h}
            viewBox={`0 0 ${w} ${h}`}
            fill="none"
            overflow="visible"
          >
            <path
              d={d}
              stroke={BLUE}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={opacity}
            />
          </svg>

        </div>
      </div>
    </div>
  );
}

// ── LineGrassLayer ────────────────────────────────────────────────────────────

interface Props { wiltState: WiltState; }

export function LineGrassLayer({ wiltState }: Props) {
  const base: React.CSSProperties = {
    position:      'absolute',
    bottom:        '28%',
    left:          0,
    right:         0,
    height:        0,
    overflow:      'visible',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Back — thinnest / most transparent */}
      <div style={{ ...base, zIndex: 1 }}>
        {BACK_BLADES.map((b, i) => (
          <LineBlade key={i} {...b}
            growDelay={i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.5}
            strokeWidth={1.0} opacity={0.28}
          />
        ))}
      </div>

      {/* Mid-back */}
      <div style={{ ...base, zIndex: 2 }}>
        {MIDBACK_BLADES.map((b, i) => (
          <LineBlade key={i} {...b}
            growDelay={0.15 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.8}
            strokeWidth={1.4} opacity={0.42}
          />
        ))}
      </div>

      {/* Front */}
      <div style={{ ...base, zIndex: 3 }}>
        {FRONT_BLADES.map((b, i) => (
          <LineBlade key={i} {...b}
            growDelay={0.3 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.1}
            strokeWidth={1.8} opacity={0.62}
          />
        ))}
      </div>

      {/* Near-front — thickest / most opaque */}
      <div style={{ ...base, zIndex: 4 }}>
        {NEARFRONT_BLADES.map((b, i) => (
          <LineBlade key={i} {...b}
            growDelay={0.5 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.5}
            strokeWidth={2.2} opacity={0.80}
          />
        ))}
      </div>
    </>
  );
}
