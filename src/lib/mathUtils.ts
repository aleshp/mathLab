import { evaluate } from 'mathjs';

// === КОНСТАНТЫ ДЛЯ АЛГЕБРЫ ===
const ALGEBRA_SCOPE = {
  x: 3, y: 7, z: 11, t: 13,
  a: 17, b: 19, c: 23, d: 29,
  m: 31, n: 37, k: 41, p: 43, q: 47,
  u: 53, v: 59, S: 61, h: 67, r: 71,
  e: 2.718281828, pi: Math.PI,
  
  // === КОМБИНАТОРИКА ===
  combinations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i) / (i + 1);
    }
    return Math.round(result);
  },
  
  permutations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i);
    }
    return result;
  }
};

// === ПЕРИОДИЧЕСКИЕ ДРОБИ ===
const PERIODIC_FRACTIONS: { [key: string]: number } = {
  // 1/3, 2/3
  '0.3': 1/3,
  '0.33': 1/3,
  '0.333': 1/3,
  '0.6': 2/3,
  '0.66': 2/3,
  '0.666': 2/3,
  
  // 1/6, 5/6
  '0.16': 1/6,
  '0.166': 1/6,
  '0.83': 5/6,
  '0.833': 5/6,
  
  // 1/7, 2/7, ..., 6/7
  '0.142': 1/7,
  '0.1428': 1/7,
  '0.285': 2/7,
  '0.2857': 2/7,
  '0.428': 3/7,
  '0.4285': 3/7,
  '0.571': 4/7,
  '0.5714': 4/7,
  '0.714': 5/7,
  '0.7142': 5/7,
  '0.857': 6/7,
  '0.8571': 6/7,
  
  // 1/9, 2/9, ..., 8/9
  '0.1': 1/9,
  '0.11': 1/9,
  '0.111': 1/9,
  '0.2': 2/9,
  '0.22': 2/9,
  '0.222': 2/9,
  '0.4': 4/9,
  '0.44': 4/9,
  '0.444': 4/9,
  '0.5': 5/9,
  '0.55': 5/9,
  '0.555': 5/9,
  '0.7': 7/9,
  '0.77': 7/9,
  '0.777': 7/9,
  '0.8': 8/9,
  '0.88': 8/9,
  '0.888': 8/9,
};

/**
 * Нормализация математического выражения для MathJS
 */
