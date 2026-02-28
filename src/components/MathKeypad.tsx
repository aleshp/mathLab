import { useState, useRef, useEffect, useCallback } from 'react';
import { Delete, ArrowLeft, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';

type MathKeypadProps = {
  onCommand: (cmd: string, arg?: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
};

type MainTab = 'math' | 'abc';
type SubTab = 'basic' | 'func' | 'trig';

type KeyDef = {
  label: React.ReactNode | string;
  cmd: string;
  arg?: string;
  className?: string;
  hasMenu?: boolean;
  menuOptions?: Array<{ label: string | React.ReactNode; cmd: string; arg: string }>;
};

// Компонент для отрисовки пустого пунктирного квадратика
const D = () => (
  <span className="inline-block w-[12px] h-[14px] border-[1.5px] border-dotted border-slate-400 rounded-[3px] mx-[2px] mb-[1px] align-middle opacity-80" />
);

export function MathKeypad({ onCommand, onDelete, onClear, onSubmit }: MathKeypadProps) {
  const [mainTab, setMainTab] = useState<MainTab>('math');
  const [subTab, setSubTab] = useState<SubTab>('basic');
  const [isShift, setIsShift] = useState(false);
  const [longPressMenu, setLongPressMenu] = useState<{ options: any[]; keyId: string } | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef(false);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmitRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // === ОБРАБОТЧИКИ НАЖАТИЙ ===
  const handlePressStart = useCallback((options: any[] | undefined, keyId: string) => {
    isLongPressTriggered.current = false;
    if (!options || options.length === 0) return;

    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setLongPressMenu({ options, keyId });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400);
  }, []);

  const handlePressEnd = useCallback((e: React.PointerEvent, action: () => void) => {
    e.preventDefault();

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPressTriggered.current) {
      action();
    }
    isLongPressTriggered.current = false;

    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
  }, []);

  const handlePressCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPressTriggered.current = false;
  }, []);

  // === УНИВЕРСАЛЬНАЯ КНОПКА ===
  const Key = ({
    id,
    label,
    onClick,
    className,
    hasMenu = false,
    menuOptions,
    children,
  }: {
    id?: string;
    label?: React.ReactNode | string;
    onClick: () => void;
    className?: string;
    hasMenu?: boolean;
    menuOptions?: any[];
    children?: React.ReactNode;
  }) => (
    <button
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        handlePressStart(menuOptions, id ?? '');
      }}
      onPointerUp={(e) => handlePressEnd(e, onClick)}
      onPointerLeave={handlePressCancel}
      onPointerCancel={handlePressCancel}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={-1}
      className={`relative rounded-xl font-medium flex items-center justify-center select-none touch-manipulation transition-transform active:scale-[0.92] active:brightness-110 shadow-[0_1px_1px_rgba(0,0,0,0.2)] ${className ?? 'bg-slate-800 text-white'}`}
    >
      {children ?? label}
      {(hasMenu || (menuOptions && menuOptions.length > 0)) && (
        <div className="absolute bottom-1 right-1.5 w-1 h-1 bg-slate-500 rounded-full opacity-60" />
      )}
    </button>
  );

  // === ВКЛАДКА 1: БАЗОВАЯ ===
  const basicKeys: KeyDef[][] = [[
      { label: <div className="flex items-center">( )</div>, cmd: 'insert', arg: '\\left( #0 \\right)' },
      { label: '>', cmd: 'insert', arg: '>', hasMenu: true, menuOptions:[{label:'<', cmd:'insert', arg:'<'}, {label:'≥', cmd:'insert', arg:'\\geq'}, {label:'≤', cmd:'insert', arg:'\\leq'}, {label:'≠', cmd:'insert', arg:'\\neq'}] },
      { label: '7', cmd: 'insert', arg: '7', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '8', cmd: 'insert', arg: '8', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '9', cmd: 'insert', arg: '9', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '÷', cmd: 'insert', arg: '\\div', className: 'bg-slate-800 text-cyan-400 text-2xl' },
    ],[
      { 
        label: (
          <div className="flex flex-col items-center justify-center">
            <D/>
            <div className="w-[16px] h-[1.5px] bg-white my-[2px] rounded-full"/>
            <D/>
          </div>
        ), 
        cmd: 'insert', arg: '\\frac{#0}{#?}' 
      },
      { label: <div className="flex items-center">√<D/></div>, cmd: 'insert', arg: '\\sqrt{#?}', hasMenu: true, menuOptions:[{label:<div className="flex items-center">∛<D/></div>, cmd:'insert', arg:'\\sqrt[3]{#?}'}, {label:<div className="flex items-center"><span className="text-[10px] -mt-2 mr-[1px]">n</span>√<D/></div>, cmd:'insert', arg:'\\sqrt[#?]{#0}'}] },
      { label: '4', cmd: 'insert', arg: '4', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '5', cmd: 'insert', arg: '5', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '6', cmd: 'insert', arg: '6', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '×', cmd: 'insert', arg: '\\times', className: 'bg-slate-800 text-cyan-400 text-2xl' },
    ],[
      { label: <div className="flex items-center"><D/>²</div>, cmd: 'insert', arg: '#0^{2}', hasMenu: true, menuOptions:[{label:<div className="flex items-center"><D/>ⁿ</div>, cmd:'insert', arg:'#0^{#?}'}, {label:<div className="flex items-center"><D/>⁻¹</div>, cmd:'insert', arg:'#0^{-1}'}] },
      { label: <span className="font-serif italic text-xl">x</span>, cmd: 'insert', arg: 'x' },
      { label: '1', cmd: 'insert', arg: '1', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '2', cmd: 'insert', arg: '2', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '3', cmd: 'insert', arg: '3', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '−', cmd: 'insert', arg: '-', className: 'bg-slate-800 text-cyan-400 text-2xl' },
    ],[
      { label: 'π', cmd: 'insert', arg: '\\pi' },
      { label: '%', cmd: 'insert', arg: '\\%' },
      { label: '0', cmd: 'insert', arg: '0', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '.', cmd: 'insert', arg: '.', className: 'bg-slate-700 text-white text-xl font-semibold' },
      { label: '=', cmd: 'insert', arg: '=', className: 'bg-slate-800 text-white text-2xl' },
      { label: '+', cmd: 'insert', arg: '+', className: 'bg-slate-800 text-cyan-400 text-2xl' },
    ]
  ];

  // === ВКЛАДКА 2: ФУНКЦИИ (ПОЛНОСТЬЮ ЗАПОЛНЕНА) ===
  const funcKeys: KeyDef[][] = [
    [
      { label: <div className="flex items-center">|<D/>|</div>, cmd: 'insert', arg: '\\left|#?\\right|' },
      { label: 'f(x)', cmd: 'insert', arg: 'f(x)' },
      { label: 'g(x)', cmd: 'insert', arg: 'g(x)' },
      { label: 'e', cmd: 'insert', arg: 'e', className: 'italic font-serif' },
      { label: 'i', cmd: 'insert', arg: 'i', className: 'font-serif italic' },
      { label: '!', cmd: 'insert', arg: '!' },
    ],
    [
      { label: <div className="flex items-center">ln<D/></div>, cmd: 'insert', arg: '\\ln(#?)' },
      { label: <div className="flex items-center">log<sub className="text-[10px] mt-2">10</sub></div>, cmd: 'insert', arg: '\\log_{10}(#?)' },
      { label: <div className="flex items-center">log<sub className="text-[10px] mt-2">2</sub></div>, cmd: 'insert', arg: '\\log_{2}(#?)' },
      { label: <div className="flex items-center">log<sub className="text-[10px] mt-2"><D/></sub></div>, cmd: 'insert', arg: '\\log_{#?}(#0)' },
      { label: 'sign', cmd: 'insert', arg: '\\text{sign}(#?)' },
      { label: 'z̄', cmd: 'insert', arg: '\\bar{z}' },
    ],
    [
      { label: <div className="flex items-center">[<D/>]</div>, cmd: 'insert', arg: '\\begin{bmatrix} #? \\end{bmatrix}' },
      { label: <div className="flex items-center">||<D/>||</div>, cmd: 'insert', arg: '\\begin{vmatrix} #? \\end{vmatrix}' },
      { label: 'Cₙᵏ', cmd: 'insert', arg: 'C_{#?}^{#0}' },
      { label: 'Aₙᵏ', cmd: 'insert', arg: 'A_{#?}^{#0}' },
      { label: 'Pₙ', cmd: 'insert', arg: 'P_{#?}' },
      { label: <div className="flex flex-col items-center text-[10px] leading-tight">(<span>n</span><span>k</span>)</div>, cmd: 'insert', arg: '\\binom{#?}{#0}' },
    ],
    [
      { label: 'lim', cmd: 'insert', arg: '\\lim_{#? \\to #0}' },
      { label: '∞', cmd: 'insert', arg: '\\infty' },
      { label: '∫', cmd: 'insert', arg: '\\int' },
      { label: '∑', cmd: 'insert', arg: '\\sum' },
      { label: '∏', cmd: 'insert', arg: '\\prod' },
      { label: 'd/dx', cmd: 'insert', arg: '\\frac{d}{dx}' },
    ]
  ];

  // === ВКЛАДКА 3: ТРИГОНОМЕТРИЯ (ЗАПОЛНЕНА ГРЕЧЕСКИМИ БУКВАМИ) ===
  const trigKeys: KeyDef[][] = [
    ['sin', 'cos', 'tan', 'cot', 'sec', 'csc'].map(k => ({ label: k, cmd: 'insert', arg: `\\${k}(#?)` })),
    ['arcsin', 'arccos', 'arctan', 'arccot', 'arcsec', 'arccsc'].map(k => ({ label: k, cmd: 'insert', arg: `\\${k}(#?)` })),
    [
      { label: 'rad', cmd: 'insert', arg: '\\text{rad}' },
      { label: '°', cmd: 'insert', arg: '^\\circ' },
      { label: 'α', cmd: 'insert', arg: '\\alpha', className: 'font-serif italic' },
      { label: 'β', cmd: 'insert', arg: '\\beta', className: 'font-serif italic' },
      { label: 'γ', cmd: 'insert', arg: '\\gamma', className: 'font-serif italic' },
      { label: 'θ', cmd: 'insert', arg: '\\theta', className: 'font-serif italic' },
    ],
    [
      { label: 'π', cmd: 'insert', arg: '\\pi', className: 'font-serif italic' },
      { label: 'φ', cmd: 'insert', arg: '\\phi', className: 'font-serif italic' },
      { label: 'ω', cmd: 'insert', arg: '\\omega', className: 'font-serif italic' },
      { label: 'Δ', cmd: 'insert', arg: '\\Delta' },
      { label: 'Ω', cmd: 'insert', arg: '\\Omega' },
      { label: 'λ', cmd: 'insert', arg: '\\lambda', className: 'font-serif italic' },
    ]
  ];

  const qwertyRows = [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const renderGrid = (grid: KeyDef[][]) => (
    <div className="flex-1 flex flex-col gap-1.5 p-1.5">
      {grid.map((row, rIdx) => (
        <div key={rIdx} className="grid gap-1.5 flex-1 grid-cols-6">
          {row.map((k, cIdx) => (
            <Key
              key={cIdx}
              id={`${rIdx}-${cIdx}`}
              label={k.label}
              onClick={() => k.cmd && k.arg !== undefined && onCommand(k.cmd, k.arg)}
              className={`bg-slate-800 text-slate-200 text-sm md:text-base ${k.className || ''}`}
              hasMenu={k.hasMenu}
              menuOptions={k.menuOptions}
            />
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-900 border-t border-slate-800 select-none touch-none pb-safe">

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* LONG PRESS MENU POPOVER */}
      {longPressMenu && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end justify-center pb-safe animate-in fade-in duration-150"
          onPointerUp={() => setLongPressMenu(null)}
        >
          <div
            className="bg-slate-800 border-t-2 border-cyan-500 rounded-t-3xl p-4 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
            onPointerUp={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Варианты</h3>
              <button onClick={() => setLongPressMenu(null)} className="text-slate-400 hover:text-white px-2 py-1">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {longPressMenu.options.map((option, idx) => (
                <button
                  key={idx}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    onCommand(option.cmd, option.arg);
                    setLongPressMenu(null);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-4 px-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOP TOOLBAR (NO ARROWS) */}
      <div className="flex justify-between items-center px-2 py-2 bg-slate-900 border-b border-slate-800/50">
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setMainTab(mainTab === 'math' ? 'abc' : 'math')}
            className="px-4 py-2 font-bold bg-slate-800 text-slate-300 rounded-lg text-sm active:bg-slate-700 transition-colors"
          >
            {mainTab === 'math' ? 'abc' : '123'}
          </button>
          <button onClick={onClear} className="p-2 ml-1 text-slate-500 hover:text-white active:scale-90 transition-all">
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onSubmit} className="p-2 text-cyan-500 hover:text-cyan-400 active:scale-90 transition-all ml-2">
            <CornerDownLeft size={22} />
          </button>
          <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-400 active:scale-90 transition-all ml-1">
            <Delete size={22} />
          </button>
        </div>
      </div>

      {mainTab === 'math' ? (
        <div className="flex flex-col h-[280px] md:h-[320px]">
          {/* SUB-TABS */}
          <div className="flex gap-2 px-2 pt-2 pb-1 overflow-x-auto hide-scroll bg-slate-900" style={{ WebkitOverflowScrolling: 'touch' }}>
            {[
              { id: 'basic', label: '+ - × ÷' },
              { id: 'func', label: 'f(x) e log ln' },
              { id: 'trig', label: 'sin cos tan cot' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as SubTab)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${subTab === tab.id ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* DYNAMIC GRIDS */}
          {subTab === 'basic' && renderGrid(basicKeys)}
          {subTab === 'func' && renderGrid(funcKeys)}
          {subTab === 'trig' && renderGrid(trigKeys)}
        </div>
      ) : (
        /* QWERTY KEYBOARD */
        <div className="flex flex-col gap-2 p-2 h-[280px] md:h-[320px] bg-slate-900 justify-center">
          {qwertyRows.map((row, i) => (
            <div key={i} className={`flex justify-center gap-1.5 ${i === 1 ? 'px-4' : i === 2 ? 'px-8' : ''}`}>
              {i === 2 && (
                <Key onClick={() => setIsShift(!isShift)} className={`flex-1 max-w-[45px] ${isShift ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>⇧</Key>
              )}
              {row.map(char => {
                const c = isShift ? char.toUpperCase() : char;
                return (
                  <Key key={c} onClick={() => onCommand('insert', c)} className="flex-1 max-w-[35px] py-3 bg-slate-800 text-white text-lg">
                    {c}
                  </Key>
                );
              })}
              {i === 2 && (
                <Key onClick={onDelete} className="flex-1 max-w-[45px] bg-slate-700 text-slate-300"><Delete size={18} /></Key>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-1.5 mt-1 px-2">
            <Key onClick={() => setMainTab('math')} className="flex-[1.5] max-w-[60px] bg-slate-700 text-slate-300 text-sm font-bold py-3">123</Key>
            <Key onClick={() => onCommand('insert', ',')} className="flex-1 max-w-[40px] bg-slate-800 text-white py-3">,</Key>
            <Key onClick={() => onCommand('insert', '\\,')} className="flex-[4] bg-slate-800 text-white py-3">Space</Key>
            <Key onClick={() => onCommand('insert', '.')} className="flex-1 max-w-[40px] bg-slate-800 text-white py-3">.</Key>
            <Key onClick={onSubmit} className="flex-[1.5] max-w-[60px] bg-cyan-600 text-white py-3"><CornerDownLeft size={18} /></Key>
          </div>
        </div>
      )}
    </div>
  );
}