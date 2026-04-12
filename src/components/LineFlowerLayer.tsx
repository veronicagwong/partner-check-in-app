import React, { useEffect, useRef, useState } from 'react';

// ── Shared slot layout (identical to TulipLayer) ──────────────────────────────
const SLOTS = [
  { xPct: 38, h: 238, stagger:   0 },
  { xPct: 61, h: 224, stagger:  80 },
  { xPct: 18, h: 252, stagger: 200 },
  { xPct: 82, h: 220, stagger: 130 },
  { xPct: 16, h: 232, stagger: 310 },
  { xPct: 54, h: 245, stagger:  50 },
  { xPct: 73, h: 228, stagger: 240 },
  { xPct: 29, h: 216, stagger: 170 },
  { xPct: 57, h: 258, stagger:  20 },
  { xPct: 44, h: 222, stagger: 360 },
  { xPct: 22, h: 242, stagger: 110 },
  { xPct: 83, h: 235, stagger: 290 },
  { xPct: 67, h: 213, stagger:  70 },
  { xPct: 23, h: 249, stagger: 420 },
  { xPct: 48, h: 225, stagger: 150 },
  { xPct: 79, h: 255, stagger: 230 },
  { xPct: 35, h: 218, stagger: 330 },
  { xPct: 59, h: 232, stagger:  40 },
  { xPct: 17, h: 223, stagger: 190 },
  { xPct: 84, h: 241, stagger: 270 },
  { xPct: 26, h: 254, stagger:  95 },
  { xPct: 70, h: 217, stagger: 380 },
  { xPct: 45, h: 295, stagger: 210 },
  { xPct: 52, h: 227, stagger:  60 },
  { xPct: 15, h: 246, stagger: 300 },
  { xPct: 76, h: 222, stagger: 140 },
  { xPct: 32, h: 233, stagger: 440 },
  { xPct: 64, h: 250, stagger:  30 },
  { xPct: 19, h: 215, stagger: 350 },
  { xPct: 81, h: 239, stagger: 185 },
];

const SLOT_DEPTHS: (1 | 2 | 3 | 4)[] = [
  3, 2, 4, 1, 2,
  3, 4, 1, 2, 3,
  1, 4, 2, 3, 1,
  2, 4, 1, 3, 2,
  3, 1, 4, 2, 4,
  1, 3, 2, 4, 3,
];

const SCALE_BY_DEPTH: Record<1 | 2 | 3 | 4, number> = {
  1: 0.30,
  2: 0.52,
  3: 0.74,
  4: 1.00,
};

const SLOT_KINDS = [
  0, 2, 1, 4, 3,
  2, 0, 4, 1, 3,
  3, 1, 2, 0, 4,
  4, 3, 0, 2, 1,
  1, 4, 3, 0, 2,
  2, 0, 1, 4, 3,
];

const W = 68;
const SLOT_INDICES = Array.from({ length: SLOTS.length }, (_, i) => i);

