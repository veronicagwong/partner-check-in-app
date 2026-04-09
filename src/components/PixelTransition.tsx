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
      imageRendering:  'pixelated',
      // Colourful 16×16px pixel grid — coral / blue / yellow / purple
      background:      'repeating-conic-gradient(#FF4444 0% 25%, #4488FF 25% 50%, #FFDD00 50% 75%, #8844EE 75%) 0 0 / 16px 16px',
      animation:       'pixel-wipe 0.42s ease-in-out forwards',
    }} />
  );
}

export function PixelTransition({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return <PixelWipeOverlay key={trigger} />;
}
