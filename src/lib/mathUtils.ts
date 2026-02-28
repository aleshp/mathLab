import { evaluate } from 'mathjs';

// ============================================================
// SCOPE ДЛЯ АЛГЕБРАИЧЕСКИХ ВЫЧИСЛЕНИЙ
// ============================================================
const ALGEBRA_SCOPE: Record<string, any> = {
  x: 3, y: 7, z: 11, t: 13,
  a: 17, b: 19, c: 23, d: 29,
  m: 31, n: 37, k: 41, p: 43, q: 47,
  u: 53, v: 59, S: 61, h: 67, r: 71,
  e: Math.E,
  pi: Math.PI,

  combinations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let result = 1;
    for (let i = 0; i < k; i++) result *= (n - i) / (i + 1);
    return Math.round(result);
  },

  permutations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    let result = 1;
    for (let i = 0; i < k; i++) result *= (n - i);
    return result;
  },
};

// ============================================================
// ПЕРИОДИЧЕСКИЕ ДРОБИ
// ============================================================
const PERIODIC_FRACTIONS: Record<string, number> = {
  '0.3': 1/3, '0.33': 1/3, '0.333': 1/3,
  '0.6': 2/3, '0.66': 2/3, '0.666': 2/3,
  '0.16': 1/6, '0.166': 1/6,
  '0.83': 5/6, '0.833': 5/6,
  '0.142': 1/7, '0.1428': 1/7,
  '0.285': 2/7, '0.2857': 2/7,
  '0.428': 3/7, '0.4285': 3/7,
  '0.571': 4/7, '0.5714': 4/7,
  '0.714': 5/7, '0.7142': 5/7,
  '0.857': 6/7, '0.8571': 6/7,
  '0.1': 1/9, '0.11': 1/9, '0.111': 1/9,
  '0.2': 2/9, '0.22': 2/9, '0.222': 2/9,
  '0.4': 4/9, '0.44': 4/9, '0.444': 4/9,
  '0.5': 5/9, '0.55': 5/9, '0.555': 5/9,
  '0.7': 7/9, '0.77': 7/9, '0.777': 7/9,
  '0.8': 8/9, '0.88': 8/9, '0.888': 8/9,
};

// ============================================================
// СПИСОК ИЗВЕСТНЫХ ФУНКЦИЙ (все lowercase!)
// ============================================================
const KNOWN_FUNCS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'asin', 'acos', 'atan', 'acot', 'asec', 'acsc',
  'sinh', 'cosh', 'tanh', 'coth',
  'asinh', 'acosh', 'atanh', 'acoth',
  'sqrt', 'abs', 'log', 'log10', 'exp',
  'nthroot', 'factorial', 'combinations', 'permutations',
]);

