import { Delete, ArrowLeft, ArrowRight, CornerDownLeft } from 'lucide-react';

type MathKeypadProps = {
  onCommand: (cmd: string, arg?: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
};

export function MathKeypad({ onCommand, onDelete, onClear, onSubmit }: MathKeypadProps) {
  
  // Функция для предотвращения потери фокуса
  const preventBlur = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col gap-2 select-none touch-none pb-4">
      
      {/* ВЕРХНИЙ РЯД: Управление и Спецсимволы */}
      <div className="grid grid-cols-6 gap-2">
         {/* Спецсимволы (маленькие) */}
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\pi')} className="bg-slate-800 rounded-lg p-3 text-cyan-300 font-serif">π</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '^\\circ')} className="bg-slate-800 rounded-lg p-3 text-cyan-300">°</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\sqrt{#?}')} className="bg-slate-800 rounded-lg p-3 text-cyan-300">√</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '#@^{#?}')} className="bg-slate-800 rounded-lg p-3 text-cyan-300">xⁿ</button>
         
         {/* Стрелки */}
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('perform', 'moveToPreviousChar')} className="bg-slate-800 rounded-lg p-3 text-slate-400 flex justify-center"><ArrowLeft className="w-5 h-5"/></button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('perform', 'moveToNextChar')} className="bg-slate-800 rounded-lg p-3 text-slate-400 flex justify-center"><ArrowRight className="w-5 h-5"/></button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* ЛЕВАЯ КОЛОНКА: Функции (2 столбца) */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\sin(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white">sin</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\cos(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white">cos</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\tan(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white">tan</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\cot(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white">cot</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\log_{#?}(#@)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white">log</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\frac{#@}{#?}')} className="bg-slate-700 rounded-xl py-3 text-lg font-bold text-white">÷</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '(')} className="bg-slate-800 rounded-xl py-3 text-white">(</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', ')')} className="bg-slate-800 rounded-xl py-3 text-white">)</button>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Цифры (3 столбца) */}
        <div className="col-span-3 grid grid-cols-3 gap-2">
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '7')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">7</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '8')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">8</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '9')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">9</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '4')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">4</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '5')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">5</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '6')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">6</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '1')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">1</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '2')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">2</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '3')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm">3</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '.')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white">.</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '0')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white">0</button>
           
           {/* BACKSPACE (Красный) */}
           <button onPointerDown={(e) => preventBlur(e)} onClick={onDelete} className="bg-red-500/20 text-red-400 rounded-xl py-3 flex justify-center items-center"><Delete className="w-6 h-6"/></button>
        </div>
      </div>

      {/* НИЖНИЙ РЯД: Основные действия */}
      <div className="grid grid-cols-4 gap-2">
         <button onPointerDown={(e) => preventBlur(e)} onClick={onClear} className="bg-slate-800 text-slate-500 text-xs font-bold uppercase rounded-xl py-4">СБРОС</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '-')} className="bg-slate-700 text-white text-xl font-bold rounded-xl py-4">−</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '+')} className="bg-slate-700 text-white text-xl font-bold rounded-xl py-4">+</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={onSubmit} className="bg-emerald-600 text-white rounded-xl py-4 flex justify-center items-center shadow-lg"><CornerDownLeft className="w-6 h-6"/></button>
      </div>

    </div>
  );
}