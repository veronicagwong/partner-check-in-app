import React from 'react';

// Re-mounts on every trigger change (key={trigger}), restarting the animation.
// The parent should swap the theme at ~200ms (midpoint when overlay is opaque).
function PixelWipeOverlay() {
  return (
    <div style={{
      position:        'fixed',
      inset:           0,
      zIndex:          998,
      pointerEvents:   'none',
      background:      'rgba(255,255,255,0.85)',
      animation:       'pixel-wipe 0.38s ease-in-out forwards',
    }} />
  );
}

export function PixelTransition({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return <PixelWipeOverlay key={trigger} />;
}