// ============================================================
// НОРМАЛИЗАЦИЯ ДЛЯ ВЫЧИСЛЕНИЯ
// ============================================================
export function normalizeForCalculation(str: string): string {
  if (!str) return '';
  let s = str.trim();

  // === 0. СПЕЦСЛУЧАИ ===
  s = s.replace(/^[a-zA-Z]\s*=\s*/, '');

  if (
    /\\emptyset|\\O\b|∅/.test(s) ||
    /no\s*solution/i.test(s) ||
    /нет\s*решений/i.test(s) ||
    /корней\s*нет/i.test(s)
  ) return 'NaN';

  // === 1. \text{fn} → fn  (ДО удаления слешей!) ===
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');

  // === 2. НЕРАВЕНСТВА — ДО удаления слешей! ===
  s = s.replace(/\\leq|\\le(?![a-z])|≤/g, '<=');
  s = s.replace(/\\geq|\\ge(?![a-z])|≥/g, '>=');
  s = s.replace(/\\neq|≠/g, '!=');

  // === 3. ФУНКЦИИ — заменяем ДО удаления слешей ===
  const funcReplacements: [RegExp, string][] = [
    [/\\arcsin\b/g,  'asin'],
    [/\\arccos\b/g,  'acos'],
    [/\\arctan\b/g,  'atan'],
    [/\\arctg\b/g,   'atan'],
    [/\\arcctg\b/g,  'acot'],
    [/\\arcsinh\b/g, 'asinh'],
    [/\\arccosh\b/g, 'acosh'],
    [/\\arctanh\b/g, 'atanh'],
    [/\\arccoth\b/g, 'acoth'],
    [/\\sin\b/g,     'sin'],
    [/\\cos\b/g,     'cos'],
    [/\\tan\b/g,     'tan'],
    [/\\tg\b/g,      'tan'],
    [/\\cot\b/g,     'cot'],
    [/\\ctg\b/g,     'cot'],
    [/\\sec\b/g,     'sec'],
    [/\\csc\b/g,     'csc'],
    [/\\sinh\b/g,    'sinh'],
    [/\\cosh\b/g,    'cosh'],
    [/\\tanh\b/g,    'tanh'],
    [/\\coth\b/g,    'coth'],
    [/\\log\b/g,     'log'],
    [/\\ln\b/g,      'log'],
    [/\\lg\b/g,      'log10'],
    [/\\exp\b/g,     'exp'],
    [/\\sqrt\b/g,    'sqrt'],
    [/\\lim\b/g,     ''],
  ];
  for (const [rx, rep] of funcReplacements) {
    s = s.replace(rx, rep);
  }

  const wordFuncReplacements: [RegExp, string][] = [
    [/\barcsin\b/gi,  'asin'],
    [/\barccos\b/gi,  'acos'],
    [/\barctan\b/gi,  'atan'],
    [/\barctg\b/gi,   'atan'],
    [/\barcctg\b/gi,  'acot'],
    [/\barcsinh\b/gi, 'asinh'],
    [/\barccosh\b/gi, 'acosh'],
    [/\barctanh\b/gi, 'atanh'],
    [/\barccoth\b/gi, 'acoth'],
    [/\btg\b/gi,      'tan'],
    [/\bctg\b/gi,     'cot'],
    [/\bsh\b/gi,      'sinh'],
    [/\bch\b/gi,      'cosh'],
    [/\bth\b/gi,      'tanh'],
    [/\blg\b/gi,      'log10'],
    [/\bln\b/gi,      'log'],
  ];
  for (const [rx, rep] of wordFuncReplacements) {
    s = s.replace(rx, rep);
  }

  // === 4. МУСОР LATEX ===
  s = s.replace(/\\displaystyle/g, '');
  s = s.replace(/\\,|\\:|\\;|\\quad|\\qquad/g, '');
  s = s.replace(/\\left|\\right/g, '');

  // === 5. СИМВОЛЫ ===
  s = s.replace(/\{,\}/g, '.');
  s = s.replace(/(\d),(\d)/g, '$1.$2');

  s = s.replace(/\\cdot|\\times|×|⋅/g, '*');
  s = s.replace(/\\div|÷/g, '/');
  s = s.replace(/[−–—]/g, '-');

  s = s.replace(/(\d+):(\d+)/g, (m, a, b) =>
    parseInt(a) < 100 && parseInt(b) < 100 ? `${a}/${b}` : m
  );

  s = s.replace(/\\%/g, '/100');
  s = s.replace(/([0-9.]+)%/g, '($1/100)');

  s = s.replace(/\^\{\\circ\}|\\circ/g, ' deg');
  s = s.replace(/°/g, ' deg');

  s = s.replace(/\\infty|∞/g, 'Infinity');
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/π/g, 'pi');

  s = s.replace(/\\mathrm\{e\}|\\e\b/g, 'e');

  // === 6. ПЛЮС-МИНУС ===
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');

  // === 7. МОДУЛЬ ===
  s = s.replace(/\|([^|]+)\|/g, 'abs($1)');

  // === 8. ТРИГОНОМЕТРИЧЕСКИЕ СТЕПЕНИ ===
  const trigList = 'sin|cos|tan|cot|sec|csc|asin|acos|atan|acot|asinh|acosh|atanh|acoth|sinh|cosh|tanh|coth|log|log10';
  s = s.replace(
    new RegExp(`(${trigList})\\^\\{?(\\d+)\\}?\\s*(\\([^)]+\\))`, 'gi'),
    '($1$3)^$2'
  );
  s = s.replace(
    new RegExp(`(${trigList})\\^\\{?(\\d+)\\}?\\s*([a-z])(?!\\()`, 'gi'),
    '($1($3))^$2'
  );

  // === 9. СМЕШАННЫЕ ЧИСЛА LaTeX: 15\frac{73}{144} ===
  // ФИКС ИИ: (\d) → (\d+) — теперь работает с многозначными целыми (133 2/3)
  s = s.replace(/(\d+)\s*\\?frac\{([^}]+)\}\{([^}]+)\}/g, '($1+($2)/($3))');
  // Обычный вид: 15 73/144 (с пробелом)
  s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, '($1+$2/$3)');

  // === 10. ДРОБИ \frac{a}{b} ===
  let prev = '';
  let iter = 0;
  while (prev !== s && iter < 10) {
    prev = s;
    s = s.replace(/d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
    iter++;
  }

  // === 11. КОРНИ ===
  s = s.replace(/sqrt\[(.+?)\]\{(.+?)\}/g,  'nthRoot($2,$1)');
  s = s.replace(/√\[(.+?)\]\{(.+?)\}/g,     'nthRoot($2,$1)');
  s = s.replace(/sqrt\{([^}]+)\}/g,          'sqrt($1)');
  s = s.replace(/√\{([^}]+)\}/g,             'sqrt($1)');
  s = s.replace(/√(\d+\.?\d*)/g,             'sqrt($1)');
  s = s.replace(/√([a-z])/g,                 'sqrt($1)');

  // === 12. ЛОГАРИФМЫ С ОСНОВАНИЕМ ===
  s = s.replace(/log_\{([^}]+)\}\(([^)]+)\)/g, 'log($2,$1)');
  s = s.replace(/log_\{([^}]+)\}\{([^}]+)\}/g, 'log($2,$1)');
  s = s.replace(/log_\{([^}]+)\}([a-z0-9]+)/g, 'log($2,$1)');
  s = s.replace(/log_([0-9]+)\(([^)]+)\)/g,    'log($2,$1)');

  s = s.replace(/\blog\(([^)]+)\)/g, (_, inner) =>
    inner.includes(',') ? `log(${inner})` : `log10(${inner})`
  );

  // === 13. ФАКТОРИАЛЫ И КОМБИНАТОРИКА ===
  s = s.replace(/\(([^)]+)\)!/g, 'factorial(($1))');
  s = s.replace(/(\d+)!/g,       'factorial($1)');
  s = s.replace(/([a-z])!/g,     'factorial($1)');

  s = s.replace(/C_\{(\d+)\}\^\{(\d+)\}/g, 'combinations($1,$2)');
  s = s.replace(/C_(\d+)\^(\d+)/g,         'combinations($1,$2)');
  s = s.replace(/C\((\d+),\s*(\d+)\)/gi,   'combinations($1,$2)');

  s = s.replace(/A_\{(\d+)\}\^\{(\d+)\}/g, 'permutations($1,$2)');
  s = s.replace(/A_(\d+)\^(\d+)/g,         'permutations($1,$2)');
  s = s.replace(/A\((\d+),\s*(\d+)\)/gi,   'permutations($1,$2)');

  // === 14. СТЕПЕНИ ===
  s = s.replace(/\^\{([^}]+)\}/g, '^($1)');
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\^-(\d)/g, '^(-$1)');

  // === 15. ЧИСТКА ОСТАВШЕГОСЯ LATEX ===
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\\/g, '');

  // === 16. LOWERCASE (Infinity сохраняем) ===
  s = s.toLowerCase().replace(/infinity/g, 'Infinity');

  // === 17. ПРОБЕЛЫ ===
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*([+\-*/^()!=<>])\s*/g, '$1');
  s = s.replace(/(\d)\s+deg/g, '$1 deg');

  // === 18. НЕЯВНОЕ УМНОЖЕНИЕ ===
  s = s.replace(/(\d)(?=([a-zA-Z](?!eg\b)))/g, '$1*');
  s = s.replace(/(\d)(?=\()/g, '$1*');
  s = s.replace(/\)(?=[a-zA-Z(])/g, ')*');

  s = s.replace(/([a-z]+)(?=\()/gi, (match) => {
    if (KNOWN_FUNCS.has(match.toLowerCase())) return match;
    return match + '*';
  });

  s = s.replace(/[a-z]{2,}/gi, (word) => {
    const lower = word.toLowerCase();
    if (KNOWN_FUNCS.has(lower)) return word;
    if (['pi', 'infinity', 'deg'].includes(lower)) return word;
    const chars = word.split('');
    if (chars.every(c => c in ALGEBRA_SCOPE)) return chars.join('*');
    return word;
  });

  return s;
}

// ============================================================
// РАЗВЁРТКА ±
// ============================================================
function expandOptions(str: string): string[] {
  const parts = str.split(';');
  const results: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    part = part.replace(/\\pm/g, '±').replace(/\+-/g, '±').replace(/-\+/g, '∓').replace(/\\mp/g, '∓');

    if (part.includes('±')) {
      const idx = part.indexOf('±');
      const left = part.substring(0, idx);
      const right = part.substring(idx + 1);
      results.push(...expandOptions(`${left}+${right}`));
      results.push(...expandOptions(`${left}-${right}`));
      continue;
    }
    if (part.includes('∓')) {
      const idx = part.indexOf('∓');
      const left = part.substring(0, idx);
      const right = part.substring(idx + 1);
      results.push(...expandOptions(`${left}-${right}`));
      results.push(...expandOptions(`${left}+${right}`));
      continue;
    }
    results.push(part);
  }
  return results;
}

