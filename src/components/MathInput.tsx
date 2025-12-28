import { useEffect, useRef } from 'react';
import 'mathlive';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: any;
        'virtual-keyboard-mode'?: string;
        inputmode?: string;
      };
    }
  }
}

type Props = {
  value: string;
  onChange: (latex: string) => void;
  onSubmit: () => void;
  mfRef?: React.MutableRefObject<any>;
};

export function MathInput({ value, onChange, onSubmit, mfRef }: Props) {
  const internalRef = useRef<any>(null);

  useEffect(() => {
    const mf = internalRef.current;
    if (!mf) return;

    mf.smartMode = true; 
    mf.virtualKeyboardMode = 'manual'; 
    mf.menuItems = []; 
    mf.keypressSound = null;

    const handleInput = (e: any) => {
      onChange(e.target.value);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault(); 
        onSubmit();
      }
    };

    // Блокируем скролл при фокусе
    const handleFocus = (e: FocusEvent) => {
      // Logic handled via Reactor, but keeping listener for safety
    };

    mf.addEventListener('input', handleInput);
    mf.addEventListener('keydown', handleKeydown);
    mf.addEventListener('focus', handleFocus);

    if (mfRef) mfRef.current = mf;

    if (value !== mf.value) {
      mf.setValue(value);
    }

    return () => {
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('keydown', handleKeydown);
      mf.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const mf = internalRef.current;
    if (mf && value !== mf.value && document.activeElement !== mf) {
      mf.setValue(value);
    }
  }, [value]);

  return (
    <div className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-4 py-2 shadow-inner min-h-[60px] flex items-center overflow-hidden">
      <math-field
        ref={internalRef}
        inputmode="none" 
        virtual-keyboard-mode="manual"
        style={{
          width: '100%',
          fontSize: '24px',
          backgroundColor: 'transparent',
          color: 'white',
          border: 'none',
          outline: 'none',
          touchAction: 'none',
          
          // === ВИЗУАЛЬНЫЙ СТИЛЬ ===
          
          // 1. Курсор (Каретка) - делаем его Cyan, чтобы было видно, где печатаем
          '--caret-color': '#22d3ee', 
          
          // 2. ВЫДЕЛЕНИЕ (Стеклянный эффект)
          // Используем Cyan цвет (34, 211, 238) с прозрачностью 0.3 (30%)
          '--selection-background-color': 'rgba(34, 211, 238, 0.3)',
          
          // Цвет текста при выделении оставляем белым (или можно сделать чуть ярче)
          '--selection-color': '#ffffff',
          
          // Фон "пустого квадратика" (placeholder) - делаем едва заметным
          '--contains-highlight-backgound-color': 'rgba(255, 255, 255, 0.05)',
        } as any}
      >
        {value}
      </math-field>
    </div>
  );
}