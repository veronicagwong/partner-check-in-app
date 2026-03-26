import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions, organically scattered ────────────────────────
// xPct clamped to [15, 85] — matching the grass left/right margins so edges stay flower-free.
// Order is shuffled each smile session; these are the positional pool, not a fixed sequence.
const SLOTS = [
  { xPct: 38, h: 118, stagger:   0 },
  { xPct: 61, h: 104, stagger:  80 },
  { xPct: 18, h: 132, stagger: 200 },
  { xPct: 82, h: 100, stagger: 130 },
  { xPct: 16, h: 112, stagger: 310 },
  { xPct: 54, h: 125, stagger:  50 },
  { xPct: 73, h: 108, stagger: 240 },
  { xPct: 29, h:  96, stagger: 170 },
  { xPct: 57, h: 138, stagger:  20 },
  { xPct: 44, h: 102, stagger: 360 },
  { xPct: 22, h: 122, stagger: 110 },
  { xPct: 83, h: 115, stagger: 290 },
  { xPct: 67, h:  93, stagger:  70 },
  { xPct: 23, h: 129, stagger: 420 },
  { xPct: 48, h: 105, stagger: 150 },
  { xPct: 79, h: 135, stagger: 230 },
  { xPct: 35, h:  98, stagger: 330 },
  { xPct: 59, h: 112, stagger:  40 },
  { xPct: 17, h: 103, stagger: 190 },
  { xPct: 84, h: 121, stagger: 270 },
  { xPct: 26, h: 134, stagger:  95 },
  { xPct: 70, h:  97, stagger: 380 },
  { xPct: 45, h: 175, stagger: 210 },  // central tall depth-4 — reaches into face area
  { xPct: 52, h: 107, stagger:  60 },
  { xPct: 15, h: 126, stagger: 300 },
  { xPct: 76, h: 102, stagger: 140 },
  { xPct: 32, h: 113, stagger: 440 },
  { xPct: 64, h: 130, stagger:  30 },
  { xPct: 19, h:  95, stagger: 350 },
  { xPct: 81, h: 119, stagger: 185 },
];

// ── Depth layer per slot (1 = back/small, 4 = front/large) ───────────────────
// 7×depth-1, 8×depth-2, 8×depth-3, 7×depth-4 — evenly distributed
// Matched to zIndex layers in GrassLayer (back=1 … near-front=4)
const SLOT_DEPTHS: (1 | 2 | 3 | 4)[] = [
  3, 2, 4, 1, 2,   // slots  0–4
  3, 4, 1, 2, 3,   // slots  5–9
  1, 4, 2, 3, 1,   // slots 10–14
  2, 4, 1, 3, 2,   // slots 15–19
  3, 1, 4, 2, 4,   // slots 20–24  (slot 22 → depth 4: central tall flower)
  1, 3, 2, 4, 3,   // slots 25–29
];

// Visual scale by depth — more dramatic range for lush depth illusion
const SCALE_BY_DEPTH: Record<1 | 2 | 3 | 4, number> = {
  1: 0.30,   // tiny, far background
  2: 0.52,
  3: 0.74,
  4: 1.00,   // full size, foreground
};

// 5 flower types distributed organically (6 of each, never same kind twice in a row)
const SLOT_KINDS = [
  0, 2, 1, 4, 3,
  2, 0, 4, 1, 3,
  3, 1, 2, 0, 4,
  4, 3, 0, 2, 1,
  1, 4, 3, 0, 2,
  2, 0, 1, 4, 3,
];

const W = 68; // slot container width (px)

// ── Shuffle utility ───────────────────────────────────────────────────────────
const SLOT_INDICES = Array.from({ length: SLOTS.length }, (_, i) => i);

