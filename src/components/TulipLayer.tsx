import React, { useEffect, useRef, useState } from 'react';

// ── Slot layout — 30 positions, organically scattered ────────────────────────
const SLOTS = [
  // — first flowers to appear, seeding the scene —
  { xPct: 38, h: 158, stagger:   0 },
  { xPct: 61, h: 144, stagger:  80 },
  { xPct: 18, h: 171, stagger: 200 },
  { xPct: 82, h: 139, stagger: 130 },
  { xPct:  7, h: 152, stagger: 310 },
  { xPct: 54, h: 165, stagger:  50 },
  { xPct: 73, h: 148, stagger: 240 },
  { xPct: 29, h: 136, stagger: 170 },

  // — second burst, filling gaps and building clusters —
  { xPct: 57, h: 178, stagger:  20 },
  { xPct: 44, h: 141, stagger: 360 },
  { xPct: 12, h: 162, stagger: 110 },
  { xPct: 91, h: 155, stagger: 290 },
  { xPct: 67, h: 133, stagger:  70 },
  { xPct: 23, h: 169, stagger: 420 },
  { xPct: 48, h: 145, stagger: 150 },
  { xPct: 79, h: 175, stagger: 230 },

  // — third wave, denser clustering —
  { xPct: 35, h: 138, stagger: 330 },
  { xPct: 59, h: 152, stagger:  40 },
  { xPct:  4, h: 143, stagger: 190 },
  { xPct: 86, h: 161, stagger: 270 },
  { xPct: 26, h: 174, stagger:  95 },
  { xPct: 70, h: 137, stagger: 380 },
  { xPct: 42, h: 156, stagger: 210 },

  // — fourth wave, finishing touches and micro-clusters —
  { xPct: 52, h: 147, stagger:  60 },
  { xPct: 15, h: 166, stagger: 300 },
  { xPct: 76, h: 142, stagger: 140 },
  { xPct: 32, h: 153, stagger: 440 },
  { xPct: 64, h: 170, stagger:  30 },
  { xPct:  9, h: 135, stagger: 350 },
  { xPct: 94, h: 159, stagger: 185 },
];

// ── Flower kind assigned per slot — shuffled so all 5 types spread organically
// 6 of each kind across 30 slots; never the same kind twice in a row
const SLOT_KINDS = [
  0, 2, 1, 4, 3,
  2, 0, 4, 1, 3,
  3, 1, 2, 0, 4,
  4, 3, 0, 2, 1,
  1, 4, 3, 0, 2,
  2, 0, 1, 4, 3,
];

const W = 68; // slot container width

// ── Flower definitions ────────────────────────────────────────────────────────
// Each flower has 3 layers ordered outer-aura → mid-bloom → bright-core.
// w/h allow oval shapes; bg uses radial-gradient fading to transparent.
interface LayerDef {
  w: number;
  h: number;
  bg: string;
  blurPx: number;
  delayOffset: number; // extra seconds after stem finishes
}

interface FlowerDef {
  bloomCY: number; // Y centre of bloom from top of slot (px)
  layers: LayerDef[];
}

