import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEmotionMirror } from '../../hooks/useEmotionMirror';
import type { FaceEmotion } from '../../types/emotion';
import { GrassLayer } from '../GrassLayer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ── Color field logic ─────────────────────────────────────────────────────────

function resolveBackground(faces: FaceEmotion[]): string {
  const n = faces.length;
  if (n === 0) return '#ECECEA';
  if (n === 1) {
    if (faces[0].emotion === 'happy') return '#FFF6B1';
    if (faces[0].emotion === 'sad')   return '#C1EDFF';
    return '#EFEFED';
  }
  const [a, b] = faces;
  if (a.emotion === 'happy' && b.emotion === 'happy') return '#FFD600';
  if (a.emotion === 'sad'   && b.emotion === 'sad')   return '#0D2B6B';
  if (
    (a.emotion === 'happy' && b.emotion === 'sad') ||
    (a.emotion === 'sad'   && b.emotion === 'happy')
  ) return '#9E9E9E';
  return '#EFEFED';
}

// ── Emotion-aware blob styling ────────────────────────────────────────────────

function getBlobStyle(emotion: FaceEmotion['emotion']): {
  glass: React.CSSProperties;
  bloom: React.CSSProperties;
} {
  if (emotion === 'happy') {
    return {
      // Warm glowing orb — emissive light source
      glass: {
        background: 'radial-gradient(circle at 45% 38%, rgba(255,255,220,0.98) 0%, rgba(255,225,140,0.94) 26%, rgba(255,185,100,0.82) 56%, rgba(255,150,72,0.62) 84%)',
        border: '1px solid rgba(255,210,120,0.55)',
        boxShadow: [
          // ── Coloured outer glow — amber/orange ──
          '0 0 55px 22px rgba(255,185,95,0.75)',
          '0 0 120px 58px rgba(255,160,70,0.42)',
          '0 0 210px 105px rgba(255,138,50,0.20)',
          // ── Top rim — bright catch light ──
          'inset 0 3px 0px rgba(255,255,255,1.00)',
          'inset 0 10px 22px rgba(255,255,220,0.58)',
          // ── Bottom warmth / depth ──
          'inset 0 -5px 14px rgba(200,80,15,0.13)',
          'inset 0 -1px 0px rgba(170,60,0,0.10)',
        ].join(', '),
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
      },
      // Wide coloured bloom radiating behind the blob
      bloom: {
        position: 'absolute',
        inset: '-55%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,195,88,0.62) 0%, rgba(255,158,62,0.32) 44%, transparent 70%)',
        filter: 'blur(32px)',
        pointerEvents: 'none' as const,
      },
    };
  }

  // Default glass (neutral / sad / other)
  return {
    glass: {
      background: [
        'linear-gradient(180deg,',
        '  rgba(255,255,255,0.92) 0%,',
        '  rgba(255,255,255,0.58) 22%,',
        '  rgba(245,240,235,0.32) 70%,',
        '  rgba(228,220,212,0.22) 100%)',
      ].join(''),
      border: '1px solid rgba(255,255,255,0.70)',
      boxShadow: [
        '0 0 55px 24px rgba(255,255,255,0.65)',
        '0 0 130px 65px rgba(255,255,255,0.28)',
        '0 8px 28px rgba(0,0,0,0.07)',
        'inset 0 3px 0px rgba(255,255,255,1.00)',
        'inset 0 10px 20px rgba(255,255,255,0.52)',
        'inset 0 -5px 14px rgba(0,0,0,0.11)',
        'inset 0 -1px 0px rgba(0,0,0,0.09)',
        'inset 3px 0 10px rgba(255,255,255,0.28)',
      ].join(', '),
      backdropFilter: 'blur(20px) saturate(1.6)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
    },
    bloom: {
      position: 'absolute',
      inset: '-55%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.40) 0%, transparent 65%)',
      filter: 'blur(28px)',
      pointerEvents: 'none' as const,
    },
  };
}

