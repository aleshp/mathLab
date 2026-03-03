import { useEffect, useState, useMemo } from 'react';
import { Profile } from '../lib/supabase';
import { getPvPRank } from '../lib/gameLogic';
import { PlayerCard } from './card-skins/PlayerCard';

type Props = {
  player: Profile;
  opponentName: string;
  opponentMMR: number;
  onComplete: () => void;
};

export function VsScreen({ player, opponentName, opponentMMR, onComplete }: Props) {
  const [stage, setStage] = useState<'enter' | 'idle' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('idle'), 100);
    const t2 = setTimeout(() => setStage('exit'), 3500);
    const t3 = setTimeout(onComplete, 4000);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [onComplete]);

  const pRank = getPvPRank(player.mmr || 1000);
  const oRank = getPvPRank(opponentMMR);

  // Фиксируем один раз, чтобы не вызывать бесконечный ре-рендер
  const oWinRate = useMemo(
    () => Math.min(95, Math.max(40, 50 + Math.random() * 20)),
    []
  );

  const mySkin = player.is_premium ? 'electric' : 'default';

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-4">

      {/* Статический фон */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1e293b_0%,_#020617_100%)]" />

      {/* Контейнер карточек */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full max-w-4xl justify-center">

        {/* Карточка Игрока */}
        <PlayerCard
          isOpponent={false}
          name={player.username}
          mmr={player.mmr || 1000}
          rank={pRank}
          winRate={player.success_rate}
          skin={mySkin}
          stage={stage}
        />

        {/* VS Бейдж */}
        <div
          className={`
            shrink-0 w-20 h-20 bg-white rounded-full flex items-center justify-center
            shadow-[0_0_40px_rgba(255,255,255,0.3)] z-20
            md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2
            transition-[transform,opacity] duration-500 ease-out
            ${stage === 'enter' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
            ${stage === 'exit' ? 'scale-0 opacity-0' : ''}
          `}
        >
          <span className="text-black font-black text-3xl italic -ml-1">VS</span>
        </div>

        {/* Карточка Соперника */}
        <PlayerCard
          isOpponent={true}
          name={opponentName}
          mmr={opponentMMR}
          rank={oRank}
          winRate={oWinRate}
          skin="electric"
          stage={stage}
        />

      </div>
    </div>
  );
}