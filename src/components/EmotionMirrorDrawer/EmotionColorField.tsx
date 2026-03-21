import type { FaceEmotion } from '../../types/emotion';

interface Props {
  faces: FaceEmotion[];
  isLoading: boolean;
}

interface ColorState {
  background: string;
  label: string;
}

function resolveColorState(faces: FaceEmotion[]): ColorState {
  const count = faces.length;

  if (count === 0) return { background: '#F0F0F0', label: 'Waiting for faces…' };

  if (count === 1) {
    const e = faces[0].emotion;
    if (e === 'happy')   return { background: '#FFFDE7', label: 'One of you is feeling good' };
    if (e === 'sad')     return { background: '#E3F2FD', label: 'One of you needs some care' };
    return                      { background: '#FAF9F6', label: 'One of you is present' };
  }

  // 2 faces
  const [a, b] = faces;
  if (a.emotion === 'happy' && b.emotion === 'happy')
    return { background: '#FFD600', label: 'You\'re both thriving' };
  if (a.emotion === 'sad' && b.emotion === 'sad')
    return { background: '#0D2B6B', label: 'You\'re both carrying something heavy' };
  if (
    (a.emotion === 'happy' && b.emotion === 'sad') ||
    (a.emotion === 'sad'   && b.emotion === 'happy')
  )
    return { background: '#9E9E9E', label: 'Two different worlds right now' };

  return { background: '#FAF9F6', label: 'You\'re here together' };
}

const CIRCLE_SIZE = 80;

export function EmotionColorField({ faces, isLoading }: Props) {
  const { background } = resolveColorState(faces);
  const isDark = background === '#0D2B6B';

  // Circle colours per emotion
  function circleColor(emotion: FaceEmotion['emotion']): string {
    if (emotion === 'happy') return 'rgba(255,255,255,0.85)';
    if (emotion === 'sad')   return 'rgba(255,255,255,0.4)';
    return 'rgba(255,255,255,0.6)';
  }

  return (
    <div
      style={{
        background,
        transition: 'background-color 1.2s ease',
        borderRadius: 20,
        height: undefined, // set via className
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="w-full h-[180px] md:h-[220px]"
    >
      {/* Circles */}
      <div className="flex items-center justify-center gap-8">
        {isLoading ? (
          // Pulsing placeholder circles while MediaPipe loads
          <>
            <div
              className="pulse-circle rounded-full"
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                background: 'rgba(0,0,0,0.12)',
              }}
            />
            <div
              className="pulse-circle rounded-full"
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                background: 'rgba(0,0,0,0.12)',
                animationDelay: '0.3s',
              }}
            />
          </>
        ) : faces.length === 0 ? null : (
          faces.map((face, i) => (
            <div
              key={i}
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                borderRadius: '50%',
                background: circleColor(face.emotion),
                transition: 'background 1.2s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            />
          ))
        )}
      </div>

      {/* Loading label */}
      {isLoading && (
        <p
          style={{
            fontSize: 12,
            color: 'rgba(0,0,0,0.35)',
            margin: 0,
            fontFamily: 'var(--font-sans)',
          }}
        >
          Warming up…
        </p>
      )}

      {/* Face count indicator dots */}
      {!isLoading && faces.length > 0 && (
        <p
          style={{
            fontSize: 11,
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
            margin: 0,
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {faces.length === 1 ? '1 person' : '2 people'}
        </p>
      )}
    </div>
  );
}
