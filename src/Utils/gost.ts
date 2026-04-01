import type { GostResult } from '../Api/books';
import { GOST_PRIORITY_TABLE } from '../Constants/gost';

export type GostPriorityRow = (typeof GOST_PRIORITY_TABLE)[number];

export type MergedGostResult = GostResult & { skipped?: boolean; priority?: number };

export function mergeGostResults(
  backendResults: GostResult[],
  priorityTable: readonly GostPriorityRow[] = GOST_PRIORITY_TABLE
): MergedGostResult[] {
  const used = new Set<number>();
  return priorityTable.map((row) => {
    const matchIdx = backendResults.findIndex((r, idx) => {
      if (used.has(idx)) return false;
      if (r.code !== row.backendCode) return false;
      if (row.backendName === 'Размеры полей') return r.name.includes('Размеры') || r.name.includes('полей');
      if (row.backendName === 'Кегль шрифта') return r.name.includes('Кегль');
      return r.name.includes(row.backendName) || r.name === row.backendName;
    });
    if (matchIdx >= 0) {
      used.add(matchIdx);
      return { ...backendResults[matchIdx], skipped: false, priority: row.priority };
    }
    return {
      code: row.code,
      name: row.check,
      ok: false,
      detail: 'Пропущено (текст не извлечён или проверка не выполнена)',
      skipped: true,
      priority: row.priority,
    };
  });
}
