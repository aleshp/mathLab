import { evaluate } from 'mathjs';

// ════════════════════════════════════════════════════════════════════════
// MATHUTILS.TS — Полная обработка математических выражений
//
// Покрывает ВСЕ токены MathKeypad:
//   Tab1 (Basic): \frac, \sqrt, ^{n}, \times, \div, \pm, ;, =, >, <, \geq, \leq, \neq
//   Tab2 (Func):  \left|..\right|, e, i, !, \ln, \log_{b}, \text{sign},
//                 \bar{z}, \begin{bmatrix}, \begin{vmatrix},
//                 C_{n}^{k}, A_{n}^{k}, P_{n}, \binom{n}{k}, \infty, \%
//   Tab3 (Trig):  \sin,\cos,\tan,\cot,\sec,\csc, \arcsin...\arccsc,
//                 ^\circ, °, \text{rad}, \alpha,\beta,\gamma,\theta,
//                 \pi,\phi,\omega,\Delta,\Omega,\lambda
//
// Форматы ответов в БД:
//   числа, дроби (1/2, \frac{1}{2}), корни (8\sqrt{3}),
//   полиномы (x^4-4x^2+x), интервалы ((-\infty;+\infty)),
//   множественные ответы (2;-3), ±, пустое множество
//
// MathLive автоматически оборачивает аргументы функций в \left(\right)
// ════════════════════════════════════════════════════════════════════════


// ════════════════════════════════════════════════════════════════════════
// СКОУПЫ ДЛЯ МНОГОТОЧЕЧНОЙ ПРОВЕРКИ ПОЛИНОМОВ
// 3 точки → вероятность ложного совпадения двух разных полиномов ≈ 0
// ════════════════════════════════════════════════════════════════════════
const SCOPES: Array<Record<string, number>> = [
  { x:3,  y:7,  z:11, t:13, a:17, b:19, c:23, d:29, m:31, n:37, k:41, p:43, q:47, u:53, v:59, S:61, h:67, r:71, f:2, g:5, w:73, s_:79 },
  { x:2,  y:5,  z:7,  t:3,  a:11, b:13, c:4,  d:6,  m:8,  n:9,  k:10, p:12, q:14, u:15, v:16, S:18, h:20, r:22, f:3, g:4, w:25, s_:27 },
  { x:-2, y:3,  z:-5, t:4,  a:-3, b:7,  c:2,  d:-4, m:5,  n:-6, k:8,  p:-7, q:9,  u:-1, v:6,  S:10, h:-3, r:4,  f:6, g:8, w:-9, s_:11 },
];

// Дополнительные константы в каждом скоупе
const SCOPE_CONSTS: Record<string, number> = {
  e: Math.E, pi: Math.PI,
};
const ALGEBRA_SCOPE = { ...SCOPES[0], ...SCOPE_CONSTS };
SCOPES.forEach(sc => Object.assign(sc, SCOPE_CONSTS));


// ════════════════════════════════════════════════════════════════════════
// ПЕРИОДИЧЕСКИЕ ДРОБИ
// ════════════════════════════════════════════════════════════════════════
const PERIODIC: Record<string, number> = {
  '0.3':1/3,'0.33':1/3,'0.333':1/3,'0.3333':1/3,
  '0.6':2/3,'0.66':2/3,'0.666':2/3,'0.6666':2/3,
  '0.16':1/6,'0.166':1/6,'0.1666':1/6,
  '0.83':5/6,'0.833':5/6,'0.8333':5/6,
  '0.142':1/7,'0.1428':1/7,'0.14285':1/7,
  '0.285':2/7,'0.2857':2/7,
  '0.428':3/7,'0.4285':3/7,
  '0.571':4/7,'0.5714':4/7,
  '0.714':5/7,'0.7142':5/7,
  '0.857':6/7,'0.8571':6/7,
  '0.1':1/9,'0.11':1/9,'0.111':1/9,
  '0.2':2/9,'0.22':2/9,'0.222':2/9,
  '0.4':4/9,'0.44':4/9,'0.444':4/9,
  '0.5':5/9,'0.55':5/9,'0.555':5/9,
  '0.7':7/9,'0.77':7/9,'0.777':7/9,
  '0.8':8/9,'0.88':8/9,'0.888':8/9,
};


