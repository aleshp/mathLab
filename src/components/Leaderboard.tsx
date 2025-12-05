import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Zap, Star, TrendingUp } from 'lucide-react'; // Добавил иконки
import { getRank } from '../lib/gameLogic';

export function Leaderboard({ onClose }: { onClose: () => void }) {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaders() {
      // ВМЕСТО .from('profiles') ИСПОЛЬЗУЕМ .rpc('get_leaderboard')
      // Это вызывает нашу SQL-функцию с умной сортировкой
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) console.error('Ошибка рейтинга:', error);
      if (data) setLeaders(data);
      
      setLoading(false);
    }
    loadLeaders();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 border border-amber-500/30 rounded-2xl p-8 relative overflow-hidden flex flex-col max-h-[85vh]">
        {/* Фоновoe свечение */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Топ Агентов</h2>
              <p className="text-amber-400/60 text-xs uppercase tracking-widest">Global Ranking System</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white px-4 py-2 bg-slate-700 rounded-lg transition-colors">
            Закрыть
          </button>
        </div>

        {/* Заголовки колонок (для красоты) */}
        <div className="grid grid-cols-12 text-xs text-slate-500 uppercase font-mono mb-2 px-4 relative z-10">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-6">Агент</div>
          <div className="col-span-5 text-right">Показатели</div>
        </div>

        <div className="space-y-2 relative z-10 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40 text-slate-500">
               <div className="animate-spin mb-2"><Trophy className="w-6 h-6"/></div>
               Загрузка данных...
             </div>
          ) : leaders.map((player, index) => {
            const rank = getRank(player.clearance_level, player.is_admin);
            const isTop3 = index < 3;
            
            return (
              <div 
                key={index}
                className={`grid grid-cols-12 items-center p-3 rounded-xl border transition-all ${
                  isTop3 
                    ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-amber-500/30 hover:border-amber-400/50' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* 1. МЕСТО */}
                <div className="col-span-1 flex justify-center">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg ${
                    index === 0 ? 'text-amber-400' :
                    index === 1 ? 'text-slate-300' :
                    index === 2 ? 'text-orange-700' :
                    'text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* 2. ИНФО */}
                <div className="col-span-6 pl-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold text-white ${isTop3 ? 'text-lg' : 'text-base'}`}>
                      {player.username}
                    </span>
                    {isTop3 && <Star className="w-4 h-4 text-amber-400 fill-current animate-pulse" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 ${rank.color}`}>
                      {rank.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">LVL {player.clearance_level}</span>
                  </div>
                </div>

                {/* 3. СТАТИСТИКА (ПРАВАЯ ЧАСТЬ) */}
                <div className="col-span-5 flex flex-col items-end gap-1">
                  
                  {/* ГЛАВНЫЙ СЧЕТ (SCORE) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-mono uppercase">Rating</span>
                    <span className={`font-black font-mono text-lg ${isTop3 ? 'text-amber-400' : 'text-white'}`}>
                      {player.global_score}
                    </span>
                  </div>

                  {/* ДЕТАЛИ: MP / EXP / % */}
                  <div className="flex gap-2 text-[10px] opacity-70">
                    <div className="flex items-center gap-1 text-red-400" title="PvP Рейтинг">
                      <Zap className="w-3 h-3 fill-current" /> {player.mmr}
                    </div>
                    <div className="flex items-center gap-1 text-cyan-400" title="Решено задач">
                      <div className="font-bold">EXP</div> {player.total_experiments}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400" title="Точность">
                      <TrendingUp className="w-3 h-3" /> {Number(player.success_rate).toFixed(0)}%
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
        
        {/* Легенда снизу */}
        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-[10px] text-slate-500">
          <span>Формула рейтинга:</span>
          <span className="font-mono text-slate-400">MP + (EXP × 5) + (Точность × 2)</span>
        </div>
      </div>
    </div>
  );
}