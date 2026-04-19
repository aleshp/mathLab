
import { useEffect, useRef } from 'react';
import 'mathlive';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<any>;
        'virtual-keyboard-mode'?: string;
        inputmode?: string;
      };
    }
  }
}

type MathInputProps = {
  value: string;
  onChange: (latex: string) => void;
  onSubmit: () => void;
  mfRef?: React.MutableRefObject<any>;
};

export function MathInput({ value, onChange, onSubmit, mfRef }: MathInputProps) {
  const internalRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // FIX 1: onChange через ref — нет stale closure
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const onSubmitRef = useRef(onSubmit);
  useEffect(() => { onSubmitRef.current = onSubmit; }, [onSubmit]);

  // FIX 3: Блокируем нативный скролл при фокусе
  useEffect(() => {
    const preventScroll = (e: Event) => e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('focus', preventScroll, true);
    container.addEventListener('focusin', preventScroll, true);
    return () => {
      container.removeEventListener('focus', preventScroll, true);
      container.removeEventListener('focusin', preventScroll, true);
    };
  }, []);

  // Инициализация MathLive
  useEffect(() => {
    const mf = internalRef.current;
    if (!mf) return;

    mf.smartMode = true;
    mf.virtualKeyboardMode = 'manual';
    mf.menuItems = [];
    mf.keypressSound = null;
    mf.mathModeSpace = '\\,';

    // FIX 1: используем ref вместо захваченного onChange
    const handleInput = (e: Event) => {
      onChangeRef.current((e.target as any).value);
    };
    mf.addEventListener('input', handleInput);

    if (mfRef) mfRef.current = mf;

    // FIX 2: устанавливаем value только один раз при инициализации
    if (value && value !== mf.value) {
      mf.setValue(value, { silenceNotifications: true });
    }

    // FIX 3: фокус без scroll-джампа
    requestAnimationFrame(() => {
      if (mf && document.activeElement !== mf) {
        mf.focus({ preventScroll: true });
        // НЕ вызываем window.scrollTo — это вызывало мигание на мобилке
      }
    });

    return () => {
      mf.removeEventListener('input', handleInput);
    };
  }, []); // пустые deps — правильно, всё через refs

  // FIX 2: синхронизация value — только этот эффект, убран дубль из init
  useEffect(() => {
    const mf = internalRef.current;
    if (!mf || value === mf.value) return;

    // Сохраняем позицию курсора
    const sel = mf.selection;
    mf.setValue(value, { silenceNotifications: true });
    try {
      mf.selection = sel;
    } catch {
      // ignore — курсор сбрасывается в конец, это допустимо
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-900 border border-cyan-500/30 rounded-lg px-3 py-1.5 shadow-inner min-h-[50px] flex items-center overflow-hidden"
      onTouchMove={(e) => {
        if (e.target === internalRef.current) e.stopPropagation();
      }}
    >
      <math-field
        ref={internalRef}
        inputmode="none"
        virtual-keyboard-mode="manual"
        aria-label="Поле ввода математического выражения"
        style={{
          width: '100%',
          fontSize: '20px',
          backgroundColor: 'transparent',
          color: 'white',
          border: 'none',
          outline: 'none',
          touchAction: 'pan-x pan-y',
          '--caret-color': 'transparent',
          '--selection-background-color': 'rgba(6, 182, 212, 0.25)',
          '--selection-color': 'white',
          '--contains-highlight-background-color': 'rgba(6, 182, 212, 0.15)',
          '--primary': '#06b6d4',
        } as React.CSSProperties}
      />
    </div>
  );
}