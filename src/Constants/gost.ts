/** Приоритетная таблица ГОСТов + маппинг на коды/имена бэкенда */
export const GOST_PRIORITY_TABLE = [
  { priority: 1, code: 'ГОСТ Р 7.0.4-2020', check: 'Наличие выходных сведений', backendCode: '7.0.4-2020', backendName: 'Выходные сведения' },
  { priority: 2, code: 'ГОСТ 5773-90', check: 'Формат страницы', backendCode: '5773-90', backendName: 'Формат страницы' },
  { priority: 3, code: 'ГОСТ Р 7.0.53-2013', check: 'Валидация ISBN', backendCode: '7.0.53-2013', backendName: 'ISBN' },
  { priority: 4, code: 'ОСТ 29.127-2002', check: 'Размеры полей', backendCode: '29.127-2002', backendName: 'Размеры полей' },
  { priority: 5, code: 'ОСТ 29.127-2002', check: 'Кегль шрифта', backendCode: '29.127-2002', backendName: 'Кегль шрифта' },
  { priority: 6, code: 'ГОСТ Р 7.0.1-2011', check: 'Знак копирайта', backendCode: '7.0.1-2011', backendName: 'Знак ©' },
  { priority: 7, code: 'ГОСТ 7.0.3-2006', check: 'Элементы аппарата', backendCode: '7.0.3-2006', backendName: 'Элементы аппарата' },
  { priority: 8, code: 'ГОСТ Р 7.0.100-2018', check: 'Библиографическое описание', backendCode: '7.0.100-2018', backendName: 'Библиографическое описание' },
  { priority: 9, code: 'ГОСТ Р 7.0.5-2008', check: 'Оформление ссылок', backendCode: '7.0.5-2008', backendName: 'Оформление ссылок' },
  { priority: 10, code: 'Техтребования', check: 'Разрешение изображений', backendCode: 'техн.', backendName: 'Разрешение изображений' },
] as const;

export const GOST_CHECK_COUNT = GOST_PRIORITY_TABLE.length;

/** Коды для метки «Новое» */
export const NEW_GOST_CODES = new Set(['29.127-2002', '7.0.3-2006', '7.0.100-2018', '7.0.5-2008', 'техн.']);
