import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPvPRank } from '../lib/gameLogic';
import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react';

interface RankChange { id: string; timestamp: string; old_mmr: number; new_mmr: number; change: number; reason: 'win' | 'loss' | 'calibration'; }
interface Props { userId: string; onClose: () => void; }

export function RankHistory({ userId, onClose }: Props) {
  const [history, setHistory] = useState<RankChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadHistory(); }, [userId]);

  async function loadHistory() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('rank_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to load rank history', error);
      setError('Не удалось загрузить историю');
      setLoading(false);
      return;
    }

    if (data) setHistory(data as RankChange[]);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase">История рангов</h2>
            <p className="text-slate-400 text-sm">Последние 50 изменений рейтинга</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4 space-y-2">
          {loading ? <div className="text-center py-20 text-slate-500">Загрузка...</div> : error ? <div className="text-center py-20 text-red-500">{error}</div> : history.length === 0 ? (
            <div className="text-center py-20 text-slate-500"><Clock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>История пуста</p><p className="text-xs mt-2">Сыграйте несколько матчей</p></div>
          ) : (
            history.map((record) => {
              const oldRank = getPvPRank(record.old_mmr);
              const newRank = getPvPRank(record.new_mmr);
              const isWin = record.change > 0;
              const rankChanged = oldRank.name !== newRank.name;

              return (
                <div key={record.id} className={`bg-slate-800/50 border rounded-xl p-4 flex items-center gap-4 ${isWin ? 'border-emerald-500/20' : 'border-red-500/20'} ${rankChanged ? 'ring-2 ring-amber-500/50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isWin ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>{isWin ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-400">{new Date(record.timestamp).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      {rankChanged && <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full text-[10px] text-amber-400 font-bold uppercase">Rank Up!</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs ${oldRank.color}`}>{oldRank.icon} {oldRank.fullName}</div>
                      {rankChanged && (<><span className="text-slate-600">→</span><div className={`text-xs ${newRank.color} font-bold`}>{newRank.icon} {newRank.fullName}</div></>)}
                    </div>
                  </div>
                  <div className="text-right"><div className={`text-xl font-black font-mono ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>{isWin ? '+' : ''}{record.change}</div><div className="text-xs text-slate-500 font-mono">{record.old_mmr} → {record.new_mmr}</div></div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900"><button onClick={onClose} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold transition-colors">Закрыть</button></div>
      </div>
    </div>
  );
}