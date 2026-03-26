import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions, organically scattered ────────────────────────
const SLOTS = [
  { xPct: 38, h: 158, stagger:   0 },
  { xPct: 61, h: 144, stagger:  80 },
  { xPct: 18, h: 171, stagger: 200 },
  { xPct: 82, h: 139, stagger: 130 },
  { xPct:  7, h: 152, stagger: 310 },
  { xPct: 54, h: 165, stagger:  50 },
  { xPct: 73, h: 148, stagger: 240 },
  { xPct: 29, h: 136, stagger: 170 },
  { xPct: 57, h: 178, stagger:  20 },
  { xPct: 44, h: 141, stagger: 360 },
  { xPct: 12, h: 162, stagger: 110 },
  { xPct: 91, h: 155, stagger: 290 },
  { xPct: 67, h: 133, stagger:  70 },
  { xPct: 23, h: 169, stagger: 420 },
  { xPct: 48, h: 145, stagger: 150 },
  { xPct: 79, h: 175, stagger: 230 },
  { xPct: 35, h: 138, stagger: 330 },
  { xPct: 59, h: 152, stagger:  40 },
  { xPct:  4, h: 143, stagger: 190 },
  { xPct: 86, h: 161, stagger: 270 },
  { xPct: 26, h: 174, stagger:  95 },
  { xPct: 70, h: 137, stagger: 380 },
  { xPct: 42, h: 156, stagger: 210 },
  { xPct: 52, h: 147, stagger:  60 },
  { xPct: 15, h: 166, stagger: 300 },
  { xPct: 76, h: 142, stagger: 140 },
  { xPct: 32, h: 153, stagger: 440 },
  { xPct: 64, h: 170, stagger:  30 },
  { xPct:  9, h: 135, stagger: 350 },
  { xPct: 94, h: 159, stagger: 185 },
];

// Shuffle so 5 types spread organically — 6 of each, never same kind twice in a row
const SLOT_KINDS = [
  0, 2, 1, 4, 3,
  2, 0, 4, 1, 3,
  3, 1, 2, 0, 4,
  4, 3, 0, 2, 1,
  1, 4, 3, 0, 2,
  2, 0, 1, 4, 3,
];

const W = 68; // slot container width

// ── Per-flower SVG dimensions ─────────────────────────────────────────────────
// bloomTop = distance from slot top to bottom of SVG / top of stem (px)
const FLOWER_META = [
  { svgW: 130, svgH: 118, bloomTop: 70 }, // 0 Poppy
  { svgW: 142, svgH: 130, bloomTop: 82 }, // 1 Peony
  { svgW: 112, svgH: 100, bloomTop: 56 }, // 2 Buttercup
  { svgW: 120, svgH: 114, bloomTop: 66 }, // 3 Cosmos
  { svgW: 122, svgH: 110, bloomTop: 66 }, // 4 Wild Rose
];

// ── SVG flower components ─────────────────────────────────────────────────────
// Each uid is the slot index as a string, making all filter/gradient IDs page-unique.

// 0 — Poppy: 5 large rounded petals, bold coral-red
function PoppySVG({ uid }: { uid: string }) {
  const cx = 65, cy = 72;
  const N = 5, off = 26, rx = 19, ry = 29;
  const pts = Array.from({ length: N }, (_, i) => i * (360 / N));
  return (
    <svg width={130} height={118} viewBox="0 0 130 118" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`pp-g-${uid}`} cx="50%" cy="65%" r="60%">
          <stop offset="0%"   stopColor="#F9AE90" />
          <stop offset="55%"  stopColor="#E8543A" />
          <stop offset="100%" stopColor="#B0301A" />
        </radialGradient>
        {/* soft edge blur merged back with source for painted look */}
        <filter id={`pp-f-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* outer glow */}
        <filter id={`pp-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* outer glow pass */}
      <g opacity="0.45" filter={`url(#pp-glow-${uid})`}>
        {pts.map(a => (
          <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
            fill="#F4967A" transform={`rotate(${a},${cx},${cy})`} />
        ))}
      </g>
      {/* petals */}
      {pts.map(a => (
        <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
          fill={`url(#pp-g-${uid})`}
          filter={`url(#pp-f-${uid})`}
          transform={`rotate(${a},${cx},${cy})`} />
      ))}
      {/* dark centre + golden boss */}
      <circle cx={cx} cy={cy} r={9}   fill="#2A0808" />
      <circle cx={cx} cy={cy} r={5}   fill="#FFD600" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * 2 * Math.PI;
        return <circle key={i} cx={cx + Math.cos(a) * 3.6} cy={cy + Math.sin(a) * 3.6}
          r={1.4} fill="#FFB000" />;
      })}
    </svg>
  );
}

