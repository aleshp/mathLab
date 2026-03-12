import React from 'react';

export type PvPTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster';

export interface PvPRank {
  tier: PvPTier;
  division: number; // 1-4 (IV, III, II, I), 0 для Master/Grandmaster
  minMMR: number;
  maxMMR: number;
  name: string;
  fullName: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
  description: string;
}

// === УРОВЕНЬ 3: КАСТОМНЫЕ ГЕЙМЕРСКИЕ SVG БЕЙДЖИ ===
const RankIcon = ({ tier, division, className = "w-[1.2em] h-[1.2em] inline-block drop-shadow-xl align-middle" }: { tier: PvPTier, division: number, className?: string }) => {
  // Цветовые палитры для каждого тира (основа, начало и конец градиента, цвет свечения)
  const colors = {
    bronze:  { base: '#b45309', gradStart: '#f59e0b', gradEnd: '#78350f', glow: '#d97706' },
    silver:  { base: '#94a3b8', gradStart: '#f8fafc', gradEnd: '#475569', glow: '#cbd5e1' },
    gold:    { base: '#eab308', gradStart: '#fef08a', gradEnd: '#854d0e', glow: '#fde047' },
    platinum:{ base: '#06b6d4', gradStart: '#67e8f9', gradEnd: '#164e63', glow: '#22d3ee' },
    diamond: { base: '#3b82f6', gradStart: '#93c5fd', gradEnd: '#1e3a8a', glow: '#60a5fa' },
    master:  { base: '#a855f7', gradStart: '#e9d5ff', gradEnd: '#4c1d95', glow: '#c084fc' },
    grandmaster:{ base: '#ef4444',gradStart: '#fca5a5', gradEnd: '#7f1d1d', glow: '#f87171' },
  };

  const c = colors[tier] || colors.bronze;

  // Логика маркеров дивизиона (от 1 до 4 кристаллов снизу)
  const marksCount = division > 0 && division <= 4 ? 5 - division : 0;

  const renderMarks = () => {
    if (marksCount === 0) return null;
    const marks =[];
    const startX = 50 - ((marksCount - 1) * 14) / 2; // Центрируем кристаллы
    for (let i = 0; i < marksCount; i++) {
      marks.push(
        <polygon
          key={i}
          points={`${startX + i * 14},78 ${startX + i * 14 + 5},85 ${startX + i * 14},92 ${startX + i * 14 - 5},85`}
          fill="#ffffff"
          opacity="0.9"
          filter="url(#markGlow)"
        />
      );
    }
    return marks;
  };

  // Обертка для SVG с фильтрами и градиентами (эффект 3D и свечения)
  const SvgWrapper = ({ children }: { children: React.ReactNode }) => (
    <svg viewBox="0 0 100 100" className={className} style={{ overflow: 'visible' }}>
      <defs>
        {/* Основной металлический градиент */}
        <linearGradient id={`grad-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.gradStart} />
          <stop offset="40%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.gradEnd} />
        </linearGradient>
        {/* Градиент для блика (эффект стекла/огранки) */}
        <linearGradient id={`grad-light-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${tier}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="markGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Фоновое свечение (Аура ранга) */}
      <circle cx="50" cy="50" r="35" fill={c.glow} opacity="0.35" filter={`url(#glow-${tier})`} />
      
      {children}
      {renderMarks()}
    </svg>
  );

  // Отрисовка геометрии в зависимости от тира
  switch (tier) {
    case 'bronze':
      return (
        <SvgWrapper>
          {/* Базовый треугольный щит */}
          <path d="M 50 10 L 85 30 L 50 90 L 15 30 Z" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2" strokeLinejoin="round" />
          {/* Правая половина - блик */}
          <path d="M 50 10 L 85 30 L 50 90 Z" fill={`url(#grad-light-${tier})`} />
          <path d="M 50 25 L 70 35 L 50 75 L 30 35 Z" fill="none" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1.5" />
        </SvgWrapper>
      );
    case 'silver':
      return (
        <SvgWrapper>
          {/* Классический рыцарский щит */}
          <path d="M 50 5 L 85 15 L 85 50 C 85 75 50 95 50 95 C 50 95 15 75 15 50 L 15 15 Z" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 50 5 L 85 15 L 85 50 C 85 75 50 95 50 95 Z" fill={`url(#grad-light-${tier})`} />
          <path d="M 50 15 L 75 25 L 75 50 C 75 65 50 80 50 80 C 50 80 25 65 25 50 L 25 25 Z" fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
        </SvgWrapper>
      );
    case 'gold':
      return (
        <SvgWrapper>
          {/* Продвинутый щит с вырезами сверху */}
          <path d="M 50 5 L 90 15 L 90 40 L 75 55 L 75 75 L 50 95 L 25 75 L 25 55 L 10 40 L 10 15 Z" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 50 5 L 90 15 L 90 40 L 75 55 L 75 75 L 50 95 Z" fill={`url(#grad-light-${tier})`} />
          <polygon points="50 30, 65 40, 50 65, 35 40" fill="#ffffff" opacity="0.25" />
        </SvgWrapper>
      );
    case 'platinum':
      return (
        <SvgWrapper>
          {/* Фантастический шестиугольник (Кибер-ядро) */}
          <polygon points="50 5, 90 25, 90 75, 50 95, 10 75, 10 25" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="50 5, 90 25, 90 75, 50 95" fill={`url(#grad-light-${tier})`} />
          <polygon points="50 20, 75 35, 75 65, 50 80, 25 65, 25 35" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#ffffff" opacity="0.9" filter="url(#markGlow)" />
        </SvgWrapper>
      );
    case 'diamond':
      return (
        <SvgWrapper>
          {/* Острый кристалл-бриллиант */}
          <polygon points="50 0, 95 30, 50 95, 5 30" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2" strokeLinejoin="round" />
          <polygon points="50 0, 95 30, 50 95" fill={`url(#grad-light-${tier})`} />
          <path d="M 50 0 L 50 95" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <path d="M 5 30 L 95 30" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
          <polygon points="50 15, 75 30, 50 70, 25 30" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.5" />
        </SvgWrapper>
      );
    case 'master':
      return (
        <SvgWrapper>
          {/* Мощный щит с короной сверху */}
          <path d="M 50 5 L 90 20 L 80 60 C 80 80 50 95 50 95 C 50 95 20 80 20 60 L 10 20 Z" fill={`url(#grad-${tier})`} stroke={c.gradStart} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 50 5 L 90 20 L 80 60 C 80 80 50 95 50 95 Z" fill={`url(#grad-light-${tier})`} />
          {/* Выступы короны */}
          <path d="M 28 14 L 35 5 L 50 12 L 65 5 L 72 14" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2.5" strokeLinejoin="round" filter="url(#markGlow)" />
          {/* Огромная звезда в центре (заменяет мелкие кристаллы) */}
          <polygon points="50 32, 55 48, 70 48, 58 58, 62 74, 50 64, 38 74, 42 58, 30 48, 45 48" fill="#ffffff" filter="url(#markGlow)" />
        </SvgWrapper>
      );
    case 'grandmaster':
      return (
        <SvgWrapper>
          {/* Эпичный многосоставной герб */}
          {/* Фоновые парящие осколки/крылья */}
          <path d="M 50 10 L 100 25 L 85 70 L 50 100 L 15 70 L 0 25 Z" fill={`url(#grad-${tier})`} opacity="0.5" filter={`url(#glow-${tier})`} />
          {/* Ядро */}
          <path d="M 50 0 L 80 20 L 75 65 L 50 90 L 25 65 L 20 20 Z" fill={`url(#grad-${tier})`} stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
          <path d="M 50 0 L 80 20 L 75 65 L 50 90 Z" fill={`url(#grad-light-${tier})`} />
          {/* Ультимативная руна */}
          <polygon points="50 25, 56 42, 72 42, 59 52, 63 68, 50 58, 37 68, 41 52, 28 42, 44 42" fill="#ffffff" filter="url(#markGlow)" />
          <circle cx="50" cy="49" r="5" fill={c.gradStart} />
        </SvgWrapper>
      );
    default:
      return null;
  }
};


// === ОПРЕДЕЛЕНИЕ ВСЕХ РАНГОВ И ПРИВЯЗКА ИКОНОК ===
export const PVP_RANKS: PvPRank[] =[
  { tier: 'bronze', division: 4, minMMR: 500, maxMMR: 549, name: 'Bronze IV', fullName: 'Бронза IV', color: 'text-orange-700', gradientFrom: '#92400e', gradientTo: '#78350f', icon: <RankIcon tier="bronze" division={4} />, description: 'Начало пути' },
  { tier: 'bronze', division: 3, minMMR: 550, maxMMR: 599, name: 'Bronze III', fullName: 'Бронза III', color: 'text-orange-600', gradientFrom: '#9a3412', gradientTo: '#92400e', icon: <RankIcon tier="bronze" division={3} />, description: 'Учимся основам' },
  { tier: 'bronze', division: 2, minMMR: 600, maxMMR: 649, name: 'Bronze II', fullName: 'Бронза II', color: 'text-orange-500', gradientFrom: '#c2410c', gradientTo: '#9a3412', icon: <RankIcon tier="bronze" division={2} />, description: 'Прогресс виден' },
  { tier: 'bronze', division: 1, minMMR: 650, maxMMR: 699, name: 'Bronze I', fullName: 'Бронза I', color: 'text-orange-400', gradientFrom: '#ea580c', gradientTo: '#c2410c', icon: <RankIcon tier="bronze" division={1} />, description: 'Шаг до серебра' },
  
  { tier: 'silver', division: 4, minMMR: 700, maxMMR: 749, name: 'Silver IV', fullName: 'Серебро IV', color: 'text-slate-400', gradientFrom: '#475569', gradientTo: '#334155', icon: <RankIcon tier="silver" division={4} />, description: 'Серебряная лига' },
  { tier: 'silver', division: 3, minMMR: 750, maxMMR: 799, name: 'Silver III', fullName: 'Серебро III', color: 'text-slate-300', gradientFrom: '#64748b', gradientTo: '#475569', icon: <RankIcon tier="silver" division={3} />, description: 'Растущий навык' },
  { tier: 'silver', division: 2, minMMR: 800, maxMMR: 849, name: 'Silver II', fullName: 'Серебро II', color: 'text-slate-200', gradientFrom: '#94a3b8', gradientTo: '#64748b', icon: <RankIcon tier="silver" division={2} />, description: 'Уверенная игра' },
  { tier: 'silver', division: 1, minMMR: 850, maxMMR: 899, name: 'Silver I', fullName: 'Серебро I', color: 'text-slate-100', gradientFrom: '#cbd5e1', gradientTo: '#94a3b8', icon: <RankIcon tier="silver" division={1} />, description: 'Путь к золоту' },
  
  { tier: 'gold', division: 4, minMMR: 900, maxMMR: 949, name: 'Gold IV', fullName: 'Золото IV', color: 'text-yellow-600', gradientFrom: '#ca8a04', gradientTo: '#a16207', icon: <RankIcon tier="gold" division={4} />, description: 'Золотая лига' },
  { tier: 'gold', division: 3, minMMR: 950, maxMMR: 999, name: 'Gold III', fullName: 'Золото III', color: 'text-yellow-500', gradientFrom: '#eab308', gradientTo: '#ca8a04', icon: <RankIcon tier="gold" division={3} />, description: 'Сильный игрок' },
  { tier: 'gold', division: 2, minMMR: 1000, maxMMR: 1049, name: 'Gold II', fullName: 'Золото II', color: 'text-yellow-400', gradientFrom: '#facc15', gradientTo: '#eab308', icon: <RankIcon tier="gold" division={2} />, description: 'Опытный боец' },
  { tier: 'gold', division: 1, minMMR: 1050, maxMMR: 1099, name: 'Gold I', fullName: 'Золото I', color: 'text-yellow-300', gradientFrom: '#fde047', gradientTo: '#facc15', icon: <RankIcon tier="gold" division={1} />, description: 'Элита золота' },
  
  { tier: 'platinum', division: 4, minMMR: 1100, maxMMR: 1149, name: 'Platinum IV', fullName: 'Платина IV', color: 'text-cyan-500', gradientFrom: '#06b6d4', gradientTo: '#0891b2', icon: <RankIcon tier="platinum" division={4} />, description: 'Платиновая лига' },
  { tier: 'platinum', division: 3, minMMR: 1150, maxMMR: 1199, name: 'Platinum III', fullName: 'Платина III', color: 'text-cyan-400', gradientFrom: '#22d3ee', gradientTo: '#06b6d4', icon: <RankIcon tier="platinum" division={3} />, description: 'Высокий уровень' },
  { tier: 'platinum', division: 2, minMMR: 1200, maxMMR: 1249, name: 'Platinum II', fullName: 'Платина II', color: 'text-cyan-300', gradientFrom: '#67e8f9', gradientTo: '#22d3ee', icon: <RankIcon tier="platinum" division={2} />, description: 'Топовый игрок' },
  { tier: 'platinum', division: 1, minMMR: 1250, maxMMR: 1299, name: 'Platinum I', fullName: 'Платина I', color: 'text-cyan-200', gradientFrom: '#a5f3fc', gradientTo: '#67e8f9', icon: <RankIcon tier="platinum" division={1} />, description: 'Шаг до алмаза' },
  
  { tier: 'diamond', division: 4, minMMR: 1300, maxMMR: 1349, name: 'Diamond IV', fullName: 'Алмаз IV', color: 'text-blue-400', gradientFrom: '#60a5fa', gradientTo: '#3b82f6', icon: <RankIcon tier="diamond" division={4} />, description: 'Алмазная лига' },
  { tier: 'diamond', division: 3, minMMR: 1350, maxMMR: 1399, name: 'Diamond III', fullName: 'Алмаз III', color: 'text-blue-300', gradientFrom: '#93c5fd', gradientTo: '#60a5fa', icon: <RankIcon tier="diamond" division={3} />, description: 'Редкий навык' },
  { tier: 'diamond', division: 2, minMMR: 1400, maxMMR: 1449, name: 'Diamond II', fullName: 'Алмаз II', color: 'text-blue-200', gradientFrom: '#bfdbfe', gradientTo: '#93c5fd', icon: <RankIcon tier="diamond" division={2} />, description: 'Элита элит' },
  { tier: 'diamond', division: 1, minMMR: 1450, maxMMR: 1499, name: 'Diamond I', fullName: 'Алмаз I', color: 'text-blue-100', gradientFrom: '#dbeafe', gradientTo: '#bfdbfe', icon: <RankIcon tier="diamond" division={1} />, description: 'Грань мастерства' },
  
  { tier: 'master', division: 0, minMMR: 1500, maxMMR: 1699, name: 'Master', fullName: 'Мастер', color: 'text-purple-400', gradientFrom: '#c084fc', gradientTo: '#a855f7', icon: <RankIcon tier="master" division={0} />, description: 'Мастер арены' },
  { tier: 'grandmaster', division: 0, minMMR: 1700, maxMMR: 9999, name: 'Grandmaster', fullName: 'Грандмастер', color: 'text-red-400', gradientFrom: '#f87171', gradientTo: '#ef4444', icon: <RankIcon tier="grandmaster" division={0} />, description: 'Легенда MathLab' },
];

const SORTED_RANKS = [...PVP_RANKS].sort((a, b) => a.minMMR - b.minMMR);

// === ПОЛУЧИТЬ РАНГ ПО MMR ===
export function getPvPRankByMMR(mmr: number): PvPRank {
  for (let i = SORTED_RANKS.length - 1; i >= 0; i--) {
    const r = SORTED_RANKS[i];
    if (mmr >= r.minMMR) return r;
  }
  return SORTED_RANKS[0];
}

// === ПРОГРЕСС ВНУТРИ ДИВИЗИОНА (0-100%) ===
export function getRankProgress(mmr: number): number {
  const rank = getPvPRankByMMR(mmr);
  const range = Math.max(1, rank.maxMMR - rank.minMMR);
  const progress = mmr - rank.minMMR;
  return Math.min(Math.max((progress / range) * 100, 0), 100);
}

// === ПРОВЕРКА ПОВЫШЕНИЯ РАНГА ===
export function checkRankUp(oldMMR: number, newMMR: number): PvPRank | null {
  const oldRank = getPvPRankByMMR(oldMMR);
  const newRank = getPvPRankByMMR(newMMR);
  if (oldRank.name !== newRank.name) return newRank;
  return null;
}

// === КОРОТКОЕ НАЗВАНИЕ (Для UI) ===
export function getShortRankName(mmr: number): string {
  const rank = getPvPRankByMMR(mmr);
  if (rank.division === 0) return rank.name;
  return `${rank.tier.charAt(0).toUpperCase()}${rank.division}`;
}

// === РИМСКИЕ ЦИФРЫ ===
export function getDivisionRoman(division: number): string {
  const romans =['', 'I', 'II', 'III', 'IV'];
  return romans[division] || '';
}

// === MMR ЗА ПОБЕДУ/ПОРАЖЕНИЕ (С УЧЕТОМ РАЗНИЦЫ) ===
export function calculateMMRChange(
  myMMR: number,
  oppMMR: number,
  won: boolean,
  options: { K?: number; MIN_ABS?: number; MAX_ABS?: number } = {}
): number {
  const { K = 32, MIN_ABS = 10, MAX_ABS = 50 } = options;
  const expectedScore = 1 / (1 + Math.pow(10, (oppMMR - myMMR) / 400));
  const actualScore = won ? 1 : 0;
  let change = Math.round(K * (actualScore - expectedScore));

  change = Math.max(-MAX_ABS, Math.min(MAX_ABS, change));

  if (change !== 0 && Math.abs(change) < MIN_ABS) {
    change = change > 0 ? MIN_ABS : -MIN_ABS;
  }

  return change;
}

// === СТАТИСТИКА ДЛЯ РАНГА ===
export function getRankStats(mmr: number): {
  rank: PvPRank;
  progress: number;
  nextRank: PvPRank | null;
  mmrToNext: number;
  shortName: string;
} {
  const rank = getPvPRankByMMR(mmr);
  const progress = getRankProgress(mmr);

  const currentIndex = SORTED_RANKS.findIndex(r => r.name === rank.name);
  const nextRank = currentIndex < SORTED_RANKS.length - 1 ? SORTED_RANKS[currentIndex + 1] : null;
  const mmrToNext = nextRank ? Math.max(0, nextRank.minMMR - mmr) : 0;

  return {
    rank,
    progress,
    nextRank,
    mmrToNext,
    shortName: getShortRankName(mmr)
  };
}