function normalizeForCalculation(str: string): string {
  if (!str) return '';
  let s = str.trim();

  // === 0. СПЕЦИАЛЬНЫЕ СЛУЧАИ ===
  // Убираем "x =" или "y =" в начале
  s = s.replace(/^[a-zA-Z]\s*=\s*/, '');

  // Пустое множество
  if (s.includes('\\emptyset') || s.includes('\\O') ||
      /no\s*solution/i.test(s) || /нет\s*решений/i.test(s) ||
      /корней\s*нет/i.test(s) || s === '∅') {
    return 'NaN';
  }

  // === 1. УБИРАЕМ LaTeX МУСОР ===
  s = s.replace(/\\text\{[^}]*\}/g, '');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\displaystyle/g, '');
  s = s.replace(/\\,/g, '');
  s = s.replace(/\\:/g, '');
  s = s.replace(/\\;/g, '');
  s = s.replace(/\\quad/g, '');
  s = s.replace(/\\qquad/g, '');

  // === 2. СТАНДАРТИЗАЦИЯ СИМВОЛОВ ===
  // ЗАПЯТАЯ → ТОЧКА (только для десятичных дробей!)
  s = s.replace(/\{,\}/g, '.');
  // ВАЖНО: Запятая между числами = десятичная точка
  s = s.replace(/(\d),(\d)/g, '$1.$2');
  
  // Математические операторы
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/×/g, '*');
  s = s.replace(/⋅/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/÷/g, '/');
  
  // Все виды минусов → обычный минус
  s = s.replace(/−/g, '-');
  s = s.replace(/–/g, '-');
  s = s.replace(/—/g, '-');
  
  // Двоеточие как деление (только если это не интервал)
  s = s.replace(/(\d+):(\d+)/g, (match, a, b) => {
    if (parseInt(a) < 100 && parseInt(b) < 100) return `${a}/${b}`;
    return match;
  });

  // Проценты
  s = s.replace(/\\%/g, '/100');
  s = s.replace(/([0-9.]+)%/g, '($1/100)');

  // Градусы
  s = s.replace(/\^\{\\circ\}/g, ' deg');
  s = s.replace(/\\circ/g, ' deg');
  s = s.replace(/°/g, ' deg');

  // Бесконечность и π
  s = s.replace(/\\infty/g, 'Infinity');
  s = s.replace(/∞/g, 'Infinity');
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/π/g, 'pi');

  // Константа e
  s = s.replace(/\\mathrm\{e\}/g, 'e');
  s = s.replace(/\\e\b/g, 'e');

  // === 3. ПЛЮС-МИНУС ===
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');

  // === 4. УБИРАЕМ СЛЕШИ LaTeX ===
  s = s.replace(/\\left/g, '');
  s = s.replace(/\\right/g, '');

  // === 5. МОДУЛЬ (АБС) ===
  s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

  // === 6. ПЕРЕИМЕНОВАНИЕ ФУНКЦИЙ ===
  const functionMap: { [key: string]: string } = {
    // Обратные тригонометрические
    'arctg': 'atan',
    'arcctg': 'acot',
    'arcsin': 'asin',
    'arccos': 'acos',
    'arctan': 'atan',
    'arccot': 'acot',
    'arcsec': 'asec',
    'arccsc': 'acsc',
    
    // Тригонометрия (кириллица)
    'tg': 'tan',
    'ctg': 'cot',
    'тг': 'tan',
    'ктг': 'cot',
    
    // Гиперболические
    'sh': 'sinh',
    'ch': 'cosh',
    'th': 'tanh',
    'cth': 'coth',
    'arcsinh': 'asinh',
    'arccosh': 'acosh',
    'arctanh': 'atanh',
    'arccoth': 'acoth',
    
    // Логарифмы
    'lg': 'log10',
    'ln': 'log'
  };

  // Убираем слеши перед функциями
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|coth|arcsin|arccos|arctan|arccot|asin|acos|atan|acot|asinh|acosh|atanh|acoth|log|ln|lg|exp|sqrt)/g, '$1');

  // Применяем замены
  for (const [oldFunc, newFunc] of Object.entries(functionMap)) {
    const regex = new RegExp(`\\b${oldFunc}\\b`, 'gi');
    s = s.replace(regex, newFunc);
  }

  // === 7. ТРИГОНОМЕТРИЧЕСКИЕ СТЕПЕНИ ===
  // sin^2(x) → (sin(x))^2
  const trigFuncs = 'sin|cos|tan|cot|sec|csc|asin|acos|atan|acot|asinh|acosh|atanh|acoth|sinh|cosh|tanh|coth|log|log10';
  const trigPowRegex = new RegExp(`(${trigFuncs})\\^\\{?(\\d+)\\}?\\s*(\\([^)]+\\)|[a-z0-9]+)`, 'gi');
  s = s.replace(trigPowRegex, '($1($3))^$2');

  // === 8. СМЕШАННЫЕ ЧИСЛА ===
  // 1 1/2 → 1+1/2
  s = s.replace(/(\d)\s+(\d+\/\d+)/g, '$1+$2');

  // === 9. ДРОБИ ===
  let prevS = '';
  let iterations = 0;
  while (prevS !== s && iterations < 10) {
    prevS = s;
    s = s.replace(/d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
    iterations++;
  }
  s = s.replace(/frac\{(.+?)\}\{(.+?)\}/g, '(($1)/($2))');

  // === 10. КОРНИ ===
  // n-ная степень
  s = s.replace(/sqrt\[(.+?)\]\{(.+?)\}/g, 'nthRoot($2, $1)');
  s = s.replace(/√\[(.+?)\]\{(.+?)\}/g, 'nthRoot($2, $1)');
  
  // Квадратный корень
  s = s.replace(/sqrt\{(.+?)\}/g, 'sqrt($1)');
  s = s.replace(/√\{(.+?)\}/g, 'sqrt($1)');
  s = s.replace(/√(\d+\.?\d*)/g, 'sqrt($1)');
  s = s.replace(/√([a-z])/g, 'sqrt($1)');

  // === 11. ЛОГАРИФМЫ ===
  // С основанием
  s = s.replace(/log_\{(.+?)\}\((.+?)\)/g, 'log($2, $1)');
  s = s.replace(/log_\{(.+?)\}\{(.+?)\}/g, 'log($2, $1)');
  s = s.replace(/log_\{(.+?)\}([a-z0-9]+)/g, 'log($2, $1)');
  
  // Без основания → log10
  s = s.replace(/\blog\(/g, (match, offset) => {
    let depth = 1;
    let hasComma = false;
    for (let i = offset + 4; i < s.length && depth > 0; i++) {
      if (s[i] === '(') depth++;
      if (s[i] === ')') depth--;
      if (s[i] === ',' && depth === 1) hasComma = true;
    }
    return hasComma ? 'log(' : 'log10(';
  });

  // === 12. ФАКТОРИАЛЫ И КОМБИНАТОРИКА ===
  // Факториалы
  s = s.replace(/(\d+)!/g, 'factorial($1)');
  s = s.replace(/([a-z])!/g, 'factorial($1)');
  s = s.replace(/\(([^)]+)\)!/g, 'factorial(($1))');
  
  // Биномиальные коэффициенты
  s = s.replace(/C_\{(\d+)\}\^\{(\d+)\}/g, 'combinations($1, $2)');
  s = s.replace(/C_(\d+)\^(\d+)/g, 'combinations($1, $2)');
  s = s.replace(/C\((\d+),\s*(\d+)\)/gi, 'combinations($1, $2)');
  
  // Размещения
  s = s.replace(/A_\{(\d+)\}\^\{(\d+)\}/g, 'permutations($1, $2)');
  s = s.replace(/A_(\d+)\^(\d+)/g, 'permutations($1, $2)');
  s = s.replace(/A\((\d+),\s*(\d+)\)/gi, 'permutations($1, $2)');

  // === 13. СТЕПЕНИ ===
  s = s.replace(/\^\{(.+?)\}/g, '^($1)');
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\^-(\d+)/g, '^(-$1)');

  // === 14. ЧИСТКА ===
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\\/g, '');

  // === 15. LOWERCASE (с сохранением Infinity) ===
  s = s.toLowerCase();
  s = s.replace(/infinity/g, 'Infinity');

  // === 16. УБИРАЕМ ПРОБЕЛЫ ===
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*([+\-*/^()=])\s*/g, '$1');
  s = s.replace(/(\d)\s+deg/g, '$1 deg');

  // === 17. НЕЯВНОЕ УМНОЖЕНИЕ ===
  const knownFuncs = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'acot',
                      'asinh', 'acosh', 'atanh', 'acoth', 'sinh', 'cosh', 'tanh', 'coth',
                      'sqrt', 'abs', 'log', 'log10', 'exp', 'nthroot', 'factorial', 
                      'combinations', 'permutations'];
  
  // Число перед буквой (НЕ deg!)
  s = s.replace(/(\d)(?=([a-z](?!deg)))/gi, '$1*');
  s = s.replace(/(\d)(?=\()/g, '$1*');
  
  // Скобка перед буквой/скобкой
  s = s.replace(/(\))(?=[a-z])/gi, '$1*');
  s = s.replace(/(\))(?=\()/g, '$1*');
  
  // Буква перед скобкой (если не функция)
  s = s.replace(/([a-z]+)(?=\()/gi, (match, word) => {
    if (knownFuncs.includes(word.toLowerCase())) return word;
    return `${word}*`;
  });
  
  // Последовательности переменных (xy → x*y)
  s = s.replace(/[a-z]+/g, (word) => {
    if (knownFuncs.includes(word.toLowerCase()) || ['pi', 'infinity', 'deg'].includes(word.toLowerCase())) {
      return word;
    }
    
    const chars = word.split('');
    if (chars.length > 1 && chars.every(c => ALGEBRA_SCOPE.hasOwnProperty(c))) {
      return chars.join('*');
    }
    
    return word;
  });

  return s;
}

