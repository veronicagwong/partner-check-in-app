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

// 5 types distributed organically across 30 slots (6 of each)
const SLOT_KINDS = [
  0, 2, 1, 4, 3,
  2, 0, 4, 1, 3,
  3, 1, 2, 0, 4,
  4, 3, 0, 2, 1,
  1, 4, 3, 0, 2,
  2, 0, 1, 4, 3,
];

const W = 68; // slot container width (px)

// ── Flower data ───────────────────────────────────────────────────────────────
// bloomTop: distance from slot top where the flower centre sits (= stem top)
// petalW / petalH: per-petal arrays (for Wild Rose) or single number for uniform

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
// All-div, no SVG. Petals are ellipse divs rotated around the flower centre.
function FlowerBloom({ h, baseDelay, kind }: {
  h: number; baseDelay: number; kind: number;
}) {
  const def = FLOWERS[kind];

  // Helper: get per-petal w / h (uniform or varying)
  const pw = (i: number) => Array.isArray(def.petalW) ? def.petalW[i] : def.petalW;
  const ph = (i: number) => Array.isArray(def.petalH) ? def.petalH[i] : def.petalH;

  // Timing
  // Aura fades in first (0 → 0.6s), petals stagger in starting at 0.3s,
  // centre appears last. Total ≈ 2.5s.
  const auraDelay   = baseDelay;
  const petalStart  = baseDelay + 0.3;  // petals begin while aura is still opening
  const centerDelay = baseDelay + 0.6;

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* ── Stem — very faint, 1px, grows upward from ground ── */}
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

      {/* ── Flower head — mix-blend-mode: screen for the glow effect ── */}
      <div style={{
        position:      'absolute',
        inset:         0,
        mixBlendMode:  'screen' as React.CSSProperties['mixBlendMode'],
        pointerEvents: 'none',
      }}>

        {/* Aura — large, heavily blurred, fades in first */}
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

        {/* Petals — each is a rotation wrapper (zero-size anchor at flower centre)
            + inner ellipse div that scales from its base outward              */}
        {def.angles.map((angle, i) => {
          const w = pw(i), hh = ph(i);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left:     W / 2,
                top:      def.bloomTop,
                width:    0,
                height:   0,
                // rotate around the flower centre
                transform: `rotate(${angle}deg)`,
              }}
            >
              <div style={{
                position:        'absolute',
                left:            -w / 2,
                top:             -hh,      // petal extends upward; base is at (0,0) = centre
                width:           w,
                height:          hh,
                borderRadius:    def.petalBorderRadius,
                background:      def.petalBg,
                filter:          `blur(${def.petalBlur}px)`,
                // scale from petal base (bottom-centre = flower centre)
                transformOrigin: '50% 100%',
                animation:       `petal-bloom 1.8s ease-out ${petalStart + i * 0.05}s both`,
              }} />
            </div>
          );
        })}

        {/* Centre — warm white/yellow, appears after petals begin */}
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
function Flower({ visible, h, stagger, xPct, kind }: {
  visible: boolean; h: number; stagger: number; xPct: number; kind: number;
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
      {gen > 0 && <FlowerBloom key={gen} h={h} baseDelay={0} kind={kind} />}
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
        />
      ))}
    </div>
  );
}