function shuffled(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Flower data ───────────────────────────────────────────────────────────────
// bloomTop: px from slot top where flower centre sits (= top of stem).
// Petal gradient always uses a white specular highlight at 40% 40% so each
// petal looks dimensional — like watercolour with light catching the surface.
// Aura is screen-blended and kept subtle (blur 20px, opacity 0.25).
// Size variety is critical: 5 types span tiny (28px) → very large (165px).
interface FlowerDef {
  bloomTop:     number;
  angles:       number[];
  petalW:       number;     // uniform across all petals of this type
  petalH:       number;
  petalColor:   string;     // main petal hue; white highlight is added automatically
  petalOpacity: number;     // 0.75 – 0.90
  auraSize:     number;
  auraColor:    string;     // rgba(...) used in radial-gradient
  centerSize:   number;
  centerColor:  string;
  centerDot:    string;     // tiny sharp inner dot
}

const FLOWERS: FlowerDef[] = [
  // ── 0  Large Poppy — very large, coral-red, 5 petals ─────────────────────
  // diameter at depth-4 scale: ~164px  (petalH × 2)
  {
    bloomTop: 55,
    angles: [0, 72, 144, 216, 288],
    petalW: 56, petalH: 82,
    petalColor:   '#E85D4A',
    petalOpacity: 0.82,
    auraSize: 210,
    auraColor:    'rgba(232,93,74,0.25)',
    centerSize: 18,
    centerColor:  '#F5C800',
    centerDot:    '#C88000',
  },

  // ── 1  Medium Peony — blush pink, 6 petals ────────────────────────────────
  // diameter at depth-4 scale: ~100px
  {
    bloomTop: 55,
    angles: [0, 60, 120, 180, 240, 300],
    petalW: 36, petalH: 50,
    petalColor:   '#FFB0C0',
    petalOpacity: 0.78,
    auraSize: 148,
    auraColor:    'rgba(255,160,185,0.22)',
    centerSize: 14,
    centerColor:  '#FFF0D0',
    centerDot:    '#FFD080',
  },

  // ── 2  Small Magenta — hot pink, 5 petals ────────────────────────────────
  // diameter at depth-4 scale: ~56px
  {
    bloomTop: 55,
    angles: [0, 72, 144, 216, 288],
    petalW: 20, petalH: 28,
    petalColor:   '#FF3D8A',
    petalOpacity: 0.86,
    auraSize: 96,
    auraColor:    'rgba(255,61,138,0.22)',
    centerSize: 10,
    centerColor:  '#FFFFFF',
    centerDot:    '#FFD0E8',
  },

  // ── 3  Medium Orange Cosmos — warm orange, 8 narrow petals ───────────────
  // diameter at depth-4 scale: ~96px
  {
    bloomTop: 55,
    angles: [0, 45, 90, 135, 180, 225, 270, 315],
    petalW: 20, petalH: 48,
    petalColor:   '#FF8C42',
    petalOpacity: 0.80,
    auraSize: 145,
    auraColor:    'rgba(255,140,66,0.22)',
    centerSize: 13,
    centerColor:  '#F5C800',
    centerDot:    '#C88000',
  },

  // ── 4  Tiny Lilac accent — pale violet, 6 very small petals ──────────────
  // diameter at depth-4 scale: ~30px
  {
    bloomTop: 55,
    angles: [0, 60, 120, 180, 240, 300],
    petalW: 10, petalH: 15,
    petalColor:   '#C9A6E8',
    petalOpacity: 0.88,
    auraSize: 60,
    auraColor:    'rgba(201,166,232,0.22)',
    centerSize: 7,
    centerColor:  '#FFFFFF',
    centerDot:    '#E8D8FF',
  },
];

// ── FlowerBloom ───────────────────────────────────────────────────────────────
function FlowerBloom({ h, baseDelay, kind }: {
  h: number; baseDelay: number; kind: number;
}) {
  const def = FLOWERS[kind];

  const auraDelay   = baseDelay;
  const petalStart  = baseDelay + 0.25;
  const centerDelay = baseDelay + 0.55;

  // Petal gradient: white specular highlight at upper-left → petal colour → transparent
  const petalGrad = `radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.92) 0%, ${def.petalColor} 40%, transparent 100%)`;

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* Stem — slightly curved look via 1.5px rgba green */}
      <div style={{
        position:        'absolute',
        left:            W / 2,
        top:             def.bloomTop,
        width:           1.5,
        height:          h - def.bloomTop,
        background:      'rgba(80,130,70,0.6)',
        borderRadius:    1,
        transformOrigin: 'bottom center',
        animation:       `tulip-stem-grow 0.4s ease-out ${baseDelay}s both`,
      }} />

      {/* Aura — screen-blended, light and subtle behind petals */}
      <div style={{
        position:     'absolute',
        left:         W / 2 - def.auraSize / 2,
        top:          def.bloomTop - def.auraSize / 2,
        width:        def.auraSize,
        height:       def.auraSize,
        borderRadius: '50%',
        background:   `radial-gradient(circle, ${def.auraColor} 0%, transparent 70%)`,
        filter:       'blur(20px)',
        mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
        animation:    `aura-bloom 0.5s ease-out ${auraDelay}s both`,
      }} />

      {/* Petals — individually visible, soft edges, watercolour highlight */}
      {def.angles.map((angle, i) => (
        <div
          key={i}
          style={{
            position:  'absolute',
            left:      W / 2,
            top:       def.bloomTop,
            width:     0,
            height:    0,
            transform: `rotate(${angle}deg)`,
            // opacity on the rotation wrapper so it doesn't compound with animation
            opacity:   def.petalOpacity,
          }}
        >
          <div style={{
            position:        'absolute',
            left:            -def.petalW / 2,
            top:             -def.petalH,
            width:           def.petalW,
            height:          def.petalH,
            borderRadius:    '50% 50% 50% 50% / 70% 70% 30% 30%',
            background:      petalGrad,
            filter:          'blur(3px)',
            transformOrigin: '50% 100%',
            animation:       `petal-bloom 1.6s ease-out ${petalStart + i * 0.05}s both`,
          }} />
        </div>
      ))}

      {/* Centre — contrasting colour, stays relatively sharp */}
      <div style={{
        position:     'absolute',
        left:         W / 2 - def.centerSize / 2,
        top:          def.bloomTop - def.centerSize / 2,
        width:        def.centerSize,
        height:       def.centerSize,
        borderRadius: '50%',
        background:   `radial-gradient(circle, white 0%, ${def.centerColor} 65%)`,
        filter:       'blur(1px)',
        animation:    `aura-bloom 0.35s ease-out ${centerDelay}s both`,
      }} />

      {/* Inner accent dot — sharp detail inside centre */}
      <div style={{
        position:     'absolute',
        left:         W / 2 - def.centerSize * 0.22,
        top:          def.bloomTop - def.centerSize * 0.22,
        width:        def.centerSize * 0.44,
        height:       def.centerSize * 0.44,
        borderRadius: '50%',
        background:   def.centerDot,
        animation:    `aura-bloom 0.25s ease-out ${centerDelay + 0.1}s both`,
      }} />

    </div>
  );
}