// 1 — Peony: 3 rings of petals layered outer→inner, blush pink
function PeonySVG({ uid }: { uid: string }) {
  const cx = 71, cy = 76;
  // rings rendered back→front (outer last = appears on top → wrong for a peony)
  // Peony outer petals should be BEHIND inner → render outer first
  const rings = [
    { n: 7, off: 34, rx: 14, ry: 23, fill: '#FFD6D0', rot: 0  },
    { n: 6, off: 22, rx: 12, ry: 17, fill: '#FFC0B4', rot: 15 },
    { n: 5, off: 13, rx:  9, ry: 13, fill: '#FFAAA0', rot: 6  },
  ];
  return (
    <svg width={142} height={130} viewBox="0 0 142 130" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <filter id={`pe-f-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`pe-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {/* large diffuse glow */}
      <circle cx={cx} cy={cy} r={40} fill="rgba(255,195,188,0.5)" filter={`url(#pe-glow-${uid})`} />
      {rings.map((ring) => (
        Array.from({ length: ring.n }, (_, i) => (
          <ellipse key={`${ring.n}-${i}`}
            cx={cx} cy={cy - ring.off} rx={ring.rx} ry={ring.ry}
            fill={ring.fill}
            filter={`url(#pe-f-${uid})`}
            transform={`rotate(${ring.rot + i * (360 / ring.n)},${cx},${cy})`} />
        ))
      ))}
      {/* centre */}
      <circle cx={cx} cy={cy} r={7}   fill="#FFF5F0" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 2 * Math.PI;
        return <circle key={i} cx={cx + Math.cos(a) * 4.2} cy={cy + Math.sin(a) * 4.2}
          r={1.5} fill="#FFD600" />;
      })}
    </svg>
  );
}

