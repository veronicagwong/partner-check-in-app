import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEmotionMirror } from '../../hooks/useEmotionMirror';
import type { FaceEmotion } from '../../types/emotion';

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

// Simple flex wrapper (glow is on the blob itself via box-shadow)
const glowWrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Apple liquid-glass style + glow via box-shadow
const glassStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.20) 100%)',
  border: '1px solid rgba(255,255,255,0.75)',
  boxShadow: [
    '0 0 60px 28px rgba(255,255,255,0.70)',   // tight inner glow — centered
    '0 0 140px 70px rgba(255,255,255,0.35)',  // wide soft halo — centered
    'inset 0 1.5px 0 rgba(255,255,255,0.95)',
    'inset 0 -1px 0 rgba(255,255,255,0.20)',
  ].join(', '),
  backdropFilter: 'blur(18px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
};

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
  const containerRef = useRef<HTMLDivElement>(null);

  const mirrorActive = mounted && !animatingOut;
  const { videoRef, isLoading, cameraPermission, faces, error } =
    useEmotionMirror({ active: mirrorActive });

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
          <div style={glowWrapStyle}>
            <div
              className="blob-a pulse-circle"
              style={{ width: circleSize, height: circleSize, ...glassStyle }}
            />
          </div>
        ) : faces.length === 0 ? null : (
          faces.map((_face, i) => (
            <div key={i} style={glowWrapStyle}>
              <div
                className={i === 0 ? 'blob-a' : 'blob-b'}
                style={{ width: circleSize, height: circleSize, ...glassStyle }}
              />
            </div>
          ))
        )}
      </div>

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