function shuffled(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Per-flower dimensions ─────────────────────────────────────────────────────
// bloomTop: y (from slot top) where stem ends and head begins
interface FlowerDims { bloomTop: number; headW: number; headH: number; }

const DIMS: FlowerDims[] = [
  { bloomTop: 72, headW: 52, headH: 58  },  // 0 — tulip
  { bloomTop: 66, headW: 70, headH: 66  },  // 1 — daisy
  { bloomTop: 76, headW: 68, headH: 60  },  // 2 — lotus star
  { bloomTop: 70, headW: 76, headH: 84  },  // 3 — rose
  { bloomTop: 56, headW: 74, headH: 104 },  // 4 — branching buds
];

const STROKE = '#3A44DC';
const SW  = 2.4;   // main stroke
const SWT = 1.8;   // thin detail stroke

// ── Shared SVG props ──────────────────────────────────────────────────────────
const SVG_PROPS = {
  fill:            'none',
  stroke:          STROKE,
  strokeLinecap:   'round'  as const,
  strokeLinejoin:  'round'  as const,
};

// ── Flower head SVGs ──────────────────────────────────────────────────────────
// Each SVG origin is top-left of the head bounding box.
// Stem attachment point sits at (headW/2, headH) — bottom centre.

function HeadSVG({ kind, headW: hw, headH: hh }: { kind: number; headW: number; headH: number }) {
  const cx = hw / 2;
  const cy = hh;  // bottom attachment

  if (kind === 0) {
    // ── Tulip — 3 separate teardrop petals fanning from the stem attachment ──
    return (
      <svg viewBox={`0 0 ${hw} ${hh}`} width={hw} height={hh}
           {...SVG_PROPS} overflow="visible">
        {/* Centre petal — tallest, goes straight up */}
        <path strokeWidth={SW} d={
          `M${cx},${cy} C${cx-7},${cy-18} ${cx-7},${cy-48} ${cx},${cy-58}`+
          ` C${cx+7},${cy-48} ${cx+7},${cy-18} ${cx},${cy}`
        } />
        {/* Left petal — fans out to the left */}
        <path strokeWidth={SW} d={
          `M${cx-2},${cy} C${cx-14},${cy-10} ${cx-22},${cy-32} ${cx-16},${cy-50}`+
          ` C${cx-13},${cy-56} ${cx-7},${cy-54} ${cx-4},${cy-44}`+
          ` C${cx-6},${cy-28} ${cx-4},${cy-12} ${cx-2},${cy}`
        } />
        {/* Right petal — mirrors left */}
        <path strokeWidth={SW} d={
          `M${cx+2},${cy} C${cx+14},${cy-10} ${cx+22},${cy-32} ${cx+16},${cy-50}`+
          ` C${cx+13},${cy-56} ${cx+7},${cy-54} ${cx+4},${cy-44}`+
          ` C${cx+6},${cy-28} ${cx+4},${cy-12} ${cx+2},${cy}`
        } />
      </svg>
    );
  }

  if (kind === 1) {
    // ── Daisy — 8 oval petals + centre circle ────────────────────────────────
    // Flower centre sits 36px above attachment
    const fy = cy - 36;
    const petalCy = fy - 20;  // petal ellipse centre (20px above flower centre)
    return (
      <svg viewBox={`0 0 ${hw} ${hh}`} width={hw} height={hh}
           {...SVG_PROPS} overflow="visible">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
          <ellipse key={a}
            cx={cx} cy={petalCy}
            rx={6} ry={11}
            strokeWidth={SWT}
            transform={`rotate(${a},${cx},${fy})`}
          />
        ))}
        <circle cx={cx} cy={fy} r={8} strokeWidth={SW} />
      </svg>
    );
  }

  if (kind === 2) {
    // ── Lotus star — 6 pointed petals radiating from centre ─────────────────
    // Flower centre 28px above attachment
    const fy = cy - 28;
    return (
      <svg viewBox={`0 0 ${hw} ${hh}`} width={hw} height={hh}
           {...SVG_PROPS} overflow="visible">
        {[0, 60, 120, 180, 240, 300].map(a => (
          <path key={a}
            strokeWidth={SWT}
            d={`M${cx},${fy} C${cx-5},${fy-10} ${cx-5},${fy-24} ${cx},${fy-36} C${cx+5},${fy-24} ${cx+5},${fy-10} ${cx},${fy}`}
            transform={`rotate(${a},${cx},${fy})`}
          />
        ))}
        {/* Small inner petals between main ones for fullness */}
        {[30, 90, 150, 210, 270, 330].map(a => (
          <path key={`i${a}`}
            strokeWidth={SWT-0.6}
            d={`M${cx},${fy} C${cx-3},${fy-8} ${cx-3},${fy-18} ${cx},${fy-26} C${cx+3},${fy-18} ${cx+3},${fy-8} ${cx},${fy}`}
            transform={`rotate(${a},${cx},${fy})`}
          />
        ))}
        <circle cx={cx} cy={fy} r={5} strokeWidth={SW} />
      </svg>
    );
  }

  if (kind === 3) {
    // ── Rose — wide round head (front view), prominent spiral, cup calyx ──────
    // Circle centre sits at (cx, fy); r=30. headW=76, headH=84, cx=38, fy=40.
    const fy = cy - 44;   // circle centre
    const r  = 30;        // outer radius
    return (
      <svg viewBox={`0 0 ${hw} ${hh}`} width={hw} height={hh}
           {...SVG_PROPS} overflow="visible">

        {/* ── Outer circle ── */}
        <path strokeWidth={SW} d={
          `M${cx-r},${fy}`+
          ` Q${cx-r},${fy-r} ${cx},${fy-r}`+
          ` Q${cx+r},${fy-r} ${cx+r},${fy}`+
          ` Q${cx+r},${fy+r} ${cx},${fy+r}`+
          ` Q${cx-r},${fy+r} ${cx-r},${fy}`
        } />

        {/* ── Calyx cup — two sides from circle base down to stem attachment ── */}
        <path strokeWidth={SW} d={`M${cx-12},${cy} C${cx-20},${cy-12} ${cx-28},${cy-24} ${cx-r},${fy+r-2}`} />
        <path strokeWidth={SW} d={`M${cx+12},${cy} C${cx+20},${cy-12} ${cx+28},${cy-24} ${cx+r},${fy+r-2}`} />

        {/* ── Guard sepal bumps at base of cup ── */}
        <path strokeWidth={SWT-0.3} d={`M${cx-12},${cy} Q${cx-17},${cy+7} ${cx-22},${cy+3} Q${cx-19},${cy-2} ${cx-12},${cy}`} />
        <path strokeWidth={SWT-0.3} d={`M${cx+12},${cy} Q${cx+17},${cy+7} ${cx+22},${cy+3} Q${cx+19},${cy-2} ${cx+12},${cy}`} />

        {/* ── Inner rose spiral: ~1.5 turns from rim to centre ── */}
        {/*  outer ring → second ring → centre curl                */}
        <path strokeWidth={SWT} d={
          // outer inner ring (4px inside)
          `M${cx-r+4},${fy}`+
          ` Q${cx-r+4},${fy-r+6} ${cx},${fy-r+5}`+
          ` Q${cx+r-4},${fy-r+6} ${cx+r-4},${fy}`+
          ` Q${cx+r-4},${fy+r-6} ${cx},${fy+r-5}`+
          // second ring (12px inside) — sweeps back around
          ` Q${cx-r+12},${fy+r-5} ${cx-r+12},${fy}`+
          ` Q${cx-r+12},${fy-r+16} ${cx},${fy-r+14}`+
          ` Q${cx+r-14},${fy-r+14} ${cx+r-14},${fy}`+
          // centre curl
          ` Q${cx+r-14},${fy+10} ${cx+4},${fy+8}`+
          ` Q${cx-6},${fy+8} ${cx-4},${fy}`+
          ` Q${cx-4},${fy-8} ${cx+2},${fy-6}`
        } />

        {/* ── Centre dot ── */}
        <circle cx={cx} cy={fy} r={4.5} strokeWidth={SWT} />

      </svg>
    );
  }

  if (kind === 4) {
    // ── Branching buds — curving stem with 3 buds ────────────────────────────
    return (
      <svg viewBox={`0 0 ${hw} ${hh}`} width={hw} height={hh}
           {...SVG_PROPS} overflow="visible">
        {/* Main curving stem */}
        <path strokeWidth={SW} d={
          `M${cx},${cy} C${cx-2},${cy-32} ${cx-4},${cy-56} ${cx},${cy-76}`+
          ` C${cx+2},${cy-88} ${cx},${cy-98} ${cx},${cy-100}`
        } />
        {/* Left branch */}
        <path strokeWidth={SW} d={
          `M${cx-2},${cy-56} C${cx-10},${cy-64} ${cx-18},${cy-72} ${cx-24},${cy-82}`
        } />
        {/* Right branch */}
        <path strokeWidth={SW} d={
          `M${cx+1},${cy-76} C${cx+8},${cy-84} ${cx+16},${cy-90} ${cx+22},${cy-98}`
        } />
        {/* Left bud */}
        <circle cx={cx-24} cy={cy-88} r={7.5} strokeWidth={SW} />
        {/* Right bud */}
        <circle cx={cx+22} cy={cy-104} r={7.5} strokeWidth={SW} />
        {/* Top bud */}
        <circle cx={cx} cy={cy-100} r={7.5} strokeWidth={SW} />
        {/* Leaf on main stem */}
        <path strokeWidth={SWT} d={
          `M${cx},${cy-42} C${cx-10},${cy-46} ${cx-16},${cy-40} ${cx-13},${cy-32}`+
          ` C${cx-10},${cy-24} ${cx-2},${cy-28} ${cx},${cy-38}`
        } />
      </svg>
    );
  }

  return null;
}

