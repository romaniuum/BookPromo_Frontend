import type { Review } from '../Api/reviews';

export function getCurrentUserReview(
  reviews: Review[],
  userId: string | undefined,
  userName: string | undefined
): Review | null {
  if (!userId && !userName) return null;
  for (const r of reviews) {
    if (r.reader_id && userId && String(r.reader_id).toLowerCase() === String(userId).toLowerCase()) return r;
    if (!r.is_anonymous && r.reader_name && userName && r.reader_name.trim() === userName.trim()) return r;
  }
  return null;
}
