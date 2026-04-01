import { API_BASE_URL } from '../Constants';
import type { Book } from './books';

async function request(
  path: string,
  token: string,
  options?: { method?: string; body?: string }
): Promise<Book[] | void> {
  const headers: HeadersInit = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body,
  });
  if (res.status === 204) return;
  const text = await res.text();
  if (!res.ok) {
    let message = text || 'Ошибка запроса';
    try {
      const json = JSON.parse(text);
      message = json.error ?? json.message ?? message;
    } catch (e) {
      console.log(e)
    }
    throw new Error(message);
  }
  return text ? (JSON.parse(text) as Book[]) : [];
}

export async function getMyReadingList(token: string | null): Promise<Book[]> {
  if (!token) return [];
  const data = await request('/api/v1/me/reading-list', token);
  return Array.isArray(data) ? data : [];
}

export async function addToReadingList(bookId: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  await request('/api/v1/me/reading-list', token, {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  });
}

export async function removeFromReadingList(bookId: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  const res = await fetch(`${API_BASE_URL}/api/v1/me/reading-list/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 204) {
    const text = await res.text();
    let message = text || 'Ошибка удаления';
    try {
      const json = JSON.parse(text);
      message = json.error ?? json.message ?? message;
    } catch (e) {
      console.log(e)
    }
    throw new Error(message);
  }
}