// ── Stem SVG ──────────────────────────────────────────────────────────────────
// viewBox: 0 0 W stemH — y=0 is bloom point, y=stemH is ground
function StemSVG({ kind, stemH }: { kind: number; stemH: number }) {
  const cx = W / 2;
  return (
    <svg viewBox={`0 0 ${W} ${stemH}`} width={W} height={stemH}
         {...SVG_PROPS} overflow="visible">
      {/* Main stem */}
      <path strokeWidth={SW} d={`M${cx},${stemH} L${cx},0`} />

      {/* Per-kind ground / stem details */}
      {kind === 0 && <>
        {/* Tulip: two spreading ground leaves */}
        <path strokeWidth={SWT} d={`M${cx+2},${stemH-2} Q${cx+12},${stemH-18} ${cx+22},${stemH-8}`} />
        <path strokeWidth={SWT} d={`M${cx-2},${stemH-2} Q${cx-12},${stemH-18} ${cx-22},${stemH-8}`} />
        {/* Close the leaves back toward stem */}
        <path strokeWidth={SWT-0.4} d={`M${cx+22},${stemH-8} Q${cx+18},${stemH-2} ${cx+4},${stemH}`} />
        <path strokeWidth={SWT-0.4} d={`M${cx-22},${stemH-8} Q${cx-18},${stemH-2} ${cx-4},${stemH}`} />
      </>}

      {kind === 1 && <>
        {/* Daisy: 4 grass-style base leaves */}
        <path strokeWidth={SWT} d={`M${cx},${stemH} Q${cx-18},${stemH-28} ${cx-26},${stemH-14}`} />
        <path strokeWidth={SWT} d={`M${cx},${stemH} Q${cx-8},${stemH-30} ${cx-10},${stemH-16}`} />
        <path strokeWidth={SWT} d={`M${cx},${stemH} Q${cx+8},${stemH-30} ${cx+10},${stemH-16}`} />
        <path strokeWidth={SWT} d={`M${cx},${stemH} Q${cx+18},${stemH-28} ${cx+26},${stemH-14}`} />
      </>}

      {kind === 3 && <>
        {/* Rose: two large prominent leaves — match the reference drawing */}
        {/* Left leaf at ~45% height — big oval sweeping left */}
        <path strokeWidth={SW} d={
          `M${cx},${stemH*0.46} C${cx-14},${stemH*0.38} ${cx-26},${stemH*0.38} ${cx-24},${stemH*0.52}`+
          ` C${cx-22},${stemH*0.64} ${cx-8},${stemH*0.62} ${cx},${stemH*0.50}`
        } />
        {/* Right leaf at ~54% height — big oval sweeping right */}
        <path strokeWidth={SW} d={
          `M${cx},${stemH*0.54} C${cx+14},${stemH*0.46} ${cx+26},${stemH*0.46} ${cx+24},${stemH*0.60}`+
          ` C${cx+22},${stemH*0.72} ${cx+8},${stemH*0.70} ${cx},${stemH*0.58}`
        } />
      </>}
    </svg>
  );
}