// ════════════════════════════════════════════════════════════════════════
// ИЗВЕСТНЫЕ ФУНКЦИИ (lowercase) — не разбиваем на произведение букв
// ════════════════════════════════════════════════════════════════════════
const KNOWN_FUNCS = new Set([
  'sin','cos','tan','cot','sec','csc',
  'asin','acos','atan','acot','asec','acsc',
  'arcsin','arccos','arctan','arccot','arcsec','arccsc',
  'sinh','cosh','tanh','coth','asinh','acosh','atanh',
  'sqrt','abs','log','log10','log2','exp','sign','conj',
  'nthroot','factorial','combinations','permutations','cbrt',
]);

// mathjs alias: cot не всегда встроен — добавим в scope
const EXTRA_FUNCS: Record<string, (...args: number[]) => number> = {
  cot:  (x: number) => 1 / Math.tan(x),
  sec:  (x: number) => 1 / Math.cos(x),
  csc:  (x: number) => 1 / Math.sin(x),
  acot: (x: number) => Math.PI / 2 - Math.atan(x),
  asec: (x: number) => Math.acos(1 / x),
  acsc: (x: number) => Math.asin(1 / x),
  sign: (x: number) => Math.sign(x),
  combinations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    let r = 1;
    for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return Math.round(r);
  },
  permutations: (n: number, k: number): number => {
    if (k > n || k < 0 || n < 0) return 0;
    let r = 1;
    for (let i = 0; i < k; i++) r *= (n - i);
    return r;
  },
};
SCOPES.forEach(sc => Object.assign(sc, EXTRA_FUNCS));
Object.assign(ALGEBRA_SCOPE, EXTRA_FUNCS);


