import React, { useState } from 'react';
import type { WiltState } from './GrassLayer';

// ── 3 blade heights (in 8px blocks) ──────────────────────────────────────────
//   tall   = 4 blocks = 32px  (25% chance)
//   medium = 2 blocks = 16px  (35% chance)
//   short  = 1 block  =  8px  (40% chance)

const BLADE_COUNT = 60;
const BLADE_W = 2;    // px — thin like a stem
const BLADE_GAP = 6;  // px — space between blades (stride = 8px total)
const TALL = 32, MED = 16, SHORT = 8;
const TIP   = '#5A8A2C';
const BODY  = '#3D7020';

function buildBlades(): Array<{ h: number }> {
  let seed = 0xdeadbeef;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };
  return Array.from({ length: BLADE_COUNT }, () => {
    const r = rand();
    return { h: r < 0.25 ? TALL : r < 0.60 ? MED : SHORT };
  });
}

// SVG: 480 wide (60 blades × 8px stride), 32 tall (max blade)
// Each blade is BLADE_W wide, bottom-aligned, tip block lighter green.
function GrassBladesRow() {
  const [blades] = useState(buildBlades);
  return (
    <svg
      width="100%" height={TALL}
      viewBox={`0 0 ${BLADE_COUNT * (BLADE_W + BLADE_GAP)} ${TALL}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated', position: 'absolute', top: -TALL, left: 0 }}
    >
      {blades.map((b, i) => {
        const x = i * (BLADE_W + BLADE_GAP);
        const y = TALL - b.h;
        return (
          <g key={i}>
            <rect x={x} y={y}      width={BLADE_W} height={8}      fill={TIP}  />
            {b.h > 8 && <rect x={x} y={y + 8} width={BLADE_W} height={b.h - 8} fill={BODY} />}
          </g>
        );
      })}
    </svg>
  );
}

export function PixelGrassLayer({ wiltState }: { wiltState: WiltState }) {
  const wilted     = wiltState === 'wilted';
  const recovering = wiltState === 'recovering';

  const filter     = wilted     ? 'grayscale(1) brightness(0.55)'
                   : recovering ? 'grayscale(0) brightness(1)'
                   : 'none';
  const transition = wilted     ? 'filter 0.45s ease'
                   : recovering ? 'filter 2s ease-out'
                   : 'none';

  return (
    <div style={{
      position:      'absolute',
      bottom:        '28%',
      left:          '12%',
      right:         '12%',
      height:        '11%',
      pointerEvents: 'none',
      zIndex:        2,
      filter,
      transition,
    }}>

      {/* ── 3-height random blades ── */}
      <GrassBladesRow />

      {/* ── Shadow strip ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: '#2E5518' }} />

      {/* ── Main ground body ── */}
      <div style={{ position: 'absolute', top: 5, left: 0, right: 0, bottom: 0, background: BODY }} />

    </div>
  );
}
