import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions, organically scattered ────────────────────────
// xPct clamped to [15, 85] — matching the grass left/right margins so edges stay flower-free.
// Order is shuffled each smile session; these are the positional pool, not a fixed sequence.
const SLOTS = [
  { xPct: 38, h: 158, stagger:   0 },
  { xPct: 61, h: 144, stagger:  80 },
  { xPct: 18, h: 171, stagger: 200 },
  { xPct: 82, h: 139, stagger: 130 },
  { xPct: 16, h: 152, stagger: 310 },  // was 7  — clamped to margin
  { xPct: 54, h: 165, stagger:  50 },
  { xPct: 73, h: 148, stagger: 240 },
  { xPct: 29, h: 136, stagger: 170 },
  { xPct: 57, h: 178, stagger:  20 },
  { xPct: 44, h: 141, stagger: 360 },
  { xPct: 22, h: 162, stagger: 110 },  // was 12  — clamped
  { xPct: 83, h: 155, stagger: 290 },  // was 91  — clamped
  { xPct: 67, h: 133, stagger:  70 },
  { xPct: 23, h: 169, stagger: 420 },
  { xPct: 48, h: 145, stagger: 150 },
  { xPct: 79, h: 175, stagger: 230 },
  { xPct: 35, h: 138, stagger: 330 },
  { xPct: 59, h: 152, stagger:  40 },
  { xPct: 17, h: 143, stagger: 190 },  // was 4   — clamped
  { xPct: 84, h: 161, stagger: 270 },  // was 86  — clamped
  { xPct: 26, h: 174, stagger:  95 },
  { xPct: 70, h: 137, stagger: 380 },
  { xPct: 42, h: 156, stagger: 210 },
  { xPct: 52, h: 147, stagger:  60 },
  { xPct: 15, h: 166, stagger: 300 },
  { xPct: 76, h: 142, stagger: 140 },
  { xPct: 32, h: 153, stagger: 440 },
  { xPct: 64, h: 170, stagger:  30 },
  { xPct: 19, h: 135, stagger: 350 },  // was 9   — clamped
  { xPct: 81, h: 159, stagger: 185 },  // was 94  — clamped
];

// ── Depth layer per slot (1 = back/small, 4 = front/large) ───────────────────
// 7×depth-1, 8×depth-2, 8×depth-3, 7×depth-4 — evenly distributed
// Matched to zIndex layers in GrassLayer (back=1 … near-front=4)
const SLOT_DEPTHS: (1 | 2 | 3 | 4)[] = [
  3, 2, 4, 1, 2,   // slots  0–4
  3, 4, 1, 2, 3,   // slots  5–9
  1, 4, 2, 3, 1,   // slots 10–14
  2, 4, 1, 3, 2,   // slots 15–19
  4, 1, 3, 2, 4,   // slots 20–24
  1, 3, 2, 4, 3,   // slots 25–29
];

