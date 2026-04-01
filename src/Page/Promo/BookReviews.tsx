import { useEffect, useState, useMemo } from 'react';
import { Rate, Spin } from 'antd';
import { HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useAuth } from '../../Contexts/AuthContext';
import { getReviewsByBookID, likeReview, unlikeReview, type Review, type BookRating } from '../../Api/reviews';
import styles from './BookReviews.module.css';

type BookReviewsProps = {
  bookId: string;
  reviews?: Review[] | null;
  rating?: BookRating | null;
  loading?: boolean;
  onSuccess?: (opts?: { silent?: boolean }) => void;
};

function timeAgo(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const sec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (sec < 60) return 'только что';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} ${min === 1 ? 'минуту' : min < 5 ? 'минуты' : 'минут'} назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ${h === 1 ? 'час' : h < 5 ? 'часа' : 'часов'} назад`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d} ${d === 1 ? 'день' : d < 5 ? 'дня' : 'дней'} назад`;
    const m = Math.floor(d / 30);
    if (m < 12) return `${m} ${m === 1 ? 'месяц' : m < 5 ? 'месяца' : 'месяцев'} назад`;
    const y = Math.floor(m / 12);
    return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'} назад`;
  } catch {
    return iso;
  }
}

function initial(name: string): string {
  if (!name || name === 'Анонимный пользователь') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function BookReviews({
  bookId,
  reviews: reviewsProp,
  rating: _ratingProp,
  loading: loadingProp,
  onSuccess,
}: BookReviewsProps) {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, { is_liked: boolean; likes_count: number }>>({});

  const isControlled = reviewsProp !== undefined;
  const displayReviews = isControlled ? (reviewsProp ?? []) : reviews;
  const displayLoading = isControlled ? !!loadingProp : loading;

  useEffect(() => {
    setOptimisticLikes((prev) => {
      let next = prev;
      for (const r of displayReviews) {
        const o = prev[r.id];
        if (o && r.is_liked === o.is_liked && (r.likes_count ?? 0) === o.likes_count) {
          const { [r.id]: _, ...rest } = next;
          next = rest;
        }
      }
      return next;
    });
  }, [displayReviews]);

  const isOwnReview = (r: Review): boolean => {
    if (!user) return false;
    if (r.reader_id && String(r.reader_id).toLowerCase() === String(user.id).toLowerCase()) return true;
    if (!r.is_anonymous && r.reader_name && user.name && r.reader_name.trim() === user.name.trim()) return true;
    return false;
  };

  const reviewsToShow = useMemo(() => {
    return displayReviews.filter((r) => !isOwnReview(r));
  }, [displayReviews, user?.id, user?.name]);

  useEffect(() => {
    if (isControlled || !bookId) {
      if (isControlled) setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getReviewsByBookID(bookId, token)
      .then(({ reviews: r }) => setReviews(r))
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [bookId, token, isControlled]);

  const handleLike = async (r: Review) => {
    if (!token) return;
    const currentLiked = optimisticLikes[r.id]?.is_liked ?? r.is_liked === true;
    const currentCount = Math.max(0, optimisticLikes[r.id]?.likes_count ?? r.likes_count ?? 0);
    const nextLiked = !currentLiked;
    const nextCount = currentCount + (nextLiked ? 1 : -1);
    setOptimisticLikes((prev) => ({ ...prev, [r.id]: { is_liked: nextLiked, likes_count: nextCount } }));
    try {
      if (currentLiked) {
        await unlikeReview(r.id, token);
      } else {
        await likeReview(r.id, token);
      }
      onSuccess?.({ silent: true });
    } catch {
      setOptimisticLikes((prev) => {
        const { [r.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const getLikeCount = (r: Review) =>
    Math.max(0, optimisticLikes[r.id]?.likes_count ?? r.likes_count ?? 0);
  const isLiked = (r: Review) => optimisticLikes[r.id]?.is_liked ?? r.is_liked === true;

  if (displayLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loading}>
          <Spin size="small" />
        </div>
      </div>
    );
  }

  if (error && !isControlled) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.error}>Не удалось загрузить отзывы</p>
      </div>
    );
  }

  if (reviewsToShow.length === 0) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.empty}>
          {displayReviews.length === 0 ? 'Нет отзывов' : 'Других отзывов пока нет'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {reviewsToShow.map((r) => (
        <article key={r.id} className={styles.reviewCard}>
          <div className={styles.reviewHead}>
            <div className={styles.avatar}>
              {r.is_anonymous ? '?' : initial(r.reader_name)}
            </div>
            <div className={styles.reviewMeta}>
              <div className={styles.reviewAuthorRow}>
                <span className={styles.reviewAuthor}>
                  {r.is_anonymous ? 'Анонимный пользователь' : r.reader_name}
                </span>
              </div>
              <p className={styles.reviewTime}>{timeAgo(r.created_at)}</p>
            </div>
            <Rate value={r.rating} count={5} disabled className={styles.reviewStars} />
          </div>
          {r.comment ? <p className={styles.reviewComment}>{r.comment}</p> : <p className={styles.reviewCommentPlaceholder}>Нет текста отзыва</p>}
          <div className={styles.reviewEngagement}>
            <span className={styles.reviewLikes}>{getLikeCount(r)} НРАВИТСЯ</span>
            <span className={styles.reviewEngagementDot}>·</span>
            <span className={styles.reviewCommentsCount}>0 КОММЕНТАРИЕВ</span>
          </div>
          <div className={styles.reviewActions}>
            <button
              type="button"
              className={`${styles.reviewAction} ${isLiked(r) ? styles.reviewActionLiked : ''}`}
              aria-label="Нравится"
              disabled={!token}
              onClick={() => handleLike(r)}
            >
              {isLiked(r) ? (
                <HeartFilled className={styles.actionIcon} />
              ) : (
                <HeartOutlined className={styles.actionIcon} />
              )}
              НРАВИТСЯ
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
