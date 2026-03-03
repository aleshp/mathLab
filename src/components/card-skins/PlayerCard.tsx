import { Trophy, Target, Swords } from 'lucide-react';

export type CardSkin = 'default' | 'electric' | 'fire' | 'gold' | 'ice' | 'shadow' | 'neon' | 'plasma' | string;

type PlayerCardProps = {
  isOpponent: boolean;
  name: string;
  mmr: number;
  rank: any;
  winRate: number;
  matchesPlayed?: number;
  skin?: CardSkin;
  stage?: 'enter' | 'idle' | 'exit';
};

// ─── Stat box ─────────────────────────────────────────────
function StatBox({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-black/30 rounded-lg px-2 py-2 border border-white/5 flex flex-col items-center gap-0.5">
      <div className={`flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest ${color}`}>
        {icon}<span>{label}</span>
      </div>
      <span className="text-white font-black text-base font-mono leading-tight">{value}</span>
      <span className="text-slate-600 text-[7px] uppercase tracking-widest">{sub}</span>
    </div>
  );
}

// ─── Skin wrappers ────────────────────────────────────────

function SkinDefault({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = isOpponent ? '#ef4444' : '#22d3ee';
  const bg = isOpponent ? '#1a0505' : '#001a1f';
  return (
    <div className="relative w-[280px] min-h-[380px] rounded-2xl overflow-hidden flex flex-col"
      style={{ border: `2px solid ${c}`, boxShadow: `0 0 30px ${c}33`, background: '#0a0f1a' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${bg} 0%, transparent 60%)` }} />
      {children}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${c}80, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

function SkinElectric({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = isOpponent ? '#ef4444' : '#22d3ee';
  // Срезанные верхние углы — электрощит
  const clip = 'polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% 100%, 0% 100%, 0% 18px)';
  return (
    <div className="relative w-[280px] min-h-[380px] flex flex-col"
      style={{ clipPath: clip, background: '#050d14', boxShadow: `0 0 40px ${c}55, 0 0 80px ${c}15` }}>
      {/* Рамка */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${c}` }} />
      {/* Горизонтальные scan-линии */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `repeating-linear-gradient(0deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 8px)` }} />
      {/* Молнии в срезанных углах */}
      <svg className="absolute top-0 left-0 pointer-events-none" width="36" height="36" style={{ zIndex: 5 }}>
        <polyline points="0,18 10,0 18,0" fill="none" stroke={c} strokeWidth="2" />
      </svg>
      <svg className="absolute top-0 right-0 pointer-events-none" width="36" height="36" style={{ zIndex: 5 }}>
        <polyline points="36,18 26,0 18,0" fill="none" stroke={c} strokeWidth="2" />
      </svg>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${c}12 0%, transparent 55%)` }} />
      {children}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${c}90, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

function SkinFire({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const top = isOpponent ? '#dc2626' : '#f97316';
  const bot = isOpponent ? '#7f1d1d' : '#431407';
  // Языки пламени снизу
  const clip = 'polygon(0% 0%, 100% 0%, 100% 86%, 92% 100%, 82% 86%, 72% 100%, 62% 86%, 52% 100%, 42% 86%, 32% 100%, 22% 86%, 12% 100%, 0% 86%)';
  return (
    <div className="relative w-[280px] min-h-[380px] flex flex-col"
      style={{ clipPath: clip, background: '#0d0500', boxShadow: `0 0 50px ${top}55, 0 0 100px ${bot}30` }}>
      {/* Искры-точки */}
      {[{t:'15%',l:'8%'},{t:'28%',l:'87%'},{t:'55%',l:'6%'},{t:'42%',l:'91%'},{t:'70%',l:'82%'}].map((e, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ top: e.t, left: e.l, width: 3, height: 3, background: top, boxShadow: `0 0 8px ${top}`, opacity: 0.7 }} />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${top}` }} />
      <div style={{ height: 3, background: `linear-gradient(90deg, ${bot}, ${top}, #fbbf24, ${top}, ${bot})`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 100%, ${bot}60 0%, transparent 55%)` }} />
      {children}
    </div>
  );
}

function SkinGold({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = '#facc15';
  const dim = '#92400e';
  return (
    <div className="relative w-[280px] min-h-[380px] rounded-sm flex flex-col overflow-hidden"
      style={{ border: `2px solid ${c}`, boxShadow: `0 0 60px ${c}55, 0 0 120px ${c}20`, background: '#0a0700' }}>
      {/* Угловые квадратные засечки */}
      {['top-[6px] left-[6px]', 'top-[6px] right-[6px]', 'bottom-[6px] left-[6px]', 'bottom-[6px] right-[6px]'].map((p, i) => (
        <div key={i} className={`absolute ${p} w-4 h-4 pointer-events-none`}
          style={{ border: `2px solid ${c}`, borderRadius: 0 }} />
      ))}
      {/* Боковые ромбы */}
      {[-1, 1].map((side, i) => (
        <div key={i} className="absolute top-1/2 pointer-events-none"
          style={{ [side < 0 ? 'left' : 'right']: -5, transform: 'translateY(-50%) rotate(45deg)', width: 8, height: 8, background: c, boxShadow: `0 0 10px ${c}` }} />
      ))}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${dim}, ${c}, #fffbeb, ${c}, ${dim})`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${dim}50 0%, transparent 55%)` }} />
      {children}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c}80, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

function SkinIce({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = '#7dd3fc';
  const bright = '#e0f2fe';
  // Срезаны все 4 угла — кристалл
  const clip = 'polygon(22px 0%, calc(100% - 22px) 0%, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0% calc(100% - 22px), 0% 22px)';
  return (
    <div className="relative w-[280px] min-h-[380px] flex flex-col"
      style={{ clipPath: clip, background: '#020d14', boxShadow: `0 0 40px ${c}45, 0 0 80px ${c}15` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${c}80` }} />
      {/* Кристальные трещины SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]" style={{ zIndex: 1 }}>
        <line x1="28" y1="55" x2="75" y2="115" stroke={c} strokeWidth="1" />
        <line x1="75" y1="115" x2="55" y2="175" stroke={c} strokeWidth="0.6" />
        <line x1="235" y1="75" x2="200" y2="145" stroke={c} strokeWidth="1" />
        <line x1="200" y1="145" x2="225" y2="200" stroke={c} strokeWidth="0.6" />
        <line x1="140" y1="18" x2="118" y2="85" stroke={c} strokeWidth="0.8" />
        <line x1="118" y1="85" x2="145" y2="130" stroke={c} strokeWidth="0.5" />
      </svg>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c}, ${bright}, ${c}, transparent)`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${c}15 0%, transparent 50%)` }} />
      {children}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${c}70, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

function SkinShadow({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = '#8b5cf6';
  const dark = '#2e1065';
  // Острый V-вырез снизу
  const clip = 'polygon(0% 0%, 100% 0%, 100% calc(100% - 22px), 50% 100%, 0% calc(100% - 22px))';
  return (
    <div className="relative w-[280px] min-h-[380px] flex flex-col"
      style={{ clipPath: clip, background: '#06000f', boxShadow: `0 0 45px ${c}50, 0 0 90px ${dark}40` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${c}70` }} />
      {/* Мистические орбы */}
      {[{ t: '18%', l: '14%' }, { t: '62%', l: '79%' }, { t: '38%', l: '48%' }].map((o, i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{ top: o.t, left: o.l, width: 4, height: 4, background: c, boxShadow: `0 0 14px 5px ${c}55`, opacity: 0.45 }} />
      ))}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${dark}90 0%, transparent 65%)` }} />
      {children}
    </div>
  );
}

function SkinNeon({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c = '#4ade80';
  const dim = '#052e16';
  return (
    <div className="relative w-[280px] min-h-[380px] flex flex-col overflow-hidden"
      style={{ background: '#020b05', border: `1px solid ${c}60`, boxShadow: `0 0 40px ${c}50, 0 0 80px ${c}15` }}>
      {/* Двойная внутренняя рамка */}
      <div className="absolute inset-[4px] pointer-events-none" style={{ border: `1px solid ${c}30` }} />
      {/* Grid-фон */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      {/* Угловые точки */}
      {['top-[3px] left-[3px]', 'top-[3px] right-[3px]', 'bottom-[3px] left-[3px]', 'bottom-[3px] right-[3px]'].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-[5px] h-[5px] rounded-full pointer-events-none`}
          style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
      ))}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${dim}, ${c}, #86efac, ${c}, ${dim})`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${c}10 0%, transparent 55%)` }} />
      {children}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${c}80, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