// Visual scale by depth — deeper = smaller, like natural perspective
const SCALE_BY_DEPTH: Record<1 | 2 | 3 | 4, number> = {
  1: 0.42,
  2: 0.62,
  3: 0.80,
  4: 1.00,
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
// bloomTop: distance from slot top where the flower centre sits (= stem top)
interface FlowerDef {
  bloomTop:          number;
  angles:            number[];
  petalW:            number | number[];
  petalH:            number | number[];
  petalBg:           string;
  petalBlur:         number;
  petalBorderRadius: string;
  auraSize:          number;
  auraBg:            string;
  auraBlur:          number;
  centerSize:        number;
  centerBg:          string;
}

const FLOWERS: FlowerDef[] = [
  // ── 0  Poppy — 6 wide rounded petals, coral-red ──────────────────────────
  {
    bloomTop: 70,
    angles: [0, 60, 120, 180, 240, 300],
    petalW: 45, petalH: 75,
    petalBg:  'radial-gradient(ellipse at 50% 25%, #F4967A 0%, #E8543A 55%, rgba(184,52,26,0.05) 100%)',
    petalBlur: 8,
    petalBorderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    auraSize: 220,
    auraBg:   'radial-gradient(circle, rgba(232,84,58,0.55) 0%, transparent 70%)',
    auraBlur: 40,
    centerSize: 22,
    centerBg: 'radial-gradient(circle, #FFE040 0%, #FF8800 70%)',
  },

  // ── 1  Peony — 6 very soft blush petals, almost overlapping ──────────────
  {
    bloomTop: 82,
    angles: [0, 60, 120, 180, 240, 300],
    petalW: 50, petalH: 70,
    petalBg:  'radial-gradient(ellipse at 50% 22%, #FFF0EE 0%, #FFD6D0 55%, rgba(255,170,160,0.05) 100%)',
    petalBlur: 10,
    petalBorderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    auraSize: 240,
    auraBg:   'radial-gradient(circle, rgba(255,180,170,0.45) 0%, transparent 70%)',
    auraBlur: 45,
    centerSize: 26,
    centerBg: 'radial-gradient(circle, #FFF8F5 0%, #FFE0D8 65%)',
  },

  // ── 2  Buttercup — 3 narrow pointed-tip petals, bright gold ──────────────
  {
    bloomTop: 56,
    angles: [0, 120, 240],
    petalW: 28, petalH: 55,
    petalBg:  'radial-gradient(ellipse at 50% 18%, #FFE866 0%, #FFD600 55%, rgba(210,170,0,0.05) 100%)',
    petalBlur: 6,
    petalBorderRadius: '40% 40% 50% 50% / 70% 70% 30% 30%',
    auraSize: 150,
    auraBg:   'radial-gradient(circle, rgba(255,214,0,0.55) 0%, transparent 70%)',
    auraBlur: 30,
    centerSize: 20,
    centerBg: 'radial-gradient(circle, #FFEE66 0%, #FFA500 70%)',
  },

  // ── 3  Iris — 2 elongated slightly-wavy petals, soft violet ──────────────
  {
    bloomTop: 68,
    angles: [0, 180],
    petalW: 35, petalH: 65,
    petalBg:  'radial-gradient(ellipse at 50% 22%, #DDB6FF 0%, #C084FC 55%, rgba(150,60,240,0.05) 100%)',
    petalBlur: 9,
    petalBorderRadius: '60% 40% 60% 40% / 60% 60% 40% 40%',
    auraSize: 180,
    auraBg:   'radial-gradient(circle, rgba(192,132,252,0.40) 0%, transparent 70%)',
    auraBlur: 35,
    centerSize: 18,
    centerBg: 'radial-gradient(circle, #FFF0FF 0%, #DDB6FF 60%)',
  },

  // ── 4  Wild Rose — 5 petals, organically uneven sizes, hot pink ──────────
  {
    bloomTop: 66,
    angles: [0, 72, 144, 216, 288],
    petalW: [42, 36, 40, 34, 39],
    petalH: [64, 60, 67, 61, 65],
    petalBg:  'radial-gradient(ellipse at 50% 25%, #FFB3D9 0%, #FF6EB4 55%, rgba(200,40,130,0.05) 100%)',
    petalBlur: 8,
    petalBorderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    auraSize: 190,
    auraBg:   'radial-gradient(circle, rgba(255,110,180,0.45) 0%, transparent 70%)',
    auraBlur: 38,
    centerSize: 22,
    centerBg: 'radial-gradient(circle, #FFF8F0 0%, #FFE080 65%)',
  },
];

// ── FlowerBloom ───────────────────────────────────────────────────────────────
function FlowerBloom({ h, baseDelay, kind }: {
  h: number; baseDelay: number; kind: number;
}) {
  const def = FLOWERS[kind];
  const pw  = (i: number) => Array.isArray(def.petalW) ? def.petalW[i] : def.petalW;
  const ph  = (i: number) => Array.isArray(def.petalH) ? def.petalH[i] : def.petalH;

  const auraDelay  = baseDelay;
  const petalStart = baseDelay + 0.3;
  const centerDelay = baseDelay + 0.6;

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* Stem — very faint, 1px, grows upward from ground */}
      <div style={{
        position:        'absolute',
        left:            W / 2,
        top:             def.bloomTop,
        width:           1,
        height:          h - def.bloomTop,
        background:      'rgba(100,140,80,0.4)',
        transformOrigin: 'bottom center',
        animation:       `tulip-stem-grow 0.4s ease-out ${baseDelay}s both`,
      }} />

      {/* Flower head — mix-blend-mode: screen for the glow effect */}
      <div style={{
        position:      'absolute',
        inset:         0,
        mixBlendMode:  'screen' as React.CSSProperties['mixBlendMode'],
        pointerEvents: 'none',
      }}>

        {/* Aura — large, heavily blurred halo, appears first */}
        <div style={{
          position:     'absolute',
          left:         W / 2 - def.auraSize / 2,
          top:          def.bloomTop - def.auraSize / 2,
          width:        def.auraSize,
          height:       def.auraSize,
          borderRadius: '50%',
          background:   def.auraBg,
          filter:       `blur(${def.auraBlur}px)`,
          animation:    `aura-bloom 0.6s ease-out ${auraDelay}s both`,
        }} />

        {/* Petals — rotation wrapper (zero-size anchor) + inner ellipse */}
        {def.angles.map((angle, i) => {
          const w = pw(i), hh = ph(i);
          return (
            <div key={i} style={{
              position:  'absolute',
              left:      W / 2,
              top:       def.bloomTop,
              width:     0,
              height:    0,
              transform: `rotate(${angle}deg)`,
            }}>
              <div style={{
                position:        'absolute',
                left:            -w / 2,
                top:             -hh,
                width:           w,
                height:          hh,
                borderRadius:    def.petalBorderRadius,
                background:      def.petalBg,
                filter:          `blur(${def.petalBlur}px)`,
                transformOrigin: '50% 100%',
                animation:       `petal-bloom 1.8s ease-out ${petalStart + i * 0.05}s both`,
              }} />
            </div>
          );
        })}

        {/* Centre */}
        <div style={{
          position:     'absolute',
          left:         W / 2 - def.centerSize / 2,
          top:          def.bloomTop - def.centerSize / 2,
          width:        def.centerSize,
          height:       def.centerSize,
          borderRadius: '50%',
          background:   def.centerBg,
          filter:       'blur(4px)',
          animation:    `aura-bloom 0.4s ease-out ${centerDelay}s both`,
        }} />

      </div>
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
