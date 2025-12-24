import { evaluate } from 'mathjs';

/**
 * Превращает математическую строку (LaTeX или человеческую) в формат, понятный mathjs
 */
function normalizeForCalculation(str: string): string {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  
  // 1. Предварительная очистка символов
  s = s.replace(/,/g, '.');
  s = s.replace(/√/g, 'sqrt');
  s = s.replace(/π/g, 'pi');
  s = s.replace(/°/g, 'deg');
  s = s.replace(/×/g, '*');
  s = s.replace(/⋅/g, '*');
  
  // Infinity (разные варианты написания)
  s = s.replace(/\\infty/g, 'Infinity');
  s = s.replace(/∞/g, 'Infinity');
  s = s.replace(/\binf(inity)?\b/g, 'Infinity');

  // Контекстная замена двоеточия (только между цифрами)
  s = s.replace(/(\d):(\d)/g, '$1/$2');

  // 2. Обработка LaTeX
  s = s.replace(/\\sqrt\[(\d+)\]\{(.+?)\}/g, 'nthRoot($2, $1)');
  s = s.replace(/\\sqrt\{(.+?)\}/g, 'sqrt($1)');
  s = s.replace(/\\sqrt/g, 'sqrt');
  s = s.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '(($1)/($2))');
  
  // Функции
  const funcs = ['sin', 'cos', 'tan', 'cot', 'ln', 'lg', 'log'];
  funcs.forEach(f => {
    s = s.replace(new RegExp(`\\\\${f}`, 'g'), f);
  });
  s = s.replace(/lg/g, 'log10'); // lg -> log10
  s = s.replace(/\blog\b/g, 'log10'); // log -> log10 (по умолчанию)

  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\cdot/g, '*');
  
  // Убираем LaTeX скобки { }
  s = s.replace(/\{/g, '(').replace(/\}/g, ')');
  s = s.replace(/\\/g, ''); // Остатки слешей

  // 3. Умная расстановка скобок для функций (sin x -> sin(x), sin30 -> sin(30))
  // Ищем имя функции, за которым НЕТ открывающей скобки, но есть аргумент
  const funcPattern = /(sin|cos|tan|cot|ln|log10|sqrt)\s*([a-z0-9.]+|pi|infinity)/g;
  
  // Проходимся дважды, чтобы обработать вложенности если вдруг (хотя регулярка простая)
  // Мы заменяем "sin 30" на "sin(30)", но не трогаем "sin(30)"
  // Используем lookahead (?! \() чтобы не дублировать скобки
  s = s.replace(/(sin|cos|tan|cot|ln|log10|sqrt)\s+(?!\()([a-z0-9.]+|pi|infinity)/g, '$1($2)');
  // Для слитого написания (sin30 -> sin(30)), исключая cases where next is char (sinx -> sin(x) handled below if x is var)
  // Но осторожно с переменными. Сделаем для цифр и pi
  s = s.replace(/(sin|cos|tan|cot|ln|log10|sqrt)(?!\()(\d+(\.\d+)?|pi|infinity)/g, '$1($2)');

  // 4. Неявное умножение (Implicit Multiplication)
  s = s.replace(/\s+/g, ''); // Убираем пробелы финально

  // Число/Скобка перед Буквой/Функцией/Скобкой
  // 2x -> 2*x, )x -> )*x, 2sin -> 2*sin
  s = s.replace(/(\d|\))(?=[a-z\(]|sqrt|sin|cos|tan|ln|log)/g, '$1*');
  
  return s;
}

/**
 * Рекурсивно разворачивает строку с вариантами (±).
 */
function expandOptions(str: string): string[] {
  const parts = str.split(';');
  let results: string[] = [];

  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    part = part.replace(/\+-/g, '±');

    if (part.includes('±')) {
      const idx = part.indexOf('±');
      const left = part.substring(0, idx).trim();
      const right = part.substring(idx + 1).trim();

      // Добавляем скобки только если правая часть сложная
      const isComplex = /[+\-*/^]/.test(right);
      const rStr = isComplex ? `(${right})` : right;

      const plus = `${left}+${rStr}`;
      const minus = `${left}-${rStr}`;
      
      // Рекурсия (допускаем простую вложенность)
      if (plus.includes('±')) {
         results = results.concat(expandOptions(plus));
         results = results.concat(expandOptions(minus));
      } else {
         results.push(plus);
         results.push(minus);
      }
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

    const calculate = (expr: string): number => {
      try {
        const norm = normalizeForCalculation(expr);
        const res = evaluate(norm);
        // Разрешаем Infinity, но не NaN/Complex
        if (typeof res === 'number' && !isNaN(res)) {
          return res;
        }
        return NaN;
      } catch (e) {
        return NaN;
      }
    };

    const userValues = userExprs.map(calculate);
    const dbValues = dbExprs.map(calculate);

    // Если есть NaN, идем в строковое сравнение
    if (userValues.some(isNaN) || dbValues.some(isNaN)) {
       throw new Error("Fallback to string");
    }

    userValues.sort((a, b) => a - b);
    dbValues.sort((a, b) => a - b);

    if (userValues.length !== dbValues.length) return false;

    return userValues.every((uVal, i) => {
      const dVal = dbValues[i];
      
      // Обработка Бесконечности
      if (!isFinite(uVal) || !isFinite(dVal)) {
        return uVal === dVal;
      }

      const diff = Math.abs(uVal - dVal);
      
      // Строгое сравнение для "почти целых" чисел (1000 vs 1001)
      if (Math.abs(Math.round(uVal) - uVal) < 1e-9 && Math.abs(Math.round(dVal) - dVal) < 1e-9) {
         return Math.abs(Math.round(uVal) - Math.round(dVal)) === 0;
      }
      
      // Относительная погрешность
      const tolerance = Math.max(0.05, Math.abs(dVal * 0.001));
      return diff <= tolerance;
    });

  } catch (e) {
    // Fallback
    const clean = (s: string) => normalizeForCalculation(s);
    const userSorted = expandOptions(userAnswer).map(clean).sort().join(';');
    const dbSorted = expandOptions(dbAnswer).map(clean).sort().join(';');
    return userSorted === dbSorted;
  }
}