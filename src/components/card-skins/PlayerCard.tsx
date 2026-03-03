import { Trophy, Target } from 'lucide-react';

export type CardSkin = 'default' | 'electric' | 'fire' | 'gold' | string;

type PlayerCardProps = {
  isOpponent: boolean;
  name: string;
  mmr: number;
  rank: any;
  winRate: number;
  skin?: CardSkin;
  stage?: 'enter' | 'idle' | 'exit';
};

export function PlayerCard({ isOpponent, name, mmr, rank, winRate, skin = 'default', stage = 'idle' }: PlayerCardProps) {

  let transformClass = '';
  if (stage === 'enter') {
    transformClass = isOpponent ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0';
  } else if (stage === 'exit') {
    transformClass = isOpponent ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0';
  } else {
    transformClass = 'translate-x-0 opacity-100';
  }

  // --- ЛОГИКА СКИНОВ ---
  let skinBorder = isOpponent ? 'border-red-500' : 'border-cyan-500';
  let skinShadow = isOpponent ? 'shadow-red-500/20' : 'shadow-cyan-500/20';
  let skinGlow = '';
  let skinBg = isOpponent ? 'from-red-900' : 'from-cyan-900';
  let badgeColors = isOpponent ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400';

  if (skin === 'electric') {
     skinGlow = isOpponent ? 'shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'shadow-[0_0_30px_rgba(6,182,212,0.4)]';
  } else if (skin === 'fire') {
     skinBorder = 'border-orange-500';
     skinShadow = 'shadow-orange-500/30';
     skinGlow = 'shadow-[0_0_30px_rgba(249,115,22,0.5)]';
     skinBg = 'from-orange-900';
     badgeColors = 'bg-orange-500/20 text-orange-400';
  } else if (skin === 'gold') {
     skinBorder = 'border-yellow-400';
     skinShadow = 'shadow-yellow-400/30';
     skinGlow = 'shadow-[0_0_30px_rgba(250,204,21,0.5)]';
     skinBg = 'from-yellow-900';
     badgeColors = 'bg-yellow-500/20 text-yellow-400';
  }

  return (
    <div
      className={`
        w-full max-w-sm md:w-80 h-auto md:h-[450px]
        bg-slate-900 rounded-3xl border-2 ${skinBorder} ${skinShadow} shadow-2xl
        transition-[transform,opacity] duration-500 ease-out will-change-transform ${transformClass} ${skinGlow}
        flex flex-col items-center p-6 relative overflow-hidden
      `}
    >
      {/* Фон внутри (градиент) */}
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-b ${skinBg} to-transparent`} />

      {/* Бейдж */}
      <div className={`relative z-10 mb-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColors}`}>
        {isOpponent ? 'OPPONENT' : 'YOU'}
      </div>

      {/* Аватар */}
      <div className="relative z-10 mb-4">
        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center bg-slate-800 ${skinBorder}`}>
          <img
            src="/meerkat/avatar.png"
            className={`w-[80%] h-[80%] object-contain ${isOpponent ? 'grayscale sepia' : ''}`}
          />
        </div>
        <div className="absolute -bottom-2 -right-2 text-3xl filter drop-shadow-md">
          {rank.icon}
        </div>
      </div>

      {/* Инфо */}
      <div className="relative z-10 text-center w-full mb-6">
        <h2 className="text-xl md:text-2xl font-black text-white truncate">{name}</h2>
        <div className={`text-xs font-bold uppercase ${rank.color}`}>{rank.fullName}</div>
      </div>

      {/* Статы */}
      <div className="relative z-10 w-full grid grid-cols-2 gap-3 mt-auto">
        <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-white/5">
          <div className={`text-[10px] font-bold uppercase mb-1 flex justify-center gap-1 ${badgeColors.split(' ')[1]}`}>
            <Trophy className="w-3 h-3" /> MP
          </div>
          <div className="text-lg font-mono font-black text-white">{mmr}</div>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-white/5">
          <div className={`text-[10px] font-bold uppercase mb-1 flex justify-center gap-1 ${badgeColors.split(' ')[1]}`}>
            <Target className="w-3 h-3" /> Win
          </div>
          <div className="text-lg font-mono font-black text-white">{winRate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Блик для платныx скинов */}
      {skin !== 'default' && (
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      )}
    </div>
  );
}