import React, { useEffect, useRef, useState } from 'react';

// ── Palette ───────────────────────────────────────────────────────────────────
// kind: 0=blue daisy  1=red tulip  2=white daisy  3=yellow sunflower  4=purple hyacinth
const STEM = '#3D7020';
const LEAF = '#5A8A2C';

// ── SVG base dimensions (depth scale applied via CSS, never baked in) ─────────
// viewBox "0 0 9 14" → 10px per unit at 90×140px
const SVG_W = 99;
const SVG_H = 154;

// ── Flower head pixel grids ───────────────────────────────────────────────────
// Head occupies rows 0–6 (cols 0–8, center col 4).
// Stem: x=4, y=7, width=0.5, height=7.  Leaves at (6,9) and (2,11).

type Cell = { x: number; y: number; fill: string };

function buildHead(kind: number): Cell[] {
  const cells: Cell[] = [];
  const c = (x: number, y: number, fill: string) => cells.push({ x, y, fill });

  switch (kind) {

    case 0: { // ── Blue round daisy ─────────────────────────────────────────
      // Ring of petals + 3×2 yellow centre
      const P = '#4488FF', C = '#FFDD00';
      // top + bottom arcs
      for (let x = 2; x <= 6; x++) { c(x, 0, P); c(x, 5, P); }
      // left + right sides
      for (let y = 1; y <= 4; y++) { c(0, y, P); c(8, y, P); }
      // inner ring fill
      for (let y = 1; y <= 4; y++) { c(1, y, P); c(7, y, P); }
      for (let x = 2; x <= 6; x++) { c(x, 1, P); c(x, 4, P); }
      // centre 3×2 block
      for (let x = 3; x <= 5; x++) { c(x, 2, C); c(x, 3, C); }
      // connector
      c(4, 6, P);
      break;
    }

    case 1: { // ── Red tulip ────────────────────────────────────────────────
      const P = '#DD3333';
      c(1, 0, P); c(7, 0, P);                              // horn tips
      c(0, 1, P); c(1, 1, P); c(7, 1, P); c(8, 1, P);    // top rim
      for (let x = 0; x <= 8; x++) c(x, 2, P);            // widest row
      for (let x = 1; x <= 7; x++) c(x, 3, P);
      for (let x = 2; x <= 6; x++) c(x, 4, P);
      for (let x = 3; x <= 5; x++) c(x, 5, P);
      c(4, 6, P);
      break;
    }

    case 2: { // ── White thin daisy (8 spokes, pale yellow centre) ──────────
      const P = '#E8E8E8', C = '#FFE566';
      c(4, 0, P);                                           // top spoke
      c(2, 1, P); c(6, 1, P);                              // upper diagonals
      c(1, 2, P); c(7, 2, P); c(4, 2, C);                 // side spokes + centre
      c(0, 3, P); c(8, 3, P);                              // outer side spokes
      c(3, 3, C); c(4, 3, C); c(5, 3, C);                 // centre row
      c(1, 4, P); c(7, 4, P); c(4, 4, C);                 // side spokes + centre
      c(2, 5, P); c(6, 5, P);                              // lower diagonals
      c(4, 6, P);                                          // bottom spoke / connector
      break;
    }

    case 3: { // ── Yellow sunflower ─────────────────────────────────────────
      const P = '#FFCC00', C = '#FF8800';
      c(2, 0, P); c(4, 0, P); c(6, 0, P);                 // top 3 petals
      c(1, 1, P); c(7, 1, P);                              // upper sides
      c(0, 2, P); c(8, 2, P);                              // outer sides
      c(0, 3, P); c(8, 3, P);
      c(0, 4, P); c(8, 4, P);
      c(1, 5, P); c(7, 5, P);                              // lower sides
      c(2, 6, P); c(4, 6, P); c(6, 6, P);                 // bottom 3 petals / connector
      // 5×3 orange centre
      for (let y = 2; y <= 4; y++)
        for (let x = 2; x <= 6; x++) c(x, y, C);
      break;
    }

    case 4: { // ── Purple hyacinth (diamond checkerboard) ───────────────────
      const D = '#8844EE', L = '#CC99FF';
      const cell = (x: number, y: number) => ((x + y) % 2 === 0 ? D : L);
      c(4, 0, cell(4, 0));
      for (const x of [3,4,5])     c(x, 1, cell(x, 1));
      for (let x = 2; x <= 6; x++) c(x, 2, cell(x, 2));
      for (let x = 1; x <= 7; x++) c(x, 3, cell(x, 3));
      for (let x = 2; x <= 6; x++) c(x, 4, cell(x, 4));
      for (const x of [3,4,5])     c(x, 5, cell(x, 5));
      c(4, 6, cell(4, 6));
      break;
    }
  }

  return cells;
}

