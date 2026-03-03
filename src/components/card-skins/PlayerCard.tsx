import { Trophy, Target, Swords } from 'lucide-react';

export type CardSkin = 'default' | 'electric' | 'fire' | 'gold' | string;

type PlayerCardProps = {
  isOpponent: boolean;
  name: string;
  mmr: number;
  rank: any;
  winRate: number;
  matchesPlayed?: number;
  skin?: CardSkin;
  stage?: 'enter' | 'idle' | 'exit';
};

export function PlayerCard({
  isOpponent,
  name,
  mmr,
  rank,
  winRate,
  matchesPlayed = 0,
  skin = 'default',
  stage = 'idle',
}: PlayerCardProps) {
  const isPremium = skin !== 'default';

  // Цвета по стороне (для дефолта)
  const sideColor   = isOpponent ? '#ef4444' : '#22d3ee';
  const sideBorder  = isOpponent ? 'border-red-500/70'  : 'border-cyan-500/70';
  const sideBadge   = isOpponent ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
  const sideLabel   = isOpponent ? 'text-red-400' : 'text-cyan-400';
  const sideGradL   = isOpponent ? '#7f1d1d' : '#164e63';

  // Конфиг скинов
  const SKINS: Record<string, { border: string; glow: string; badge: string; label: string; labelText: string; color: string; colorDim: string; topBar?: string }> = {
    electric: {
      border:    'border-cyan-400',
      glow:      '0 0 40px rgba(6,182,212,0.5), 0 0 80px rgba(6,182,212,0.15), inset 0 0 40px rgba(6,182,212,0.04)',
      badge:     'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
      label:     'text-cyan-400',
      labelText: '⚡ ELECTRIC',
      color:     '#22d3ee',
      colorDim:  '#083344',
    },
    fire: {
      border:    'border-orange-500',
      glow:      '0 0 50px rgba(249,115,22,0.55), 0 0 100px rgba(239,68,68,0.2), inset 0 0 40px rgba(249,115,22,0.06)',
      badge:     'bg-orange-500/15 text-orange-300 border border-orange-500/30',
      label:     'text-orange-400',
      labelText: '🔥 FIRE',
      color:     '#f97316',
      colorDim:  '#431407',
    },
    gold: {
      border:    'border-yellow-400',
      glow:      '0 0 60px rgba(250,204,21,0.55), 0 0 120px rgba(250,204,21,0.2), inset 0 0 40px rgba(250,204,21,0.06)',
      badge:     'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
      label:     'text-yellow-400',
      labelText: '👑 GOLD',
      color:     '#facc15',
      colorDim:  '#422006',
    },
    ice: {
      border:    'border-sky-300',
      glow:      '0 0 40px rgba(125,211,252,0.45), 0 0 80px rgba(186,230,253,0.15), inset 0 0 40px rgba(125,211,252,0.05)',
      badge:     'bg-sky-400/15 text-sky-200 border border-sky-400/30',
      label:     'text-sky-300',
      labelText: '❄️ ICE',
      color:     '#7dd3fc',
      colorDim:  '#082f49',
      topBar:    'linear-gradient(90deg, #082f49, #7dd3fc, #e0f2fe, #7dd3fc, #082f49)',
    },
    shadow: {
      border:    'border-violet-500',
      glow:      '0 0 45px rgba(139,92,246,0.5), 0 0 90px rgba(109,40,217,0.2), inset 0 0 40px rgba(139,92,246,0.05)',
      badge:     'bg-violet-500/15 text-violet-300 border border-violet-500/30',
      label:     'text-violet-400',
      labelText: '🌑 SHADOW',
      color:     '#8b5cf6',
      colorDim:  '#2e1065',
    },
    neon: {
      border:    'border-green-400',
      glow:      '0 0 40px rgba(74,222,128,0.5), 0 0 80px rgba(74,222,128,0.15), inset 0 0 40px rgba(74,222,128,0.05)',
      badge:     'bg-green-500/15 text-green-300 border border-green-500/30',
      label:     'text-green-400',
      labelText: '💚 NEON',
      color:     '#4ade80',
      colorDim:  '#052e16',
      topBar:    'linear-gradient(90deg, #052e16, #4ade80, #86efac, #4ade80, #052e16)',
    },
    plasma: {
      border:    'border-fuchsia-400',
      glow:      '0 0 50px rgba(232,121,249,0.5), 0 0 100px rgba(167,139,250,0.2), inset 0 0 40px rgba(232,121,249,0.06)',
      badge:     'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30',
      label:     'text-fuchsia-400',
      labelText: '🔮 PLASMA',
      color:     '#e879f9',
      colorDim:  '#4a044e',
      topBar:    'linear-gradient(90deg, #4a044e, #a855f7, #e879f9, #818cf8, #e879f9, #a855f7, #4a044e)',
    },
  };

  const sk = isPremium ? (SKINS[skin] ?? SKINS.electric) : null;
  const borderClass   = isPremium ? sk!.border  : sideBorder;
  const badgeClass    = isPremium ? sk!.badge   : sideBadge;
  const labelClass    = isPremium ? sk!.label   : sideLabel;
  const accentColor   = isPremium ? sk!.color   : sideColor;
  const gradLeft      = isPremium ? sk!.colorDim : sideGradL;

  // Slide animation
  let motionClass = 'translate-x-0 opacity-100';
  if (stage === 'enter' || stage === 'exit') {
    motionClass = isOpponent ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0';
  }

  return (
    <>
      <style>{`
        @keyframes card-shimmer {
          0%   { transform: translateX(-200%) skewX(-20deg); }
          100% { transform: translateX(400%) skewX(-20deg); }
        }
        @keyframes border-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .shimmer-run { animation: card-shimmer 3.5s ease-in-out infinite; }
        .border-pulsing { animation: border-pulse 2.2s ease-in-out infinite; }
      `}</style>

      <div
        className={`
          relative w-full max-w-[300px]
          bg-slate-950 rounded-2xl border-2 ${borderClass} shadow-2xl
          transition-[transform,opacity] duration-500 ease-out will-change-transform
          ${motionClass} overflow-hidden flex flex-col select-none
        `}
        style={isPremium ? { boxShadow: sk!.glow } : undefined}
      >
        {/* Верхняя акцент-полоса */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ background: (isPremium && sk!.topBar) ? sk!.topBar : `linear-gradient(90deg, ${gradLeft}, ${accentColor}, ${gradLeft})` }}
        />

        {/* Внутренний атмосферный фон */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 65%)` }}
        />

        {/* Шиммер-блик (только для премиум) */}
        {isPremium && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div
              className="shimmer-run absolute top-0 left-0 h-full w-1/4"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`, filter: 'blur(6px)' }}
            />
          </div>
        )}

        {/* Угловые декоративные засечки */}
        {['top-2.5 left-2.5 border-t-2 border-l-2 rounded-tl', 'top-2.5 right-2.5 border-t-2 border-r-2 rounded-tr',
          'bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl', 'bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br'
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-2.5 h-2.5 ${borderClass} opacity-50 pointer-events-none`} />
        ))}

        <div className="relative z-10 flex flex-col items-center px-5 pt-4 pb-5 gap-3.5">

          {/* Бейдж + скин-лейбл */}
          <div className="flex items-center justify-between w-full">
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${badgeClass}`}>
              {isOpponent ? 'OPPONENT' : 'YOU'}
            </span>
            {isPremium && (
              <span className={`text-[9px] font-black uppercase tracking-wider ${labelClass} opacity-75`}>
                {sk!.labelText}
              </span>
            )}
          </div>

          {/* Аватар */}
          <div className="relative mt-1">
            {isPremium && (
              <div
                className={`absolute -inset-2 rounded-full border-2 ${borderClass} border-pulsing opacity-40`}
              />
            )}
            <div
              className={`w-[88px] h-[88px] rounded-full border-2 ${borderClass} bg-slate-900 flex items-center justify-center overflow-hidden`}
              style={{ boxShadow: `0 0 20px ${accentColor}30` }}
            >
              <img
                src="/meerkat/avatar.png"
                className={`w-[82%] h-[82%] object-contain ${isOpponent ? 'grayscale' : ''}`}
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 text-2xl leading-none drop-shadow-lg">
              {rank.icon}
            </div>
          </div>

          {/* Имя и ранг */}
          <div className="text-center w-full">
            <h2 className="text-[17px] font-black text-white tracking-wide truncate leading-snug">
              {name}
            </h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 ${rank.color}`}>
              {rank.fullName}
            </p>
          </div>

          {/* Тонкий разделитель */}
          <div
            className="w-full h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)` }}
          />

          {/* Статы — 3 колонки */}
          <div className="w-full grid grid-cols-3 gap-1.5">
            {[
              { icon: <Trophy className="w-2.5 h-2.5" />, label: 'Rating',  value: String(mmr),           sub: 'MP'     },
              { icon: <Target className="w-2.5 h-2.5" />,  label: 'Winrate', value: `${winRate}%`,          sub: 'WIN'    },
              { icon: <Swords className="w-2.5 h-2.5" />,  label: 'Matches', value: String(matchesPlayed), sub: 'PLAYED' },
            ].map(({ icon, label, value, sub }) => (
              <div
                key={label}
                className="bg-black/35 rounded-xl px-2 py-2.5 border border-white/5 flex flex-col items-center gap-0.5"
              >
                <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${labelClass}`}>
                  {icon}
                  <span>{label}</span>
                </div>
                <span className="text-white font-black text-base font-mono leading-tight">{value}</span>
                <span className="text-slate-600 text-[7px] uppercase tracking-widest">{sub}</span>
              </div>
            ))}
          </div>

          {/* Winrate прогресс-бар */}
          <div className="w-full">
            <div className="h-[3px] w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${winRate}%`,
                  background: `linear-gradient(90deg, ${gradLeft}, ${accentColor})`,
                  transition: 'width 0.8s ease-out',
                }}
              />
            </div>
          </div>

        </div>

        {/* Нижняя акцент-полоса */}
        <div
          className="h-[2px] w-full flex-shrink-0"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }}
        />
      </div>
    </>
  );
}