function SkinPlasma({ isOpponent, children }: { isOpponent: boolean; children: React.ReactNode }) {
  const c1 = '#e879f9';
  const c2 = '#818cf8';
  const c3 = '#a855f7';
  // Волнистые боковые края
  const clip = 'polygon(0% 0%, 100% 0%, 100% 12%, 96% 22%, 100% 34%, 96% 48%, 100% 62%, 96% 74%, 100% 86%, 100% 100%, 0% 100%, 4% 86%, 0% 74%, 4% 60%, 0% 46%, 4% 32%, 0% 20%)';
  return (
    <div className="relative w-[290px] min-h-[380px] flex flex-col"
      style={{ clipPath: clip, background: '#0a0014', boxShadow: `0 0 50px ${c1}50, 0 0 100px ${c2}20` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: clip, border: `2px solid ${c3}80` }} />
      {/* Плазменные кривые */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="50%" stopColor={c2} />
            <stop offset="100%" stopColor={c1} />
          </linearGradient>
        </defs>
        <path d="M15,50 Q90,90 145,45 T275,65" fill="none" stroke="url(#plasmaGrad)" strokeWidth="1.2" />
        <path d="M15,130 Q80,165 140,125 T275,145" fill="none" stroke="url(#plasmaGrad)" strokeWidth="1" />
        <path d="M20,210 Q95,245 155,205 T275,225" fill="none" stroke="url(#plasmaGrad)" strokeWidth="0.8" />
      </svg>
      <div style={{ height: 4, background: `linear-gradient(90deg, #4a044e, ${c3}, ${c1}, ${c2}, ${c1}, ${c3}, #4a044e)`, flexShrink: 0 }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 25% 20%, ${c1}15 0%, transparent 40%), radial-gradient(ellipse at 75% 70%, ${c2}15 0%, transparent 40%)` }} />
      {children}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${c1}70, ${c2}60, transparent)`, flexShrink: 0 }} />
    </div>
  );
}

