import { evaluate } from 'mathjs';

// === КОНСТАНТЫ ДЛЯ АЛГЕБРЫ ===
// Подставляем вместо переменных простые числа.
// Это позволяет проверить, что (a+b)^2 равно a^2+2ab+b^2.
const ALGEBRA_SCOPE = {
  x: 3, y: 7, z: 11, t: 13,
  a: 17, b: 19, c: 23, d: 29,
  m: 31, n: 37, k: 41, p: 43, q: 47,
  u: 53, v: 59, S: 61, h: 67, r: 71,
  e: 2.718281828
};

/**
 * Главная функция нормализации.
 * Превращает любой математический "мусор" и LaTeX в чистую формулу для MathJS.
 */
function normalizeForCalculation(str: string): string {
  if (!str) return '';
  let s = str.trim(); 

  // === 0. БАЗОВЫЕ ПРОВЕРКИ ===
  // Убираем "x =" в начале
  s = s.replace(/^[a-zA-Z]\s*=\s*/, '');

  // Пустое множество и "нет корней"
  if (s.includes('\\emptyset') || s.includes('\\O') || 
      s.toLowerCase() === 'no solution' || s.toLowerCase() === 'нет решений' ||
      s.toLowerCase() === 'корней нет') {
    return 'NaN';
  }

  // === 1. СТАНДАРТИЗАЦИЯ СИМВОЛОВ ===
  s = s.replace(/\{,\}/g, '.'); // LaTeX запятая
  s = s.replace(/,/g, '.');     // Обычная запятая
  s = s.replace(/:/g, '/');     // Двоеточие как деление
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/×/g, '*');
  s = s.replace(/⋅/g, '*');
  s = s.replace(/\\%/g, '%');   // Проценты
  
  // Градусы (mathjs требует пробел перед deg)
  s = s.replace(/\^\{\\circ\}/g, ' deg');
  s = s.replace(/\\circ/g, ' deg');
  s = s.replace(/°/g, ' deg');

  // Бесконечность и Пи
  s = s.replace(/\\infty/g, 'Infinity');
  s = s.replace(/∞/g, 'Infinity');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/π/g, 'pi');

  // === 2. ПЕРЕВОД ФУНКЦИЙ (TG -> TAN) ===
  // Сначала убираем слеши LaTeX, чтобы не мешали
  s = s.replace(/\\/g, ''); 
  
  // Убираем \left и \right
  s = s.replace(/left\(/g, '(').replace(/right\)/g, ')');
  s = s.replace(/left\|/g, 'abs(').replace(/right\|/g, ')');
  s = s.replace(/\|(.+?)\|/g, 'abs($1)'); // Просто палки |x| -> abs(x)

  // Переименовываем "советские" функции в международные (для mathjs)
  // Важно делать это ДО обработки степеней
  s = s.replace(/\barctg\b/g, 'atan');
  s = s.replace(/\barcctg\b/g, 'acot');
  s = s.replace(/\barcsin\b/g, 'asin');
  s = s.replace(/\barccos\b/g, 'acos');
  
  s = s.replace(/\btg\b/g, 'tan');
  s = s.replace(/\bctg\b/g, 'cot');
  
  s = s.replace(/\blg\b/g, 'log10');
  s = s.replace(/\bln\b/g, 'log');

  // === 3. ТРИГОНОМЕТРИЧЕСКИЕ СТЕПЕНИ (tg^2 x -> (tan(x))^2) ===
  // Паттерн: функция + степень + (аргумент в скобках или без)
  // Пример: tan^2 x  ИЛИ tan^2(x)
  const trigPowRegex = /(sin|cos|tan|cot|sec|csc|asin|acos|atan|acot)\^\{?(\d+)\}?\s*(\([^\)]+\)|[a-z0-9]+)/gi;
  s = s.replace(trigPowRegex, '($1($3))^$2');

  // === 4. СМЕШАННЫЕ ЧИСЛА И ДРОБИ ===
  // 1 1/2 -> 1 + 1/2
  s = s.replace(/(\d)\s+frac/g, '$1+frac'); 
  
  // LaTeX дроби: frac{a}{b} -> ((a)/(b))
  // Используем цикл, чтобы обработать вложенные дроби (многоэтажные)
  let prevS = '';
  while (prevS !== s) {
    prevS = s;
    s = s.replace(/d?frac\{(.+?)\}\{(.+?)\}/g, '(($1)/($2))');
  }

  // === 5. КОРНИ ===
  s = s.replace(/sqrt\[(.+?)\]\{(.+?)\}/g, 'nthRoot($2, $1)'); 
  s = s.replace(/sqrt\{(.+?)\}/g, 'sqrt($1)');

  // === 6. ЛОГАРИФМЫ ===
  // log_{2}(8) -> log(8, 2)
  s = s.replace(/log_\{(.+?)\}\((.+?)\)/g, 'log($2, $1)'); 
  s = s.replace(/log_\{(.+?)\}\{(.+?)\}/g, 'log($2, $1)');
  s = s.replace(/log_\{(.+?)\}(.+?)/g, 'log($2, $1)'); 
  // log без основания -> log10 (школьный стандарт)
  s = s.replace(/log\(/g, 'log10('); 

  // === 7. СТЕПЕНИ ===
  s = s.replace(/\^\{(.+?)\}/g, '^($1)');

  // === 8. ЧИСТКА И УМНОЖЕНИЕ ===
  s = s.replace(/[{}]/g, ''); // Убираем остатки скобок
  s = s.toLowerCase(); // MathJS любит lowercase (кроме Infinity, поправим ниже)
  s = s.replace(/infinity/g, 'Infinity');

  s = s.replace(/\s+/g, ''); // Убираем пробелы
  s = s.replace(/(\d)deg/g, '$1 deg'); // Возвращаем пробел градусам

  // Неявное умножение: 2x -> 2*x, x( -> x*(
  // Но аккуратно, чтобы не сломать названия функций (например, в 'cos' буква 's' не должна умножаться)
  
  // 1. Число перед буквой или скобкой: 2x -> 2*x, 2( -> 2*(
  s = s.replace(/(\d)(?=[a-z\(])/g, '$1*');
  
  // 2. Скобка перед буквой или скобкой: )x -> )*x, )( -> )*(
  s = s.replace(/(\))(?=[a-z\(])/g, '$1*');

  // 3. Две буквы рядом (xy -> x*y), НО НЕ внутри имен функций!
  // Это сложно. Проще всего оставить как есть, mathjs умеет понимать xy как x*y, если переменные определены в scope.
  
  // Исправление "функция как множитель": 2sin -> 2*sin (уже обработано пунктом 1)
  // Исправление "x sin": xsin -> x*sin.
  // Это регуляркой сделать сложно, надеемся на корректный ввод или mathjs.

  return s;
}

/**
 * Разворачивает ± (плюс-минус) в массив вариантов
 */
function expandOptions(str: string): string[] {
  const parts = str.split(';'); // Разделитель ответов
  let results: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;

    // Заменяем разные виды плюс-минуса на один
    part = part.replace(/\\pm/g, '±');
    part = part.replace(/\+-/g, '±');

    if (part.includes('±')) {
      // Рекурсивно раскрываем плюс и минус
      const idx = part.indexOf('±');
      const left = part.substring(0, idx);
      const right = part.substring(idx + 1);

      // Если справа сложное выражение, берем его в скобки
      const rStr = right.match(/[+\-*/]/) ? `(${right})` : right;

      const plus = `${left}+${rStr}`;
      const minus = `${left}-${rStr}`;
      
      results = results.concat(expandOptions(plus));
      results = results.concat(expandOptions(minus));
    } else {
      results.push(part);
    }
  }
  return results;
}

