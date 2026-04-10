import React, { useEffect, useRef, useState } from 'react';

// ── Pixel flower definitions ───────────────────────────────────────────────────
// Each flower is a tiny SVG (viewBox 0 0 5 10, display 20×40px).
// shape-rendering="crispEdges" keeps everything sharp with no anti-aliasing.
// 5 colour types: blue, red, white, yellow, purple.

const PETAL_COLORS  = ['#4488FF', '#FF4444', '#EEEEEE', '#FFDD00', '#8844EE'];
const CENTER_COLORS = ['#FFFFFF', '#FFDD00', '#FFDD00', '#FF8800', '#FFFFFF'];
const DARK_OUTLINE  = ['#1144AA', '#AA1111', '#AAAAAA', '#AA7700', '#551188'];

function PixelFlowerSVG({ kind, scale }: { kind: number; scale: number }) {
  const petal   = PETAL_COLORS[kind]  ?? '#4488FF';
  const center  = CENTER_COLORS[kind] ?? '#FFFFFF';
  const outline = DARK_OUTLINE[kind]  ?? '#222222';

  // Display size scaled by depth (5× base size: 100×200px at depth 4)
  const w = Math.round(100 * scale);
  const h = Math.round(200 * scale);

  return (
    <svg
      width={w} height={h}
      viewBox="0 0 5 10"
      shapeRendering="crispEdges"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {/* ── Stem ── */}
      <rect x="2" y="3" width="1" height="7" fill="#228B22" />
      {/* ── Leaves ── */}
      <rect x="1" y="5" width="1" height="1" fill="#44AA33" />
      <rect x="3" y="7" width="1" height="1" fill="#44AA33" />

      {/* ── Petal outline (shadow) — 1px below / beside petals ── */}
      <rect x="2" y="1" width="1" height="1" fill={outline} opacity="0.35" />
      <rect x="0" y="2" width="1" height="1" fill={outline} opacity="0.35" />
      <rect x="4" y="2" width="1" height="1" fill={outline} opacity="0.35" />
      <rect x="2" y="3" width="1" height="1" fill={outline} opacity="0.25" />

      {/* ── Petals (cross) ── */}
      <rect x="2" y="0" width="1" height="1" fill={petal} />  {/* top    */}
      <rect x="1" y="1" width="1" height="1" fill={petal} />  {/* top-L  */}
      <rect x="3" y="1" width="1" height="1" fill={petal} />  {/* top-R  */}
      <rect x="0" y="2" width="2" height="1" fill={petal} />  {/* left   */}
      <rect x="3" y="2" width="2" height="1" fill={petal} />  {/* right  */}
      <rect x="1" y="3" width="1" height="1" fill={petal} />  {/* btm-L  */}
      <rect x="3" y="3" width="1" height="1" fill={petal} />  {/* btm-R  */}

      {/* ── Centre ── */}
      <rect x="2" y="1" width="1" height="2" fill={center} />
    </svg>
  );
}

// ── Slot layout — same positions as TulipLayer, 20 slots ─────────────────────
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

// ── Single flower slot — same show/hide logic as TulipLayer ──────────────────
function PixelFlower({
  visible, xPct, stagger, kind, scale,
}: {
  visible: boolean; xPct: number; stagger: number; kind: number; scale: number;
}) {
  const [gen, setGen]   = useState(0);
  const prevVisible     = useRef(false);
  const timerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flowerW = Math.round(100 * scale);

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
      }, 400);
    }
    prevVisible.current = visible;
  }, [visible, stagger]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div style={{
      position:        'absolute',
      bottom:          0,
      left:            `calc(${xPct}% - ${flowerW / 2}px)`,
      opacity:         visible ? 1 : 0,
      transform:       visible ? 'scaleY(1)' : 'scaleY(0)',
      transformOrigin: 'bottom center',
      transition:      visible
        ? 'none'
        : 'opacity 0.35s ease, transform 0.35s ease-in',
      pointerEvents:   'none',
      imageRendering:  'pixelated',
    }}>
      {gen > 0 && (
        <div
          key={gen}
          style={{
            transformOrigin: 'bottom center',
            animation:       'petal-bloom 0.18s ease-out both',
          }}
        >
          <PixelFlowerSVG kind={kind} scale={scale} />
        </div>
      )}
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
