import React from 'react';
import { getPvPRankStats } from '../lib/gameLogic';
import { TrendingUp, Target } from 'lucide-react';

interface Props { mmr: number; showDetails?: boolean; compact?: boolean; }

export function RankProgress({ mmr, showDetails = true, compact = false }: Props) {
  const stats = getPvPRankStats(mmr);
  const { rank, progress, nextRank, mmrToNext } = stats;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-2xl">{rank.icon}</div>
        <div>
          <div className={`font-bold text-sm ${rank.color} leading-tight`}>
            {rank.division > 0 ? `${rank.tier.charAt(0).toUpperCase()}${rank.division}` : rank.name}
          </div>
          <div className="text-xs text-slate-500 font-mono">{mmr} MP</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `linear-gradient(135deg, ${rank.gradientFrom}, ${rank.gradientTo})`, boxShadow: `0 0 30px ${rank.gradientFrom}50` }}>
          {rank.icon}
        </div>
        <div className="flex-1">
          <div className={`text-2xl font-black ${rank.color}`}>{rank.fullName}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400 text-sm font-mono">{mmr} MP</span>
            {nextRank && <span className="text-slate-600 text-xs">• {mmrToNext} до {nextRank.fullName}</span>}
          </div>
        </div>
      </div>

      {nextRank && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase">Прогресс</span>
            <span className="text-xs text-slate-400 font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${rank.gradientFrom}, ${rank.gradientTo})` }} />
          </div>
        </div>
      )}

      {showDetails && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-2 text-center">
            <Target className="w-4 h-4 text-slate-400 mx-auto mb-1" />
            <div className="text-lg font-black text-white">{mmr}</div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Рейтинг</div>
          </div>
          {nextRank && (
            <div className="bg-slate-800/50 rounded-lg p-2 text-center">
              <TrendingUp className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <div className="text-lg font-black text-cyan-400">+{mmrToNext}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">До повышения</div>
            </div>
          )}
        </div>
      )}

      {showDetails && (
        <div className="pt-2 border-t border-slate-800">
          <p className="text-slate-400 text-xs italic text-center">"{rank.description}"</p>
        </div>
      )}
    </div>
  );
}