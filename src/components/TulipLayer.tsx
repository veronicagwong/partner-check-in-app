import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions, organically scattered ────────────────────────
// Intentionally uneven: clusters in some zones, sparse gaps elsewhere.
// Heights vary widely so tall and short plants mix naturally.
// Stagger is non-sequential so nearby flowers don't pop up together.
const SLOTS = [
  // — first flowers to appear, seeding the scene —
  { xPct: 38, h: 158, stagger:   0 },   // near centre, first
  { xPct: 61, h: 144, stagger:  80 },   // right of centre
  { xPct: 18, h: 171, stagger: 200 },   // left zone
  { xPct: 82, h: 139, stagger: 130 },   // right zone
  { xPct:  7, h: 152, stagger: 310 },   // far left, lone
  { xPct: 54, h: 165, stagger:  50 },   // centre-right cluster start
  { xPct: 73, h: 148, stagger: 240 },   // right of that
  { xPct: 29, h: 136, stagger: 170 },   // left-of-centre

  // — second burst, filling gaps and building clusters —
  { xPct: 57, h: 178, stagger:  20 },   // tall one right by slot 5 — cluster
  { xPct: 44, h: 141, stagger: 360 },   // near slot 0
  { xPct: 12, h: 162, stagger: 110 },   // left cluster with slot 2
  { xPct: 91, h: 155, stagger: 290 },   // far right lone
  { xPct: 67, h: 133, stagger:  70 },   // short, between slots 6 & 3
  { xPct: 23, h: 169, stagger: 420 },   // joins slot 2 cluster
  { xPct: 48, h: 145, stagger: 150 },   // centre fill
  { xPct: 79, h: 175, stagger: 230 },   // tallest right-zone

  // — third wave, denser clustering —
  { xPct: 35, h: 138, stagger: 330 },   // left of centre group
  { xPct: 59, h: 152, stagger:  40 },   // right of centre, near slot 1
  { xPct:  4, h: 143, stagger: 190 },   // extreme left edge
  { xPct: 86, h: 161, stagger: 270 },   // far right cluster with slot 11
  { xPct: 26, h: 174, stagger:  95 },   // left cluster fills in
  { xPct: 70, h: 137, stagger: 380 },   // right mid, near slot 6
  { xPct: 42, h: 156, stagger: 210 },   // centre dense patch

  // — fourth wave, finishing touches and micro-clusters —
  { xPct: 52, h: 147, stagger:  60 },   // tight cluster around centre
  { xPct: 15, h: 166, stagger: 300 },   // near slot 2 group
  { xPct: 76, h: 142, stagger: 140 },   // right side fills dense
  { xPct: 32, h: 153, stagger: 440 },   // left-centre gap fill
  { xPct: 64, h: 170, stagger:  30 },   // tall right-of-centre
  { xPct:  9, h: 135, stagger: 350 },   // left cluster small one
  { xPct: 94, h: 159, stagger: 185 },   // far right edge, lone
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
