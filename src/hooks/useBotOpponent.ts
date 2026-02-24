import { useState, useEffect, useRef } from 'react';
import { getPvPRankByMMR } from '../lib/PvPRankSystem';

export const BOT_NAMES = [
  'Aizere_2008', 'Санжик', 'КиборгУбийца', 'Alikhan07', 
  'Шапи', 'Ералы', 'Aleke', 'Райан-Гослинг', 'Мерей',
  'Math_Terminator', 'X_Ae_A-12', 'Сын Маминой Подруги',
  'Нурсултан_PRO', 'ЕГЭ_Слаер', 'Алгебра_Кинг'
];

export function getDeterministicBotName(duelId: string | null): string {
  if (!duelId) return '???';
  let hash = 0;
  for (let i = 0; i < duelId.length; i++) {
    hash = duelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BOT_NAMES.length;
  return BOT_NAMES[index];
}

type BotConfig = {
  isEnabled: boolean;
  duelId: string | null;
  playerMMR: number; // Принимаем MMR игрока для подбора сложности
  maxQuestions: number;
  initialScore?: number;
  initialProgress?: number;
  onProgressUpdate: (score: number, progress: number) => void;
};

// === 7 УРОВНЕЙ СЛОЖНОСТИ ===
// Точность (accuracy) — вероятность правильного ответа (0.3 = 30%)
// minTime/maxTime — время "думанья" в миллисекундах
const RANK_BEHAVIOR = {
  bronze:      { minTime: 9000, maxTime: 15000, accuracy: 0.30 }, // Медленно, много ошибок
  silver:      { minTime: 8000, maxTime: 13000, accuracy: 0.45 }, // Чуть быстрее, ошибки 50/50
  gold:        { minTime: 6000, maxTime: 11000, accuracy: 0.60 }, // Средний игрок
  platinum:    { minTime: 5000, maxTime: 9000,  accuracy: 0.75 }, // Уверенный игрок
  diamond:     { minTime: 4000, maxTime: 7000,  accuracy: 0.85 }, // Сильный игрок
  master:      { minTime: 3000, maxTime: 6000,  accuracy: 0.92 }, // Очень сильный
  grandmaster: { minTime: 2000, maxTime: 4000,  accuracy: 0.98 }  // Киберкотлета
};

export function useBotOpponent({ 
  isEnabled, 
  duelId,
  playerMMR, 
  maxQuestions, 
  initialScore = 0,
  initialProgress = 0,
  onProgressUpdate 
}: BotConfig) {
  
  const [botName, setBotName] = useState(() => getDeterministicBotName(duelId));
  const [botScore, setBotScore] = useState(initialScore);
  const [botProgress, setBotProgress] = useState(initialProgress);
  
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  // Определяем настройки бота на основе ранга игрока
  const playerRank = getPvPRankByMMR(playerMMR);
  // Если ранг не найден (странный случай), фоллбэк на Бронзу
  const behavior = RANK_BEHAVIOR[playerRank.tier] || RANK_BEHAVIOR.bronze;

  useEffect(() => {
    if (initialScore > 0 || initialProgress > 0) {
      setBotScore(initialScore);
      setBotProgress(initialProgress);
    }
  }, [initialScore, initialProgress]);

  useEffect(() => {
    setBotName(getDeterministicBotName(duelId));
  }, [duelId]);

  useEffect(() => {
    if (!isEnabled || botProgress >= maxQuestions) return;

    // Небольшой рандом, чтобы бот не отвечал как метроном
    const variance = (Math.random() * 2000) - 1000; // +/- 1 секунда
    
    let nextThinkingTime = Math.floor(
      Math.random() * (behavior.maxTime - behavior.minTime + 1) + behavior.minTime + variance
    );

    // Бот-Грандмастер может ответить мгновенно, но не быстрее 1.5 сек (имитация чтения)
    const minPossible = behavior.minTime < 3000 ? 1500 : 3000;
    nextThinkingTime = Math.max(minPossible, nextThinkingTime);

    const timer = setTimeout(() => {
      // Решаем, правильно ли ответил бот
      const isCorrect = Math.random() < behavior.accuracy;
      
      const newScore = isCorrect ? botScore + 1 : botScore;
      const newProgress = botProgress + 1;

      setBotScore(newScore);
      setBotProgress(newProgress);
      
      onProgressUpdate(newScore, newProgress);

    }, nextThinkingTime);

    timeouts.current.push(timer);

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [isEnabled, botProgress, maxQuestions, botScore, behavior]);

  return { botName, botScore, botProgress };
}