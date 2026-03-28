import React, { useEffect, useRef, useState } from 'react';

// ── Minimal side-view bird SVG ────────────────────────────────────────────────
// Facing right by default; flip horizontally for RTL passes.
function BirdSVG({ flipped }: { flipped: boolean }) {
  return (
    // Outer wrapper handles horizontal flip (static transform)
    <div style={{ display: 'inline-block', transform: flipped ? 'scaleX(-1)' : undefined }}>
      {/* Inner wrapper carries the bobbing animation (translateY) */}
      <div style={{ display: 'inline-block', animation: 'bird-bob 1.5s ease-in-out infinite' }}>
        <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
          {/* tail */}
          <path d="M9 15 L1 11 L3 18 Z" fill="#3A78C2" opacity="0.85" />
          {/* body */}
          <ellipse cx="19" cy="16" rx="10" ry="5.5" fill="#5B9FE0" />
          {/* wing — flaps around its root at (21,13) */}
          <path
            d="M21 13 C25 6 31 4 35 6 C30 9 25 11 21 13Z"
            fill="#8DCBF5"
            style={{
              transformOrigin: '21px 13px',
              animation: 'wing-flap 0.30s ease-in-out infinite',
            }}
          />
          {/* head */}
          <circle cx="29" cy="12" r="5" fill="#5B9FE0" />
          {/* eye — tiny white sclera + dark pupil */}
          <circle cx="30.5" cy="10.8" r="1.4" fill="white" />
          <circle cx="30.9" cy="10.5" r="0.7" fill="#1C3F6A" />
          {/* beak */}
          <path d="M33.5 11 L40 9.8 L33.5 13 Z" fill="#FFD166" />
        </svg>
      </div>
    </div>
  );
}

// ── BirdLayer ─────────────────────────────────────────────────────────────────
// Renders a bird that flutters across the screen whenever `active` is true.
// Each pass picks a random direction (LTR / RTL) and vertical position.
// A new pass is triggered every ~11 s while active.

interface Pass {
  id: number;
  direction: 'ltr' | 'rtl';
  topPct: number;
}

export function BirdLayer({ active }: { active: boolean }) {
  const [pass, setPass]   = useState<Pass | null>(null);
  const idRef             = useRef(0);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerPass = () => {
    idRef.current += 1;
    setPass({
      id:        idRef.current,
      direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
      topPct:    Math.random() * 32 + 8, // 8 % – 40 % from top
    });
  };

  useEffect(() => {
    if (active) {
      // Cancel any pending hide timer from a previous deactivation
      if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
      // Kick off immediately, then repeat
      triggerPass();
      intervalRef.current = setInterval(triggerPass, 11000);
    } else {
      // Stop scheduling new passes
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      // Let the current flight finish before unmounting (flight takes 4.5 s)
      hideTimerRef.current = setTimeout(() => {
        setPass(null);
        hideTimerRef.current = null;
      }, 4700);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!pass) return null;

  return (
    <div
      key={pass.id}
      style={{
        position:      'absolute',
        top:           `${pass.topPct}%`,
        left:          0,
        pointerEvents: 'none',
        zIndex:        6,   // above flowers (1–4) and grain (1); below UI buttons (10)
        animation:     pass.direction === 'ltr'
          ? 'bird-fly-ltr 4.5s ease-in-out forwards'
          : 'bird-fly-rtl 4.5s ease-in-out forwards',
      }}
    >
      <BirdSVG flipped={pass.direction === 'rtl'} />
    </div>
  );
}
