import React from 'react';

// ── Wilt state ─────────────────────────────────────────────────────────────────
export type WiltState = 'idle' | 'wilted' | 'recovering';

const GROW_DUR = 0.65;
const STAGGER  = 0.08;

// ── Blade config ──────────────────────────────────────────────────────────────
interface BladeConfig {
  xPct:      number;
  h:         number;   // visual height (px)
  w:         number;   // visual width (px)
  lean:      number;   // –1..+1 tilt at tip
  swayDur:   number;
  swayAmp:   number;
  swayPhase: number;
}

// Heights and widths now target the requested 60-120px / 8-14px ranges
const BACK_BLADES: BladeConfig[] = [
  { xPct: 15,  h:  64, w:  8, lean: -0.20, swayDur: 3.2, swayAmp: 3, swayPhase: 0.00 },
  { xPct: 22,  h:  72, w:  9, lean:  0.15, swayDur: 2.9, swayAmp: 4, swayPhase: 0.50 },
  { xPct: 31,  h:  80, w:  9, lean: -0.10, swayDur: 3.5, swayAmp: 3, swayPhase: 1.00 },
  { xPct: 40,  h:  90, w: 10, lean:  0.25, swayDur: 2.7, swayAmp: 4, swayPhase: 0.30 },
  { xPct: 50,  h:  96, w: 10, lean: -0.15, swayDur: 3.8, swayAmp: 3, swayPhase: 0.70 },
  { xPct: 60,  h:  88, w: 10, lean:  0.10, swayDur: 3.0, swayAmp: 4, swayPhase: 0.20 },
  { xPct: 69,  h:  76, w:  9, lean: -0.20, swayDur: 3.3, swayAmp: 3, swayPhase: 0.90 },
  { xPct: 78,  h:  68, w:  8, lean:  0.30, swayDur: 2.8, swayAmp: 4, swayPhase: 0.40 },
  { xPct: 85,  h:  60, w:  8, lean: -0.12, swayDur: 3.6, swayAmp: 3, swayPhase: 0.60 },
];

const MIDBACK_BLADES: BladeConfig[] = [
  { xPct: 19,  h:  66, w:  9, lean:  0.18, swayDur: 3.1, swayAmp: 3, swayPhase: 0.20 },
  { xPct: 29,  h:  82, w: 10, lean: -0.22, swayDur: 2.9, swayAmp: 4, swayPhase: 0.80 },
  { xPct: 41,  h:  96, w: 11, lean:  0.12, swayDur: 3.4, swayAmp: 3, swayPhase: 0.40 },
  { xPct: 53,  h: 104, w: 11, lean: -0.08, swayDur: 2.7, swayAmp: 4, swayPhase: 1.00 },
  { xPct: 65,  h:  90, w: 10, lean:  0.25, swayDur: 3.2, swayAmp: 3, swayPhase: 0.60 },
  { xPct: 80,  h:  70, w:  9, lean: -0.18, swayDur: 3.0, swayAmp: 4, swayPhase: 0.10 },
];

const NEARFRONT_BLADES: BladeConfig[] = [
  { xPct: 25,  h: 108, w: 13, lean: -0.28, swayDur: 3.3, swayAmp: 5, swayPhase: 0.50 },
  { xPct: 38,  h: 118, w: 14, lean:  0.18, swayDur: 2.8, swayAmp: 4, swayPhase: 0.00 },
  { xPct: 51,  h: 120, w: 14, lean: -0.10, swayDur: 3.0, swayAmp: 4, swayPhase: 0.75 },
  { xPct: 63,  h: 114, w: 13, lean:  0.30, swayDur: 3.6, swayAmp: 5, swayPhase: 0.30 },
  { xPct: 75,  h: 100, w: 12, lean: -0.20, swayDur: 2.9, swayAmp: 4, swayPhase: 1.10 },
];

const FRONT_BLADES: BladeConfig[] = [
  { xPct: 18,  h:  94, w: 11, lean: -0.30, swayDur: 3.2, swayAmp: 4, swayPhase: 0.10 },
  { xPct: 27,  h: 110, w: 12, lean:  0.20, swayDur: 2.8, swayAmp: 3, swayPhase: 0.60 },
  { xPct: 37,  h: 118, w: 13, lean: -0.15, swayDur: 3.0, swayAmp: 3, swayPhase: 1.20 },
  { xPct: 47,  h: 120, w: 14, lean:  0.10, swayDur: 2.6, swayAmp: 3, swayPhase: 0.40 },
  { xPct: 57,  h: 116, w: 14, lean:  0.20, swayDur: 3.4, swayAmp: 4, swayPhase: 0.90 },
  { xPct: 67,  h: 108, w: 12, lean:  0.35, swayDur: 2.9, swayAmp: 3, swayPhase: 0.20 },
  { xPct: 76,  h:  98, w: 11, lean: -0.25, swayDur: 3.5, swayAmp: 5, swayPhase: 0.70 },
  { xPct: 84,  h:  82, w: 10, lean:  0.15, swayDur: 3.1, swayAmp: 4, swayPhase: 0.30 },
];

// ── Grain data URI (SVG feTurbulence noise) ───────────────────────────────────
const GRAIN_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E")`;

// ── Blade ─────────────────────────────────────────────────────────────────────

interface LayerStyle {
  bottomColor:  string;   // gradient bottom stop (opaque sage)
  midColor:     string;   // gradient mid stop (softer)
  blurPx:       number;   // self-blur for aura softness
  layerOpacity: number;   // overall opacity per depth layer
}