const FLOWERS: FlowerDef[] = [
  // ── 0  Poppy — large, coral-red, slightly wider than tall ────────────────
  {
    bloomCY: 58,
    layers: [
      {
        w: 220, h: 180,
        bg: 'radial-gradient(ellipse, rgba(255,180,160,0.40) 0%, transparent 70%)',
        blurPx: 25, delayOffset: 0.00,
      },
      {
        w: 154, h: 126,
        bg: 'radial-gradient(ellipse, rgba(244,150,122,0.9) 0%, transparent 70%)',
        blurPx: 10, delayOffset: 0.15,
      },
      {
        w: 110, h:  90,
        bg: 'radial-gradient(ellipse, #E8543A 25%, rgba(232,84,58,0) 70%)',
        blurPx:  3, delayOffset: 0.30,
      },
    ],
  },

  // ── 1  Cloud Bloom — large, white-pink, perfectly round ──────────────────
  {
    bloomCY: 65,
    layers: [
      {
        w: 240, h: 240,
        bg: 'radial-gradient(circle, rgba(255,210,220,0.30) 0%, transparent 70%)',
        blurPx: 30, delayOffset: 0.00,
      },
      {
        w: 160, h: 160,
        bg: 'radial-gradient(circle, rgba(255,214,208,0.85) 0%, transparent 70%)',
        blurPx: 14, delayOffset: 0.15,
      },
      {
        w: 120, h: 120,
        bg: 'radial-gradient(circle, #FFF5F0 15%, rgba(255,245,240,0) 70%)',
        blurPx:  4, delayOffset: 0.30,
      },
    ],
  },

  // ── 2  Buttercup — small, punchy, warm golden yellow ─────────────────────
  {
    bloomCY: 42,
    layers: [
      {
        w: 140, h: 140,
        bg: 'radial-gradient(circle, rgba(255,240,140,0.35) 0%, transparent 70%)',
        blurPx: 18, delayOffset: 0.00,
      },
      {
        w:  90, h:  90,
        bg: 'radial-gradient(circle, rgba(255,224,102,0.9) 0%, transparent 70%)',
        blurPx:  8, delayOffset: 0.15,
      },
      {
        w:  60, h:  60,
        bg: 'radial-gradient(circle, #FFD600 28%, rgba(255,214,0,0) 70%)',
        blurPx:  2, delayOffset: 0.30,
      },
    ],
  },

  // ── 3  Iris — lilac-purple, taller than wide ──────────────────────────────
  {
    bloomCY: 55,
    layers: [
      {
        w: 136, h: 204,
        bg: 'radial-gradient(ellipse, rgba(200,160,255,0.30) 0%, transparent 70%)',
        blurPx: 22, delayOffset: 0.00,
      },
      {
        w:  88, h: 132,
        bg: 'radial-gradient(ellipse, rgba(221,182,255,0.85) 0%, transparent 70%)',
        blurPx: 10, delayOffset: 0.15,
      },
      {
        w:  60, h:  90,
        bg: 'radial-gradient(ellipse, #C084FC 25%, rgba(192,132,252,0) 70%)',
        blurPx:  3, delayOffset: 0.30,
      },
    ],
  },

  // ── 4  Mist Flower — medium, cool pink, very diffuse ─────────────────────
  {
    bloomCY: 60,
    layers: [
      {
        w: 220, h: 220,
        bg: 'radial-gradient(circle, rgba(255,180,220,0.25) 0%, transparent 70%)',
        blurPx: 35, delayOffset: 0.00,
      },
      {
        w: 130, h: 130,
        bg: 'radial-gradient(circle, rgba(255,179,217,0.80) 0%, transparent 70%)',
        blurPx: 16, delayOffset: 0.15,
      },
      {
        w:  80, h:  80,
        bg: 'radial-gradient(circle, #FF6EB4 18%, rgba(255,110,180,0) 70%)',
        blurPx:  5, delayOffset: 0.30,
      },
    ],
  },
];

// ── Flower bloom ──────────────────────────────────────────────────────────────
function FlowerBloom({ h, baseDelay, kind }: {
  h: number; baseDelay: number; kind: number;
}) {
  const def      = FLOWERS[kind];
  const stemTop  = def.bloomCY + 6; // stem starts a few px below bloom centre

  return (
    <div style={{ position: 'relative', width: W, height: h }}>

      {/* ── Stem: soft gradient strip, grows from ground up ── */}
      <div style={{
        position:        'absolute',
        left:            W / 2 - 1,
        top:             stemTop,
        width:           2,
        height:          h - stemTop,
        background:      'linear-gradient(to bottom, rgba(130,190,110,0.85), rgba(130,190,110,0.25))',
        filter:          'blur(1px)',
        borderRadius:    2,
        transformOrigin: 'bottom center',
        animation:       `tulip-stem-grow 0.5s ease-out ${baseDelay}s both`,
      }} />

      {/* ── Bloom layers: outer aura → mid → core ── */}
      {def.layers.map((layer, li) => (
        <div
          key={li}
          style={{
            position:  'absolute',
            left:      '50%',
            top:       def.bloomCY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{
            width:        layer.w,
            height:       layer.h,
            background:   layer.bg,
            filter:       `blur(${layer.blurPx}px)`,
            borderRadius: '50%',
            mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
            animation:    `flower-bloom 2s ease-out ${baseDelay + 0.35 + layer.delayOffset}s both`,
          }} />
        </div>
      ))}

    </div>
  );
}

// ── Single slot with show/hide logic ─────────────────────────────────────────
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
