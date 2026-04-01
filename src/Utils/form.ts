export function parsePublicationYear(raw: unknown): number | undefined {
  const year = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
  return !Number.isNaN(year) && year >= 1000 && year <= 2100 ? year : undefined;
}
