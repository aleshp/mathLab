import { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { LabMap } from './components/LabMap';
import { Header } from './components/Header';
import { StickyReconnect } from './components/StickyReconnect';
import { Dashboard } from './components/Dashboard';
import { LegalModal } from './components/LegalModal';
import { JoinTournamentModal } from './components/JoinTournamentModal';
import { CompanionLair } from './components/CompanionLair';
import { CompanionSetup } from './components/CompanionSetup';
import { LevelUpManager } from './components/LevelUpManager';
import { Onboarding } from './components/Onboarding';
import { Leaderboard } from './components/Leaderboard';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { PricingPage } from './components/PricingPage';
import { TermsPage } from './components/TermsPage';
import { ResetPassword } from './components/ResetPassword';
import { supabase } from './lib/supabase';
import { Sector, Module } from './lib/supabase';
import { FriendlyDuelModal } from './components/FriendlyDuelModal';
import { PromoPage } from './components/PromoPage';

// Добавлена иконка Users
import { Loader, Crown, Settings, Shield, Zap, Keyboard, Lock, ClipboardList, ArrowRight, Users } from 'lucide-react';
import 'katex/dist/katex.min.css';

// =======================
// LAZY (тяжёлые) КОМПОНЕНТЫ
// =======================
const ModuleViewer = lazy(() => import('./components/ModuleViewer').then(m => ({ default: m.ModuleViewer })));
const Reactor = lazy(() => import('./components/Reactor').then(m => ({ default: m.Reactor })));
const PvPMode = lazy(() => import('./components/PvPMode').then(m => ({ default: m.PvPMode })));
const TournamentLobby = lazy(() => import('./components/TournamentLobby').then(m => ({ default: m.TournamentLobby })));
const TournamentAdmin = lazy(() => import('./components/TournamentAdmin').then(m => ({ default: m.TournamentAdmin })));
const AdminGenerator = lazy(() => import('./components/AdminGenerator').then(m => ({ default: m.AdminGenerator })));
const VideoArchive = lazy(() => import('./components/VideoArchive').then(m => ({ default: m.VideoArchive })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ErrorAnalyzer = lazy(() => import('./components/ErrorAnalyzer').then(m => ({ default: m.ErrorAnalyzer })));
const PixelBlast = lazy(() => import('./components/PixelBlast'));

// =======================
// LOADER
// =======================
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
    <Loader className="w-10 h-10 text-cyan-400 animate-spin" />
  </div>
);

type View = 'map' | 'modules' | 'reactor' | 'pvp' | 'tournament_lobby' | 'analyzer';

function MainApp() {
  const { user, loading, profile } = useAuth();

  // Навигация / выбор
  const [view, setView] = useState<View>('map');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const[selectedModule, setSelectedModule] = useState<Module | null>(null);
  const[trainingProblemIds, setTrainingProblemIds] = useState<string[] | null>(null);

  // Глобальные флаги / модалки / гостевой режим
  const [isGuest, setIsGuest] = useState(false);
  const[showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTournamentAdmin, setShowTournamentAdmin] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const[showJoinCode, setShowJoinCode] = useState(false);
  const [showCompanion, setShowCompanion] = useState(false);
  const [showCompanionSetup, setShowCompanionSetup] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'refund' | null>(null);
  const[showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // Флаг для дружеской дуэли (перемещен внутрь компонента)
  const [showFriendlyDuel, setShowFriendlyDuel] = useState(false);

  // Игровые сессии
  const [activeGameSession, setActiveGameSession] = useState<{ duelId: string; tournamentId?: string } | null>(null);
  const[activeTournamentId, setActiveTournamentId] = useState<string | null>(null);

  // === joinTournament (по коду) ===
  async function joinTournament(code: string) {
    if (!user) {
      alert('Нужно войти в систему, чтобы присоединиться к турниру');
      return;
    }

    const { data: tour, error } = await supabase
      .from('tournaments')
      .select('id, status')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('joinTournament error', error);
      alert('Ошибка при поиске турнира');
      return;
    }

    if (tour) {
      await supabase
        .from('tournament_participants')
        .upsert({ tournament_id: tour.id, user_id: user.id });

      setShowJoinCode(false);
      window.history.replaceState({}, document.title, '/');
      setActiveTournamentId(tour.id);
      setView('tournament_lobby');
    } else {
      alert('Турнир с таким кодом не найден!');
    }
  }

  // === Хэндлер запуска дружеской дуэли ===
  function handleFriendlyDuelReady(duelId: string) {
    setShowFriendlyDuel(false);
    setActiveGameSession({ duelId, tournamentId: undefined });
    setView('pvp');
  }

  // === Сохраняем код турнира ПЕРЕД логином/регистрацией ===
  useEffect(() => {
    const tCode = new URLSearchParams(window.location.search).get('t');
    if (tCode) {
      sessionStorage.setItem('pending_tournament_code', tCode);
    }
  },[]);

  // === Проверка активных сессий + подписка на duels ===
  useEffect(() => {
    if (!user) {
      setActiveGameSession(null);
      setActiveTournamentId(null);
      return;
    }

    const urlCode = new URLSearchParams(window.location.search).get('t');
    const pendingCode = sessionStorage.getItem('pending_tournament_code');
    const codeToJoin = urlCode || pendingCode;

    if (codeToJoin) {
      joinTournament(codeToJoin);
      sessionStorage.removeItem('pending_tournament_code');
    }

    let isMounted = true;

    async function checkActiveSession() {
      if (!user) return;

      const { data: duel } = await supabase
        .from('duels')
        .select('id, tournament_id, status, player1_id, player2_id')
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .eq('status', 'active')
        .maybeSingle();

      if (!isMounted) return;

      if (duel) {
        setActiveGameSession({ duelId: duel.id, tournamentId: duel.tournament_id });
      } else {
        setActiveGameSession(null);
      }

      if (!duel) {
        const { data: part } = await supabase
          .from('tournament_participants')
          .select('tournament_id, tournaments(status)')
          .eq('user_id', user.id)
          .neq('tournaments.status', 'finished')
          .maybeSingle();

        if (!isMounted) return;
        if (part && (part as any).tournament_id) {
          setActiveTournamentId((part as any).tournament_id);
        } else {
          setActiveTournamentId(null);
        }
      }
    }

    checkActiveSession();

    const channel = supabase
      .channel('global-game-check-' + (user?.id ?? 'anon'))
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'duels' },
        (payload) => {
          const newData = payload.new as any;
          if (!newData) return;
          if (
            newData.status === 'finished' &&
            (newData.player1_id === user?.id || newData.player2_id === user?.id)
          ) {
            setActiveGameSession(null);
          } else {
            if (newData.player1_id === user?.id || newData.player2_id === user?.id) {
              checkActiveSession();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'duels', filter: `player1_id=eq.${user?.id}` },
        () => checkActiveSession()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'duels', filter: `player2_id=eq.${user?.id}` },
        () => checkActiveSession()
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        try {
          supabase.removeChannel('global-game-check-' + user?.id);
        } catch (e) {}
      }
    };
  }, [user]);

  // === Проверка прав ведущего/хоста турнира (teacher) ===
  useEffect(() => {
    async function checkHosting() {
      if (!user) return;
      if (profile?.role === 'teacher' && !profile?.is_admin) {
        const { data } = await supabase
          .from('tournaments')
          .select('id')
          .eq('created_by', user.id)
          .in('status', ['waiting', 'active'])
          .maybeSingle();

        if (data) setShowTournamentAdmin(true);
      }
    }
    checkHosting();
  }, [user, profile]);

  // === Онбординг / Companion setup ===
  useEffect(() => {
    if (!profile) return;

    if (profile.total_experiments === 0 && profile.clearance_level === 0) {
      const hasSeen = localStorage.getItem('onboarding_seen');
      if (!hasSeen) {
        setShowOnboarding(true);
        return;
      }
    }

    if (!profile.companion_name) {
      setShowCompanionSetup(true);
    }
  }, [profile]);

  function finishOnboarding() {
    localStorage.setItem('onboarding_seen', 'true');
    setShowOnboarding(false);
  }

  function handleSectorSelect(sector: Sector) {
    setSelectedSector(sector);
    setView('modules');
  }

  function handleStartExperiment(module: Module) {
    setSelectedModule(module);
    setView('reactor');
    setTrainingProblemIds(null);
  }

  function handleBackToMap() {
    setView('map');
    setSelectedSector(null);
    setTrainingProblemIds(null);
  }

  function handleStartErrorTraining(problemIds: string[]) {
    setTrainingProblemIds(problemIds);
    setSelectedModule({
      id: 'error_training' as any,
      sector_id: 0 as any,
      name: 'Работа над ошибками',
      theory_content: '',
      order_index: 0,
      required_modules:[]
    });
    setView('reactor');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400">
        Загрузка...
      </div>
    );
  }

  if (!user && !isGuest && !showAuthModal) {
    return (
      <>
        <LandingPage
          onStartDemo={() => setIsGuest(true)}
          onLogin={() => setShowAuthModal(true)}
          onOpenLegal={(type) => setShowLegal(type)}
        />
        {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      </>
    );
  }

  if (!user && showAuthModal) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 left-4 text-white z-50 p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <Auth onOpenLegal={(type) => setShowLegal(type)} />
        {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative selection:bg-cyan-500/30">

      {/* ФОН */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-slate-900" />}>
          <PixelBlast
            variant="circle"
            pixelSize={12}
            color="#B19EEF"
            patternScale={6}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples={false}
            liquid={false}
            speed={0.3}
            edgeFade={0.25}
            transparent
          />
        </Suspense>
        <div className="absolute inset-0 bg-slate-900/50 pointer-events-none" />
      </div>

      <div className="relative z-10 h-full flex flex-col">

        {/* Sticky reconnect */}
        {activeGameSession && view !== 'pvp' && view !== 'tournament_lobby' && (
          <StickyReconnect
            duelId={activeGameSession.duelId}
            tournamentId={activeGameSession.tournamentId}
            onReconnect={() => {
              if (activeGameSession.tournamentId) {
                setActiveTournamentId(activeGameSession.tournamentId);
              }
              if (activeGameSession.duelId) {
                setView('pvp');
              } else if (activeGameSession.tournamentId) {
                setView('tournament_lobby');
              }
            }}
            onDiscard={() => {
              setActiveGameSession(null);
            }}
          />
        )}

        {/* Кнопка возврата в турнир */}
        {activeTournamentId && !activeGameSession && view !== 'tournament_lobby' && (
          <div className="fixed top-4 left-0 right-0 z-[190] flex justify-center px-4 pointer-events-none">
            <div className="bg-slate-900/95 border-2 border-cyan-500/50 backdrop-blur-md rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] p-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto animate-in slide-in-from-top-full duration-500">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-cyan-500/40">
                <Crown className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm leading-tight">Турнир идёт!</div>
                <div className="text-slate-400 text-xs">Ты участник активного турнира</div>
              </div>
              <button
                onClick={() => setView('tournament_lobby')}
                className="flex-shrink-0 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg flex items-center gap-1.5"
              >
                Войти
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <Header
          user={user}
          profile={profile}
          onBackToMap={handleBackToMap}
          onShowCompanion={() => setShowCompanion(true)}
          onShowArchive={() => setShowArchive(true)}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onShowDashboard={() => setShowDashboard(true)}
          onExitGuest={() => setIsGuest(false)}
          onShowAuth={() => setShowAuthModal(true)}
        />

        <main className="relative z-0 pb-24 md:pb-20 flex-1">
          <Suspense fallback={<PageLoader />}>
            {view === 'map' && (
              <>
                <LabMap onSectorSelect={handleSectorSelect} />
                <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center gap-3 w-full max-w-lg mx-auto">
                  {user ? (
                    <>
                      <button
                        onClick={() => setShowJoinCode(true)}
                        className="p-3 bg-slate-800/90 backdrop-blur-md border-2 border-slate-600 hover:bg-slate-700 hover:border-slate-500 rounded-2xl shadow-lg active:scale-95 transition-all"
                        title="Код турнира"
                      >
                        <Keyboard className="w-5 h-5 text-slate-400 hover:text-cyan-400 transition-colors" />
                      </button>

                      <button
                        onClick={() => setView('analyzer')}
                        className="flex-1 bg-slate-800/90 backdrop-blur-md border-2 border-amber-500/50 hover:bg-slate-800 hover:border-amber-400 rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        title="Журнал ошибок"
                      >
                        <ClipboardList className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                        <span className="font-bold text-amber-300 text-xs uppercase hidden sm:inline tracking-wider">
                          Ошибки
                        </span>
                      </button>

                      {/* НОВАЯ КНОПКА: ДРУЖЕСКИЙ МАТЧ */}
                      <button
                        onClick={() => setShowFriendlyDuel(true)}
                        className="p-3 bg-slate-800/90 backdrop-blur-md border-2 border-emerald-600/50 hover:border-emerald-500 hover:bg-slate-800 rounded-2xl shadow-lg active:scale-95 transition-all group"
                        title="Дружеский матч"
                      >
                        <Users className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      </button>

                      <button
                        onClick={() => setView('pvp')}
                        className="flex-[2] relative flex items-center justify-center gap-2 bg-slate-900/90 backdrop-blur-md border-2 border-red-600 px-4 py-3 rounded-2xl shadow-lg shadow-red-900/20 active:scale-95 transition-all overflow-hidden group"
                        title="PvP"
                      >
                        <div className="absolute inset-0 bg-red-600/10 group-hover:bg-red-600/20 transition-colors" />
                        <Zap className="w-6 h-6 text-red-500 fill-current animate-pulse" />
                        <span className="font-black text-white text-base tracking-widest italic uppercase relative z-10 drop-shadow-md">
                          PVP
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="bg-slate-900/90 border border-slate-700 px-6 py-3 rounded-full text-slate-400 text-sm flex items-center gap-2 backdrop-blur-md shadow-lg">
                      <Lock className="w-4 h-4" />
                      PvP и Турниры доступны после регистрации
                    </div>
                  )}
                </div>
              </>
            )}

            {view === 'modules' && selectedSector && (
              <ModuleViewer
                sector={selectedSector}
                onBack={handleBackToMap}
                onStartExperiment={handleStartExperiment}
              />
            )}

            {view === 'reactor' && selectedModule && (
              <Reactor
                module={selectedModule}
                onBack={handleBackToMap}
                onRequestAuth={() => setShowAuthModal(true)}
                forcedProblemIds={trainingProblemIds}
              />
            )}

            {user && view === 'pvp' && (
              <PvPMode
                onBack={handleBackToMap}
                initialDuelId={activeGameSession?.duelId}
              />
            )}

            {user && view === 'tournament_lobby' && activeTournamentId && (
              <TournamentLobby tournamentId={activeTournamentId} />
            )}

            {user && view === 'analyzer' && (
              <ErrorAnalyzer
                onBack={handleBackToMap}
                onStartTraining={handleStartErrorTraining}
              />
            )}
          </Suspense>
        </main>
      </div>

      {(profile?.role === 'admin' || profile?.role === 'teacher') && (
        <div className="fixed bottom-28 right-4 z-50 flex flex-col gap-3">
          <button
            onClick={() => setShowTournamentAdmin(true)}
            className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-400 hover:bg-amber-500 hover:text-black transition-all shadow-lg backdrop-blur-sm group"
            title="Турниры"
          >
            <Crown className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          {profile?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowAdmin(true)}
                className="p-3 bg-slate-800/90 border border-cyan-500/30 rounded-full text-cyan-400 shadow-lg backdrop-blur-sm hover:bg-cyan-500 hover:text-black transition-all group"
                title="Генератор задач"
              >
                <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              </button>

              <button
                onClick={() => setShowAdminDashboard(true)}
                className="p-3 bg-red-600/20 border border-red-500/50 rounded-full text-red-400 shadow-lg backdrop-blur-sm hover:bg-red-600 hover:text-white transition-all group"
                title="Админ-центр"
              >
                <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Modals and overlays */}
      {user && (
        <Suspense fallback={null}>
          {showCompanionSetup && <CompanionSetup onComplete={() => setShowCompanionSetup(false)} />}
          {showOnboarding && <Onboarding onComplete={finishOnboarding} />}
          {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

          {showDashboard && (
            <Dashboard
              onClose={() => setShowDashboard(false)}
              onOpenLegal={(type) => setShowLegal(type)}
            />
          )}

          {showAdmin && <AdminGenerator onClose={() => setShowAdmin(false)} />}
          {showArchive && <VideoArchive onClose={() => setShowArchive(false)} />}
          {showTournamentAdmin && <TournamentAdmin onClose={() => setShowTournamentAdmin(false)} />}

          {showJoinCode && (
            <JoinTournamentModal
              onJoin={joinTournament}
              onClose={() => setShowJoinCode(false)}
            />
          )}

          {showCompanion && <CompanionLair onClose={() => setShowCompanion(false)} />}
          {showAdminDashboard && <AdminDashboard onClose={() => setShowAdminDashboard(false)} />}

          {/* НОВАЯ МОДАЛКА ДРУЖЕСКОЙ ДУЭЛИ */}
          {showFriendlyDuel && (
            <FriendlyDuelModal 
              onClose={() => setShowFriendlyDuel(false)} 
              onDuelReady={handleFriendlyDuelReady} 
            />
          )}

          <LevelUpManager />
        </Suspense>
      )}

      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
    </div>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  },[]);

  return (
    <AuthProvider>
      <AnalyticsTracker />
      {(() => {
        if (path === '/terms-and-conditions' || path === '/terms') {
          return <TermsPage />;
        }
        if (path === '/promos') {
          return <PromoPage />;
        }
        if (path === '/pricing') {
          return <PricingPage />;
        }
        if (path === '/reset-password') {
          return <ResetPassword />;
        }
        return <MainApp />;
      })()}
    </AuthProvider>
  );
}

export default App;