export function checkAnswer(userAnswer: string, dbAnswer: string): boolean {
  if (!userAnswer) return false;

  try {
    const userExprs = expandOptions(userAnswer);
    const dbExprs = expandOptions(dbAnswer);

    // Функция вычисления значения
    const calculate = (expr: string): number => {
      try {
        const norm = normalizeForCalculation(expr);
        if (norm === 'NaN') return NaN;
        
        // Считаем с подстановкой "алгебраических" чисел
        const res = evaluate(norm, ALGEBRA_SCOPE);
        
        if (typeof res === 'number') return res;
        return NaN;
      } catch (e) {
        // console.log('Calc Error:', e, expr); 
        return NaN;
      }
    };

    const userValues = userExprs.map(calculate);
    const dbValues = dbExprs.map(calculate);

    // Если есть NaN (не смогли посчитать), падаем в текстовое сравнение
    if (userValues.some(isNaN) || dbValues.some(isNaN)) {
       throw new Error("Calculation failed");
    }

    // Сортируем значения, чтобы порядок ответов не влиял (x1; x2)
    userValues.sort((a, b) => a - b);
    dbValues.sort((a, b) => a - b);

    if (userValues.length !== dbValues.length) return false;

    // Сравниваем каждое значение с допуском погрешности
    return userValues.every((uVal, i) => {
      const dVal = dbValues[i];
      
      // Infinity == Infinity
      if (!isFinite(uVal) || !isFinite(dVal)) {
        return uVal === dVal;
      }

      const diff = Math.abs(uVal - dVal);
      
      // 1. Абсолютная точность для целых (защита от 3.00000004)
      if (Math.abs(Math.round(uVal) - uVal) < 1e-9 && Math.abs(Math.round(dVal) - dVal) < 1e-9) {
         return Math.abs(Math.round(uVal) - Math.round(dVal)) === 0;
      }
      
      // 2. Относительная точность для дробей и корней
      const tolerance = Math.max(0.001, Math.abs(dVal * 0.001)); // 0.1% погрешность
      return diff <= tolerance;
    });

  } catch (e) {
    // FALLBACK: Строковое сравнение нормализованных формул
    // Это спасет, если mathjs не справился, но строки одинаковые (после очистки)
    const clean = (s: string) => normalizeForCalculation(s).replace(/\s/g, '');
    const userSorted = expandOptions(userAnswer).map(clean).sort().join(';');
    const dbSorted = expandOptions(dbAnswer).map(clean).sort().join(';');
    return userSorted === dbSorted;
  }
}