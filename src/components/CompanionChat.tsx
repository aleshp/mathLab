import { useState, useEffect, useRef } from 'react';
import { askMeerkat } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import { X, Send, Sparkles, Utensils, AlertTriangle } from 'lucide-react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

type Props = {
  onClose: () => void;
  problemContext: string;
};

type Message = {
  id: string;
  role: 'me' | 'meerkat';
  parts: string;
};

const QUICK_QUESTIONS =[
  "Как решить эту задачу?",
  "Какую формулу использовать?",
  "Объясни проще, для чайников",
  "В чем тут подвох?"
];

export function CompanionChat({ onClose, problemContext }: Props) {
  const { profile } = useAuth();
  const companionName = profile?.companion_name || 'Сурикат';
  const hunger = profile?.companion_hunger ?? 100;
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'meerkat', parts: `Привет! Застрял на этой задаче? Давай разберем её вместе.` }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    // 1. Сообщение юзера
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'me', parts: text }]);
    
    // === ДЕРЗКАЯ ПРОВЕРКА ГОЛОДА (< 10%) ===
    if (hunger < 10) {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        const sassyMessage = `Эй, ты серьезно? 😤 Мой уровень сытости всего **${hunger}%**!\n\nЯ тебе что, калькулятор на солнечных батареях? Думаешь, мой мозг работает на святом духе? Быстро иди в "Домик", накорми меня мясом 🥩, а потом уже требуй формулы!`;
        
        setMessages(prev =>[...prev, { id: (Date.now() + 1).toString(), role: 'meerkat', parts: sassyMessage }]);
      }, 1500);
      return; 
    }
    // =======================

    setIsThinking(true);
    const answer = await askMeerkat(messages, text, companionName, problemContext);
    setIsThinking(false);
    setMessages(prev =>[...prev, { id: (Date.now() + 1).toString(), role: 'meerkat', parts: answer }]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  const getSprite = () => {
    if (hunger < 10) return '/meerkat/crying.png';
    if (isThinking) return '/meerkat/thinking.png';
    return '/meerkat/idle.png';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/85 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-5xl h-[95vh] md:h-[85vh] md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 relative">
        
        {/* ЛЕВАЯ ЧАСТЬ: ЧАТ */}
        <div className="flex-1 flex flex-col h-full bg-slate-950/50 min-w-0 z-10 relative">
          
          {/* ШАПКА ЧАТА */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center border border-amber-500/40">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                {hunger < 10 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 p-0.5 rounded-full border-2 border-slate-900 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-black text-white text-lg tracking-wide">{companionName}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono text-cyan-400 uppercase">AI-Ассистент</span>
                  
                  {/* Красивая шкала голода */}
                  <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    <Utensils className={`w-3 h-3 ${hunger < 10 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
                    <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${hunger < 10 ? 'bg-red-500' : 'bg-orange-400'}`}
                        style={{ width: `${hunger}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${hunger < 10 ? 'text-red-400' : 'text-slate-400'}`}>{hunger}%</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ИСТОРИЯ СООБЩЕНИЙ */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.03)_0%,_transparent_100%)]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-[15px] leading-relaxed shadow-lg ${
                  msg.role === 'me' 
                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-br-sm' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.parts.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0 min-h-[1em]">
                      <Latex>{line}</Latex>
                    </p>
                  ))}
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 rounded-bl-sm flex gap-2 items-center shadow-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* БЫСТРЫЕ ВОПРОСЫ */}
          <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm shrink-0 z-20">
             <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3 px-4 w-full touch-pan-x">
               {QUICK_QUESTIONS.map((q, i) => (
                 <button
                   key={i}
                   onClick={() => sendMessage(q)}
                   disabled={isThinking}
                   className="whitespace-nowrap flex-shrink-0 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-xs font-medium text-slate-300 hover:bg-cyan-900/30 hover:border-cyan-500/50 hover:text-cyan-300 transition-all disabled:opacity-50 active:scale-95"
                 >
                   {q}
                 </button>
               ))}
             </div>
          </div>

          {/* ПОЛЕ ВВОДА */}
          <form onSubmit={handleFormSubmit} className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 z-20">
            <div className="flex gap-3 relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hunger < 10 ? "Сурикат отказывается работать..." : "Спроси меня о чем угодно..."}
                disabled={hunger < 10 && !isThinking} // Запрещаем писать, если голоден
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-white outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isThinking || hunger < 10}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ВИЗУАЛ СУРИКАТА */}
        <div className={`
            absolute bottom-[160px] right-[-10px] w-44 h-44 z-0 pointer-events-none opacity-100
            md:static md:w-80 md:h-full md:opacity-100 md:bg-slate-900 md:border-l md:border-slate-800
            flex flex-col items-center justify-end overflow-hidden shrink-0 transition-all duration-300
        `}>
          
          {/* Свечение на фоне */}
          <div className={`absolute inset-0 opacity-20 hidden md:block transition-colors duration-500 ${hunger < 10 ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.3),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.2),transparent_70%)]'}`} />
          
          <div className={`relative z-10 mb-[-10px] md:mb-[-20px] transition-all duration-300 ${isThinking ? 'scale-105' : 'hover:scale-105'}`}>
             <img 
               src={getSprite()} 
               alt="Companion" 
               className="w-44 h-44 md:w-72 md:h-72 object-contain mix-blend-screen drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
               onError={(e) => { e.currentTarget.src='/meerkat/idle.png'; }}
             />
          </div>
          
          {/* Облачко с мыслями */}
          {isThinking && hunger >= 10 && (
            <div className="absolute top-0 right-14 md:top-16 md:right-10 bg-white text-black text-xs font-bold px-4 py-2.5 rounded-2xl rounded-br-none animate-bounce shadow-xl z-20 border-2 border-cyan-500">
              Хм-м... 🤔
            </div>
          )}

          {/* Дерзкое облачко с ГОЛОДОМ */}
          {hunger < 10 && (
             <div className="absolute top-4 right-14 md:top-16 md:right-10 bg-red-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl rounded-br-none animate-pulse shadow-xl z-20 border-2 border-red-400 rotate-2">
               ХОЧУ ЖРАТЬ! 💢
             </div>
          )}
        </div>

      </div>
    </div>
  );
}