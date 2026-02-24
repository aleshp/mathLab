import { Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export function OnlineCounter() {
  // Начинаем с ~120 игроков
  const [count, setCount] = useState(124);

  useEffect(() => {
    const interval = setInterval(() => {
      // Случайное изменение на -2..+3 каждые 5 сек
      const change = Math.floor(Math.random() * 6) - 2;
      setCount(prev => Math.max(80, prev + change));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-emerald-400 animate-pulse">
      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
      <span>{count} online</span>
    </div>
  );
}