/**
 * Разворачивает ± в массив вариантов
 */
function expandOptions(str: string): string[] {
  const parts = str.split(';');
  let results: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    part = part.replace(/\\pm/g, '±');
    part = part.replace(/\+-/g, '±');
    part = part.replace(/-\+/g, '∓');
    part = part.replace(/\\mp/g, '∓');

    if (part.includes('±')) {
      const idx = part.indexOf('±');
      const left = part.substring(0, idx);
      const right = part.substring(idx + 1);
      const rStr = right.match(/[+\-*/^]/) ? `(${right})` : right;
      results = results.concat(expandOptions(`${left}+${rStr}`));
      results = results.concat(expandOptions(`${left}-${rStr}`));
      continue;
    }

    if (part.includes('∓')) {
      const idx = part.indexOf('∓');
      const left = part.substring(0, idx);
      const right = part.substring(idx + 1);
      const rStr = right.match(/[+\-*/^]/) ? `(${right})` : right;
      results = results.concat(expandOptions(`${left}-${rStr}`));
      results = results.concat(expandOptions(`${left}+${rStr}`));
      continue;
    }

    results.push(part);
  }
  return results;
}

/**
 * Проверка интервала
 */
function parseInterval(str: string): { isInterval: boolean; values?: number[] } {
  const intervalRegex = /^[\[\(](.+?)[,;](.+?)[\]\)]$/;
  const match = str.match(intervalRegex);
  if (!match) return { isInterval: false };

  try {
    const v1 = parseFloat(match[1].trim());
    const v2 = parseFloat(match[2].trim());
    if (!isNaN(v1) && !isNaN(v2)) {
      return { isInterval: true, values: [v1, v2].sort((a, b) => a - b) };
    }
  } catch (e) {
    // не интервал
  }
  return { isInterval: false };
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ ПРОВЕРКИ ОТВЕТА
 */
export function checkAnswer(userAnswer: string, dbAnswer: string): boolean {
  if (!userAnswer) return false;

  try {
    // === 1. ПРОВЕРКА ИНТЕРВАЛОВ ===
    const userInterval = parseInterval(userAnswer);
    const dbInterval = parseInterval(dbAnswer);
    
    if (userInterval.isInterval && dbInterval.isInterval && userInterval.values && dbInterval.values) {
      return userInterval.values.every((v, i) => 
        Math.abs(v - dbInterval.values![i]) < 0.001
      );
    }

    // === 2. РАЗВЕРТЫВАНИЕ ВАРИАНТОВ (±) ===
    const userExprs = expandOptions(userAnswer);
    const dbExprs = expandOptions(dbAnswer);

    // === 3. ВЫЧИСЛЕНИЕ ЗНАЧЕНИЙ ===
    const calculate = (expr: string): number => {
      try {
        const norm = normalizeForCalculation(expr);
        if (norm === 'NaN') return NaN;
        
        // Проверяем, не периодическая ли дробь
        const trimmed = norm.trim();
        if (PERIODIC_FRACTIONS.hasOwnProperty(trimmed)) {
          return PERIODIC_FRACTIONS[trimmed];
        }
        
        const res = evaluate(norm, ALGEBRA_SCOPE);
        
        if (typeof res === 'number') return res;
        if (typeof res === 'object' && res !== null) {
          if ('re' in res) return (res as any).re; // Комплексное число
        }
        return NaN;
      } catch (e) {
        console.warn('mathUtils calculation error:', expr, e);
        return NaN;
      }
    };

    const userValues = userExprs.map(calculate);
    const dbValues = dbExprs.map(calculate);

    // === 4. FALLBACK НА ТЕКСТОВОЕ СРАВНЕНИЕ ===
    if (userValues.some(isNaN) || dbValues.some(isNaN)) {
      throw new Error("Calculation failed, fallback to text compare");
    }

    // === 5. СОРТИРОВКА И СРАВНЕНИЕ ===
    userValues.sort((a, b) => a - b);
    dbValues.sort((a, b) => a - b);

    if (userValues.length !== dbValues.length) return false;

    // === 6. УМНОЕ СРАВНЕНИЕ С TOLERANCE ===
    return userValues.every((uVal, i) => {
      const dVal = dbValues[i];
      
      // Infinity == Infinity
      if (!isFinite(uVal) || !isFinite(dVal)) {
        return uVal === dVal;
      }

      const diff = Math.abs(uVal - dVal);
      
      // ДЛЯ ЦЕЛЫХ ЧИСЕЛ: Строгое сравнение
      if (Math.abs(Math.round(uVal) - uVal) < 1e-9 && Math.abs(Math.round(dVal) - dVal) < 1e-9) {
        return Math.abs(Math.round(uVal) - Math.round(dVal)) === 0;
      }
      
      // ДЛЯ ДРОБЕЙ: Адаптивная погрешность
      // 0.1% от значения, но минимум 0.001
      const tolerance = Math.max(0.001, Math.abs(dVal * 0.001));
      return diff <= tolerance;
    });

  } catch (e) {
    // === FALLBACK: ТЕКСТОВОЕ СРАВНЕНИЕ ===
    console.warn('mathUtils fallback to text compare:', { userAnswer, dbAnswer, error: e });
    
    const clean = (s: string) => normalizeForCalculation(s).replace(/\s/g, '');
    const userSorted = expandOptions(userAnswer).map(clean).sort().join(';');
    const dbSorted = expandOptions(dbAnswer).map(clean).sort().join(';');
    return userSorted === dbSorted;
  }
}