// ── Single slot with show / hide logic ───────────────────────────────────────
function Flower({ visible, h, stagger, xPct, kind, scale }: {
  visible: boolean; h: number; stagger: number;
  xPct: number; kind: number; scale: number;
}) {
  const [gen, setGen]   = useState(0);
  const prevVisible     = useRef(false);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      // Cancel any pending unmount from a previous disappear animation
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      timerRef.current = setTimeout(() => {
        setGen(g => g + 1);
        timerRef.current = null;
      }, stagger);
    }
    if (!visible && prevVisible.current) {
      // Cancel pending stagger mount
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      // Let the scale-down + fade animation play, then unmount
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
      {/* Scale wrapper: keeps base anchored to ground, shrinks toward back */}
      <div style={{
        width:           W,
        height:          h,
        transformOrigin: 'bottom center',
        transform:       `scale(${scale})`,
      }}>
        {gen > 0 && <FlowerBloom key={gen} h={h} baseDelay={0} kind={kind} />}
      </div>
    </div>
  );
}

// ── Layer ─────────────────────────────────────────────────────────────────────
// Four depth containers matching GrassLayer's zIndex planes (back=1…near-front=4).
// Slot order is shuffled on every new smile session so the first flower (and all
// subsequent ones) are a fresh random pick from the full slot pool each time.
export function TulipLayer({ count }: { count: number }) {
  // Shuffled slot indices — determines which slot appears as the 1st, 2nd, 3rd… flower
  const [order, setOrder] = useState<number[]>(() => shuffled(SLOT_INDICES));
  const prevCount         = useRef(0);

  useEffect(() => {
    // When a smile session ends (count → 0), prepare a fresh random order
    // so the very next smile starts with a different first flower.
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
              <Flower
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
