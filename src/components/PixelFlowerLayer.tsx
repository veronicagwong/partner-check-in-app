import React, { useEffect, useRef, useState } from 'react';

// ── Palette ───────────────────────────────────────────────────────────────────
// kind: 0=blue daisy  1=red tulip  2=white daisy  3=yellow sunflower  4=purple hyacinth
const PETAL_COLORS   = ['#4488FF', '#DD3333', '#EEEEEE', '#FFCC00', '#8844EE'] as const;
const CENTER_COLORS  = ['#FFDD00', '#FFDD00', '#FFDD00', '#FF8800', '#CC99FF'] as const;

const STEM  = '#3D7020';
const LEAF  = '#5A8A2C';

// ── SVG dimensions (always rendered at full size; CSS scale handles depth) ────
const SVG_W = 180;   // px
const SVG_H = 360;   // px
// viewBox "0 0 9 18" → each unit = 20 px

// ── Per-kind flower head geometry ─────────────────────────────────────────────
// Head occupies rows 0–6 (y 0–6).  Stem: x=4, y=6→18 (thin).
// rowDelay: bottom-up — row 6 pops at 0.21 s, row 0 at 0.63 s.
const rowDelay = (y: number) => 0.21 + (6 - y) * 0.07;

type Rect = { x: number; y: number; fill: string; delay: number };

function buildHead(kind: number): Rect[] {
  const p = PETAL_COLORS[kind];
  const c = CENTER_COLORS[kind];
  const rects: Rect[] = [];
  const r = (x: number, y: number, fill: string) =>
    rects.push({ x, y, fill, delay: rowDelay(y) });

  switch (kind) {

    case 0: { // ── Blue round daisy ─────────────────────────────────────────
      for (let x = 2; x <= 6; x++) r(x, 0, p);            // top arc
      for (let x = 1; x <= 7; x++) r(x, 1, p);
      for (const x of [0,1,2,6,7,8]) r(x, 2, p);          // sides
      for (const x of [3,4,5])       r(x, 2, c);          // centre
      for (const x of [0,1,2,6,7,8]) r(x, 3, p);
      for (const x of [3,4,5])       r(x, 3, c);
      for (let x = 1; x <= 7; x++) r(x, 4, p);
      for (let x = 2; x <= 6; x++) r(x, 5, p);            // bottom arc
      r(4, 6, p);                                          // connector
      break;
    }

    case 1: { // ── Red tulip (cup with two horn tips) ───────────────────────
      r(1, 0, p); r(7, 0, p);                              // horn tips
      for (const x of [0,1,2,6,7,8]) r(x, 1, p);          // top rim (gap in middle)
      for (let x = 0; x <= 8; x++) r(x, 2, p);            // widest row
      for (let x = 1; x <= 7; x++) r(x, 3, p);
      for (let x = 2; x <= 6; x++) r(x, 4, p);
      for (const x of [3,4,5])     r(x, 5, p);            // base
      r(4, 6, p);                                          // connector
      break;
    }

    case 2: { // ── White thin-petal daisy (8 spokes + centre) ───────────────
      r(4, 0, p);                                          // top spoke
      r(2, 1, p); r(6, 1, p);                              // upper diagonals
      r(1, 2, p); r(7, 2, p); r(4, 2, c);                 // side spokes + centre top
      r(0, 3, p); r(8, 3, p);                              // outer side spokes
      r(3, 3, c); r(4, 3, c); r(5, 3, c);                 // centre row
      r(1, 4, p); r(7, 4, p); r(4, 4, c);                 // side spokes + centre bottom
      r(2, 5, p); r(6, 5, p);                              // lower diagonals
      r(4, 6, p);                                          // bottom spoke / connector
      break;
    }

    case 3: { // ── Yellow sunflower (ring petals + large orange centre) ──────
      for (const x of [2,4,6]) r(x, 0, p);                // 3 top petals
      r(1, 1, p); r(7, 1, p);                              // upper sides
      r(0, 2, p); r(8, 2, p);                              // outer sides
      r(0, 3, p); r(8, 3, p);
      r(0, 4, p); r(8, 4, p);
      r(1, 5, p); r(7, 5, p);                              // lower sides
      for (const x of [2,4,6]) r(x, 6, p);                // 3 bottom petals / connector
      // 5×3 orange centre block
      for (let y = 2; y <= 4; y++)
        for (let x = 2; x <= 6; x++)
          r(x, y, c);
      break;
    }

    case 4: { // ── Purple hyacinth (diamond oval, checkerboard) ─────────────
      const light = c;   // '#CC99FF'
      const dark  = p;   // '#8844EE'
      const cell  = (x: number, y: number) => ((x + y) % 2 === 0 ? dark : light);
      r(4, 0, cell(4, 0));
      for (const x of [3,4,5])     r(x, 1, cell(x, 1));
      for (let x = 2; x <= 6; x++) r(x, 2, cell(x, 2));
      for (let x = 1; x <= 7; x++) r(x, 3, cell(x, 3));
      for (let x = 2; x <= 6; x++) r(x, 4, cell(x, 4));
      for (const x of [3,4,5])     r(x, 5, cell(x, 5));
      r(4, 6, cell(4, 6));                                 // connector
      break;
    }
  }

  return rects;
}

