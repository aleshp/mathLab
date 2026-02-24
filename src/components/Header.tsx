import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Trophy, MonitorPlay, Home, Bell, Zap, GraduationCap } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, supabase } from '../lib/supabase';
import { getRank, getLevelProgress } from '../lib/gameLogic';
import { NotificationsModal } from './NotificationsModal';
import { LanguageSwitcher } from './LanguageSwitcher';

// --- СЧЕТЧИК ОНЛАЙНА ---
function FloatingOnlineCounter() {
  const [count, setCount] = useState(124);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(p => Math.max(80, p + Math.floor(Math.random() * 7) - 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700/50 shadow-lg pointer-events-none">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      <span className="text-[10px] md:text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">{count} Online</span>
    </div>
  );
}

type Props = {
  user: SupabaseUser | null;
  profile: Profile | null;
  onBackToMap: () => void;
  onShowCompanion: () => void;
  onShowArchive: () => void;
  onShowLeaderboard: () => void;
  onShowDashboard: () => void;
  onExitGuest: () => void;
  onShowAuth: () => void;
};

export function Header({ 
  user, profile, onBackToMap, 
  onShowCompanion, onShowArchive, onShowLeaderboard, onShowDashboard,
  onExitGuest, onShowAuth 
}: Props) {
  const { t } = useTranslation();

  const currentRank = profile ? getRank(profile.clearance_level, profile.role) : { title: t('header.guest'), color: 'text-slate-400' };
  const progressPercent = profile ? getLevelProgress(profile.total_experiments) : 0;

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    checkUnread();

    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
      () => {
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <>
      <FloatingOnlineCounter />

      <header className="relative border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-2 md:py-3 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
          
          {/* === ЛОГОТИП (ТЕПЕРЬ ВИДЕН ВСЕГДА) === */}
          <button onClick={onBackToMap} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-lg border border-cyan-500/30 bg-slate-800 flex items-center justify-center shrink-0">
               <img 
                 src="/logo.png" 
                 alt="Logo" 
                 className="w-full h-full object-cover"
                 onError={(e) => { e.currentTarget.style.display='none'; }}
               />
            </div>
            {/* Убрал все hidden, теперь текст есть всегда */}
            <div className="text-left flex flex-col justify-center min-w-0">
              <h1 className="text-sm md:text-xl font-bold text-white leading-tight">MathLab</h1>
              <p className="text-cyan-400/60 text-[9px] md:text-xs font-mono">{t('header.subtitle')}</p>
            </div>
          </button>

          {/* === КНОПКИ УПРАВЛЕНИЯ === */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            
            <LanguageSwitcher />

            {user ? (
              <>
                  <button 
                    onClick={() => { setShowNotifications(true); setUnreadCount(0); }}
                    className="relative p-1.5 md:p-2 bg-slate-800/50 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                  >
                    <Bell className="w-4 h-4 md:w-5 md:h-5 text-slate-400 hover:text-purple-400" />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                  </button>

                  {profile?.companion_name && (
                    <button 
                      onClick={onShowCompanion}
                      className="relative p-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-black/20 rounded-md overflow-hidden">
                        <img src="/meerkat/avatar.png" alt="Pet" className="w-full h-full object-contain" />
                      </div>
                      {profile.companion_hunger < 30 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 border border-slate-900 rounded-full animate-pulse" />}
                    </button>
                  )}

                  <button onClick={onShowArchive} className="p-1.5 md:p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 transition-colors" title={t('header.archive')}>
                    <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <button onClick={onShowLeaderboard} className="p-1.5 md:p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 transition-colors" title={t('header.leaderboard')}>
                    <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  {/* === ПРОФИЛЬ === */}
                  <button onClick={onShowDashboard} className="flex items-center gap-1.5 md:gap-2 pl-2 border-l border-slate-700/50 ml-1 min-w-0">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase ${currentRank?.color}`}>
                          {currentRank?.title.split(' ')[0]}
                        </span>
                        {profile?.is_premium && profile.role !== 'teacher' && <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" />}
                        {profile?.role === 'teacher' && <GraduationCap className="w-2.5 h-2.5 text-cyan-400" />}
                      </div>
                      <span className="text-white font-medium text-xs md:text-sm leading-none max-w-[60px] md:max-w-[100px] truncate">
                        {profile?.username}
                      </span>
                    </div>

                    <div className="relative shrink-0">
                       <div className="p-1.5 md:p-2 bg-slate-800 rounded-lg border border-slate-700">
                           <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                       </div>
                       <div className="absolute -bottom-1 left-0 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
                       </div>
                    </div>
                  </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={onExitGuest} className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-400">
                  <Home className="w-4 h-4" />
                </button>
                <button onClick={onShowAuth} className="px-3 md:px-6 py-1.5 md:py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs md:text-sm shadow-lg">
                  {t('header.login_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </>
  );
}