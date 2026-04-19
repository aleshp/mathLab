import { useEffect, useState } from 'react';

type Props = {
  name: string;
  coins: number;
  onDone: () => void;
};

export function AchievementToast({ name, coins, onDone }: Props) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOut(true);
      setTimeout(onDone, 400);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 360,
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(6,182,212,0.25)',
        borderRadius: 20,
        padding: '18px 20px 14px',
        overflow: 'hidden',
        position: 'relative',
        animation: out
          ? 'ach-out 0.4s ease-in forwards'
          : 'ach-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        <style>{`
          @keyframes ach-in {
            from { transform: translateY(-120%) scale(0.95); opacity: 0; filter: blur(8px); }
            to   { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
          }
          @keyframes ach-out {
            from { transform: translateY(0) scale(1); opacity: 1; filter: blur(0); }
            to   { transform: translateY(-120%) scale(0.95); opacity: 0; filter: blur(8px); }
          }
          @keyframes ach-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes ach-bar {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>

        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120,
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: '#22d3ee', fontWeight: 700, marginBottom: 4,
        }}>
          Достижение разблокировано
        </div>

        <div style={{
          fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 8,
          background: 'linear-gradient(90deg, #fff 0%, #94a3b8 50%, #fff 100%)',
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'ach-shimmer 2.5s linear infinite',
        }}>
          {name}
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 8, padding: '3px 10px',
          fontSize: 12, fontWeight: 800, color: '#fbbf24',
        }}>
          <span style={{ width: 8, height: 8, background: '#fbbf24', borderRadius: '50%', display: 'inline-block' }} />
          +{coins} MathCoins
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
          animation: 'ach-bar 3s linear forwards',
        }} />
      </div>
    </div>
  );
}