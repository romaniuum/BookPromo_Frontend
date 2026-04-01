import { API_BASE_URL } from '../Constants';

export type Review = {
  id: string;
  reader_id?: string;
  rating: number;
  comment: string;
  created_at: string;
  reader_name: string;
  is_anonymous: boolean;
  likes_count?: number;
  is_liked?: boolean;
};

export type BookRating = {
  book_id?: string;
  average_rating: number;
  total_reviews: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
};

export type ReviewsByBookResponse = {
  reviews: Review[];
  rating: BookRating;
};

async function request<T>(
  path: string,
  token: string | null,
  options?: { method?: string; body?: string }
): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body,
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

export type CreateReviewPayload = {
  book_id: string;
  rating: number;
  comment: string;
  is_anonymous: boolean;
};

export async function getReviewsByBookID(
  bookId: string,
  token: string | null
): Promise<ReviewsByBookResponse> {
  const data = await request<ReviewsByBookResponse>(
    `/api/v1/reviews/book/${bookId}`,
    token
  );
  return {
    reviews: Array.isArray(data?.reviews) ? data.reviews : [],
    rating: data?.rating ?? {
      average_rating: 0,
      total_reviews: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    },
  };
}

export async function createReview(
  payload: CreateReviewPayload,
  token: string | null
): Promise<{ id: string }> {
  if (!token) throw new Error('Необходима авторизация');
  return request<{ id: string }>('/api/v1/reviews', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type UpdateReviewPayload = {
  book_id: string;
  rating?: number;
  comment?: string;
  is_anonymous?: boolean;
};

export async function updateReview(
  reviewId: string,
  payload: UpdateReviewPayload,
  token: string | null
): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  await request(`/api/v1/reviews/${reviewId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteReview(reviewId: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/v1/reviews/${reviewId}`, {
    method: 'DELETE',
    headers,
  });
  if (res.status === 204) return;
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

export async function likeReview(reviewId: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/v1/reviews/${reviewId}/like`, {
    method: 'POST',
    headers,
  });
  if (res.status === 204) return;
  const text = await res.text();
  let message = text || 'Ошибка лайка';
  try {
    const json = JSON.parse(text);
    message = json.error ?? json.message ?? message;
  } catch (e) {
    console.log(e)
  }
  throw new Error(message);
}

export async function unlikeReview(reviewId: string, token: string | null): Promise<void> {
  if (!token) throw new Error('Необходима авторизация');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/v1/reviews/${reviewId}/like`, {
    method: 'DELETE',
    headers,
  });
  if (res.status === 204) return;
  const text = await res.text();
  let message = text || 'Ошибка снятия лайка';
  try {
    const json = JSON.parse(text);
    message = json.error ?? json.message ?? message;
  } catch (e) {
    console.log(e)
  }
  throw new Error(message);
}
