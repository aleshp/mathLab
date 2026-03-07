import React, { useState } from 'react';
import { Play, ArrowLeft, Film, MonitorPlay, Crosshair } from 'lucide-react';
import { CinematicTrailer } from './CinematicTrailer';
import { WarTrailer } from './WarTrailer';

export function PromoPage() {
  const [playing, setPlaying] = useState<string | null>(null);

  // Если выбран главный трейлер
  if (playing === 'cinematic') {
    return (
      <CinematicTrailer 
        onClose={() => setPlaying(null)} 
        onAction={() => window.location.href = '/'} 
      />
    );
  }

  // Если выбран тактический трейлер "Math is War"
  if (playing === 'war') {
    return (
      <WarTrailer 
        onClose={() => setPlaying(null)} 
        onAction={() => window.location.href = '/'} 
      />
    );
  }

  // Карточки для меню
  const promos =[
    {
      id: 'cinematic',
      title: 'Официальный Трейлер v1.0',
      description: 'Эпичный кинематографичный тизер платформы. История от скуки до Алмазного ранга.',
      duration: '0:29',
      icon: Film,
      disabled: false,
      style: {
        glow: 'from-cyan-500/40 to-blue-600/40',
        iconBg: 'bg-cyan-500/20 border-cyan-500/40',
        text: 'text-cyan-400'
      }
    },
    {
      id: 'war',
      title: 'Math is War (Action Cut)',
      description: 'Динамичный тактический промо-ролик. Интеллект — это сила. Выживает умнейший.',
      duration: '0:16',
      icon: Crosshair,
      disabled: false,
      style: {
        glow: 'from-red-500/40 to-orange-600/40',
        iconBg: 'bg-red-500/20 border-red-500/40',
        text: 'text-red-400'
      }
    },
    {
      id: 'gameplay',
      title: 'Геймплей (Скоро)',
      description: 'Чистый геймплей PvP арены, турниров и прокачки суриката.',
      duration: 'TBA',
      icon: MonitorPlay,
      disabled: true,
      style: {
        glow: 'from-slate-500/20 to-slate-600/20',
        iconBg: 'bg-slate-800 border-slate-700',
        text: 'text-slate-500'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 relative overflow-y-auto">
      {/* Фоновое свечение */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 pt-10">
        
        {/* Шапка */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Film className="w-3 h-3" /> Media Archive
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 drop-shadow-lg">
              Промо-материалы
            </h1>
            <p className="text-slate-400 text-lg">Выберите ролик для просмотра</p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors font-bold text-sm shadow-lg w-full md:w-auto"
          >
            <ArrowLeft className="w-4 h-4" /> На главную
          </button>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo) => {
            const Icon = promo.icon;
            return (
              <div 
                key={promo.id}
                onClick={() => !promo.disabled && setPlaying(promo.id)}
                className={`relative group rounded-3xl p-1 transition-all duration-500 ${
                  promo.disabled ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-[1.03] hover:-translate-y-2'
                }`}
              >
                {/* Свечение при наведении */}
                {!promo.disabled && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${promo.style.glow} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />
                )}
                
                <div className="relative h-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-[1.4rem] p-6 md:p-8 flex flex-col justify-between overflow-hidden z-10 shadow-2xl">
                  
                  <div className="mb-8 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${promo.style.iconBg}`}>
                      <Icon className={`w-8 h-8 ${promo.style.text}`} />
                    </div>
                    <h3 className="text-2xl font-black mb-3 leading-tight">{promo.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{promo.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-800/80 relative z-10">
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">{promo.duration}</span>
                    {!promo.disabled && (
                      <div className={`flex items-center gap-2 font-bold text-sm transition-transform duration-300 group-hover:translate-x-2 ${promo.style.text}`}>
                        Смотреть <Play className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}