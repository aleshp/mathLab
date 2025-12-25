import { Delete, ArrowLeft, ArrowRight, CornerDownLeft } from 'lucide-react';

type MathKeypadProps = {
  onCommand: (cmd: string, arg?: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
};

export function MathKeypad({ onCommand, onDelete, onClear, onSubmit }: MathKeypadProps) {
  
  // Магия, чтобы фокус оставался в поле ввода
  const preventBlur = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col gap-2 select-none touch-none pb-4">
      
      {/* ВЕРХНИЙ РЯД: Управление и Спецсимволы */}
      <div className="grid grid-cols-6 gap-2">
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\pi')} className="bg-slate-800 rounded-lg p-3 text-cyan-300 font-serif active:scale-95">π</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '^\\circ')} className="bg-slate-800 rounded-lg p-3 text-cyan-300 active:scale-95">°</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\sqrt{#?}')} className="bg-slate-800 rounded-lg p-3 text-cyan-300 active:scale-95">√</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '#@^{#?}')} className="bg-slate-800 rounded-lg p-3 text-cyan-300 active:scale-95">xⁿ</button>
         
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('perform', 'moveToPreviousChar')} className="bg-slate-800 rounded-lg p-3 text-slate-400 flex justify-center active:scale-95"><ArrowLeft className="w-5 h-5"/></button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('perform', 'moveToNextChar')} className="bg-slate-800 rounded-lg p-3 text-slate-400 flex justify-center active:scale-95"><ArrowRight className="w-5 h-5"/></button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {/* ЛЕВАЯ КОЛОНКА: Функции */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\sin(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white active:scale-95">sin</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\cos(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white active:scale-95">cos</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\tan(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white active:scale-95">tan</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\cot(#?)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white active:scale-95">cot</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\log_{#?}(#@)')} className="bg-slate-700 rounded-xl py-3 text-sm font-bold text-white active:scale-95">log</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '\\frac{#@}{#?}')} className="bg-slate-700 rounded-xl py-3 text-lg font-bold text-white active:scale-95">÷</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '(')} className="bg-slate-800 rounded-xl py-3 text-white active:scale-95">(</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', ')')} className="bg-slate-800 rounded-xl py-3 text-white active:scale-95">)</button>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Цифры */}
        <div className="col-span-3 grid grid-cols-3 gap-2">
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '7')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">7</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '8')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">8</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '9')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">9</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '4')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">4</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '5')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">5</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '6')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">6</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '1')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">1</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '2')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">2</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '3')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white shadow-sm active:scale-95">3</button>
           
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '.')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white active:scale-95">.</button>
           <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '0')} className="bg-slate-800 hover:bg-slate-700 rounded-xl py-3 text-xl font-bold text-white active:scale-95">0</button>
           
           {/* BACKSPACE */}
           <button onPointerDown={(e) => preventBlur(e)} onClick={onDelete} className="bg-red-500/20 text-red-400 rounded-xl py-3 flex justify-center items-center active:scale-95"><Delete className="w-6 h-6"/></button>
        </div>
      </div>

      {/* НИЖНИЙ РЯД */}
      <div className="grid grid-cols-4 gap-2">
         <button onPointerDown={(e) => preventBlur(e)} onClick={onClear} className="bg-slate-800 text-slate-500 text-xs font-bold uppercase rounded-xl py-4 active:scale-95">СБРОС</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '-')} className="bg-slate-700 text-white text-xl font-bold rounded-xl py-4 active:scale-95">−</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={() => onCommand('insert', '+')} className="bg-slate-700 text-white text-xl font-bold rounded-xl py-4 active:scale-95">+</button>
         <button onPointerDown={(e) => preventBlur(e)} onClick={onSubmit} className="bg-emerald-600 text-white rounded-xl py-4 flex justify-center items-center shadow-lg active:scale-95"><CornerDownLeft className="w-6 h-6"/></button>
      </div>

    </div>
  );
}