import { ComputeEngine } from '@cortex-js/compute-engine';

// === НАСТРОЙКА ДВИЖКА ===
// Инициализируем один раз. 
// numericMode: 'auto' позволяет считать и точно (дроби), и приближенно (float).
const ce = new ComputeEngine({ 
  numericMode: 'auto',
  tolerance: 1e-4 // Допуск при сравнении чисел (0.0001)
});

// Добавляем в контекст переменные, чтобы он не считал их ошибками
// Это позволяет писать x, y, z, a, b и т.д.
ce.declare('x', { domain: 'RealNumber' });
ce.declare('y', { domain: 'RealNumber' });
ce.declare('z', { domain: 'RealNumber' });
ce.declare('t', { domain: 'RealNumber' });
ce.declare('n', { domain: 'Integer' });
ce.declare('k', { domain: 'Integer' });
ce.declare('a', { domain: 'RealNumber' });
ce.declare('b', { domain: 'RealNumber' });
ce.declare('c', { domain: 'RealNumber' });

/**
 * Подготовка LaTeX строки перед скармливанием движку.
 * Исправляет специфические школьные форматы, которые движок может не понять.
 */
function preprocessLatex(latex: string): string {
  if (!latex) return '';
  let s = latex.trim();

  // 1. Замена точки с запятой на запятую в списках/интервалах (школьный стандарт СНГ)
  // Пример: [1; 2] -> [1, 2]
  // Но стараемся не ломать функции f(x;y), хотя они редки
  s = s.replace(/;/g, ',');

  // 2. Исправление смешанных дробей: "3 \frac{1}{2}" -> "3 + \frac{1}{2}"
  // Без плюса движок может подумать, что это умножение 3 * 1/2
  s = s.replace(/(\d+)\s*\\frac/g, '$1+\\frac');

  // 3. Замена кириллических букв на латиницу (частая ошибка учеников)
  s = s.replace(/х/g, 'x').replace(/у/g, 'y').replace(/с/g, 'c'); // русские буквы
  
  // 4. Градусы
  s = s.replace(/\^\\circ/g, 'deg');
  s = s.replace(/°/g, 'deg');

  // 5. Очистка лишних пробельных команд
  s = s.replace(/\\,|\\:|\\;|\\quad/g, ' ');

  // 6. Десятичная запятая в точку (на всякий случай)
  // s = s.replace(/(\d),(\d)/g, '$1.$2'); 
  // (Cortex в принципе понимает запятую как разделитель, но лучше точку для чисел)

  return s;
}

/**
 * Основная функция проверки
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer) return false;
  if (!correctAnswer) return true; // Если ответа нет в базе (баг), считаем верным? Или false.

  // 0. Очистка входных данных
  const userClean = preprocessLatex(userAnswer);
  const correctClean = preprocessLatex(correctAnswer);

  // 1. Быстрая проверка строк (если ввели идеально точно)
  if (userClean.replace(/\s/g, '') === correctClean.replace(/\s/g, '')) {
    return true;
  }

  // 2. Проверка на "Пустое множество"
  const emptyRegex = /\\emptyset|\\O|∅|no\s*solution|нет\s*решений/i;
  if (emptyRegex.test(userClean) && emptyRegex.test(correctClean)) {
    return true;
  }

  try {
    // === CORTEX MAGIC ===
    
    // Парсим выражения
    const expr1 = ce.parse(userClean);
    const expr2 = ce.parse(correctClean);

    // Сценарий A: Символьное сравнение (Алгебра)
    // (x+1)^2  ==  x^2 + 2x + 1
    if (expr1.isSame(expr2)) return true;

    // Пробуем упростить оба выражения и сравнить снова
    // simplify() раскроет скобки, приведет подобные слагаемые
    const simp1 = expr1.simplify();
    const simp2 = expr2.simplify();
    if (simp1.isSame(simp2)) return true;

    // Сценарий B: Численное сравнение (Арифметика / Тригонометрия)
    // 1/2 == 0.5, sin(90deg) == 1
    const val1 = expr1.N(); // Вычислить значение
    const val2 = expr2.N();

    if (val1.isSame(val2)) return true;
    
    // Иногда isSame для чисел слишком строг, проверим разницу (epsilon)
    // Если оба результата - числа
    const num1 = val1.valueOf();
    const num2 = val2.valueOf();

    if (typeof num1 === 'number' && typeof num2 === 'number') {
       if (Math.abs(num1 - num2) < 0.0001) return true;
    }

    // Сценарий C: Уравнения (x=5 против 5)
    // Часто в базе ответ "5", а юзер пишет "x=5"
    // Пробуем извлечь правую часть, если это равенство
    /* 
       В Cortex выражение x=5 парсится как ["Equal", "x", 5]
       Мы можем проверить, если это Equal, взять последний аргумент.
    */
    /* Этот блок можно раскомментировать, если нужно поддержать "x=..."
    if (expr1.head === 'Equal' && expr2.head !== 'Equal') {
       const rhs = expr1.op(2); // Правая часть
       if (rhs && rhs.isSame(expr2)) return true;
       if (rhs && rhs.simplify().isSame(simp2)) return true;
       if (rhs && typeof rhs.valueOf() === 'number' && typeof num2 === 'number' && Math.abs(rhs.valueOf() as number - num2) < 0.0001) return true;
    }
    */

  } catch (e) {
    console.warn("Cortex compare error:", e);
    // Если движок упал, фоллбэк на сравнение строк без пробелов
    return userClean.replace(/\s/g, '') === correctClean.replace(/\s/g, '');
  }

  return false;
}

// Экспортируем функцию нормализации, если она где-то еще используется
// Но вообще лучше использовать preprocessLatex внутри
export function normalizeForCalculation(str: string): string {
  return preprocessLatex(str); 
}