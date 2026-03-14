import { evaluate } from 'mathjs';

// ============================================================
// ОБЛАСТИ ЗНАЧЕНИЙ ДЛЯ МНОГОТОЧЕЧНОЙ ПРОВЕРКИ ПОЛИНОМОВ
// Используем 3 разные точки — вероятность ложного совпадения
// двух разных полиномов при всех трёх одновременно ≈ 0.
// ============================================================
const MULTI_SCOPES: Array<Record<string, any>> = [
  { x: 3,  y: 7,  z: 11, t: 13, a: 17, b: 19, c: 23, d: 29, m: 31, n: 37, k: 41, p: 43, q: 47, u: 53, v: 59, S: 61, h: 67, r: 71, e: Math.E, pi: Math.PI },
  { x: 2,  y: 5,  z: 7,  t: 3,  a: 11, b: 13, c: 4,  d: 6,  m: 8,  n: 9,  k: 10, p: 12, q: 14, u: 15, v: 16, S: 18, h: 20, r: 22, e: Math.E, pi: Math.PI },
  { x: -2, y: 3,  z: -5, t: 4,  a: -3, b: 7,  c: 2,  d: -4, m: 5,  n: -6, k: 8,  p: -7, q: 9,  u: -1, v: 6,  S: 10, h: -3, r: 4,  e: Math.E, pi: Math.PI },
];

