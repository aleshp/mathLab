import { useEffect, useState, useMemo } from 'react';
import { Profile } from '../lib/supabase';
import { getPvPRank } from '../lib/gameLogic';
import { PlayerCard } from './card-skins/PlayerCard';
import { usePvPStats } from '../hooks/usePvPStats';

type Props = {
  player: Profile;
  opponentName: string;
  opponentMMR: number;
  onComplete: () => void;
};

// Фиксированные частицы чтобы не пересчитывались на каждый рендер
const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: 10 + (i * 37 % 80),
  y: 5  + (i * 53 % 90),
  size: 1.5 + (i % 3) * 1.2,
  dur: 1.8 + (i % 5) * 0.4,
  delay: (i % 7) * 0.25,
  drift: -30 + (i % 6) * 12,
}));

const SPARKS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
  len: 40 + (i % 4) * 25,
  delay: i * 0.06,
}));

export function VsScreen({ player, opponentName, opponentMMR, onComplete }: Props) {
  const [stage, setStage] = useState<'enter' | 'flash' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('flash'), 100);   // вспышка
    const t2 = setTimeout(() => setStage('idle'),  400);   // карточки
    const t3 = setTimeout(() => setStage('exit'),  3300);  // уход
    const t4 = setTimeout(onComplete,             3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const myStats  = usePvPStats(player.id);
  const oWinRate = useMemo(() => Math.round(Math.min(95, Math.max(35, 50 + Math.random() * 25))), []);
  const oMatches = useMemo(() => Math.floor(Math.random() * 80 + 10), []);

  const pRank  = getPvPRank(player.mmr || 1000);
  const oRank  = getPvPRank(opponentMMR);
  const mySkin = (player as any).equipped_card_skin || (player.is_premium ? 'electric' : 'default');

  const visible = stage === 'idle' || stage === 'exit';
  const flashing = stage === 'flash';

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] overflow-hidden flex items-center justify-center">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes particle-rise {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-120px) translateX(var(--drift)) scale(0); opacity: 0; }
        }
        @keyframes spark-shoot {
          0%   { transform: rotate(var(--angle)) scaleX(0); opacity: 1; }
          60%  { transform: rotate(var(--angle)) scaleX(1); opacity: 1; }
          100% { transform: rotate(var(--angle)) scaleX(1); opacity: 0; }
        }
        @keyframes energy-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.08); }
        }
        @keyframes scanline {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes vs-pop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(3deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }
        @keyframes glow-ring {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ── Базовый фон ── */}
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #0f172a 0%, #020617 75%)' }} />

      {/* ── Энергетические зоны (сверху — синяя, снизу — красная) ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[55%]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, transparent 65%)',
            opacity: visible ? 0.35 : 0,
            transition: 'opacity 0.6s ease-out',
          }} />
        <div className="absolute inset-x-0 bottom-0 h-[55%]"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, #7f1d1d 0%, transparent 65%)',
            opacity: visible ? 0.35 : 0,
            transition: 'opacity 0.6s ease-out',
          }} />
      </div>

      {/* ── Пульсирующие энергетические кольца вокруг центра ── */}
      {visible && [0, 1, 2].map(i => (
        <div key={i} className="absolute rounded-full pointer-events-none border border-white/10"
          style={{
            width:  180 + i * 110,
            height: 180 + i * 110,
            top:    '50%',
            left:   '50%',
            transform: 'translate(-50%, -50%)',
            animation: `energy-pulse ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
      ))}

      {/* ── Сканирующая линия ── */}
      {visible && (
        <div className="absolute left-0 right-0 h-[2px] pointer-events-none z-10"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
            animation: 'scanline 3s linear infinite',
          }} />
      )}

      {/* ── Частицы-искры ── */}
      {visible && PARTICLES.map(p => (
        <div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            left:   `${p.x}%`,
            top:    `${p.y}%`,
            width:  p.size,
            height: p.size,
            background: p.id % 3 === 0 ? '#60a5fa' : p.id % 3 === 1 ? '#f87171' : '#ffffff',
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            '--drift': `${p.drift}px`,
            animation: `particle-rise ${p.dur}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* ── Вспышка при входе ── */}
      <div className="absolute inset-0 bg-white pointer-events-none z-20"
        style={{
          opacity:    flashing ? 0.5 : 0,
          transition: flashing ? 'none' : 'opacity 0.35s ease-out',
        }} />

      {/* ── Разделительная линия по центру ── */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px pointer-events-none z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.5s',
        }} />

      {/* ── Весь стек — автомасштаб под высоту экрана ── */}
      <div className="relative z-20 flex flex-col items-center"
        style={{
          transform: 'scale(min(1, calc((100dvh - 32px) / 900px)))',
          transformOrigin: 'center center',
        }}
      >

        {/* Карточка ИГРОКА */}
        <div style={{
          transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease-out',
          transform:  visible ? 'translateY(0)' : 'translateY(-140%)',
          opacity:    visible ? 1 : 0,
        }}>
          <PlayerCard
            isOpponent={false}
            name={player.username}
            mmr={player.mmr || 1000}
            rank={pRank}
            winRate={myStats.winRate}
            matchesPlayed={myStats.matchesPlayed}
            skin={mySkin}
            stage="idle"
          />
        </div>

        {/* VS Badge + искры */}
        <div className="relative z-30 flex-shrink-0 -my-4 flex items-center justify-center"
          style={{
            animation: visible ? 'vs-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
            opacity:   visible ? undefined : 0,
          }}
        >
          {/* Разлетающиеся лучи */}
          {visible && SPARKS.map(s => (
            <div key={s.id} className="absolute pointer-events-none origin-left"
              style={{
                width:  s.len,
                height: 2,
                top:    '50%',
                left:   '50%',
                background: 'linear-gradient(to right, rgba(255,255,255,0.7), transparent)',
                '--angle': `${s.angle}deg`,
                transform: `rotate(${s.angle}deg) scaleX(0)`,
                transformOrigin: 'left center',
                animation: `spark-shoot 0.6s ease-out forwards`,
                animationDelay: `${0.1 + s.delay}s`,
              } as React.CSSProperties}
            />
          ))}

          {/* Кольца расходятся */}
          {visible && [0, 1].map(i => (
            <div key={i} className="absolute rounded-full border border-white/30 pointer-events-none"
              style={{
                width: 64, height: 64,
                top: '50%', left: '50%',
                marginTop: -32, marginLeft: -32,
                animation: `glow-ring 0.8s ease-out forwards`,
                animationDelay: `${0.1 + i * 0.15}s`,
              }} />
          ))}

          {/* Сам бейдж */}
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center relative"
            style={{ boxShadow: '0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.2)' }}>
            <span className="text-black font-black text-2xl italic -ml-0.5">VS</span>
          </div>
        </div>

        {/* Карточка СОПЕРНИКА */}
        <div style={{
          transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.07s, opacity 0.4s ease-out 0.07s',
          transform:  visible ? 'translateY(0)' : 'translateY(140%)',
          opacity:    visible ? 1 : 0,
        }}>
          <PlayerCard
            isOpponent={true}
            name={opponentName}
            mmr={opponentMMR}
            rank={oRank}
            winRate={oWinRate}
            matchesPlayed={oMatches}
            skin="electric"
            stage="idle"
          />
        </div>

      </div>

      {/* Fade-out */}
      <div className="absolute inset-0 bg-black pointer-events-none z-40"
        style={{
          opacity:    stage === 'exit' ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
        }} />
    </div>
  );
}