function Blade({
  xPct, h, w, lean, swayDur, swayAmp, swayPhase,
  growDelay, bladeIndex,
  wiltState, wiltDuration,
  bottomColor, midColor, blurPx, layerOpacity,
}: BladeConfig & { growDelay: number; bladeIndex: number; wiltState: WiltState; wiltDuration: number } & LayerStyle) {

  const swayDelay = growDelay + GROW_DUR + 0.1;
  const wiltDelay = bladeIndex * 0.08;

  // lean → rotation degrees (tip tilt, anchored at bottom)
  const leanDeg = lean * 20;

  // Wilt transform + filter — same logic as before, blur always present
  let scaleY: number;
  let filterStyle: string;
  let wiltTransition: string;

  if (wiltState === 'wilted') {
    scaleY         = 0.12;
    filterStyle    = `grayscale(1) brightness(0.65) blur(${blurPx}px)`;
    wiltTransition = `transform ${wiltDuration}s ease-in ${wiltDelay}s, filter ${wiltDuration}s ease-in ${wiltDelay}s`;
  } else if (wiltState === 'recovering') {
    scaleY         = 1;
    filterStyle    = `grayscale(0) brightness(1) blur(${blurPx}px)`;
    wiltTransition = 'transform 2.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 2.5s ease-out';
  } else {
    scaleY         = 1;
    filterStyle    = `blur(${blurPx}px)`;
    wiltTransition = 'none';
  }

  return (
    <div style={{
      position:  'absolute',
      bottom:    0,
      left:      `${xPct}%`,
      transform: 'translateX(-50%)',
    }}>
      {/* ── spring grow-in ── */}
      <div style={{
        transformOrigin: 'bottom center',
        animation: `blade-grow ${GROW_DUR}s cubic-bezier(0.34, 1.56, 0.64, 1) ${growDelay}s both`,
      }}>
        {/* ── sway + wilt (filter lives here so blur scales with wilt) ── */}
        <div style={{
          transformOrigin: 'bottom center',
          '--sway-amp':    `${swayAmp}deg`,
          animation:       `blade-sway ${swayDur}s ease-in-out ${swayDelay + swayPhase}s infinite`,
          transform:       `scaleY(${scaleY})`,
          filter:          filterStyle,
          transition:      wiltTransition,
        } as React.CSSProperties}>

          {/* ── Pill blade — lean applied here, isolated from sway/grow ── */}
          <div style={{
            width:           w,
            height:          h,
            background:      `linear-gradient(to top, ${bottomColor}, ${midColor} 60%, transparent)`,
            borderRadius:    '50% 50% 0 0 / 100% 100% 0 0',
            mixBlendMode:    'multiply',
            opacity:         layerOpacity,
            transform:       `rotate(${leanDeg}deg)`,
            transformOrigin: 'bottom center',
          }} />

        </div>
      </div>
    </div>
  );
}

// ── GrassLayer ─────────────────────────────────────────────────────────────────

interface GrassLayerProps { wiltState: WiltState; }

export function GrassLayer({ wiltState }: GrassLayerProps) {
  const base: React.CSSProperties = {
    position: 'absolute', bottom: '28%',
    left: 0, right: 0, height: 0,
    overflow: 'visible', pointerEvents: 'none',
  };

  // Layer style tokens — back=cooler/blurred, front=warmer/sharp
  const backStyle:     LayerStyle = { bottomColor: 'rgba(90,145,135,0.9)',   midColor: 'rgba(115,170,155,0.45)', blurPx: 4.0, layerOpacity: 0.52 };
  const midbackStyle:  LayerStyle = { bottomColor: 'rgba(100,158,130,0.9)',  midColor: 'rgba(128,185,148,0.45)', blurPx: 3.0, layerOpacity: 0.66 };
  const frontStyle:    LayerStyle = { bottomColor: 'rgba(118,172,108,0.9)',  midColor: 'rgba(148,200,128,0.45)', blurPx: 2.0, layerOpacity: 0.84 };
  const nearStyle:     LayerStyle = { bottomColor: 'rgba(132,182,106,0.9)',  midColor: 'rgba(162,210,122,0.45)', blurPx: 1.5, layerOpacity: 0.92 };

  return (
    <>
      {/* Back — most blue-green, most blurred */}
      <div style={{ ...base, zIndex: 1 }}>
        {BACK_BLADES.map((b, i) => (
          <Blade key={i} {...b} {...backStyle}
            growDelay={i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.5} />
        ))}
      </div>

      {/* Mid-back */}
      <div style={{ ...base, zIndex: 2 }}>
        {MIDBACK_BLADES.map((b, i) => (
          <Blade key={i} {...b} {...midbackStyle}
            growDelay={0.15 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={2.8} />
        ))}
      </div>

      {/* Front */}
      <div style={{ ...base, zIndex: 3 }}>
        {FRONT_BLADES.map((b, i) => (
          <Blade key={i} {...b} {...frontStyle}
            growDelay={0.3 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.1} />
        ))}
      </div>

      {/* Near-front — warmest sage, sharpest */}
      <div style={{ ...base, zIndex: 4 }}>
        {NEARFRONT_BLADES.map((b, i) => (
          <Blade key={i} {...b} {...nearStyle}
            growDelay={0.5 + i * STAGGER} bladeIndex={i}
            wiltState={wiltState} wiltDuration={3.5} />
        ))}
      </div>

      {/* ── Grain overlay — painterly feTurbulence texture ── */}
      <div style={{
        position:       'absolute',
        inset:          '-100vh -100vw',   // bleed beyond grass to cover full scene
        backgroundImage: GRAIN_URI,
        backgroundSize: '200px 200px',
        opacity:        0.25,
        mixBlendMode:   'overlay',
        pointerEvents:  'none',
        zIndex:         20,
      }} />
    </>
  );
}
