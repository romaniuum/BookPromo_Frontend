import type { BookRating } from '../../Api/reviews';
import styles from './RatingSidebar.module.css';

type RatingSidebarProps = {
  rating: BookRating | null;
  loading?: boolean;
};

const STAR_LABELS: Record<number, string> = {
  5: '5 звёзд',
  4: '4 звезды',
  3: '3 звезды',
  2: '2 звезды',
  1: '1 звезда',
};

const BAR_CLASS: Record<number, string> = {
  5: styles.barFill5,
  4: styles.barFill4,
  3: styles.barFill3,
  2: styles.barFill2,
  1: styles.barFill1,
};

export function RatingSidebar({ rating, loading }: RatingSidebarProps) {
  if (loading) {
    return (
      <aside className={styles.wrapper}>
        <div className={styles.title}>Рейтинг</div>
        <p className={styles.empty}>Загрузка…</p>
      </aside>
    );
  }

  const hasRating = rating && rating.total_reviews > 0;
  const maxCount = hasRating
    ? Math.max(
        rating!.rating_1,
        rating!.rating_2,
        rating!.rating_3,
        rating!.rating_4,
        rating!.rating_5
      )
    : 0;

  return (
    <aside className={styles.wrapper}>
      <div className={styles.title}>Рейтинг</div>
      {!hasRating ? (
        <p className={styles.empty}>Пока нет оценок</p>
      ) : (
        [5, 4, 3, 2, 1].map((n) => {
          const count = (rating as BookRating)[`rating_${n}` as keyof BookRating] as number ?? 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={n} className={styles.barRow}>
              <span className={styles.barLabel}>{STAR_LABELS[n]}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${BAR_CLASS[n]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={styles.barCount}>{count}</span>
            </div>
          );
        })
      )}
    </aside>
  );
}
