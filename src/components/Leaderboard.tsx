import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Zap, Target, X, Crown, Medal, Star, Swords, User, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { getRank } from '../lib/gameLogic';

type FilterType = 'global' | 'pvp' | 'exp';

export function Leaderboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('global');
  
  // Пагинация
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Сброс страницы при смене фильтра
  useEffect(() => {
    setPage(1);
    loadLeaders(1, filter);
  }, [filter]);

  // Загрузка при смене страницы
  useEffect(() => {
    loadLeaders(page, filter);
  }, [page]);

  async function loadLeaders(pageNum: number, currentFilter: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_leaderboard', {
      sort_type: currentFilter,
      page_number: pageNum,
      page_size: PAGE_SIZE
    });
    
    if (error) console.error('Ошибка рейтинга:', error);
    if (data) setLeaders(data);
    setLoading(false);
  }

  // === УМНЫЙ ПОИСК СЕБЯ (Серверный) ===
  const jumpToMe = async () => {
    if (!user) return;
    setLoading(true);

    // 1. Узнаем свою позицию в общем списке
    const { data: myRank, error } = await supabase.rpc('get_user_rank_position', {
      target_user_id: user.id,
      sort_type: filter
    });

    if (myRank) {
      // 2. Вычисляем страницу: ceil(rank / size)
      const myPage = Math.ceil(myRank / PAGE_SIZE);
      
      // 3. Переходим на эту страницу
      if (myPage !== page) {
        setPage(myPage); // useEffect сам подгрузит данные
      }
      
      // 4. Подсветка (небольшой хак с таймаутом, чтобы дождаться рендера)
      setTimeout(() => {
        const myElement = document.getElementById(`rank-${user.id}`);
        if (myElement) {
          myElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          myElement.classList.add('animate-pulse', 'bg-cyan-500/20');
          setTimeout(() => myElement.classList.remove('animate-pulse', 'bg-cyan-500/20'), 2000);
        }
      }, 500);
    } else {
      alert("Вас пока нет в рейтинге.");
    }
    setLoading(false);
  };

  const getRankStyle = (rank: number) => {
    // rank теперь приходит из базы (1, 2, 3...)
    switch (rank) {
      case 1: return { icon: <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-400 fill-current" />, color: 'text-amber-400', border: 'border-amber-500/50' };
      case 2: return { icon: <Medal className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />, color: 'text-slate-300', border: 'border-slate-400/50' };
      case 3: return { icon: <Medal className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />, color: 'text-orange-500', border: 'border-orange-600/50' };
      default: return { icon: <span className="font-mono font-bold text-sm md:text-base text-slate-500">#{rank}</span>, color: 'text-white', border: 'border-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-2 md:p-4 animate-in fade-in zoom-in duration-200">
      
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* ШАПКА */}
        <div className="p-4 md:p-6 border-b border-slate-700 bg-slate-800/50 flex flex-col gap-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Рейтинг</h2>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* ТАБЫ */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
             <button onClick={() => setFilter('global')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'global' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                <Trophy className="w-3 h-3" /> Общий
             </button>
             <button onClick={() => setFilter('pvp')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'pvp' ? 'bg-red-900/30 text-red-400 border border-red-500/20 shadow-md' : 'text-slate-500 hover:text-red-400'}`}>
                <Swords className="w-3 h-3" /> PvP
             </button>
             <button onClick={() => setFilter('exp')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${filter === 'exp' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-500/20 shadow-md' : 'text-slate-500 hover:text-cyan-400'}`}>
                <Zap className="w-3 h-3" /> Опыт
             </button>
          </div>
        </div>

        {/* СПИСОК */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 custom-scrollbar bg-slate-900/50 relative">
          
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 absolute inset-0">
               <Loader className="w-8 h-8 animate-spin text-cyan-500"/>
             </div>
          ) : leaders.length === 0 ? (
             <div className="text-center py-10 text-slate-500">Список пуст</div>
          ) : (
            leaders.map((player) => {
              // ВАЖНО: player.rank приходит из базы (1, 2, ... 100500)
              const style = getRankStyle(player.rank);
              const rankInfo = getRank(player.clearance_level, false); // is_admin не передаем в RPC, можно добавить, но пока так
              const isMe = player.user_id === user?.id;
              
              return (
                <div 
                  key={player.user_id}
                  id={`rank-${player.user_id}`}
                  className={`
                    relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300
                    ${style.border} ${isMe ? 'bg-cyan-900/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'bg-slate-800/40'}
                  `}
                >
                  <div className="w-8 h-8 flex items-center justify-center shrink-0">
                    {style.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm md:text-base truncate ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                        {player.username} {isMe && '(Вы)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 rounded bg-slate-950 border border-slate-800 ${rankInfo.color}`}>
                        {rankInfo.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <div className={`font-black font-mono text-base md:text-lg ${filter === 'pvp' ? 'text-red-400' : filter === 'exp' ? 'text-cyan-400' : 'text-white'}`}>
                      {filter === 'pvp' ? player.mmr : filter === 'exp' ? player.total_experiments : player.global_score}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">
                      {filter === 'pvp' ? 'MP' : filter === 'exp' ? 'Задач' : 'Rating'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* ПАГИНАЦИЯ И КНОПКА "Я" */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center relative">
          
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <span className="flex items-center px-4 bg-slate-950 rounded-lg border border-slate-800 text-slate-400 font-mono text-sm">
              Стр. {page}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={leaders.length < PAGE_SIZE || loading}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {user && (
            <button 
              onClick={jumpToMe}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              <span>Где я?</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
}