// ── LineFlowerBloom — renders one flower with staggered entrance animation ────
function LineFlowerBloom({ h, baseDelay, kind }: {
  h: number; baseDelay: number; kind: number;
}) {
  const { bloomTop, headW, headH } = DIMS[kind];
  const stemH     = h - bloomTop;
  const headDelay = baseDelay + 0.50;

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* ── Stem: grows upward from ground ── */}
      <div style={{
        position:        'absolute',
        left:            0,
        bottom:          0,
        width:           W,
        height:          stemH,
        transformOrigin: 'bottom center',
        animation:       `tulip-stem-grow 0.55s ease-out ${baseDelay}s both`,
        pointerEvents:   'none',
      }}>
        <StemSVG kind={kind} stemH={stemH} />
      </div>

      {/* ── Flower head: wobble wrapper (rotate) ── */}
      <div style={{
        position:        'absolute',
        left:            W / 2 - headW / 2,
        top:             bloomTop - headH,
        width:           headW,
        height:          headH,
        transformOrigin: 'center bottom',
        animation:       `tulip-wobble 2.2s ease-out ${headDelay}s both`,
        pointerEvents:   'none',
      }}>
        {/* ── Bloom scale wrapper ── */}
        <div style={{
          width:           '100%',
          height:          '100%',
          transformOrigin: 'center bottom',
          animation:       `tulip-bloom-grow 0.6s cubic-bezier(0.34,1.56,0.64,1) ${headDelay}s both`,
        }}>
          <HeadSVG kind={kind} headW={headW} headH={headH} />
        </div>
      </div>

    </div>
  );
}