// Первый скоуп — для совместимости со старым кодом
const ALGEBRA_SCOPE = MULTI_SCOPES[0];

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
// КОНВЕРТАЦИЯ \frac — САМЫЙ ПЕРВЫЙ ШАГ
// MathLive выдаёт \frac{a}{b}, нам нужно (a)/(b)
// Обрабатываем рекурсивно, т.к. могут быть вложенные дроби
// ============================================================
function convertFrac(s: string): string {
  // \frac{числитель}{знаменатель} → (числитель)/(знаменатель)
  // Используем цикл т.к. regex не умеет вложенные скобки
  let result = s;
  let prev = '';
  while (prev !== result) {
    prev = result;
    // Простой случай: \frac{A}{B} где A и B — без вложенных {}
    result = result.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  }
  return result;
}

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

  // === 1. \frac ПЕРВЫМ — до всего остального! ===
  s = convertFrac(s);

  // === 2. \text{fn} → fn ===
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');

  // === 3. НЕРАВЕНСТВА ===
  s = s.replace(/\\leq|\\le(?![a-z])|≤/g, '<=');
  s = s.replace(/\\geq|\\ge(?![a-z])|≥/g, '>=');

  // === 4. КОРНИ ===
  // \sqrt[n]{x} → nthroot(x, n)
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'nthroot($2,$1)');
  // \sqrt{x} → sqrt(x)
  s = s.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\sqrt/g, 'sqrt');
  // √x → sqrt(x)
  s = s.replace(/√([a-zA-Z0-9(]+)/g, 'sqrt($1)');
  s = s.replace(/√/g, 'sqrt');

  // === 5. СПЕЦИАЛЬНЫЕ СИМВОЛЫ ===
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/π/g, 'pi');
  s = s.replace(/\\infty|∞/g, 'Infinity');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/×/g, '*');
  s = s.replace(/÷/g, '/');
  s = s.replace(/·/g, '*');

  // === 6. ТРИГОНОМЕТРИЯ ===
  s = s.replace(/\\sin\b/g, 'sin');
  s = s.replace(/\\cos\b/g, 'cos');
  s = s.replace(/\\tan\b/g, 'tan');
  s = s.replace(/\\cot\b/g, 'cot');
  s = s.replace(/\\arcsin\b/g, 'asin');
  s = s.replace(/\\arccos\b/g, 'acos');
  s = s.replace(/\\arctan\b/g, 'atan');
  s = s.replace(/\\ln\b/g, 'log');
  s = s.replace(/\\log\b/g, 'log10');
  s = s.replace(/\\lg\b/g, 'log10');

  // === 7. ГРАДУСЫ ===
  s = s.replace(/(\d+)\s*°/g, '($1 deg)');
  s = s.replace(/°/g, ' deg');

  // === 8. ДРОБНОЕ ДЕЛЕНИЕ — нотация a÷b или a:b ===
  s = s.replace(/:/g, '/');

  // === 9. МИНУС ПЛЮС ===
  s = s.replace(/—/g, '-'); // длинное тире

  // === 10. СТЕПЕНИ ===
  s = s.replace(/\^\{([^}]+)\}/g, '^($1)');
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\^-(\d)/g, '^(-$1)');

  // === 11. ЧИСТКА ОСТАВШЕГОСЯ LATEX ===
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\\/g, '');

  // === 12. LOWERCASE (Infinity сохраняем) ===
  s = s.toLowerCase().replace(/infinity/g, 'Infinity');

  // === 13. ПРОБЕЛЫ ===
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*([+\-*/^()!=<>])\s*/g, '$1');
  s = s.replace(/(\d)\s+deg/g, '$1 deg');

  // === 14. НЕЯВНОЕ УМНОЖЕНИЕ ===
  // 2x → 2*x, 2(3) → 2*(3), )(x → )*(x
  s = s.replace(/(\d)(?=([a-zA-Z](?!eg\b)))/g, '$1*');
  s = s.replace(/(\d)(?=\()/g, '$1*');
  s = s.replace(/\)(?=[a-zA-Z(])/g, ')*');

  // Функции НЕ умножаем: sin(x) остаётся sin(x), не sin*(x)
  s = s.replace(/([a-z]+)(?=\()/gi, (match) => {
    if (KNOWN_FUNCS.has(match.toLowerCase())) return match;
    return match + '*';
  });

  // Многобуквенные переменные — разбиваем на произведение
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
// МНОГОТОЧЕЧНОЕ ВЫЧИСЛЕНИЕ ПОЛИНОМИАЛЬНОГО ВЫРАЖЕНИЯ
// Возвращает массив значений [val_at_scope1, val_at_scope2, val_at_scope3]
// Если хотя бы одно NaN — возвращает [NaN, NaN, NaN]
// ============================================================
function calcMultiPoint(expr: string): [number, number, number] {
  const norm = normalizeForCalculation(expr);
  if (norm === 'NaN' || norm === '') return [NaN, NaN, NaN];

  // Сначала проверяем таблицу периодических дробей
  const trimmed = norm.trim();
  if (PERIODIC_FRACTIONS[trimmed] !== undefined) {
    const v = PERIODIC_FRACTIONS[trimmed];
    return [v, v, v];
  }

  const results: [number, number, number] = [NaN, NaN, NaN];
  for (let i = 0; i < 3; i++) {
    try {
      const res = evaluate(norm, MULTI_SCOPES[i]);
      if (typeof res === 'number' && isFinite(res)) results[i] = res;
      else if (typeof res === 'boolean') results[i] = res ? 1 : 0;
      else if (typeof res === 'object' && res !== null && 're' in res) {
        const re = (res as any).re;
        results[i] = typeof re === 'number' ? re : NaN;
      }
    } catch {
      // оставляем NaN
    }
  }
  return results;
}

// ============================================================
// СРАВНЕНИЕ ДВУХ ЧИСЛОВЫХ ЗНАЧЕНИЙ С ДОПУСКОМ
// ============================================================
function numEq(a: number, b: number): boolean {
  if (!isFinite(a) || !isFinite(b)) return a === b;
  const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
  if (isInt(a) && isInt(b)) return Math.round(a) === Math.round(b);
  const tol = Math.max(0.001, Math.abs(b * 0.001));
  return Math.abs(a - b) <= tol;
}

// ============================================================
// ОПРЕДЕЛЕНИЕ: это неравенство или интервал?
// ============================================================
function isInequalityOrInterval(s: string): boolean {
  if (/[≤≥]|\\le\b|\\ge\b|\\leq\b|\\geq\b|<=|>=/.test(s)) return true;
  if (/\\infty|∞|-inf|Infinity/.test(s)) return true;
  const intervalPattern = /^[\[\(][^;,()]+[;,][^;,()]+[\]\)]$/;
  if (intervalPattern.test(s.trim())) return true;
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
  left: number; right: number;
  leftOpen: boolean; rightOpen: boolean;
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
    if (v === 'Infinity'  || v === 'inf')  return  Infinity;
    return parseFloat(v);
  };

  const left  = parseVal(match[2]);
  const right = parseVal(match[3]);
  if (isNaN(left)  && isFinite(left))  return null;
  if (isNaN(right) && isFinite(right)) return null;

  return { left, right, leftOpen: match[1] === '(', rightOpen: match[4] === ')' };
}

function intervalsEqual(a: ParsedInterval, b: ParsedInterval, eps = 0.001): boolean {
  const cmpVal = (x: number, y: number) => {
    if (!isFinite(x) || !isFinite(y)) return x === y;
    return Math.abs(x - y) < eps;
  };
  return cmpVal(a.left, b.left) && cmpVal(a.right, b.right)
      && a.leftOpen === b.leftOpen && a.rightOpen === b.rightOpen;
}

// ============================================================
// РАЗВЁРТКА ±  и  разбивка по ";"
// ============================================================
function expandOptions(str: string): string[] {
  const parts = str.split(';');
  const results: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    part = part.replace(/\\pm/g, '±').replace(/\+-/g, '±').replace(/-\+/g, '∓').replace(/\\mp/g, '∓');

    if (part.includes('±')) {
      const idx   = part.indexOf('±');
      const left  = part.substring(0, idx);
      const right = part.substring(idx + 1);
      results.push(...expandOptions(`${left}+${right}`));
      results.push(...expandOptions(`${left}-${right}`));
      continue;
    }
    if (part.includes('∓')) {
      const idx   = part.indexOf('∓');
      const left  = part.substring(0, idx);
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
// ОПРЕДЕЛЯЕМ: содержит ли выражение переменные (полином)
// ============================================================
function hasVariables(s: string): boolean {
  // Нормализуем и проверяем наличие переменных из скоупа
  const norm = normalizeForCalculation(s);
  // Если в нормализованном выражении есть буквы, кроме pi/deg/Infinity/функций — это полином
  const withoutConst = norm
    .replace(/\bpi\b/gi, '')
    .replace(/\bInfinity\b/g, '')
    .replace(/\bdeg\b/g, '')
    .replace(/\b(sin|cos|tan|cot|sqrt|abs|log|log10|exp|asin|acos|atan|nthroot|factorial|combinations|permutations)\b/g, '');
  return /[a-zA-Z]/.test(withoutConst);
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
    if (isEmpty(userTrim) || isEmpty(dbTrim)) return false;

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

    // === 2. РАЗБИВКА НА НЕСКОЛЬКО ОТВЕТОВ ЧЕРЕЗ ";" ===
    const userExprs = expandOptions(userTrim);
    const dbExprs   = expandOptions(dbTrim);

    if (userExprs.length !== dbExprs.length) return false;

    // === 3. ПОЛИНОМИАЛЬНЫЕ ВЫРАЖЕНИЯ — МНОГОТОЧЕЧНАЯ ПРОВЕРКА ===
    // Если в ответе есть переменные, проверяем в 3 точках
    const anyHasVars = [...userExprs, ...dbExprs].some(hasVariables);
    if (anyHasVars) {
      // Сортируем значения при каждой точке и сравниваем
      const userMulti = userExprs.map(e => calcMultiPoint(e));
      const dbMulti   = dbExprs.map(e => calcMultiPoint(e));

      // Проверяем что все вычислились без NaN
      const allValid = (vals: [number,number,number][]) =>
        vals.every(([a, b, c]) => !isNaN(a) && !isNaN(b) && !isNaN(c));

      if (allValid(userMulti) && allValid(dbMulti)) {
        // Сортируем по первой точке для порядконезависимости (как было со старым sort)
        userMulti.sort((a, b) => a[0] - b[0]);
        dbMulti.sort((a, b) => a[0] - b[0]);

        return userMulti.every(([u0, u1, u2], i) => {
          const [d0, d1, d2] = dbMulti[i];
          // Все три точки должны совпадать
          return numEq(u0, d0) && numEq(u1, d1) && numEq(u2, d2);
        });
      }
      // Если не смогли вычислить — падаем в текстовое сравнение ниже
    }

    // === 4. ЧИСЛОВЫЕ ВЫРАЖЕНИЯ (без переменных) — ОДНОКРАТНОЕ ВЫЧИСЛЕНИЕ ===
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

    if (!userValues.some(isNaN) && !dbValues.some(isNaN)) {
      userValues.sort((a, b) => a - b);
      dbValues.sort((a, b) => a - b);
      if (userValues.every((uVal, i) => numEq(uVal, dbValues[i]))) return true;
    }

  } catch {
    // fallback ниже
  }

  // === 5. FALLBACK: ТЕКСТОВОЕ СРАВНЕНИЕ ===
  // Нормализуем дроби вида ((a)/(b)) → a/b
  const normFractionStr = (s: string): string =>
    s.replace(/\(\(([^()]+)\)\/\(([^()]+)\)\)/g, '$1/$2')
     .replace(/\(([^()]+)\/([^()]+)\)/g, '$1/$2');

  // Числовой fallback (для случаев когда первый блок бросил исключение)
  const tryCalcFallback = (expr: string): number => {
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

  const uFallbackVals = expandOptions(userTrim).map(tryCalcFallback);
  const dFallbackVals = expandOptions(dbTrim).map(tryCalcFallback);

  if (
    uFallbackVals.length === dFallbackVals.length &&
    uFallbackVals.every(v => !isNaN(v)) &&
    dFallbackVals.every(v => !isNaN(v))
  ) {
    uFallbackVals.sort((a, b) => a - b);
    dFallbackVals.sort((a, b) => a - b);
    if (uFallbackVals.every((uVal, i) => numEq(uVal, dFallbackVals[i]))) return true;
  }

  // Чисто текстовое сравнение
  const clean = (s: string) => {
    if (isInequalityOrInterval(s)) return normalizeInequality(s);
    try {
      const norm = normalizeForCalculation(s).replace(/\s/g, '');
      return normFractionStr(norm);
    } catch {
      return s.toLowerCase().replace(/\s/g, '');
    }
  };

  const userSorted = expandOptions(userTrim).map(clean).sort().join(';');
  const dbSorted   = expandOptions(dbTrim).map(clean).sort().join(';');
  return userSorted === dbSorted;
}

const norm = s
  .replace(/\\infty|∞/g, 'Infinity')
  .replace(/\+Infinity/g, 'Infinity')  // уже есть
  .replace(/\+\\infty|\+∞/g, 'Infinity') // ← добавить это
  .replace(/\\pi/g, String(Math.PI))
  .replace(/\s/g, '');