// 2 — Buttercup: 6 bright yellow petals, large bold orange centre
function ButtercupSVG({ uid }: { uid: string }) {
  const cx = 56, cy = 58;
  const N = 6, off = 21, rx = 14, ry = 22;
  const pts = Array.from({ length: N }, (_, i) => i * (360 / N));
  return (
    <svg width={112} height={100} viewBox="0 0 112 100" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`bc-g-${uid}`} cx="50%" cy="80%" r="65%">
          <stop offset="0%"   stopColor="#FFEE88" />
          <stop offset="65%"  stopColor="#FFD600" />
          <stop offset="100%" stopColor="#E8B800" />
        </radialGradient>
        <radialGradient id={`bc-c-${uid}`} cx="38%" cy="38%" r="65%">
          <stop offset="0%"   stopColor="#FFA400" />
          <stop offset="100%" stopColor="#D86000" />
        </radialGradient>
        <filter id={`bc-f-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.0" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`bc-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g opacity="0.55" filter={`url(#bc-glow-${uid})`}>
        {pts.map(a => (
          <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
            fill="#FFD600" transform={`rotate(${a},${cx},${cy})`} />
        ))}
      </g>
      {pts.map(a => (
        <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
          fill={`url(#bc-g-${uid})`}
          filter={`url(#bc-f-${uid})`}
          transform={`rotate(${a},${cx},${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={13} fill={`url(#bc-c-${uid})`} />
      <circle cx={cx} cy={cy} r={7}  fill="#FFD600" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 2 * Math.PI;
        return <circle key={i} cx={cx + Math.cos(a) * 5} cy={cy + Math.sin(a) * 5}
          r={1} fill="#8B4000" />;
      })}
    </svg>
  );
}

// 3 — Cosmos: 8 narrow elongated petals, lilac-purple
function CosmosSVG({ uid }: { uid: string }) {
  const cx = 60, cy = 66;
  const N = 8, off = 26, rx = 10, ry = 29;
  const pts = Array.from({ length: N }, (_, i) => i * (360 / N));
  return (
    <svg width={120} height={114} viewBox="0 0 120 114" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`co-g-${uid}`} cx="50%" cy="85%" r="70%">
          <stop offset="0%"   stopColor="#EDD8FF" />
          <stop offset="60%"  stopColor="#C084FC" />
          <stop offset="100%" stopColor="#8030D8" />
        </radialGradient>
        <filter id={`co-f-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`co-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <g opacity="0.5" filter={`url(#co-glow-${uid})`}>
        {pts.map(a => (
          <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
            fill="#C084FC" transform={`rotate(${a},${cx},${cy})`} />
        ))}
      </g>
      {pts.map(a => (
        <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
          fill={`url(#co-g-${uid})`}
          filter={`url(#co-f-${uid})`}
          transform={`rotate(${a},${cx},${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={7}   fill="#FFE040" />
      <circle cx={cx} cy={cy} r={3.5} fill="#FF9000" />
    </svg>
  );
}

// 4 — Wild Rose: 5 petals, hot pink with creamy centre and stamens
function WildRoseSVG({ uid }: { uid: string }) {
  const cx = 61, cy = 66;
  const N = 5, off = 25, rx = 18, ry = 26;
  const pts = Array.from({ length: N }, (_, i) => i * (360 / N));
  return (
    <svg width={122} height={110} viewBox="0 0 122 110" overflow="visible" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`wr-g-${uid}`} cx="50%" cy="58%" r="68%">
          <stop offset="0%"   stopColor="#FFD8EC" />
          <stop offset="52%"  stopColor="#FF6EB4" />
          <stop offset="100%" stopColor="#CC2880" />
        </radialGradient>
        <filter id={`wr-f-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`wr-glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g opacity="0.45" filter={`url(#wr-glow-${uid})`}>
        {pts.map(a => (
          <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
            fill="#FF6EB4" transform={`rotate(${a},${cx},${cy})`} />
        ))}
      </g>
      {pts.map(a => (
        <ellipse key={a} cx={cx} cy={cy - off} rx={rx} ry={ry}
          fill={`url(#wr-g-${uid})`}
          filter={`url(#wr-f-${uid})`}
          transform={`rotate(${a},${cx},${cy})`} />
      ))}
      {/* creamy centre */}
      <circle cx={cx} cy={cy} r={10} fill="#FFF8F0" />
      <circle cx={cx} cy={cy} r={5}  fill="#FFF0A8" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * 2 * Math.PI;
        return <circle key={i} cx={cx + Math.cos(a) * 4.8} cy={cy + Math.sin(a) * 4.8}
          r={1.3} fill="#FFD200" />;
      })}
    </svg>
  );
}

const FLOWER_SVGS = [PoppySVG, PeonySVG, ButtercupSVG, CosmosSVG, WildRoseSVG];

// ── FlowerBloom: stem + positioned/animated SVG head ─────────────────────────
function FlowerBloom({ h, baseDelay, kind, uid }: {
  h: number; baseDelay: number; kind: number; uid: string;
}) {
  const meta        = FLOWER_META[kind];
  const FlowerComp  = FLOWER_SVGS[kind];
  const stemTop     = meta.bloomTop;

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* Stem — grows upward from ground */}
      <div style={{
        position:        'absolute',
        left:            W / 2 - 1,
        top:             stemTop,
        width:           2,
        height:          h - stemTop,
        background:      'linear-gradient(to bottom, rgba(118,180,88,0.9), rgba(100,158,68,0.3))',
        filter:          'blur(0.5px)',
        borderRadius:    2,
        transformOrigin: 'bottom center',
        animation:       `tulip-stem-grow 0.45s ease-out ${baseDelay}s both`,
      }} />

      {/* Flower head — scales up from stem connection point */}
      <div style={{
        position:        'absolute',
        left:            W / 2 - meta.svgW / 2,
        top:             meta.bloomTop - meta.svgH,
        // transform-origin at bottom-centre of SVG so it grows from the stem
        transformOrigin: `${meta.svgW / 2}px ${meta.svgH}px`,
        animation:       `flower-bloom 0.15s ease-out ${baseDelay + 0.35}s both`,
      }}>
        <FlowerComp uid={uid} />
      </div>

    </div>
  );
}

// ── Single slot ───────────────────────────────────────────────────────────────
function Flower({ visible, h, stagger, xPct, kind, uid }: {
  visible: boolean; h: number; stagger: number;
  xPct: number; kind: number; uid: string;
}) {
  const [gen, setGen]   = useState(0);
  const prevVisible     = useRef(false);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      transition:    visible ? 'none' : 'opacity 0.8s ease',
      pointerEvents: 'none',
    }}>
      {gen > 0 && <FlowerBloom key={gen} h={h} baseDelay={0} kind={kind} uid={uid} />}
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
        <Flower
          key={i}
          visible={i < count}
          h={s.h}
          stagger={s.stagger}
          xPct={s.xPct}
          kind={SLOT_KINDS[i]}
          uid={String(i)}
        />
      ))}
    </div>
  );
}
