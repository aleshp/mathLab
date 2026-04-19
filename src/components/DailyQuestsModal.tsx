// src/components/DailyQuestsModal.tsx
import { useState, useEffect } from 'react';
import { X, Target, Swords, Trophy, CheckCircle2, Gift, Coins, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

type Props = {
  onClose: () => void;
};

export function DailyQuestsModal({ onClose }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const [questData, setQuestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadQuests();
  }, [user]);

  async function loadQuests() {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('daily_quests').select('*').eq('user_id', user!.id).maybeSingle();
    
    if (!data || data.quest_date !== today) {
      // Сброс или создание новых квестов на сегодня
      const newRow = {
        user_id: user!.id,
        quest_date: today,
        pve_solved: 0,
        pvp_played: 0,
        pvp_won: 0,
        pve_claimed: false,
        pvp_played_claimed: false,
        pvp_won_claimed: false
      };
      await supabase.from('daily_quests').upsert(newRow);
      setQuestData(newRow);
    } else {
      setQuestData(data);
    }
    setLoading(false);
  }

  async function claimReward(type: 'pve' | 'pvp_play' | 'pvp_win') {
    if (!user || !questData) return;
    setClaiming(type);

    try {
      let reward = 0;
      const updates: any = {};
      
      if (type === 'pve') {
        reward = 30;
        updates.pve_claimed = true;
      } else if (type === 'pvp_play') {
        reward = 40;
        updates.pvp_played_claimed = true;
      } else if (type === 'pvp_win') {
        reward = 80;
        updates.pvp_won_claimed = true;
      }

      // Проверяем, выполнил ли он все 3 квеста прямо сейчас
      const nextData = { ...questData, ...updates };
      const justFinishedAll = nextData.pve_claimed && nextData.pvp_played_claimed && nextData.pvp_won_claimed;
      
      if (justFinishedAll) {
        reward += 100; // Бонус за все квесты!
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#facc15', '#f59e0b'] });
      }

      // Обновляем БД (строку квеста и монеты)
      await supabase.from('daily_quests').update(updates).eq('user_id', user.id);
      await supabase.rpc('grant_coins', { amount: reward });
      
      setQuestData(nextData);
      await refreshProfile(); // Синхронизируем монеты в Header
      
    } catch (e) {
      console.error(e);
      alert('Ошибка при получении награды');
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const quests =[
    { id: 'pve', title: 'Решить 10 задач в Реакторе', target: 10, current: questData?.pve_solved || 0, claimed: questData?.pve_claimed, reward: 30, icon: Target },
    { id: 'pvp_play', title: 'Сыграть 3 PvP матча', target: 3, current: questData?.pvp_played || 0, claimed: questData?.pvp_played_claimed, reward: 40, icon: Swords },
    { id: 'pvp_win', title: 'Выиграть 2 PvP матча', target: 2, current: questData?.pvp_won || 0, claimed: questData?.pvp_won_claimed, reward: 80, icon: Trophy },
  ];

  const completedCount = quests.filter(q => q.claimed).length;

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Фоновое свечение */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 blur-3xl pointer-events-none" />

        <div className="p-6 border-b border-slate-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Задания</h2>
              <p className="text-slate-400 text-xs font-mono">Обновление в 00:00</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar relative z-10">
          
          {/* БОНУСНЫЙ БЛОК */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
            <div>
              <h3 className="text-amber-400 font-bold mb-1">Бонус дня</h3>
              <p className="text-xs text-amber-200/70">Выполни все квесты для мега-награды!</p>
            </div>
            <div className="flex flex-col items-end">
               <div className="flex gap-1.5 mb-1.5">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={`w-3 h-3 rounded-full border ${i <= completedCount ? 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-slate-800 border-slate-600'}`} />
                 ))}
               </div>
               <div className="text-sm font-black text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded border border-amber-500/20">
                 +100 MC
               </div>
            </div>
          </div>

          {/* СПИСОК КВЕСТОВ */}
          <div className="space-y-3">
            {quests.map((q) => {
              const Icon = q.icon;
              const isDone = q.current >= q.target;
              const progress = Math.min((q.current / q.target) * 100, 100);

              return (
                <div key={q.id} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:border-slate-600">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className={`p-2 rounded-lg ${q.claimed ? 'bg-emerald-500/20 text-emerald-400' : isDone ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm ${q.claimed ? 'text-slate-400 line-through decoration-slate-500' : 'text-white'}`}>{q.title}</h4>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">Награда: <span className="text-amber-400 font-bold">{q.reward} MC</span></div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {q.claimed ? (
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" /> Выполнено
                        </div>
                      ) : isDone ? (
                        <button
                          onClick={() => claimReward(q.id as any)}
                          disabled={claiming !== null}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white font-bold text-xs rounded-lg shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center gap-1"
                        >
                          {claiming === q.id ? <Loader className="w-4 h-4 animate-spin" /> : 'ЗАБРАТЬ'}
                        </button>
                      ) : (
                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                            {q.current} / {q.target}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Полоска прогресса */}
                  {!q.claimed && (
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full transition-all duration-500 ${isDone ? 'bg-amber-400' : 'bg-cyan-500'}`} style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}