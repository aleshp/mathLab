// В src/lib/mathUtils.ts

function normalizeForCalculation(str: string): string {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  
  // === НОВОЕ: Обработка пустого множества ===
  // Если ученик ввел "нет решений" или символ ∅
  if (s === '∅' || s === 'no solution' || s === 'нет решений') return 'NaN'; // NaN условно будет значить отсутствие решений

  // 1. Предварительная очистка
  s = s.replace(/,/g, '.');
  s = s.replace(/√/g, 'sqrt');
  s = s.replace(/π/g, 'pi');
  s = s.replace(/°/g, 'deg');
  s = s.replace(/×/g, '*');
  s = s.replace(/⋅/g, '*');
  s = s.replace(/±/g, ''); // mathjs не понимает ± внутри выражения, обработка идет в expandOptions
  
  // Infinity
  s = s.replace(/\\infty/g, 'Infinity');
  s = s.replace(/∞/g, 'Infinity');
  s = s.replace(/\binf(inity)?\b/g, 'Infinity');

  // Двоеточие как деление
  s = s.replace(/(\d):(\d)/g, '$1/$2');

  // === НОВОЕ: Обработка логарифма с основанием log_2(x) -> log(x, 2) ===
  // Паттерн: log_число(аргумент)
  // Мы ищем: log _ (число/буква) ( (аргумент) )
  // Регулярка ловит: log_2(8) или log_a(b)
  s = s.replace(/log_(\d+|[a-z])\((.+?)\)/g, 'log($2, $1)');
  // Если написали без скобок: log_2 8
  s = s.replace(/log_(\d+|[a-z])\s+(\d+|[a-z])/g, 'log($2, $1)');

  // ... (Остальной код функции без изменений до return s)
  
  // 2. Обработка LaTeX...
  s = s.replace(/\\sqrt\[(\d+)\]\{(.+?)\}/g, 'nthRoot($2, $1)');
  s = s.replace(/\\sqrt\{(.+?)\}/g, 'sqrt($1)');
  s = s.replace(/\\sqrt/g, 'sqrt');
  s = s.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '(($1)/($2))');

  const funcs = ['sin', 'cos', 'tan', 'cot', 'ln', 'lg', 'log'];
  funcs.forEach(f => {
    s = s.replace(new RegExp(`\\\\${f}`, 'g'), f);
  });
  
  s = s.replace(/lg/g, 'log10'); 
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\\/g, '');

  // 3. Скобки для функций
  s = s.replace(/log(?!\()(\d+(\.\d+)?|pi|infinity|[a-z])/g, 'log10($1)');
  s = s.replace(/(\d)deg/g, '$1 deg');

  const trigFuncs = 'sin|cos|tan|cot|ln|log10|sqrt';
  const regexArg = new RegExp(`(${trigFuncs})\\s*(?!\\()(\\d+(\\.\\d+)?( deg)?|pi|infinity|[a-z])`, 'g');
  s = s.replace(regexArg, '$1($2)');

  // 4. Неявное умножение
  s = s.replace(/\s+/g, ''); 
  s = s.replace(/(\d|\))(?=[a-z\(]|sqrt|sin|cos|tan|ln|log)/g, '$1*');
  s = s.replace(/sqrt(\d+(\.\d+)?)/g, 'sqrt($1)');

  return s;
}