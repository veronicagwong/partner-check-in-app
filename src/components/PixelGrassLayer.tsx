import React from 'react';
import type { WiltState } from './GrassLayer';

// ── Pixel-art ground ──────────────────────────────────────────────────────────
// Flat blocky ground with a stepped "tuft" edge at the top.
// No border-radius, crisp right-angle silhouette.
// Wilt is expressed as colour drain (greyscale + dim) rather than drooping blades.

export function PixelGrassLayer({ wiltState }: { wiltState: WiltState }) {
  const wilted    = wiltState === 'wilted';
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

      {/* ── Stepped tuft row — alternating 8 px blocks at the very top ── */}
      <div style={{
        position:        'absolute',
        top:             -8,
        left:            0,
        right:           0,
        height:          8,
        backgroundImage: 'repeating-linear-gradient(90deg, #55DD44 0px, #55DD44 8px, transparent 8px, transparent 16px)',
        imageRendering:  'pixelated',
      }} />

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