// ============================================================
// ОПРЕДЕЛЕНИЕ: это неравенство или интервал?
// ============================================================
function isInequalityOrInterval(s: string): boolean {
  if (/[≤≥]|\\le\b|\\ge\b|\\leq\b|\\geq\b|<=|>=/.test(s)) return true;
  if (/\\infty|∞|-inf|Infinity/.test(s)) return true;
  const intervalPattern = /^[\[\(][^;,()]+[;,][^;,()]+[\]\)]$/;
  const trimmed = s.trim();
  if (intervalPattern.test(trimmed)) return true;
  if (/[Uu∪]/.test(s) && /[\[\(]/.test(s)) return true;
  return false;
}

// ============================================================
// НОРМАЛИЗАЦИЯ НЕРАВЕНСТВА ДЛЯ ТЕКСТОВОГО СРАВНЕНИЯ
// ============================================================
function normalizeInequality(s: string): string {
  return s
    .replace(/\\leq|\\le(?![a-z])|≤/g, '<=')
    .replace(/\\geq|\\ge(?![a-z])|≥/g, '>=')
    .replace(/\\infty|∞/g, 'inf')
    .replace(/\+inf/g, 'inf')
    .replace(/\\emptyset|∅/g, 'empty')
    .replace(/\\/g, '')
    .replace(/\s+/g, '')
    .replace(/;/g, ',')
    .toLowerCase()
    .trim();
}

// ============================================================
// ПАРСИНГ ИНТЕРВАЛА: (-∞; 6], (2; 5), [3; 7]
// ============================================================
interface ParsedInterval {
  left: number;
  right: number;
  leftOpen: boolean;
  rightOpen: boolean;
}

function parseInterval(s: string): ParsedInterval | null {
  const norm = s
    .replace(/\\infty|∞/g, 'Infinity')
    .replace(/\+Infinity/g, 'Infinity')
    .replace(/\\pi/g, String(Math.PI))
    .replace(/\s/g, '');

  const match = norm.match(/^([\[\(])(.*?)[,;](.*?)([\]\)])$/);
  if (!match) return null;

  const parseVal = (v: string) => {
    if (v === '-Infinity' || v === '-inf') return -Infinity;
    if (v === 'Infinity' || v === 'inf') return Infinity;
    return parseFloat(v);
  };

  const left  = parseVal(match[2]);
  const right = parseVal(match[3]);
  if (isNaN(left) && isFinite(left)) return null;
  if (isNaN(right) && isFinite(right)) return null;

  return {
    left,
    right,
    leftOpen:  match[1] === '(',
    rightOpen: match[4] === ')',
  };
}

// ============================================================
// СРАВНЕНИЕ ИНТЕРВАЛОВ
// ============================================================
function intervalsEqual(a: ParsedInterval, b: ParsedInterval, eps = 0.001): boolean {
  const cmpVal = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return x === y;
    return Math.abs(x - y) < eps;
  };
  return (
    cmpVal(a.left, b.left) &&
    cmpVal(a.right, b.right) &&
    a.leftOpen === b.leftOpen &&
    a.rightOpen === b.rightOpen
  );
}

// ============================================================
// ГЛАВНАЯ ФУНКЦИЯ ПРОВЕРКИ
// ============================================================
export function checkAnswer(userAnswer: string, dbAnswer: string): boolean {
  if (!userAnswer || !dbAnswer) return false;

  const userTrim = userAnswer.trim();
  const dbTrim   = dbAnswer.trim();

  try {
    // === 0. ПУСТОЕ МНОЖЕСТВО ===
    const isEmpty = (s: string) =>
      /\\emptyset|\\O\b|∅|нет\s*решений|no\s*solution|корней\s*нет/i.test(s) ||
      s.trim() === '∅' || s.trim() === '\\emptyset';

    if (isEmpty(userTrim) && isEmpty(dbTrim)) return true;
    if (isEmpty(userTrim) || isEmpty(dbTrim))  return false;

    // === 1. НЕРАВЕНСТВА И ИНТЕРВАЛЫ ===
    if (isInequalityOrInterval(userTrim) || isInequalityOrInterval(dbTrim)) {
      const splitUnion = (s: string) =>
        s.split(/\s*[Uu∪]\s*/).map(p => p.trim()).filter(Boolean);

      const uParts = splitUnion(userTrim);
      const dParts = splitUnion(dbTrim);

      if (uParts.length !== dParts.length) return false;

      if (uParts.length > 1) {
        return uParts.every((up, i) => {
          const ui = parseInterval(up);
          const di = parseInterval(dParts[i]);
          if (ui && di) return intervalsEqual(ui, di);
          return normalizeInequality(up) === normalizeInequality(dParts[i]);
        });
      }

      const uInt = parseInterval(userTrim);
      const dInt = parseInterval(dbTrim);
      if (uInt && dInt) return intervalsEqual(uInt, dInt);

      return normalizeInequality(userTrim) === normalizeInequality(dbTrim);
    }

    // === 2. НЕСКОЛЬКО ТОЧЕК/ОТВЕТОВ через ";" ===
    const userExprs = expandOptions(userTrim);
    const dbExprs   = expandOptions(dbTrim);

    // === 3. ВЫЧИСЛЕНИЕ ===
    const calculate = (expr: string): number => {
      try {
        const norm = normalizeForCalculation(expr);
        if (norm === 'NaN' || norm === '') return NaN;

        const trimmed = norm.trim();
        if (PERIODIC_FRACTIONS[trimmed] !== undefined) return PERIODIC_FRACTIONS[trimmed];

        const res = evaluate(norm, ALGEBRA_SCOPE);
        if (typeof res === 'number') return res;
        if (typeof res === 'boolean') return res ? 1 : 0;
        if (typeof res === 'object' && res !== null && 're' in res) return (res as any).re;
        return NaN;
      } catch {
        return NaN;
      }
    };

    const userValues = userExprs.map(calculate);
    const dbValues   = dbExprs.map(calculate);

    if (userValues.some(isNaN) || dbValues.some(isNaN)) {
      throw new Error('fallback');
    }

    if (userValues.length !== dbValues.length) return false;

    userValues.sort((a, b) => a - b);
    dbValues.sort((a, b) => a - b);

    return userValues.every((uVal, i) => {
      const dVal = dbValues[i];
      if (!isFinite(uVal) || !isFinite(dVal)) return uVal === dVal;

      const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
      if (isInt(uVal) && isInt(dVal)) {
        return Math.round(uVal) === Math.round(dVal);
      }

      const tolerance = Math.max(0.001, Math.abs(dVal * 0.001));
      return Math.abs(uVal - dVal) <= tolerance;
    });

  } catch {
    // === FALLBACK: текстовое сравнение ===
    const clean = (s: string) => {
      if (isInequalityOrInterval(s)) return normalizeInequality(s);
      try {
        return normalizeForCalculation(s).replace(/\s/g, '');
      } catch {
        return s.toLowerCase().replace(/\s/g, '');
      }
    };

    const userSorted = expandOptions(userTrim).map(clean).sort().join(';');
    const dbSorted   = expandOptions(dbTrim).map(clean).sort().join(';');
    return userSorted === dbSorted;
  }
}