// ── Single slot with show / hide logic ───────────────────────────────────────
function LineFlower({ visible, h, stagger, xPct, kind, scale }: {
  visible: boolean; h: number; stagger: number;
  xPct: number; kind: number; scale: number;
}) {
  const [gen, setGen]       = useState(0);
  const prevVisible         = useRef(false);
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      timerRef.current = setTimeout(() => {
        setGen(g => g + 1);
        timerRef.current = null;
      }, stagger);
    }
    if (!visible && prevVisible.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      timerRef.current = setTimeout(() => {
        setGen(0);
        timerRef.current = null;
      }, 550);
    }
    prevVisible.current = visible;
  }, [visible, stagger]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div style={{
      position:        'absolute',
      bottom:          0,
      left:            `calc(${xPct}% - ${W / 2}px)`,
      width:           W,
      height:          h,
      opacity:         visible ? 1 : 0,
      transform:       visible ? 'scale(1)' : 'scale(0)',
      transformOrigin: 'bottom center',
      transition:      visible
        ? 'none'
        : 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.4, 0, 0.8, 0.2)',
      pointerEvents:   'none',
    }}>
      <div style={{
        width:           W,
        height:          h,
        transformOrigin: 'bottom center',
        transform:       `scale(${scale})`,
      }}>
        {gen > 0 && <LineFlowerBloom key={gen} h={h} baseDelay={0} kind={kind} />}
      </div>
    </div>
  );
}

// ── Layer ─────────────────────────────────────────────────────────────────────
export function LineFlowerLayer({ count }: { count: number }) {
  const [order, setOrder] = useState<number[]>(() => shuffled(SLOT_INDICES));
  const prevCount         = useRef(0);

  useEffect(() => {
    if (count === 0 && prevCount.current > 0) {
      setOrder(shuffled(SLOT_INDICES));
    }
    prevCount.current = count;
  }, [count]);

  const depths = [1, 2, 3, 4] as const;

  return (
    <>
      {depths.map(d => (
        <div key={d} style={{
          position:      'absolute',
          bottom:        '28%',
          left:          0,
          right:         0,
          height:        0,
          overflow:      'visible',
          pointerEvents: 'none',
          zIndex:        d,
        }}>
          {order.map((slotIdx, displayPos) => {
            if (SLOT_DEPTHS[slotIdx] !== d) return null;
            const s = SLOTS[slotIdx];
            return (
              <LineFlower
                key={displayPos}
                visible={displayPos < count}
                h={s.h}
                stagger={s.stagger}
                xPct={s.xPct}
                kind={SLOT_KINDS[slotIdx]}
                scale={SCALE_BY_DEPTH[d]}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
