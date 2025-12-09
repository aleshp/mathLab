import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { LabMap } from './components/LabMap';
import { ModuleViewer } from './components/ModuleViewer';
import { Reactor } from './components/Reactor';
import { Dashboard } from './components/Dashboard';
import { Sector, Module } from './lib/supabase';
// ИКОНКИ (Все нужные)
import { Menu, User, Settings, Trophy, Zap, MonitorPlay, Crown, Keyboard } from 'lucide-react';
import { supabase } from './lib/supabase';
import 'katex/dist/katex.min.css';
import { AdminGenerator } from './components/AdminGenerator';
import { Leaderboard } from './components/Leaderboard';
import { Onboarding } from './components/Onboarding';
import { getRank, getLevelProgress } from './lib/gameLogic';
import { PvPMode } from './components/PvPMode';
import { VideoArchive } from './components/VideoArchive';
import { TournamentAdmin } from './components/TournamentAdmin';
import { TournamentLobby } from './components/TournamentLobby';
import { JoinTournamentModal } from './components/JoinTournamentModal';
import { CompanionLair } from './components/CompanionLair';
import { CompanionSetup } from './components/CompanionSetup';

type View = 'map' | 'modules' | 'reactor' | 'pvp' | 'tournament_lobby';

function MainApp() {
  const { user, loading, profile } = useAuth();
  const [view, setView] = useState<View>('map');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // Состояния модальных окон
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTournamentAdmin, setShowTournamentAdmin] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [showCompanionSetup, setShowCompanionSetup] = useState(false);

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  // === ФУНКЦИЯ ВХОДА В ТУРНИР (Универсальная) ===
  async function joinTournament(code: string) {
    if (!user) return;
    
    // 1. Ищем турнир по коду
    const { data: tour } = await supabase
      .from('tournaments')
      .select('id, status')
      .eq('code', code)
      .single();

    if (tour) {
      // 2. Регистрируемся
      await supabase.from('tournament_participants').upsert({
        tournament_id: tour.id,
        user_id: user.id
      });
      
      // 3. Закрываем модалку, чистим URL
      setShowJoinCode(false);
      window.history.replaceState({}, document.title, "/");
      
      // 4. Переходим в лобби
      setActiveTournamentId(tour.id);
      setView('tournament_lobby');
    } else {
      alert("Турнир с таким кодом не найден!");
    }
  }

  // === ПРОВЕРКИ ПРИ ЗАГРУЗКЕ ===

  // 1. Проверка URL (код турнира)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tCode = params.get('t');
    if (tCode) {
      joinTournament(tCode);
    }
  }, [user]);

  // 2. Авто-реконнект к битве (если вылетел)
  useEffect(() => {
    async function checkActiveDuel() {
      if (!user) return;
      const { data } = await supabase
        .from('duels')
        .select('id')
        .eq('status', 'active')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .maybeSingle();

      if (data) {
        setView('pvp');
      }
    }
    checkActiveDuel();
  }, [user]);

  // 3. Онбординг и Встреча с Сурикатом
  useEffect(() => {
    if (!profile) return;

    // Сначала обычный онбординг
    if (profile.total_experiments === 0 && profile.clearance_level === 0) {
      const hasSeen = localStorage.getItem('onboarding_seen');
      if (!hasSeen) {
        setShowOnboarding(true);
        return; // Прерываем, чтобы не наслоилось
      }
    }

    // Потом проверка суриката (если еще нет имени)
    if (!profile.companion_name) {
      setShowCompanionSetup(true);
    }
  }, [profile, showOnboarding]); // Добавил зависимость от showOnboarding

  function finishOnboarding() {
    localStorage.setItem('onboarding_seen', 'true');
    setShowOnboarding(false);
  }

  const currentRank = profile ? getRank(profile.clearance_level, profile.is_admin) : null;
  const progressPercent = profile ? getLevelProgress(profile.total_experiments) : 0;

  // ... (Обработчики навигации) ...
  function handleSectorSelect(sector: Sector) {
    setSelectedSector(sector);
    setView('modules');
  }
  function handleStartExperiment(module: Module) {
    setSelectedModule(module);
    setView('reactor');
  }
  function handleBackToMap() {
    if (activeTournamentId && view === 'pvp') {
       setView('tournament_lobby');
    } else {
       setView('map');
       setSelectedSector(null);
       setActiveTournamentId(null); 
    }
  }
  function handleBackToModules() {
    setView('modules');
    setSelectedModule(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-lg animate-pulse font-mono">Инициализация системы...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d410_1px,transparent_1px),linear-gradient(to_bottom,#06b6d410_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <header className="relative border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          
          <button onClick={handleBackToMap} className="flex items-center gap-3 hover:opacity-80 transition-opacity group min-w-fit">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <h1 className="text-xl font-bold text-white leading-tight">Алгебраическая Лаборатория</h1>
              <p className="text-cyan-400/60 text-xs">Научный центр математических исследований</p>
            </div>
          </button>

          <div className="flex items-center gap-3 md:gap-6">
            
            {/* 1. КНОПКА СУРИКАТА (Квадратная, как просил) */}
            {profile?.companion_name && (
              <button 
                onClick={() => setShowCompanion(true)}
                // Квадратная кнопка, как у Архива/Рейтинга (p-2 -> p-1 для большей картинки)
                className="relative group p-1 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors mr-2"
                title={`Домик ${profile.companion_name}`}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                   {/* Картинка без обрезки, большая */}
                   <img 
                     src="/meerkat/avatar.png" 
                     alt="Pet" 
                     className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                     onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerText = '🦦'; }}
                   />
                </div>
                
                {/* Индикатор голода */}
                {profile.companion_hunger < 30 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full animate-ping" />
                )}
              </button>
            )}

            {/* 2. Кнопка Архива */}
            <button onClick={() => setShowArchive(true)} className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors group" title="Архив Знаний">
              <MonitorPlay className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* 3. Кнопка Рейтинга */}
            <button onClick={() => setShowLeaderboard(true)} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors group" title="Рейтинг">
              <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>

            {/* 4. Профиль */}
            <button onClick={() => setShowDashboard(true)} className="flex flex-col items-end min-w-[140px] group">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${currentRank?.color}`}>{currentRank?.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-sm group-hover:text-cyan-300 transition-colors">{profile?.username}</span>
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="w-full flex items-center gap-2 mt-1.5">
                <div className="text-[10px] text-cyan-400/60 font-mono">LVL {profile?.clearance_level}</div>
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-cyan-400 transition-all duration-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-0 pb-20">
        {view === 'map' && (
          <>
            <LabMap onSectorSelect={handleSectorSelect} />
            
            {/* КНОПКИ ГЛАВНОГО ЭКРАНА */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 w-full justify-center px-4">
              
              {/* Кнопка 1: Войти по коду */}
              <button 
                onClick={() => setShowJoinCode(true)}
                className="group flex items-center gap-2 bg-slate-800 border-2 border-slate-600 px-6 py-4 rounded-full shadow-lg hover:border-cyan-400 hover:scale-105 transition-all"
              >
                <Keyboard className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span className="text-lg font-bold text-slate-300 group-hover:text-white uppercase tracking-wider hidden sm:inline">Ввести код</span>
              </button>

              {/* Кнопка 2: PvP Арена (Большая) */}
              <button 
                onClick={() => setView('pvp')}
                className="group relative flex items-center gap-3 bg-slate-900 border-2 border-red-600 px-8 py-4 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:scale-105 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-600/10 group-hover:bg-red-600/20 transition-colors" />
                <Zap className="w-8 h-8 text-red-500 fill-current animate-pulse" />
                <span className="text-xl font-black text-white tracking-widest italic">PVP ARENA</span>
              </button>
            </div>
          </>
        )}
        
        {view === 'modules' && selectedSector && (
          <ModuleViewer sector={selectedSector} onBack={handleBackToMap} onStartExperiment={handleStartExperiment} />
        )}
        {view === 'reactor' && selectedModule && (
          <Reactor module={selectedModule} onBack={handleBackToModules} />
        )}
        {view === 'pvp' && (
          <PvPMode onBack={handleBackToMap} />
        )}
        
        {view === 'tournament_lobby' && activeTournamentId && (
          <TournamentLobby 
            tournamentId={activeTournamentId} 
            onBattleStart={() => setView('pvp')} 
          />
        )}
      </main>

      {/* Модальные окна */}
      {showCompanionSetup && <CompanionSetup onComplete={() => setShowCompanionSetup(false)} />}
      {showOnboarding && <Onboarding onComplete={finishOnboarding} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
      {showDashboard && <Dashboard onClose={() => setShowDashboard(false)} />}
      {showAdmin && <AdminGenerator onClose={() => setShowAdmin(false)} />}
      {showArchive && <VideoArchive onClose={() => setShowArchive(false)} />}
      {showTournamentAdmin && <TournamentAdmin onClose={() => setShowTournamentAdmin(false)} />}
      {showJoinCode && <JoinTournamentModal onJoin={joinTournament} onClose={() => setShowJoinCode(false)} />}
      {showCompanion && <CompanionLair onClose={() => setShowCompanion(false)} />}

      {profile?.is_admin && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
          <button onClick={() => setShowTournamentAdmin(true)} className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-400 hover:bg-amber-500 hover:text-black transition-all shadow-lg">
            <Crown className="w-6 h-6" />
          </button>
          <button onClick={() => setShowAdmin(true)} className="p-3 bg-slate-800/90 backdrop-blur-md border border-cyan-500/30 rounded-full shadow-lg hover:bg-slate-700 hover:border-cyan-400 transition-all">
            <Settings className="w-6 h-6 text-cyan-400 group-hover:rotate-90 transition-transform duration-700" />
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;