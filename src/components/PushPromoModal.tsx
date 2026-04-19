import { useState, useEffect } from 'react';
import { BellRing, X, Loader, ShieldAlert, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// VAPID ключ для Web Push (заменишь потом на свой реальный, сгенерированный через web-push)
const PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYpPNs_ZBE';

export function PushPromoModal() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const[loading, setLoading] = useState(false);

  useEffect(() => {
    // Проверяем, поддерживает ли браузер уведомления
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    // Показываем только если статус "по умолчанию" (еще не спрашивали)
    // И если мы еще не закрывали эту модалку в этой сессии
    const hasDismissed = localStorage.getItem('push_promo_dismissed');
    
    if (Notification.permission === 'default' && !hasDismissed) {
      // Небольшая задержка, чтобы не бить в лицо сразу при входе
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  },[]);

  const handleDismiss = () => {
    localStorage.setItem('push_promo_dismissed', 'true');
    setIsVisible(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // 1. Запрашиваем системное разрешение
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // 2. Получаем Service Worker (он уже зарегистрирован через vite-plugin-pwa)
        const registration = await navigator.serviceWorker.ready;
        
        // 3. Подписываемся на пуши
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: PUBLIC_VAPID_KEY
        });

        // 4. Сохраняем в Supabase
        if (user) {
          await supabase
            .from('profiles')
            .update({ push_subscription: JSON.parse(JSON.stringify(subscription)) })
            .eq('id', user.id);
        }

        // Тестовое локальное уведомление в знак благодарности
        registration.showNotification('Доступ разрешен! 🚀', {
          body: 'Теперь ты не пропустишь турниры и сможешь вовремя кормить суриката.',
          icon: '/meerkat/avatar.png',
          badge: '/meerkat/avatar.png',
          vibrate: [200, 100, 200]
        });

        setIsVisible(false);
      } else {
        // Юзер заблокировал
        handleDismiss();
      }
    } catch (error) {
      console.error('Ошибка подписки на пуши:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        
        {/* Фоновое свечение */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={handleDismiss} 
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center shadow-xl overflow-hidden">
               <img src="/meerkat/crying.png" alt="Meerkat" className="w-20 h-20 object-contain mt-2" onError={e => e.currentTarget.src = '/meerkat/avatar.png'} />
            </div>
            {/* Иконка колокольчика */}
            <div className="absolute -bottom-2 -right-2 bg-cyan-500 p-2 rounded-full border-4 border-slate-900 animate-bounce">
              <BellRing className="w-5 h-5 text-slate-900" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-3">
            Включи уведомления!
          </h2>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Не дай сурикату проголодаться! Мы будем присылать <span className="text-white font-bold">только самое важное</span>:
          </p>

          <div className="w-full space-y-3 mb-8 text-left bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Напоминания о кормлении питомца</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Вызовы на PvP-дуэли от друзей</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <BellRing className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Старт школьных турниров</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-3">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Включить'}
            </button>
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="w-full py-3 bg-transparent text-slate-500 hover:text-slate-300 font-bold rounded-xl transition-colors"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}