// ── PixelFlowerSVG ─────────────────────────────────────────────────────────────
// Always renders at SVG_W × SVG_H — depth scale is applied by the outer CSS wrapper.
function PixelFlowerSVG({ kind }: { kind: number }) {
  const head = buildHead(kind);

  return (
    <svg
      width={SVG_W} height={SVG_H}
      viewBox="0 0 9 14"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {/* ── Stem: thin (0.5 wide), rows 7–14 ── */}
      <rect x="4.25" y="7" width="0.5" height="7" fill={STEM} />

      {/* ── Leaves ── */}
      <rect x="6" y="9"  width="1" height="1" fill={LEAF} />
      <rect x="2" y="11" width="1" height="1" fill={LEAF} />

      {/* ── Flower head ── */}
      {head.map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width="1" height="1" fill={cell.fill} />
      ))}
    </svg>
  );
}

// ── Slot layout ───────────────────────────────────────────────────────────────
const PIX_SLOTS = [
  { xPct: 25, depth: 2 as const, kind: 0, stagger:   0 },
  { xPct: 30, depth: 1 as const, kind: 1, stagger:  15 },
  { xPct: 36, depth: 3 as const, kind: 2, stagger:  30 },
  { xPct: 42, depth: 1 as const, kind: 3, stagger:  45 },
  { xPct: 47, depth: 4 as const, kind: 4, stagger:  60 },
  { xPct: 52, depth: 2 as const, kind: 0, stagger:  75 },
  { xPct: 57, depth: 4 as const, kind: 2, stagger:  90 },
  { xPct: 62, depth: 3 as const, kind: 1, stagger: 105 },
  { xPct: 67, depth: 1 as const, kind: 3, stagger: 120 },
  { xPct: 72, depth: 2 as const, kind: 4, stagger: 135 },
  { xPct: 33, depth: 3 as const, kind: 0, stagger: 150 },
  { xPct: 76, depth: 4 as const, kind: 1, stagger: 165 },
  { xPct: 80, depth: 2 as const, kind: 2, stagger: 180 },
  { xPct: 27, depth: 4 as const, kind: 3, stagger: 195 },
  { xPct: 38, depth: 3 as const, kind: 4, stagger: 210 },
  { xPct: 44, depth: 1 as const, kind: 1, stagger: 225 },
  { xPct: 55, depth: 4 as const, kind: 0, stagger: 240 },
  { xPct: 69, depth: 2 as const, kind: 3, stagger: 255 },
  { xPct: 74, depth: 1 as const, kind: 4, stagger: 270 },
  { xPct: 35, depth: 2 as const, kind: 2, stagger: 285 },
];

// Depth perspective scale — applied via CSS only, never baked into SVG size
const PIX_SCALE: Record<1|2|3|4, number> = { 1: 0.55, 2: 0.70, 3: 0.85, 4: 1.00 };
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
// Two-layer pattern (mirrors TulipLayer):
//   outer div — fixed SVG_W × SVG_H, handles show/hide transform + opacity
//   inner div — applies depth perspective scale via CSS only
//   SVG       — always full size, no scale param
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
      timerRef.current = setTimeout(() => { setGen(0); timerRef.current = null; }, 400);
    }
    prevVisible.current = visible;
  }, [visible, stagger]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    // Outer: position + show/hide
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
        : 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4,0,0.8,0.2)',
      pointerEvents:   'none',
    }}>
      {/* Inner: depth perspective scale */}
      <div style={{
        width:           SVG_W,
        height:          SVG_H,
        transformOrigin: 'bottom center',
        transform:       `scale(${scale})`,
        imageRendering:  'pixelated',
      }}>
        {gen > 0 && (
          <div key={gen} style={{ transformOrigin: 'bottom center', animation: 'petal-bloom 0.18s ease-out both' }}>
            <PixelFlowerSVG kind={kind} />
          </div>
        )}
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
          bottom:        '39%',
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
