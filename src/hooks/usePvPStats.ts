import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type PvPStats = {
  winRate: number;      // 0–100
  matchesPlayed: number;
};

export function usePvPStats(userId: string | undefined): PvPStats {
  const [stats, setStats] = useState<PvPStats>({ winRate: 0, matchesPlayed: 0 });

  useEffect(() => {
    if (!userId) return;

    async function fetch() {
      const { data } = await supabase
        .from('duels')
        .select('winner_id')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .eq('status', 'finished')
        .not('winner_id', 'is', null); // исключаем ничьи без победителя

      if (!data || data.length === 0) return;

      const total = data.length;
      const wins  = data.filter(d => d.winner_id === userId).length;

      setStats({
        winRate: Math.round((wins / total) * 100),
        matchesPlayed: total,
      });
    }

    fetch();
  }, [userId]);

  return stats;
}