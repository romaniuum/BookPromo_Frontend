import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Alert } from 'antd';
import { ROUTES, getReviewPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import { getBookByID, type Book } from '../../Api/books';
import { getCurrentUserReview } from '../../Utils/reviews';
import { getReviewsByBookID, type BookRating, type Review } from '../../Api/reviews';
import { getMyReadingList, addToReadingList, removeFromReadingList } from '../../Api/readingList';
import { BookReviews } from './BookReviews';
import { RatingSidebar } from './RatingSidebar';
import { CreateReviewForm } from './CreateReviewForm';
import styles from './PromoPage.module.css';

type Tab = 'reviews' | 'about';

export function PromoPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<BookRating | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [navTab, setNavTab] = useState<Tab>('reviews');
  const [myBookIds, setMyBookIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) {
      queueMicrotask(() => {
        setLoading(false);
        setBook(null);
        setError(null);
      });
      return;
    }
    setLoading(true);
    setError(null);
    getBookByID(id, token)
      .then(setBook)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id, token]);

  const refetchReviews = useCallback((silent = false) => {
    if (!book?.id) return;
    if (!silent) setReviewsLoading(true);
    getReviewsByBookID(book.id, token)
      .then(({ reviews: r, rating: rt }) => {
        setReviews(r);
        setRating(rt);
      })
      .catch(() => {
        setReviews([]);
        setRating(null);
      })
      .finally(() => {
        if (!silent) setReviewsLoading(false);
      });
  }, [book, token]);

  useEffect(() => {
    if (!book?.id) return;
    refetchReviews();
  }, [book?.id, refetchReviews]);

  useEffect(() => {
    if (!token || !book?.id) {
      setMyBookIds(new Set());
      return;
    }
    getMyReadingList(token)
      .then((books) => setMyBookIds(new Set(books.map((b) => b.id))))
      .catch(() => setMyBookIds(new Set()));
  }, [token, book?.id]);

  const inMyBooks = book ? myBookIds.has(book.id) : false;
  const toggleMyBook = () => {
    if (!book || !token) return;
    if (inMyBooks) {
      setMyBookIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
      removeFromReadingList(book.id, token).catch(() => {
        setMyBookIds((prev) => new Set(prev).add(book.id));
      });
    } else {
      setMyBookIds((prev) => new Set(prev).add(book.id));
      addToReadingList(book.id, token).catch(() => {
        setMyBookIds((prev) => {
          const next = new Set(prev);
          next.delete(book.id);
          return next;
        });
      });
    }
  };

  if (!id) {
    navigate(ROUTES.CATALOG, { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className={styles.page}>
        <Alert
          type="error"
          message={error || 'Книга не найдена'}
          showIcon
          action={
            <Button size="small" onClick={() => navigate(ROUTES.CATALOG)}>
              В каталог
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebarLeft}>
          <div className={styles.coverWrap}>
            {book.cover_image ? (
              <img
                src={getImageUrl(book.cover_image)}
                alt=""
                className={styles.cover}
              />
            ) : (
              <div className={styles.coverPlaceholder} />
            )}
          </div>
        </aside>

        <main className={styles.main}>
          <h1 className={styles.bookTitle}>{book.title}</h1>
          <p className={styles.author}>{book.genre || 'Автор не указан'}</p>

          <div className={styles.actions}>
            {book.pdf_url ? (
              <a
                href={getImageUrl(book.pdf_url)}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button type="primary" size="large" className={styles.readBtn}>
                  Скачать книгу
                </Button>
              </a>
            ) : book.content ? (
              <Link to={getReviewPath(book.id)}>
                <Button type="primary" size="large" className={styles.readBtn}>
                  Читать
                </Button>
              </Link>
            ) : null}
            <Button
              size="large"
              className={styles.secondaryBtn}
              disabled={!token}
              onClick={toggleMyBook}
            >
              {inMyBooks ? 'Убрать из моих книг' : 'Добавить в мои книги'}
            </Button>
          </div>

          <div className={styles.navTabs}>
          <button
              type="button"
              className={`${styles.navTab} ${navTab === 'about' ? styles.navTabActive : ''}`}
              onClick={() => setNavTab('about')}
            >
              О книге
            </button>
            <button
              type="button"
              className={`${styles.navTab} ${navTab === 'reviews' ? styles.navTabActive : ''}`}
              onClick={() => setNavTab('reviews')}
            >
              Впечатления
              <span className={styles.navTabCount}>{reviews.length}</span>
            </button>

          </div>

          {navTab === 'about' ? (
            <p className={styles.descBlock}>
              {book.description || 'Нет описания.'}
            </p>
          ) : (
            <>
              <CreateReviewForm
                bookId={book.id}
                token={token}
                onSuccess={(opts) => refetchReviews(opts?.silent ?? false)}
                userReview={getCurrentUserReview(reviews, user?.id, user?.name ?? undefined)}
              />
              <div id="reviews-list">
                <BookReviews
                  bookId={book.id}
                  reviews={reviews}
                  rating={rating}
                  loading={reviewsLoading}
                  onSuccess={(opts) => refetchReviews(opts?.silent ?? false)}
                />
              </div>
            </>
          )}
        </main>

        <aside className={styles.sidebarRight}>
          <RatingSidebar rating={rating} loading={reviewsLoading} />
        </aside>
      </div>
    </div>
  );
}