// ─── Маппинг скинов ───────────────────────────────────────
const SKIN_WRAPPERS: Record<string, React.FC<{ isOpponent: boolean; children: React.ReactNode }>> = {
  default: SkinDefault, electric: SkinElectric, fire: SkinFire,
  gold: SkinGold, ice: SkinIce, shadow: SkinShadow,
  neon: SkinNeon, plasma: SkinPlasma,
};

const SKIN_COLORS: Record<string, { badge: string; label: string; labelText: string; stat: string; barColor: string }> = {
  default:  { badge: '', label: '',              labelText: '',           stat: '',             barColor: '' },
  electric: { badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',      label: 'text-cyan-400',    labelText: '⚡ ELECTRIC', stat: 'text-cyan-400',    barColor: '#22d3ee' },
  fire:     { badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',label: 'text-orange-400',  labelText: '🔥 FIRE',    stat: 'text-orange-400',  barColor: '#f97316' },
  gold:     { badge: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',label: 'text-yellow-400',  labelText: '👑 GOLD',    stat: 'text-yellow-400',  barColor: '#facc15' },
  ice:      { badge: 'bg-sky-400/15 text-sky-200 border border-sky-400/30',         label: 'text-sky-300',     labelText: '❄️ ICE',     stat: 'text-sky-300',     barColor: '#7dd3fc' },
  shadow:   { badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',label: 'text-violet-400',  labelText: '🌑 SHADOW',  stat: 'text-violet-400',  barColor: '#8b5cf6' },
  neon:     { badge: 'bg-green-500/15 text-green-300 border border-green-500/30',   label: 'text-green-400',   labelText: '💚 NEON',    stat: 'text-green-400',   barColor: '#4ade80' },
  plasma:   { badge: 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30', label: 'text-fuchsia-400', labelText: '🔮 PLASMA', stat: 'text-fuchsia-400', barColor: '#e879f9' },
};

// ─── Main component ───────────────────────────────────────
export function PlayerCard({
  isOpponent, name, mmr, rank, winRate,
  matchesPlayed = 0, skin = 'default', stage = 'idle',
}: PlayerCardProps) {

  const Wrapper   = SKIN_WRAPPERS[skin] ?? SkinDefault;
  const colors    = SKIN_COLORS[skin]   ?? SKIN_COLORS.default;
  const isPremium = skin !== 'default';

  const sideStatColor  = isOpponent ? 'text-red-400'  : 'text-cyan-400';
  const sideBadge      = isOpponent
    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
  const sideBarColor   = isOpponent ? '#ef4444' : '#22d3ee';

  const statColor  = isPremium ? colors.stat     : sideStatColor;
  const badgeClass = isPremium ? colors.badge    : sideBadge;
  const barColor   = isPremium ? colors.barColor : sideBarColor;

  let motionClass = 'translate-x-0 opacity-100';
  if (stage === 'enter' || stage === 'exit') {
    motionClass = isOpponent ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0';
  }

  return (
    <div className={`transition-[transform,opacity] duration-500 ease-out will-change-transform ${motionClass} select-none`}>
      <Wrapper isOpponent={isOpponent}>
        <div className="relative z-10 flex flex-col items-center px-5 pt-5 pb-6 gap-4">

          {/* Бейдж + скин-лейбл */}
          <div className="flex items-center justify-between w-full">
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${badgeClass}`}>
              {isOpponent ? 'OPPONENT' : 'YOU'}
            </span>
            {isPremium && (
              <span className={`text-[9px] font-black uppercase tracking-wider ${colors.label} opacity-80`}>
                {colors.labelText}
              </span>
            )}
          </div>

          {/* Аватар */}
          <div className="relative mt-1">
            <div className="w-[88px] h-[88px] rounded-full bg-slate-900 flex items-center justify-center overflow-hidden"
              style={{ border: `2px solid ${barColor}60`, boxShadow: `0 0 18px ${barColor}30` }}>
              <img src="/meerkat/avatar.png"
                className={`w-[82%] h-[82%] object-contain ${isOpponent ? 'grayscale' : ''}`}
                loading="eager" />
            </div>
            <div className="absolute -bottom-1 -right-1 text-2xl leading-none drop-shadow-lg">{rank.icon}</div>
          </div>

          {/* Имя и ранг */}
          <div className="text-center w-full">
            <h2 className="text-[17px] font-black text-white tracking-wide truncate leading-snug">{name}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5 ${rank.color}`}>{rank.fullName}</p>
          </div>

          {/* Разделитель */}
          <div className="w-full h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${barColor}40, transparent)` }} />

          {/* Статы */}
          <div className="w-full grid grid-cols-3 gap-1.5">
            <StatBox icon={<Trophy className="w-2.5 h-2.5 mr-0.5" />} label="Rating"  value={String(mmr)}           sub="MP"     color={statColor} />
            <StatBox icon={<Target  className="w-2.5 h-2.5 mr-0.5" />} label="Winrate" value={`${winRate}%`}          sub="WIN"    color={statColor} />
            <StatBox icon={<Swords  className="w-2.5 h-2.5 mr-0.5" />} label="Matches" value={String(matchesPlayed)} sub="PLAYED" color={statColor} />
          </div>

          {/* Winrate бар */}
          <div className="w-full h-[3px] bg-black/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${winRate}%`, background: barColor, transition: 'width 0.8s ease-out' }} />
          </div>

        </div>
      </Wrapper>
    </div>
  );
}