import { useState, useEffect, useRef } from 'react';

const BOT_NAMES = [
  'Aizere_2008', 'Санжик', 'КиборгУбийца', 'Alikhan07', 
  'Шапи', 'Ералы', 'Aleke', 'Райан-Гослинг', 'Мерей'
];

type BotConfig = {
  isEnabled: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxQuestions: number;
  initialScore?: number;    // <--- НОВОЕ
  initialProgress?: number; // <--- НОВОЕ
  onProgressUpdate: (score: number, progress: number) => void;
};

export function useBotOpponent({ 
  isEnabled, 
  difficulty = 'medium', 
  maxQuestions, 
  initialScore = 0,     // <--- Дефолт 0
  initialProgress = 0,  // <--- Дефолт 0
  onProgressUpdate 
}: BotConfig) {
  
  const [botName, setBotName] = useState('???');
  const [botScore, setBotScore] = useState(initialScore);
  const [botProgress, setBotProgress] = useState(initialProgress);
  
  // Храним таймеры
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  // 1. Синхронизация с базой данных при загрузке страницы
  // Если из базы пришли данные (например, 3 очка), обновляем состояние хука
  useEffect(() => {
    if (initialScore > 0 || initialProgress > 0) {
      setBotScore(initialScore);
      setBotProgress(initialProgress);
    }
  }, [initialScore, initialProgress]);

  // 2. При старте выбираем случайное имя
  useEffect(() => {
    if (isEnabled && botName === '???') {
      setBotName(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
    }
  }, [isEnabled]);

  // 3. Логика решения задач
  useEffect(() => {
    // Если бот выключен или уже закончил все вопросы — стоп
    if (!isEnabled || botProgress >= maxQuestions) return;

    // Настройки скорости (в миллисекундах)
    let minTime = 4000;
    let maxTime = 9000;
    let accuracy = 0.8; 

    if (difficulty === 'hard') { minTime = 3000; maxTime = 6000; accuracy = 0.95; }
    if (difficulty === 'easy') { minTime = 7000; maxTime = 12000; accuracy = 0.6; }

    const nextThinkingTime = Math.floor(Math.random() * (maxTime - minTime + 1) + minTime);

    const timer = setTimeout(() => {
      // Бот "решил" задачу
      const isCorrect = Math.random() < accuracy;
      
      const newScore = isCorrect ? botScore + 1 : botScore;
      const newProgress = botProgress + 1;

      setBotScore(newScore);
      setBotProgress(newProgress);
      
      // Сообщаем родителю
      onProgressUpdate(newScore, newProgress);

    }, nextThinkingTime);

    timeouts.current.push(timer);

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [isEnabled, botProgress, difficulty, maxQuestions, botScore]); // Добавил botScore в зависимости

  return { botName, botScore, botProgress };
}