// src/components/CompanionLair.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Utensils, Zap, Crown, Coins, Loader, ChevronLeft } from 'lucide-react';

type Props = {
  onClose: () => void;
};

export function CompanionLair({ onClose }: Props) {
  const { profile, refreshProfile } = useAuth();
  const[animationState, setAnimationState] = useState<'idle' | 'eating' | 'happy' | 'crying'>('idle');
  const [hunger, setHunger] = useState(profile?.companion_hunger || 100);
  
  // Управление меню еды
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [feedingLoading, setFeedingLoading] = useState(false);

  // === 1. ФОНОВАЯ СИНХРОНИЗАЦИЯ ГОЛОДА ===
  useEffect(() => {
    async function syncHunger() {
      if (!profile) return;
      const lastUpdate = profile.last_fed_at ? new Date(profile.last_fed_at).getTime() : Date.now();
      const now = Date.now();
      const hoursPassed = (now - lastUpdate) / (1000 * 60 * 60);
      const hungerLoss = Math.floor(hoursPassed * 5);

      if (hungerLoss > 0) {
        const newHunger = Math.max(0, (profile.companion_hunger || 100) - hungerLoss);
        setHunger(newHunger);
        // Фоновое обновление БД (UI не блокируем)
        await supabase.from('profiles').update({ 
          companion_hunger: newHunger,
          last_fed_at: new Date().toISOString()
        }).eq('id', profile.id);
        refreshProfile();
      }
    }
    syncHunger();
    const interval = setInterval(syncHunger, 60000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  // === 1.1 РЕАКТИВНОЕ ОБНОВЛЕНИЕ ШКАЛЫ ===
  // Слушаем глобальный профиль. Если он обновился (например, после покупки еды), синхронизируем локальный стейт.
  useEffect(() => {
    if (profile?.companion_hunger !== undefined) {
      setHunger(profile.companion_hunger);
    }
  }, [profile?.companion_hunger]);

  // === 2. АВТО-ОПРЕДЕЛЕНИЕ ЭМОЦИИ ===
  useEffect(() => {
    if (animationState === 'eating' || animationState === 'happy') return;
    if (hunger < 30) {
      setAnimationState('crying');
    } else {
      setAnimationState('idle');
    }
  }, [hunger, animationState]);

  // === ФУНКЦИИ КОРМЛЕНИЯ (RPC) ===
  const isFreeAvailable = () => {
    if (!profile?.last_free_feed_at) return true;
    const lastFed = new Date(profile.last_free_feed_at);
    const today = new Date();
    return lastFed.toDateString() !== today.toDateString();
  };

  const handleFeed = async (type: 'free' | 'meat' | 'steak') => {
    if (hunger >= 100) {
      setAnimationState('happy');
      setTimeout(() => setAnimationState('idle'), 1500);
      return;
    }
    
    setFeedingLoading(true);
    try {
      const { data, error } = await supabase.rpc('feed_pet', { food_type: type });
      
      if (error) throw error;

      if (data === true) {
        // === ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ UI ===
        // Мгновенно обновляем локальную сытость, не дожидаясь загрузки с сервера
        const restoreAmount = type === 'steak' ? 100 : 50;
        setHunger(prev => Math.min(100, prev + restoreAmount));

        setAnimationState('eating');
        setTimeout(() => setAnimationState('happy'), 500);
        setTimeout(() => setAnimationState('idle'), 1500);
        
        await refreshProfile(); // Фоново подтягиваем новые монеты и сытость
      } else {
        alert('Не удалось покормить (недостаточно монет или паек уже использован).');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при кормлении.');
    } finally {
      setFeedingLoading(false);
      setShowFoodMenu(false);
    }
  };

  const handlePet = () => {
    setAnimationState('happy');
    setTimeout(() => setAnimationState('idle'), 1000);
  };

  const getSprite = () => {
    switch (animationState) {
      case 'eating': return '/meerkat/eating.png';
      case 'happy': return '/meerkat/happy.png';
      case 'crying': return '/meerkat/crying.png';
      default: return '/meerkat/idle.png';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
      
      {/* КАРТОЧКА */}
      <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-50 p-2 bg-black/40 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors border border-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        {/* БАЛАНС (внутри логова) */}
        <div className="absolute top-6 right-16 z-50 flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-amber-500/30 px-3 py-1.5 rounded-full">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 font-black font-mono text-xs">{profile?.coins || 0}</span>
        </div>

        {/* === СЦЕНА (ВЕРХНЯЯ ЧАСТЬ) === */}
        <div className="relative h-[45vh] md:h-80 w-full flex flex-col items-center justify-center shrink-0">
          
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-amber-500/30 px-3 py-1.5 rounded-full">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-100 font-bold text-xs">LVL {profile?.companion_level}</span>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/20 blur-2xl rounded-full" />

          {/* ПЕРСОНАЖ */}
          <div 
             className={`relative z-10 w-64 h-64 flex items-center justify-center cursor-pointer transition-transform ${animationState === 'crying' ? 'animate-bounce' : 'hover:scale-105'}`}
             onClick={handlePet}
          >
             <img src={getSprite()} alt="Pet" className="absolute inset-0 w-full h-full object-contain z-10 drop-shadow-2xl" />
          </div>

          {hunger < 30 && (
            <div className="absolute top-20 right-10 z-30 animate-bounce">
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg relative">
                Хочу есть! 🍖
                <div className="absolute bottom-[-4px] left-0 w-3 h-3 bg-red-500 transform rotate-45" />
              </div>
            </div>
          )}
        </div>

        {/* === ПАНЕЛЬ УПРАВЛЕНИЯ (НИЖНЯЯ ЧАСТЬ) === */}
        <div className="flex-1 bg-slate-950/80 backdrop-blur-md rounded-t-[2.5rem] p-6 border-t border-white/5 flex flex-col min-h-0">
          
          <div className="text-center mb-6 shrink-0">
            <h2 className="text-2xl font-black text-white">{profile?.companion_name}</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-mono">Ваш верный спутник</p>
          </div>

          {/* СТАТИСТИКА (HUD) */}
          <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                  <Utensils className="w-3 h-3 text-orange-400" /> Сытость
                </div>
                <span className={hunger < 30 ? 'text-red-400 font-bold' : 'text-emerald-400 font-mono'}>{hunger}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${hunger < 30 ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-yellow-500'}`} 
                  style={{ width: `${hunger}%` }} 
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                  <Zap className="w-3 h-3 text-cyan-400" /> SXP
                </div>
                <span className="text-cyan-400 font-mono">
                  {profile?.companion_xp}/{(profile?.companion_level || 1) * 100}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out" 
                  style={{ width: `${Math.min(((profile?.companion_xp || 0) / ((profile?.companion_level || 1) * 100)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* === ДИНАМИЧЕСКАЯ ОБЛАСТЬ (Кнопка ИЛИ Магазин еды) === */}
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {!showFoodMenu ? (
              <button 
                onClick={() => setShowFoodMenu(true)}
                className="w-full py-5 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-110 text-white font-black uppercase tracking-widest text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
              >
                <Utensils className="w-6 h-6" /> Покормить
              </button>
            ) : (
              <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-200">
                <button 
                  onClick={() => setShowFoodMenu(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold uppercase flex items-center gap-1 mb-2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>

                {/* 1. Бесплатный паек */}
                <button 
                  onClick={() => handleFeed('free')}
                  disabled={!isFreeAvailable() || feedingLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                >
                  <div>
                    <div className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors">🥣 Сухой корм (+50%)</div>
                    <div className="text-xs text-slate-400">Доступно 1 раз в день</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-sm">
                    FREE
                  </div>
                </button>

                {/* 2. Свежее мясо */}
                <button 
                  onClick={() => handleFeed('meat')}
                  disabled={(profile?.coins || 0) < 40 || feedingLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                >
                  <div>
                    <div className="text-white font-bold mb-1 group-hover:text-amber-400 transition-colors">🥩 Свежее мясо (+50%)</div>
                    <div className="text-xs text-slate-400">Сытный обед хищника</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-black text-sm flex items-center gap-1.5">
                    40 <Coins className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* 3. Элитный стейк */}
                <button 
                  onClick={() => handleFeed('steak')}
                  disabled={(profile?.coins || 0) < 70 || feedingLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                >
                  <div>
                    <div className="text-white font-bold mb-1 group-hover:text-red-400 transition-colors">🍱 Элитный стейк (100%)</div>
                    <div className="text-xs text-slate-400">Полное насыщение</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-black text-sm flex items-center gap-1.5">
                    70 <Coins className="w-3.5 h-3.5" />
                  </div>
                </button>

                {feedingLoading && (
                  <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                    <Loader className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}