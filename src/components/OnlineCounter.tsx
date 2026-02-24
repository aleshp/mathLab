import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

export function OnlineCounter() {
  const [count, setCount] = useState(58);

  useEffect(() => {
    const interval = setInterval(() => {
      // Имитация активности: +/- 3 игрока
      const change = Math.floor(Math.random() * 7) - 20; 
      setCount(prev => Math.max(80, prev + change));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50 text-[10px] md:text-xs font-mono text-emerald-400 animate-pulse transition-all">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
      <span className="whitespace-nowrap font-bold">{count} online</span>
    </div>
  );
}