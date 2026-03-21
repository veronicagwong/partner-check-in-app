import { useState } from 'react';
import { EmotionMirrorDrawer } from './components/EmotionMirrorDrawer/EmotionMirrorDrawer';

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-sans)',
        background: '#FAFAF8',
        gap: 24,
        padding: 24,
      }}
    >
      {/* Placeholder for main check-in UI */}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 400,
            color: '#1A1A18',
            margin: '0 0 12px',
          }}
        >
          Partner Check-In
        </h1>
        <p style={{ color: '#888885', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Your main check-in experience will appear here.
        </p>
      </div>

      {/* Emotion Mirror trigger button */}
      <button
        onClick={() => setDrawerOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: '1.5px solid rgba(0,0,0,0.15)',
          borderRadius: 999,
          padding: '10px 20px',
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: '#444441',
          letterSpacing: '0.01em',
          transition: 'border-color 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.25)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'none';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.15)';
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 16 }}>✦</span>
        How are you both feeling?
      </button>

      <EmotionMirrorDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
