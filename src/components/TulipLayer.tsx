import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions spread across the full width ───────────────────
const SLOTS = [
  // First wave (slots 0–7) — appears quickly
  { xPct:  8, h: 145, stagger:   0 },
  { xPct: 20, h: 162, stagger: 120 },
  { xPct: 33, h: 155, stagger: 240 },
  { xPct: 46, h: 170, stagger:  60 },
  { xPct: 59, h: 148, stagger: 180 },
  { xPct: 72, h: 165, stagger: 300 },
  { xPct: 84, h: 140, stagger:  90 },
  { xPct: 94, h: 158, stagger: 210 },
  // Second wave (slots 8–15) — fills gaps
  { xPct: 14, h: 138, stagger: 150 },
  { xPct: 27, h: 172, stagger:  30 },
  { xPct: 40, h: 143, stagger: 270 },
  { xPct: 52, h: 168, stagger: 100 },
  { xPct: 65, h: 155, stagger: 220 },
  { xPct: 77, h: 147, stagger: 340 },
  { xPct: 88, h: 175, stagger:  70 },
  { xPct:  3, h: 135, stagger: 190 },
  // Third wave (slots 16–22) — deeper fill
  { xPct: 10, h: 160, stagger: 260 },
  { xPct: 23, h: 145, stagger:  40 },
  { xPct: 36, h: 178, stagger: 170 },
  { xPct: 49, h: 137, stagger: 310 },
  { xPct: 62, h: 163, stagger:  80 },
  { xPct: 75, h: 152, stagger: 200 },
  { xPct: 90, h: 142, stagger: 130 },
  // Fourth wave (slots 23–29) — final density
  { xPct: 17, h: 170, stagger: 350 },
  { xPct: 30, h: 148, stagger:  50 },
  { xPct: 43, h: 165, stagger: 280 },
  { xPct: 56, h: 155, stagger: 160 },
  { xPct: 69, h: 140, stagger: 400 },
  { xPct: 81, h: 168, stagger:  20 },
  { xPct: 96, h: 150, stagger: 320 },
];

const W  = 68;   // SVG width per dandelion
const CX = W / 2;

// Spring easing from the Lottie source data
const SPRING = 'cubic-bezier(0.286, 1, 0.333, 0)';

// ── Animated wrapper: outer=scale, inner=wobble ───────────────────────────────
function SpringPart({
  children, scaleAxis, duration, delay, originX, originY,
}: {
  children: React.ReactNode;
  scaleAxis: 'Y' | 'both';
  duration: number;
  delay: number;
  originX: string;
  originY: string;
}) {
  const growAnim = scaleAxis === 'Y' ? 'tulip-stem-grow' : 'tulip-bloom-grow';
  const origin   = `${originX} ${originY}`;
  return (
    <div style={{ transformOrigin: origin, animation: `${growAnim} ${duration}s ${SPRING} both`, animationDelay: `${delay}s` }}>
      <div style={{ transformOrigin: origin, animation: `tulip-wobble ${duration * 1.1}s ease-out both`, animationDelay: `${delay}s` }}>
        {children}
      </div>
    </div>
  );
}

// ── Dandelion SVG ─────────────────────────────────────────────────────────────
function DandelionSVG({ h, baseDelay }: { h: number; baseDelay: number }) {
  const headY   = h * 0.26;          // centre of the puff head (SVG coords, y from top)
  const headR   = Math.min(h * 0.24, 28);  // radius of the full puff
  const numRays = 24;

  // Rays radiating from centre
  const rays = Array.from({ length: numRays }, (_, i) => {
    const angle  = (i / numRays) * 2 * Math.PI - Math.PI / 2;
    const inner  = headR * 0.18;    // start slightly away from centre
    const outer  = headR * 0.92;    // end near puff edge
    const tipR   = headR * 0.10;    // tip circle radius
    const x1 = CX  + inner * Math.cos(angle);
    const y1 = headY + inner * Math.sin(angle);
    const x2 = CX  + outer * Math.cos(angle);
    const y2 = headY + outer * Math.sin(angle);
    return { x1, y1, x2, y2, tipR, key: i };
  });

  const stemTop = headY + headR * 0.05; // stem meets just below head centre

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* ── Part 1: Stem — grows upward from ground ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <SpringPart scaleAxis="Y" duration={0.70} delay={baseDelay}
          originX={`${CX}px`} originY={`${h}px`}>
          <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} fill="none" style={{ display: 'block' }}>
            {/* main stem */}
            <line
              x1={CX} y1={stemTop}
              x2={CX} y2={h}
              stroke="#7ab86a" strokeWidth={2.5} strokeLinecap="round"
            />
          </svg>
        </SpringPart>
      </div>

      {/* ── Part 2: Dandelion head — starts AFTER stem finishes, springs small→big ── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <SpringPart scaleAxis="both" duration={0.65} delay={baseDelay + 0.70}
          originX={`${CX}px`} originY={`${headY}px`}>
          <svg width={W} height={h} viewBox={`0 0 ${W} ${h}`} fill="none" style={{ display: 'block' }}>
            {/* soft glow halo */}
            <circle cx={CX} cy={headY} r={headR} fill="rgba(255,255,220,0.35)" />

            {/* rays */}
            {rays.map(r => (
              <React.Fragment key={r.key}>
                <line
                  x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
                  stroke="#d8d8b0" strokeWidth={1.2} strokeLinecap="round"
                />
                {/* seed teardrop at tip */}
                <circle cx={r.x2} cy={r.y2} r={r.tipR} fill="#eeeed8" />
              </React.Fragment>
            ))}

            {/* centre dot */}
            <circle cx={CX} cy={headY} r={headR * 0.14} fill="#e8d840" />
            <circle cx={CX} cy={headY} r={headR * 0.08} fill="#c8b820" />
          </svg>
        </SpringPart>
      </div>

    </div>
  );
}

// ── Single slot with show/hide logic ─────────────────────────────────────────
function Dandelion({ visible, h, stagger, xPct }: {
  visible: boolean; h: number; stagger: number; xPct: number;
}) {
  const [gen, setGen] = useState(0);
  const prevVisible   = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      timerRef.current = setTimeout(() => {
        setGen(g => g + 1);
        timerRef.current = null;
      }, stagger);
    }
    if (!visible) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setGen(0);
    }
    prevVisible.current = visible;
  }, [visible, stagger]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div style={{
      position:      'absolute',
      bottom:        0,
      left:          `calc(${xPct}% - ${W / 2}px)`,
      width:         W,
      height:        h,
      opacity:       visible ? 1 : 0,
      transition:    visible ? 'none' : 'opacity 0.5s ease',
      pointerEvents: 'none',
    }}>
      {gen > 0 && <DandelionSVG key={gen} h={h} baseDelay={0} />}
    </div>
  );
}

// ── Layer ─────────────────────────────────────────────────────────────────────
export function TulipLayer({ count }: { count: number }) {
  return (
    <div style={{
      position:      'absolute',
      bottom:        '20%',
      left:          0,
      right:         0,
      height:        0,
      overflow:      'visible',
      pointerEvents: 'none',
      zIndex:        5,
    }}>
      {SLOTS.map((s, i) => (
        <Dandelion key={i} visible={i < count} h={s.h} stagger={s.stagger} xPct={s.xPct} />
      ))}
    </div>
  );
}
