export const APP_NAME = 'BookPromo';

// В dev — пустая строка (запросы идут через прокси Vite, без CORS); в prod — VITE_API_URL или бэкенд
export const API_BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? ''
    : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000');

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  AUTHOR: '/author',
  CREATE_BOOK: '/author/create',
  EDIT_BOOK: '/author/edit/:id',
  PROMO: '/promo/:id',
  CATALOG: '/catalog',
  REVIEW: '/review/:id',
  MY_BOOKS: '/my-books',
} as const;

export { GOST_PRIORITY_TABLE, GOST_CHECK_COUNT, NEW_GOST_CODES } from './gost';

export const getPromoPath = (id: string) => `/promo/${id}`;
export const getReviewPath = (id: string) => `/review/${id}`;
export const getEditBookPath = (id: string) => `/author/edit/${id}`;

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}
