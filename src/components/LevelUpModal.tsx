import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Crown, Star, Sparkles } from 'lucide-react';

type Props = {
  type: 'level' | 'pvp'; // Что празднуем: уровень или рейтинг
  newTitle: string;
  icon?: any; // Иконка ранга (если есть)
  onClose: () => void;
};

export function LevelUpModal({ type, newTitle, icon: Icon, onClose }: Props) {
  
  // ЗАПУСК ФЕЙЕРВЕРКА ПРИ ОТКРЫТИИ
  useEffect(() => {
    const duration = 3 * 1000; // 3 секунды салюта
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Стреляем с двух сторон
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in duration-300">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden">
        
        {/* Фоновые лучи */}
        <div className="absolute inset-0 bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent animate-spin-slow pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-50 rounded-full" />
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl">
               {Icon ? <Icon className="w-12 h-12 text-white" /> : <Crown className="w-12 h-12 text-white" />}
            </div>
            <div className="absolute -top-2 -right-2">
               <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-white italic uppercase tracking-wider mb-2">
            {type === 'level' ? 'ПОВЫШЕНИЕ!' : 'НОВЫЙ РАНГ!'}
          </h2>
          
          <p className="text-slate-400 text-sm mb-6">
            Ваши достижения признаны Лабораторией.
          </p>

          <div className="bg-slate-800/80 border border-amber-500/30 px-6 py-3 rounded-xl mb-8">
            <span className="text-amber-400 font-bold text-xl md:text-2xl drop-shadow-sm">
              {newTitle}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg"
          >
            ПРИНЯТЬ
          </button>
        </div>
      </div>
    </div>
  );
}