// Loading state uses neutral glass
const loadingGlass: React.CSSProperties = getBlobStyle('neutral').glass;

// ── Focus trap ────────────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    }
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [active, ref]);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmotionMirrorDrawer({ isOpen, onClose }: Props) {
  const [mounted, setMounted]         = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [deviceId, setDeviceId]       = useState<string | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const mirrorActive = mounted && !animatingOut;
  const { videoRef, isLoading, cameraPermission, faces, cameras, error } =
    useEmotionMirror({ active: mirrorActive, deviceId });

  useFocusTrap(containerRef, mirrorActive);

  const handleClose = useCallback(() => {
    setAnimatingOut(true);
    setTimeout(() => {
      setMounted(false);
      setAnimatingOut(false);
      document.body.classList.remove('drawer-open');
      onClose();
    }, 350);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setAnimatingOut(false);
      document.body.classList.add('drawer-open');
    }
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && mounted) handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, handleClose]);

  if (!mounted) return null;

  const bg     = resolveBackground(faces);
  const isDark = bg === '#0D2B6B' || bg === '#9E9E9E';

  // Circle sizing: single face → larger, two faces → slightly smaller
  const circleSize = faces.length === 2
    ? 'clamp(96px, 18vmin, 144px)'
    : 'clamp(110px, 24vmin, 172px)';

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Emotion Mirror"
      className={animatingOut ? 'mirror-exit' : 'mirror-enter'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: bg,
        transition: 'background 1.2s ease',
      }}
    >

      {/* ── Close button ── */}
      <button
        aria-label="Close Emotion Mirror"
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          border: 'none',
          borderRadius: 999,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)',
          fontSize: 16,
          zIndex: 2,
          transition: 'background 0.3s',
        }}
      >
        ✕
      </button>

      {/* ── Camera PiP — top right ── */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 'clamp(100px, 28vw, 150px)',
          aspectRatio: '3 / 4',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#111',
          boxShadow: '0 6px 32px rgba(0,0,0,0.25)',
          zIndex: 2,
        }}
      >
        {cameraPermission === 'denied' ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 12,
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 22 }}>📷</span>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Camera access needed
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: 'block',
              }}
            />
            {cameraPermission === 'loading' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.55)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                    textAlign: 'center',
                    padding: '0 8px',
                  }}
                >
                  Starting&hellip;
                </p>
              </div>
            )}
            {error && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  padding: 8,
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.6)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  {error}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Emotion circles — screen center ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 4vmin, 36px)',
        }}
      >
        {isLoading ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="blob-a pulse-circle" style={{ width: circleSize, height: circleSize, ...loadingGlass }} />
          </div>
        ) : faces.length === 0 ? null : (
          faces.map((face, i) => {
            const { glass, bloom } = getBlobStyle(face.emotion);
            return (
              <div key={i} style={{ position: 'relative', width: circleSize, height: circleSize }}>
                {/* Coloured bloom layer — radiates behind the blob */}
                <div style={bloom} />
                {/* Blob */}
                <div
                  className={i === 0 ? 'blob-a' : 'blob-b'}
                  style={{ position: 'absolute', inset: 0, ...glass }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* ── Camera switcher — bottom right ── */}
      {cameras.length > 1 && (
        <button
          aria-label="Switch camera"
          onClick={() => {
            const currentIndex = cameras.findIndex((c) => c.deviceId === deviceId) ?? 0;
            const next = cameras[(currentIndex + 1) % cameras.length];
            setDeviceId(next.deviceId);
          }}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
            border: 'none',
            borderRadius: 999,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 18,
            zIndex: 2,
          }}
        >
          📷
        </button>
      )}

      {/* ── Grass layer — grows up from the bottom ── */}
      <GrassLayer />

      {/* ── Privacy note — bottom center ── */}
      <p
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
          margin: 0,
          pointerEvents: 'none',
          transition: 'color 1.2s ease',
        }}
      >
        All processing happens on your device. Nothing is recorded or stored.
      </p>

    </div>
  );
}