// ── PixelFlowerSVG ─────────────────────────────────────────────────────────────
// Always rendered at SVG_W × SVG_H (scale is applied by the outer CSS wrapper).
function PixelFlowerSVG({ kind }: { kind: number }) {
  const headRects = buildHead(kind);

  const pop = (delay: number): React.CSSProperties => ({
    animation: `pix-pop 0.04s steps(1, end) ${delay.toFixed(2)}s both`,
  });

  return (
    <svg
      width={SVG_W} height={SVG_H}
      viewBox="0 0 9 18"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {/* ── Stem: thin (1/9 width), y=6→18 ── */}
      <rect x="4" y="6" width="1" height="12" fill={STEM} style={pop(0.00)} />

      {/* ── Leaves ── */}
      <rect x="6" y="10" width="1" height="1" fill={LEAF} style={pop(0.07)} />
      <rect x="2" y="13" width="1" height="1" fill={LEAF} style={pop(0.14)} />

      {/* ── Flower head — pops in bottom-row-first (rowDelay) ── */}
      {headRects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x} y={rect.y}
          width="1" height="1"
          fill={rect.fill}
          style={pop(rect.delay)}
        />
      ))}
    </svg>
  );
}

// ── Slot layout ───────────────────────────────────────────────────────────────
const PIX_SLOTS = [
  { xPct: 15, depth: 2 as const, kind: 0, stagger:   0 },
  { xPct: 20, depth: 1 as const, kind: 1, stagger:  80 },
  { xPct: 26, depth: 3 as const, kind: 2, stagger: 140 },
  { xPct: 33, depth: 1 as const, kind: 3, stagger: 200 },
  { xPct: 38, depth: 4 as const, kind: 4, stagger:  40 },
  { xPct: 44, depth: 2 as const, kind: 0, stagger: 300 },
  { xPct: 50, depth: 4 as const, kind: 2, stagger:  60 },
  { xPct: 55, depth: 3 as const, kind: 1, stagger: 160 },
  { xPct: 61, depth: 1 as const, kind: 3, stagger: 250 },
  { xPct: 67, depth: 2 as const, kind: 4, stagger: 100 },
  { xPct: 72, depth: 3 as const, kind: 0, stagger: 350 },
  { xPct: 78, depth: 4 as const, kind: 1, stagger:  20 },
  { xPct: 84, depth: 2 as const, kind: 2, stagger: 180 },
  { xPct: 18, depth: 4 as const, kind: 3, stagger: 120 },
  { xPct: 30, depth: 3 as const, kind: 4, stagger: 280 },
  { xPct: 47, depth: 1 as const, kind: 1, stagger: 320 },
  { xPct: 58, depth: 4 as const, kind: 0, stagger: 400 },
  { xPct: 70, depth: 2 as const, kind: 3, stagger: 220 },
  { xPct: 82, depth: 1 as const, kind: 4, stagger: 360 },
  { xPct: 24, depth: 2 as const, kind: 2, stagger: 440 },
];

// Depth scale — CSS transform only, not baked into SVG dimensions
const PIX_SCALE: Record<1|2|3|4, number> = { 1: 0.45, 2: 0.60, 3: 0.78, 4: 1.00 };
const PIX_INDICES = Array.from({ length: PIX_SLOTS.length }, (_, i) => i);

function shuffled(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Single flower slot ────────────────────────────────────────────────────────
// Mirrors TulipLayer's two-layer pattern:
//   outer div  — handles position + show/hide (scale 0→1, opacity)
//   inner div  — handles depth perspective scale (CSS transform only)
//   SVG        — always full SVG_W × SVG_H; pix-pop builds block-by-block
function PixelFlower({
  visible, xPct, stagger, kind, scale,
}: {
  visible: boolean; xPct: number; stagger: number; kind: number; scale: number;
}) {
  const [gen, setGen]   = useState(0);
  const prevVisible     = useRef(false);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !prevVisible.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      timerRef.current = setTimeout(() => { setGen(g => g + 1); timerRef.current = null; }, stagger);
    }
    if (!visible && prevVisible.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      timerRef.current = setTimeout(() => { setGen(0); timerRef.current = null; }, 500);
    }
    prevVisible.current = visible;
  }, [visible, stagger]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    // Outer: position anchor + show/hide (scale 0↔1 + opacity, same as TulipLayer)
    <div style={{
      position:        'absolute',
      bottom:          0,
      left:            `calc(${xPct}% - ${SVG_W / 2}px)`,
      width:           SVG_W,
      height:          SVG_H,
      opacity:         visible ? 1 : 0,
      transform:       visible ? 'scale(1)' : 'scale(0)',
      transformOrigin: 'bottom center',
      transition:      visible
        ? 'none'
        : 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.8, 0.2)',
      pointerEvents:   'none',
    }}>
      {/* Inner: depth perspective scale — CSS only, never conflicts with pix-pop */}
      <div style={{
        width:           SVG_W,
        height:          SVG_H,
        transformOrigin: 'bottom center',
        transform:       `scale(${scale})`,
        imageRendering:  'pixelated',
      }}>
        {gen > 0 && <PixelFlowerSVG key={gen} kind={kind} />}
      </div>
    </div>
  );
}

// ── Layer ─────────────────────────────────────────────────────────────────────
export function PixelFlowerLayer({ count }: { count: number }) {
  const [order, setOrder] = useState<number[]>(() => shuffled(PIX_INDICES));
  const prevCount         = useRef(0);

  useEffect(() => {
    if (count === 0 && prevCount.current > 0) setOrder(shuffled(PIX_INDICES));
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
            const s = PIX_SLOTS[slotIdx];
            if (s.depth !== d) return null;
            return (
              <PixelFlower
                key={displayPos}
                visible={displayPos < count}
                xPct={s.xPct}
                stagger={s.stagger}
                kind={s.kind}
                scale={PIX_SCALE[d]}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}
