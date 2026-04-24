import { API_BASE_URL } from '../Constants';

export type Book = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  content?: string;
  genre: string;
  cover_image?: string | null;
  pdf_url?: string | null;
  status: string;
  views_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  publication_year?: number | null;
  author_name?: string;
  isbn?: string | null;
  publisher?: string | null;
};

async function request<T>(
  path: string,
  token: string | null,
  init?: RequestInit & { body?: string }
): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...(headers as Record<string, string>), ...(init?.headers as Record<string, string>) },
  });
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
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getAllBooks(token: string | null): Promise<Book[]> {
  const data = await request<Book[]>(`/api/v1/books`, token);
  return Array.isArray(data) ? data : [];
}

/** Книга в подборках главной (публичный ответ с рейтингом и автором). */
export type BookPublic = {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover_image: string | null;
  author_name: string;
  avg_rating: number;
  reviews_count: number;
  published_at: string;
};

export type HomeSections = {
  popular: BookPublic[];
  topRated: BookPublic[];
  new: BookPublic[];
};

export async function getHomeSections(token: string | null): Promise<HomeSections> {
  const data = await request<HomeSections>(`/api/v1/books/home`, token);
  return {
    popular: Array.isArray(data?.popular) ? data.popular : [],
    topRated: Array.isArray(data?.topRated) ? data.topRated : [],
    new: Array.isArray(data?.new) ? data.new : [],
  };
}

export async function getBookByID(id: string, token: string | null): Promise<Book> {
  return request<Book>(`/api/v1/books/${id}`, token);
}

export type CreateBookPayload = {
  title: string;
  description?: string;
  content?: string;
  genre?: string;
  cover_image?: string;
  pdf_url?: string;
  publication_year?: number | null;
  isbn?: string;
  publisher?: string;
};

export type CreateBookResponse = {
  book: Book;
  user?: import('./auth').UserResponse;
};

export async function createBook(
  payload: CreateBookPayload,
  token: string
): Promise<CreateBookResponse> {
  const data = await request<CreateBookResponse>('/api/v1/books', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { book: data.book, user: data.user };
}

export type UpdateBookPayload = {
  title?: string;
  description?: string;
  content?: string;
  genre?: string;
  cover_image?: string;
  pdf_url?: string;
  clear_pdf?: boolean;
  publication_year?: number | null;
  status?: string;
  isbn?: string;
  publisher?: string;
};

export async function updateBook(
  id: string,
  payload: UpdateBookPayload,
  token: string
): Promise<Book> {
  return request<Book>(`/api/v1/books/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteBook(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/books/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
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

/** Параметры для генерации обложки через AI. */
export type GenerateCoverPayload = {
  title?: string;
  genre?: string;
  description?: string;
  publication_year?: number;
};

/** Генерация обложки через YandexART. Возвращает URL и base64 для canvas. */
export async function generateCover(
  payload: GenerateCoverPayload,
  token: string
): Promise<{ url: string; base64: string | null }> {
  const data = await request<{ url: string; base64?: string }>('/api/v1/generate-cover', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    url: (data as { url?: string }).url ?? '',
    base64: (data as { base64?: string }).base64 ?? null,
  };
}

/** Результат проверки по ГОСТ (при ошибке загрузки). */
export type GostError = {
  code: string;
  name: string;
  ok: boolean;
  detail: string;
};

/** Ошибка проверки PDF по ГОСТ. */
export class GostValidationError extends Error {
  gostErrors: GostError[];

  constructor(message: string, gostErrors: GostError[] = []) {
    super(message);
    this.name = 'GostValidationError';
    this.gostErrors = gostErrors;
  }
}

/** Результат проверки ГОСТ (один пункт). */
export type GostResult = {
  code: string;
  name: string;
  ok: boolean;
  detail: string;
};

/** Результат загрузки PDF. */
export type UploadPdfResult = {
  url: string;
  warning?: string;
  gost_valid?: boolean;
  gost_results?: GostResult[];
};

/** Загрузка PDF книги. Возвращает URL, результаты ГОСТ и предупреждение. */
export async function uploadPdf(file: File, token: string): Promise<UploadPdfResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/v1/upload-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text || 'Ошибка загрузки';
    let gostErrors: GostError[] = [];
    try {
      const json = JSON.parse(text);
      msg = json.error ?? json.message ?? msg;
      if (Array.isArray(json.gost_errors)) {
        gostErrors = json.gost_errors.map((e: { code?: string; name?: string; detail?: string }) => ({
          code: e.code ?? '',
          name: e.name ?? '',
          ok: false,
          detail: e.detail ?? '',
        }));
      }
    } catch (e) {
      console.log(e)
    }
    throw new GostValidationError(msg, gostErrors);
  }
  const data = text ? JSON.parse(text) : {};
  const gostResults = Array.isArray(data.gost_results)
    ? data.gost_results.map((r: { code?: string; name?: string; ok?: boolean; detail?: string }) => ({
        code: r.code ?? '',
        name: r.name ?? '',
        ok: !!r.ok,
        detail: r.detail ?? '',
      }))
    : undefined;
  return {
    url: data.url ?? '',
    warning: data.warning,
    gost_valid: data.gost_valid,
    gost_results: gostResults,
  };
}

/** Загрузка обложки (JPG). Возвращает URL для поля cover_image. */
export async function uploadCover(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/v1/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text || 'Ошибка загрузки';
    try {
      const json = JSON.parse(text);
      message = json.error ?? json.message ?? message;
    } catch (e) {
      console.log(e)
    }
    throw new Error(message);
  }
  const data = text ? JSON.parse(text) : {};
  return (data as { url?: string }).url ?? '';
}

export type PromoTextPayload = {
  title: string;
  author?: string;
  genre?: string;
  description?: string;
  year?: number;
};

export type PromoTextResult = {
  ad_text: string;
  theses: string[];
};

export async function generatePromoText(
  payload: PromoTextPayload,
  token: string
): Promise<PromoTextResult> {
  const data = await request<PromoTextResult>(
    '/api/v1/generate-promo-text',
    token,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return data;
}
