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

    async function fetchStats() {
      try {
        // 1. ДЕЛАЕМ 2 ПАРАЛЛЕЛЬНЫХ ЗАПРОСА ВМЕСТО .or()
        // Это полностью решает баг Supabase с пропуском строк при включенном RLS
        const [req1, req2] = await Promise.all([
          supabase
            .from('duels')
            .select('id, player1_id, player2_id, winner_id, status, player1_score, player2_score')
            .eq('player1_id', userId),
          supabase
            .from('duels')
            .select('id, player1_id, player2_id, winner_id, status, player1_score, player2_score')
            .eq('player2_id', userId)
        ]);

        const data1 = req1.data || [];
        const data2 = req2.data ||[];

        // Объединяем результаты и убираем дубликаты (на всякий случай)
        const allMatches =[...data1, ...data2];
        const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());

        if (uniqueMatches.length === 0) {
          setStats({ winRate: 0, matchesPlayed: 0 });
          return;
        }

        // Оставляем только сыгранные матчи
        const finishedMatches = uniqueMatches.filter(m => m.status === 'finished');
        
        let wins = 0;
        let validMatches = 0;

        finishedMatches.forEach(match => {
          let actualWinner = match.winner_id;

          // 2. ФОЛЛБЕК (ЗАЩИТА ОТ БАГОВ БД): 
          // Если RPC функция не отработала и winner_id пустой, вычисляем победителя сами по очкам!
          if (!actualWinner && match.player1_score !== undefined && match.player2_score !== undefined) {
            if (match.player1_score > match.player2_score) {
              actualWinner = match.player1_id;
            } else if (match.player2_score > match.player1_score) {
              actualWinner = match.player2_id;
            } else {
              actualWinner = 'draw';
            }
          }

          // Если победитель определен и это не ничья, считаем винрейт
          if (actualWinner && actualWinner !== 'draw') {
            validMatches++;
            if (actualWinner === userId) {
              wins++;
            }
          }
        });

        // 3. ОБНОВЛЯЕМ СТАТУС
        setStats({
          winRate: validMatches > 0 ? Math.round((wins / validMatches) * 100) : 0,
          matchesPlayed: finishedMatches.length, // Показываем все матчи (включая ничьи)
        });
        
      } catch (err) {
        console.error('Fatal error in usePvPStats:', err);
      }
    }

    fetchStats();
  }, [userId]);

  return stats;
}