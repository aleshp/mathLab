import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Trophy, MonitorPlay, Home, Bell, Zap, GraduationCap, Users } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, supabase } from '../lib/supabase';
import { getRank, getLevelProgress } from '../lib/gameLogic';
import { NotificationsModal } from './NotificationsModal';
import { LanguageSwitcher } from './LanguageSwitcher';

// ВСТРОЕННЫЙ КОМПОНЕНТ ОНЛАЙНА (чтобы не плодить файлы)
function OnlineCounterCompact() {
  const [count, setCount] = useState(124);
  useEffect(() => {
    const interval = setInterval(() => setCount(p => Math.max(80, p + Math.floor(Math.random()*7)-3)), 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800/50 rounded-md border border-slate-700/30 text-[9px] text-emerald-400 font-mono">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
      <span>{count}</span>
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
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      setUnreadCount(count || 0);
    };
    checkUnread();
    const sub = supabase.channel('header-notif').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => setUnreadCount(p => p + 1)).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [user]);

  return (
    <>
      <header className="relative border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm z-10 select-none">
        <div className="max-w-7xl mx-auto px-2 md:px-6 py-2 flex items-center justify-between gap-1 overflow-x-hidden">
          
          {/* ЛЕВАЯ ЧАСТЬ: ЛОГО + СЧЕТЧИК */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onBackToMap} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg border border-cyan-500/30 bg-slate-800 flex items-center justify-center">
                 <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display='none'; }} />
              </div>
              <div className="hidden sm:block text-left">
                <h1 className="text-lg font-bold text-white leading-tight">MathLab</h1>
                <p className="text-cyan-400/60 text-[10px] font-mono">PvP Arena</p>
              </div>
            </button>
            {/* Счетчик прямо здесь, виден всегда */}
            <OnlineCounterCompact />
          </div>

          {/* ПРАВАЯ ЧАСТЬ: КНОПКИ */}
          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageSwitcher />

            {user ? (
              <>
                  <button onClick={() => { setShowNotifications(true); setUnreadCount(0); }} className="relative p-1.5 md:p-2 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                  </button>

                  {profile?.companion_name && (
                    <button onClick={onShowCompanion} className="relative p-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="w-6 h-6 bg-black/20 rounded-md overflow-hidden">
                        <img src="/meerkat/avatar.png" alt="Pet" className="w-full h-full object-contain" />
                      </div>
                      {profile.companion_hunger < 30 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 border border-slate-900 rounded-full animate-ping" />}
                    </button>
                  )}

                  {/* КНОПКИ АРХИВА И РЕЙТИНГА (Видны всегда, но компактные) */}
                  <button onClick={onShowArchive} className="p-1.5 md:p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                    <MonitorPlay className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  <button onClick={onShowLeaderboard} className="p-1.5 md:p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                  </button>

                  {/* ПРОФИЛЬ */}
                  <button onClick={onShowDashboard} className="flex items-center gap-2 pl-2 border-l border-slate-700/50 ml-1">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold uppercase ${currentRank?.color} hidden xs:inline`}>
                          {currentRank?.title.split(' ')[0]}
                        </span>
                        {profile?.is_premium && <div className="bg-amber-500/20 p-0.5 rounded"><Zap className="w-2 h-2 text-amber-400 fill-current" /></div>}
                      </div>
                      <div className="w-8 md:w-16 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-cyan-400" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                    <div className="p-1 bg-slate-800 rounded-lg border border-slate-700">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={onExitGuest} className="p-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-400">
                  <Home className="w-4 h-4" />
                </button>
                <button onClick={onShowAuth} className="px-3 py-1.5 bg-cyan-600 text-white font-bold rounded-lg text-xs">
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