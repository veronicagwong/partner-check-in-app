import React, { useState } from 'react';
import type { WiltState } from './GrassLayer';

// ── Pixel-art ground ──────────────────────────────────────────────────────────
// Flat blocky ground with a stepped "tuft" edge at the top.
// 3 random blade heights:
//   tall   = 6 blocks = 48 px (28% chance)
//   medium = 3 blocks = 24 px (30% chance)
//   short  = 1 block  =  8 px (42% chance)
// Wilt: colour drain (greyscale + dim) rather than drooping.

const BLADE_COUNT = 60;

// Seeded random so heights are stable between renders (no memo/ref needed —
// useState initializer runs only once).
function buildBlades(): Array<{ height: number }> {
  // simple LCG seeded with a constant so the garden looks the same every visit
  let seed = 0xdeadbeef;
  const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

  return Array.from({ length: BLADE_COUNT }, () => {
    const r = rand();
    const height = r < 0.28 ? 48 : r < 0.58 ? 24 : 8;
    return { height };
  });
}

// ViewBox: 480 wide (60 blades × 8 units), 48 tall (max blade = 6 blocks × 8)
// Blades are bottom-aligned inside the viewBox.
function GrassBladesRow() {
  const [blades] = useState<Array<{ height: number }>>(buildBlades);

  return (
    <svg
      width="100%"
      height="48"
      viewBox="0 0 480 48"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated', position: 'absolute', top: -48, left: 0 }}
    >
      {blades.map((b, i) => {
        const x = i * 8;
        const y = 48 - b.height; // bottom-align
        // Tall blades get a lighter tip block for depth
        const tipColor  = b.height === 48 ? '#77EE55' : '#55DD44';
        const bodyColor = '#55DD44';

        return (
          <g key={i}>
            {/* tip block */}
            <rect x={x} y={y} width={8} height={8} fill={tipColor} />
            {/* remaining body blocks (if any) */}
            {b.height > 8 && (
              <rect x={x} y={y + 8} width={8} height={b.height - 8} fill={bodyColor} />
            )}
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
      bottom:        0,
      left:          0,
      right:         0,
      height:        '28%',
      pointerEvents: 'none',
      zIndex:        2,
      filter,
      transition,
    }}>

      {/* ── 3-height random blade SVG ── */}
      <GrassBladesRow />

      {/* ── Shadow strip — dark row just inside the top edge ── */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        height:     5,
        background: '#2A7A22',
      }} />

      {/* ── Main ground body ── */}
      <div style={{
        position:   'absolute',
        top:        5,
        left:       0,
        right:      0,
        bottom:     0,
        background: '#3DAA3D',
      }} />

    </div>
  );
}