// ════════════════════════════════════════════════════════════════════════
// ШАГ 0: РЕКУРСИВНАЯ КОНВЕРТАЦИЯ \frac{a}{b} → (a)/(b)
// Выполняется ДО любых других преобразований
// MathLive output: \frac{1}{2}, \frac{x+1}{x-1}, вложенные дроби
// ════════════════════════════════════════════════════════════════════════
function convertFrac(s: string): string {
  let prev = '';
  while (prev !== s) {
    prev = s;
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
  }
  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 1: КОНВЕРТАЦИЯ \left|...\right| → abs(...)
// ВАЖНО: выполнять ПЕРЕД заменой \left( → (
// Покрывает: \left|x\right|, \left\lvert x\right\rvert
// ════════════════════════════════════════════════════════════════════════
function convertAbs(s: string): string {
  // \left| ... \right|
  s = s.replace(/\\left\s*\|/g, 'abs(');
  s = s.replace(/\\right\s*\|/g, ')');
  // \left\lvert ... \right\rvert
  s = s.replace(/\\left\s*\\lvert/g, 'abs(');
  s = s.replace(/\\right\s*\\rvert/g, ')');
  // \lvert ... \rvert
  s = s.replace(/\\lvert/g, 'abs(');
  s = s.replace(/\\rvert/g, ')');
  // vmatrix (определитель): \begin{vmatrix}...\end{vmatrix} → det(...)
  // Для простых случаев 2x2 попробуем вычислить, иначе текстовое сравнение
  s = s.replace(/\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g, (_, inner) => {
    return 'det_mat(' + inner.replace(/\\\\/g, ';').replace(/&/g, ',') + ')';
  });
  // bmatrix → matrix_mat для текстового сравнения
  s = s.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (_, inner) => {
    return 'mat(' + inner.replace(/\\\\/g, ';').replace(/&/g, ',') + ')';
  });
  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 2: \left( → (, \right) → ), \left[ → [, \right] → ]
// MathLive автоматически добавляет \left\right к функциям
// ════════════════════════════════════════════════════════════════════════
function convertBrackets(s: string): string {
  s = s.replace(/\\left\s*\(/g, '(');
  s = s.replace(/\\right\s*\)/g, ')');
  s = s.replace(/\\left\s*\[/g, '[');
  s = s.replace(/\\right\s*\]/g, ']');
  s = s.replace(/\\left\s*\\{/g, '(');
  s = s.replace(/\\right\s*\\}/g, ')');
  s = s.replace(/\\left\s*\./g, '');   // \left. — пустой разделитель
  s = s.replace(/\\right\s*\./g, '');  // \right.
  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 3: ГРАДУСЫ
// MathLive output: 30^{\circ}, также может быть 30°
// ВАЖНО: выполнять ПЕРЕД обработкой ^{...} как степени
// ════════════════════════════════════════════════════════════════════════
function convertDegrees(s: string): string {
  // ^{\circ} после числа или выражения — это градусы, не степень
  s = s.replace(/\^\{\\?circ\}/g,  ' deg');
  s = s.replace(/\^\{°\}/g,         ' deg');
  s = s.replace(/\^\\?circ\b/g,    ' deg');
  s = s.replace(/°/g,               ' deg');
  s = s.replace(/∘/g,               ' deg');  // Unicode degree operator
  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 4: КОМБИНАТОРИКА
// C_{n}^{k} — сочетания, A_{n}^{k} — размещения, P_{n} — перестановки
// \binom{n}{k} — биномиальный коэффициент (= C_n^k)
// MathLive output: C_{5}^{3}, A_{5}^{3}, P_{5}, \binom{5}{3}
// ════════════════════════════════════════════════════════════════════════
function convertCombinatorics(s: string): string {
  // \binom{n}{k} → combinations(n,k)
  s = s.replace(/\\binom\{([^{}]+)\}\{([^{}]+)\}/g, 'combinations($1,$2)');

  // C_{n}^{k} или C^{k}_{n}
  s = s.replace(/C_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'combinations($1,$2)');
  s = s.replace(/C\^\{([^{}]+)\}_\{([^{}]+)\}/g, 'combinations($2,$1)');
  s = s.replace(/C_(\d+)\^(\d+)/g,               'combinations($1,$2)');
  s = s.replace(/C\((\d+)[,;]\s*(\d+)\)/gi,      'combinations($1,$2)');

  // A_{n}^{k} — размещения
  s = s.replace(/A_\{([^{}]+)\}\^\{([^{}]+)\}/g, 'permutations($1,$2)');
  s = s.replace(/A_(\d+)\^(\d+)/g,               'permutations($1,$2)');
  s = s.replace(/A\((\d+)[,;]\s*(\d+)\)/gi,      'permutations($1,$2)');

  // P_{n} — перестановки = n!
  s = s.replace(/P_\{([^{}]+)\}/g, 'factorial($1)');
  s = s.replace(/P_(\d+)/g,        'factorial($1)');

  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 5: ЛОГАРИФМЫ
// Порядок важен: специфичные РАНЬШЕ общих
// MathLive: \ln(x), \log_{10}(x), \log_{2}(x), \log_{b}(x)
// ════════════════════════════════════════════════════════════════════════
function convertLogs(s: string): string {
  // \ln → log (натуральный логарифм в mathjs = log)
  s = s.replace(/\\ln\b/g, 'log');

  // \log_{10} → log10
  s = s.replace(/\\log_\{10\}/g, 'log10');
  s = s.replace(/\\log_10\b/g,   'log10');

  // \log_{2} → log2 (в mathjs: log(x,2))
  s = s.replace(/\\log_\{2\}/g,  'log2_');  // временный маркер
  s = s.replace(/\\log_2\b/g,    'log2_');

  // \log_{b}(x) → log(x,b)  — произвольное основание
  s = s.replace(/\\log_\{([^{}]+)\}/g, 'log_BASE_$1_');

  // \log → log10 (школьный lg = log10)
  s = s.replace(/\\log\b/g,  'log10');
  s = s.replace(/\\lg\b/g,   'log10');

  // Раскрываем log2_: log2_(x) → log(x,2)
  s = s.replace(/log2_\s*\(([^()]+)\)/g, 'log($1,2)');
  s = s.replace(/log2_\s*/g, 'log2_NOARG');  // без скобок — упадёт в fallback

  // Раскрываем log_BASE_b_: log_BASE_b_(x) → log(x,b)
  s = s.replace(/log_BASE_([^_]+)_\s*\(([^()]+)\)/g, 'log($2,$1)');
  s = s.replace(/log_BASE_([^_]+)_\s*/g, 'logBASE_NOARG');

  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 6: ТРИГОНОМЕТРИЯ
// MathLive output: \sin\left(x\right), \arcsin\left(x\right)
// (скобки уже обработаны convertBrackets)
// ════════════════════════════════════════════════════════════════════════
function convertTrig(s: string): string {
  // Обратные функции — ПЕРЕД прямыми (arcsin перед sin!)
  s = s.replace(/\\arcsin\b/g, 'asin');
  s = s.replace(/\\arccos\b/g, 'acos');
  s = s.replace(/\\arctan\b/g, 'atan');
  s = s.replace(/\\arccot\b/g, 'acot');
  s = s.replace(/\\arcsec\b/g, 'asec');
  s = s.replace(/\\arccsc\b/g, 'acsc');

  // Прямые функции
  s = s.replace(/\\sin\b/g, 'sin');
  s = s.replace(/\\cos\b/g, 'cos');
  s = s.replace(/\\tan\b/g, 'tan');
  s = s.replace(/\\cot\b/g, 'cot');
  s = s.replace(/\\sec\b/g, 'sec');
  s = s.replace(/\\csc\b/g, 'csc');

  // Гиперболические
  s = s.replace(/\\sinh\b/g, 'sinh');
  s = s.replace(/\\cosh\b/g, 'cosh');
  s = s.replace(/\\tanh\b/g, 'tanh');

  // \text{rad} — просто убираем (радианы — дефолт)
  s = s.replace(/\\text\{rad\}/g, '');
  s = s.replace(/\brad\b/g, '');

  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ШАГ 7: КОРНИ
// MathLive: \sqrt{x}, \sqrt[n]{x}, \sqrt[3]{x}
// ════════════════════════════════════════════════════════════════════════
function convertRoots(s: string): string {
  // \sqrt[n]{x} → nthroot(x,n)
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, 'nthroot($2,$1)');
  // \sqrt{x} → sqrt(x)
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\sqrt\b/g, 'sqrt');
  // Unicode √
  s = s.replace(/∛([a-zA-Z0-9(]+)/g, 'nthroot($1,3)');
  s = s.replace(/∜([a-zA-Z0-9(]+)/g, 'nthroot($1,4)');
  s = s.replace(/√([a-zA-Z0-9(]+)/g, 'sqrt($1)');
  s = s.replace(/√/g, 'sqrt');
  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ОСНОВНАЯ НОРМАЛИЗАЦИЯ
// ════════════════════════════════════════════════════════════════════════
export function normalizeForCalculation(raw: string): string {
  if (!raw) return '';
  let s = raw.trim();

  // ── СПЕЦСЛУЧАИ ────────────────────────────────────────────────────────
  // Убираем "x = " префикс (уравнения вида "x = 5")
  s = s.replace(/^[a-zA-Z]\s*=\s*/, '');

  if (
    /\\emptyset|\\varnothing|∅/.test(s) ||
    /no\s*solution/i.test(s) ||
    /нет\s*решений/i.test(s) ||
    /корней\s*нет/i.test(s) ||
    /∅/.test(s)
  ) return 'NaN';

  // ── ФАЗА 1: СТРУКТУРНЫЕ КОНВЕРТАЦИИ (порядок КРИТИЧЕН) ───────────────

  // 1a. \frac{}{} → ()/() рекурсивно
  s = convertFrac(s);

  // 1b. \text{}, \mathrm{}, \mathbf{} → содержимое
  s = s.replace(/\\(?:text|mathrm|mathbf|operatorname)\{([^{}]*)\}/g, '$1');

  // 1c. \left||\right| → abs() ПЕРЕД \left( → (
  s = convertAbs(s);

  // 1d. \left( → (, \right) → ), etc.
  s = convertBrackets(s);

  // 1e. Градусы — ДО обработки ^{...} как степени!
  s = convertDegrees(s);

  // 1f. Комбинаторика — ДО удаления {}
  s = convertCombinatorics(s);

  // 1g. Логарифмы — ДО удаления \
  s = convertLogs(s);

  // 1h. Тригонометрия
  s = convertTrig(s);

  // 1i. Корни
  s = convertRoots(s);

  // ── ФАЗА 2: СПЕЦИАЛЬНЫЕ СИМВОЛЫ ──────────────────────────────────────

  // Константы
  s = s.replace(/\\pi\b/g,   'pi');
  s = s.replace(/π/g,        'pi');
  s = s.replace(/\\e\b/g,    'e');

  // Бесконечность: +∞ и -∞ ПЕРЕД общей ∞
  s = s.replace(/[+]\\infty|[+]∞/g, 'Infinity');
  s = s.replace(/-\\infty|-∞/g,      '-Infinity');
  s = s.replace(/\\infty|∞/g,        'Infinity');

  // Операторы
  s = s.replace(/\\times/g,  '*');
  s = s.replace(/\\cdot/g,   '*');
  s = s.replace(/\\div/g,    '/');
  s = s.replace(/×/g,        '*');
  s = s.replace(/÷/g,        '/');
  s = s.replace(/·/g,        '*');
  s = s.replace(/—/g,        '-');    // длинное тире
  s = s.replace(/–/g,        '-');    // среднее тире

  // Неравенства
  s = s.replace(/\\leq|\\le(?![a-z])|≤/g, '<=');
  s = s.replace(/\\geq|\\ge(?![a-z])|≥/g, '>=');
  s = s.replace(/\\neq|≠/g,              '!=');
  s = s.replace(/\\approx|≈/g,           '≈');  // оставляем для текстового сравнения

  // Процент: \% или число% → /100
  s = s.replace(/(\d+(?:\.\d+)?)\s*\\%/g, '($1/100)');
  s = s.replace(/(\d+(?:\.\d+)?)\s*%/g,   '($1/100)');
  s = s.replace(/\\%/g, '');  // отдельный \% без числа — убираем

  // Факториал
  s = s.replace(/\(([^()]+)\)!/g, 'factorial(($1))');
  s = s.replace(/([a-zA-Z0-9]+)!/g, 'factorial($1)');

  // \bar{z} → conj(z) (комплексное сопряжённое)
  s = s.replace(/\\bar\{([^{}]+)\}/g, 'conj($1)');
  s = s.replace(/\\overline\{([^{}]+)\}/g, 'conj($1)');

  // \text{sign} — уже обработано через \text{}, станет просто sign

  // Греческие буквы как числа/переменные
  // (в скоупе нет греческих — оставляем как есть, они попадут в SCOPE как переменные)
  // Для тригонометрических задач часто нужен конкретный угол — оставляем
  s = s.replace(/\\alpha/g, 'alpha');
  s = s.replace(/\\beta/g,  'beta');
  s = s.replace(/\\gamma/g, 'gamma');
  s = s.replace(/\\theta/g, 'theta');
  s = s.replace(/\\phi/g,   'phi');
  s = s.replace(/\\omega/g, 'omega');
  s = s.replace(/\\Delta/g, 'Delta');
  s = s.replace(/\\Omega/g, 'Omega');
  s = s.replace(/\\lambda/g,'lambda');
  s = s.replace(/\\mu/g,    'mu');
  s = s.replace(/\\sigma/g, 'sigma');

  // Логарифмы с подстрочным индексом в виде числа (после \log убран)
  // log_b(x) формат без {} (из ручного ввода)
  s = s.replace(/\blog_([0-9]+)\s*\(/g, 'log(');  // упрощение: log_n(x) → log(x,n)
  // Полная форма: log_n(x) → log(x,n)
  s = s.replace(/\blog_([0-9]+)\s*\(([^()]+)\)/g, 'log($2,$1)');

  // ── ФАЗА 3: СТЕПЕНИ ──────────────────────────────────────────────────
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)');  // ^{n} → ^(n)
  s = s.replace(/\*\*/g, '^');
  s = s.replace(/\^-(\d)/g, '^(-$1)');

  // ── ФАЗА 4: ЧИСТКА ОСТАВШЕГОСЯ LATEX ─────────────────────────────────
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\\/g, '');

  // ── ФАЗА 5: РЕГИСТР (Infinity сохраняем) ─────────────────────────────
  s = s.toLowerCase().replace(/infinity/g, 'Infinity');

  // ── ФАЗА 6: ПРОБЕЛЫ ───────────────────────────────────────────────────
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*([+\-*/^()!=<>])\s*/g, '$1');
  s = s.replace(/(\d)\s+deg\b/g, '$1 deg');  // "30 deg" сохраняем
  s = s.replace(/\s+deg\b/g, ' deg');

  // ── ФАЗА 7: НЕЯВНОЕ УМНОЖЕНИЕ ──────────────────────────────────────────
  // 2x → 2*x, 2(3) → 2*(3)
  s = s.replace(/(\d)(?=([a-zA-Z](?!eg\b|nfinity)))/g, '$1*');
  s = s.replace(/(\d)(?=\()/g, '$1*');
  s = s.replace(/\)(?=[a-zA-Z(])/g, ')*');

  // Функции не трогаем (sin(x) → не sin*(x))
  s = s.replace(/([a-z_]+)(?=\()/gi, (match) => {
    if (KNOWN_FUNCS.has(match.toLowerCase())) return match;
    if (/^(log|log10|log2_|nthroot|factorial|combinations|permutations|det_mat|mat|conj|sign)$/i.test(match)) return match;
    return match + '*';
  });

  // Многобуквенные переменные → произведение одиночных (xy → x*y)
  s = s.replace(/[a-z]{2,}/gi, (word) => {
    const lower = word.toLowerCase();
    if (KNOWN_FUNCS.has(lower)) return word;
    if (/^(pi|infinity|deg|alpha|beta|gamma|theta|phi|omega|delta|sigma|mu|lambda)$/.test(lower)) return word;
    if (/^(log10|log2_|nthroot|factorial|combinations|permutations|det_mat|conj|sign)$/.test(lower)) return word;
    // Если все буквы есть в скоупе — разбиваем на произведение
    const chars = word.split('');
    if (chars.every(c => c.toLowerCase() in SCOPES[0] || c in SCOPES[0])) {
      return chars.join('*');
    }
    return word;
  });

  return s;
}


// ════════════════════════════════════════════════════════════════════════
// ВЫЧИСЛЕНИЕ В ОДНОЙ ТОЧКЕ
// ════════════════════════════════════════════════════════════════════════
function calcAt(expr: string, scope: Record<string, any>): number {
  try {
    const norm = normalizeForCalculation(expr);
    if (!norm || norm === 'NaN') return NaN;
    const t = norm.trim();
    if (PERIODIC[t] !== undefined) return PERIODIC[t];
    const res = evaluate(norm, scope);
    if (typeof res === 'number') return res;
    if (typeof res === 'boolean') return res ? 1 : 0;
    if (typeof res === 'object' && res !== null && 're' in res) {
      const re = (res as any).re;
      return typeof re === 'number' ? re : NaN;
    }
    return NaN;
  } catch {
    return NaN;
  }
}


// ════════════════════════════════════════════════════════════════════════
// МНОГОТОЧЕЧНОЕ ВЫЧИСЛЕНИЕ ПОЛИНОМА
// Возвращает [v1, v2, v3] — значения в 3 разных точках
// ════════════════════════════════════════════════════════════════════════
function calcMulti(expr: string): [number, number, number] {
  return [calcAt(expr, SCOPES[0]), calcAt(expr, SCOPES[1]), calcAt(expr, SCOPES[2])];
}

function multiValid(v: [number, number, number]): boolean {
  return v.every(x => !isNaN(x));
}


// ════════════════════════════════════════════════════════════════════════
// СРАВНЕНИЕ ЧИСЕЛ С ДОПУСКОМ
// ════════════════════════════════════════════════════════════════════════
function numEq(a: number, b: number): boolean {
  if (!isFinite(a) || !isFinite(b)) return a === b;
  if (Math.abs(a - b) < 1e-9) return true;
  const isInt = (v: number) => Math.abs(v - Math.round(v)) < 1e-9;
  if (isInt(a) && isInt(b)) return Math.round(a) === Math.round(b);
  const tol = Math.max(0.001, Math.abs(b * 0.001));
  return Math.abs(a - b) <= tol;
}


// ════════════════════════════════════════════════════════════════════════
// ЕСТЬ ЛИ ПЕРЕМЕННЫЕ В ВЫРАЖЕНИИ (полином)?
// ════════════════════════════════════════════════════════════════════════
function hasVars(s: string): boolean {
  const norm = normalizeForCalculation(s);
  const stripped = norm
    .replace(/\bpi\b/g, '')
    .replace(/\bInfinity\b/g, '')
    .replace(/\bdeg\b/g, '')
    .replace(/\b(sin|cos|tan|cot|sec|csc|asin|acos|atan|acot|asec|acsc|sinh|cosh|tanh|sqrt|abs|log|log10|exp|sign|conj|nthroot|factorial|combinations|permutations)\b/gi, '');
  return /[a-zA-Z]/.test(stripped);
}


// ════════════════════════════════════════════════════════════════════════
// ОПРЕДЕЛЕНИЕ ТИПА: НЕРАВЕНСТВО ИЛИ ИНТЕРВАЛ
// ════════════════════════════════════════════════════════════════════════
function isInterval(s: string): boolean {
  if (/[≤≥]|\\le\b|\\ge\b|\\leq\b|\\geq\b|<=|>=/.test(s)) return true;
  if (/[+\-]?\\infty|[+\-]?∞|[+\-]?Infinity|-inf\b/i.test(s)) return true;
  if (/^[\[\(][^;,()]+[;,][^;,()]+[\]\)]$/.test(s.trim())) return true;
  if (/[Uu∪]/.test(s) && /[\[\(]/.test(s)) return true;
  return false;
}


// ════════════════════════════════════════════════════════════════════════
// НОРМАЛИЗАЦИЯ НЕРАВЕНСТВА ДЛЯ ТЕКСТОВОГО СРАВНЕНИЯ
// ════════════════════════════════════════════════════════════════════════
function normIneq(s: string): string {
  return s
    .replace(/\\leq|\\le(?![a-z])|≤/g, '<=')
    .replace(/\\geq|\\ge(?![a-z])|≥/g, '>=')
    .replace(/[+]\\infty|[+]∞/g, 'inf')
    .replace(/-\\infty|-∞/g, '-inf')
    .replace(/\\infty|∞/g, 'inf')
    .replace(/\\emptyset|∅/g, 'empty')
    .replace(/\+inf\b/g, 'inf')
    .replace(/\\/g, '')
    .replace(/\s+/g, '')
    .replace(/;/g, ',')
    .toLowerCase()
    .trim();
}


// ════════════════════════════════════════════════════════════════════════
// ПАРСИНГ ИНТЕРВАЛА: (-∞; 6], (2; 5), [3; +∞)
// ════════════════════════════════════════════════════════════════════════
interface Interval {
  left: number; right: number;
  leftOpen: boolean; rightOpen: boolean;
}

function parseInterval(s: string): Interval | null {
  const n = s
    .replace(/[+]\\infty|[+]∞|\+Infinity/g, 'Infinity')
    .replace(/-\\infty|-∞/g, '-Infinity')
    .replace(/\\infty|∞/g, 'Infinity')
    .replace(/\\pi/g, String(Math.PI))
    .replace(/\s/g, '');

  const m = n.match(/^([\[\(])(.*?)[,;](.*?)([\]\)])$/);
  if (!m) return null;

  const pv = (v: string): number => {
    if (v === '-Infinity' || v === '-inf') return -Infinity;
    if (v === 'Infinity'  || v === 'inf')  return  Infinity;
    const num = parseFloat(v);
    if (!isNaN(num)) return num;
    // Попробуем вычислить (например pi/2)
    try { const r = evaluate(v, ALGEBRA_SCOPE); return typeof r === 'number' ? r : NaN; }
    catch { return NaN; }
  };

  const left  = pv(m[2]);
  const right = pv(m[3]);
  if (isNaN(left) || isNaN(right)) return null;

  return { left, right, leftOpen: m[1] === '(', rightOpen: m[4] === ')' };
}

function intervalsEq(a: Interval, b: Interval, eps = 0.001): boolean {
  const cv = (x: number, y: number) => !isFinite(x) || !isFinite(y) ? x === y : Math.abs(x - y) < eps;
  return cv(a.left, b.left) && cv(a.right, b.right)
      && a.leftOpen === b.leftOpen && a.rightOpen === b.rightOpen;
}


// ════════════════════════════════════════════════════════════════════════
// РАЗВЁРТКА ± И РАЗБИВКА ПО ";"
// ════════════════════════════════════════════════════════════════════════
function expand(str: string): string[] {
  const results: string[] = [];
  for (let part of str.split(';')) {
    part = part.trim();
    if (!part) continue;
    part = part.replace(/\\pm/g, '±').replace(/\+-/g, '±').replace(/-\+/g, '∓').replace(/\\mp/g, '∓');

    if (part.includes('±')) {
      const i = part.indexOf('±');
      const L = part.slice(0, i), R = part.slice(i + 1);
      results.push(...expand(`${L}+${R}`), ...expand(`${L}-${R}`));
    } else if (part.includes('∓')) {
      const i = part.indexOf('∓');
      const L = part.slice(0, i), R = part.slice(i + 1);
      results.push(...expand(`${L}-${R}`), ...expand(`${L}+${R}`));
    } else {
      results.push(part);
    }
  }
  return results;
}


// ════════════════════════════════════════════════════════════════════════
// ТЕКСТОВАЯ НОРМАЛИЗАЦИЯ ДЛЯ FALLBACK
// ════════════════════════════════════════════════════════════════════════
function textNorm(s: string): string {
  if (isInterval(s)) return normIneq(s);
  try {
    const n = normalizeForCalculation(s).replace(/\s/g, '');
    // ((a)/(b)) → a/b
    return n
      .replace(/\(\(([^()]+)\)\/\(([^()]+)\)\)/g, '$1/$2')
      .replace(/\(([^()]+)\/([^()]+)\)/g, '$1/$2');
  } catch {
    return s.toLowerCase().replace(/\s/g, '');
  }
}


// ════════════════════════════════════════════════════════════════════════
//  ГЛАВНАЯ ФУНКЦИЯ: checkAnswer(userAnswer, dbAnswer)
// ════════════════════════════════════════════════════════════════════════
export function checkAnswer(userAnswer: string, dbAnswer: string): boolean {
  if (!userAnswer || !dbAnswer) return false;

  const u = userAnswer.trim();
  const d = dbAnswer.trim();

  // ── 0. ПУСТОЕ МНОЖЕСТВО ────────────────────────────────────────────────
  const isEmpty = (s: string) =>
    /\\emptyset|\\varnothing|∅|нет\s*решений|no\s*solution|корней\s*нет/i.test(s) ||
    ['∅', '\\emptyset', '\\varnothing'].includes(s.trim());

  if (isEmpty(u) && isEmpty(d)) return true;
  if (isEmpty(u) || isEmpty(d)) return false;

  // ── 1. НЕРАВЕНСТВА И ИНТЕРВАЛЫ ─────────────────────────────────────────
  if (isInterval(u) || isInterval(d)) {
    const splitUnion = (s: string) => s.replace(/\\cup/g, '∪').split(/\s*[Uu∪]\s*/).map(p => p.trim()).filter(Boolean);
    const uParts = splitUnion(u);
    const dParts = splitUnion(d);
    if (uParts.length !== dParts.length) return false;

    return uParts.every((up, i) => {
      const dp = dParts[i];
      const ui = parseInterval(up), di = parseInterval(dp);
      if (ui && di) return intervalsEq(ui, di);
      return normIneq(up) === normIneq(dp);
    });
  }

  // ── 2. РАЗБИВКА НА НЕСКОЛЬКО ОТВЕТОВ (;) И ± ──────────────────────────
  const uExprs = expand(u);
  const dExprs = expand(d);
  if (uExprs.length !== dExprs.length) return false;

  // ── 3. ПОЛИНОМЫ С ПЕРЕМЕННЫМИ — МНОГОТОЧЕЧНАЯ ПРОВЕРКА ─────────────────
  // Проверяем в 3 независимых точках → исключает ложные совпадения
  const anyVars = [...uExprs, ...dExprs].some(hasVars);
  if (anyVars) {
    const uMV = uExprs.map(calcMulti);
    const dMV = dExprs.map(calcMulti);
    if (uMV.every(multiValid) && dMV.every(multiValid)) {
      uMV.sort((a, b) => a[0] - b[0]);
      dMV.sort((a, b) => a[0] - b[0]);
      return uMV.every(([u0,u1,u2], i) => {
        const [d0,d1,d2] = dMV[i];
        return numEq(u0,d0) && numEq(u1,d1) && numEq(u2,d2);
      });
    }
    // Если вычислить не удалось — текстовое сравнение
  }

  // ── 4. ЧИСЛОВЫЕ ВЫРАЖЕНИЯ ─────────────────────────────────────────────
  const uVals = uExprs.map(e => calcAt(e, ALGEBRA_SCOPE));
  const dVals = dExprs.map(e => calcAt(e, ALGEBRA_SCOPE));

  if (!uVals.some(isNaN) && !dVals.some(isNaN)) {
    const uS = [...uVals].sort((a,b) => a-b);
    const dS = [...dVals].sort((a,b) => a-b);
    if (uS.every((v, i) => numEq(v, dS[i]))) return true;
  }

  // ── 5. FALLBACK: ТЕКСТОВОЕ СРАВНЕНИЕ ──────────────────────────────────
  const uT = uExprs.map(textNorm).sort().join(';');
  const dT = dExprs.map(textNorm).sort().join(';');
  if (uT === dT) return true;

  // ── 6. ПРИБЛИЖЁННОЕ СРАВНЕНИЕ (для ≈) ─────────────────────────────────
  // Если в ответе есть ≈ — допускаем чуть большую погрешность
  if (u.includes('≈') || d.includes('≈')) {
    const uC = calcAt(u.replace(/≈/g, ''), ALGEBRA_SCOPE);
    const dC = calcAt(d.replace(/≈/g, ''), ALGEBRA_SCOPE);
    if (!isNaN(uC) && !isNaN(dC)) {
      return Math.abs(uC - dC) / Math.max(1, Math.abs(dC)) < 0.01; // 1% допуск
    }
  }

  return false;
}