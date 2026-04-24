import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Alert } from 'antd';
import { ROUTES, getReviewPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import { getBookByID, generatePromoText, type Book, type PromoTextResult } from '../../Api/books';
import { getCurrentUserReview } from '../../Utils/reviews';
import { getReviewsByBookID, type BookRating, type Review } from '../../Api/reviews';
import { getMyReadingList, addToReadingList, removeFromReadingList } from '../../Api/readingList';
import { BookReviews } from './BookReviews';
import { RatingSidebar } from './RatingSidebar';
import { CreateReviewForm } from './CreateReviewForm';
import styles from './PromoPage.module.css';

type Tab = 'reviews' | 'about' | 'share';

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
  const [promoText, setPromoText] = useState<PromoTextResult | null>(null);
  const [promoGenerating, setPromoGenerating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

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

  const handleGeneratePromo = async () => {
    if (!book || !token) return;
    setPromoGenerating(true);
    setPromoError(null);
    try {
      const result = await generatePromoText(
        {
          title: book.title,
          author: book.author_name || undefined,
          genre: book.genre || undefined,
          description: book.description || undefined,
          year: book.publication_year || undefined,
        },
        token
      );
      setPromoText(result);
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : 'Ошибка генерации');
    } finally {
      setPromoGenerating(false);
    }
  };

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
          <p className={styles.author}>{book.author_name || 'Автор не указан'}</p>

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
            {book.cover_image && (
              <a
                href={getImageUrl(book.cover_image)}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="large" className={styles.secondaryBtn}>
                  Скачать обложку
                </Button>
              </a>
            )}
          </div>

          <div className={styles.bookMeta}>
            {book.author_name && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Автор:</span>
                <span className={styles.metaValue}>{book.author_name}</span>
              </div>
            )}
            {book.genre && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Жанр:</span>
                <span className={styles.metaValue}>{book.genre}</span>
              </div>
            )}
            {book.publication_year && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Год издания:</span>
                <span className={styles.metaValue}>{book.publication_year}</span>
              </div>
            )}
            {book.publisher && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Издательство:</span>
                <span className={styles.metaValue}>{book.publisher}</span>
              </div>
            )}
            {book.isbn && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>ISBN:</span>
                <span className={styles.metaValue}>{book.isbn}</span>
              </div>
            )}
            {book.pdf_url && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Формат:</span>
                <span className={styles.metaValue}>PDF</span>
              </div>
            )}
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
            <button
              type="button"
              className={`${styles.navTab} ${navTab === 'share' ? styles.navTabActive : ''}`}
              onClick={() => setNavTab('share')}
            >
              Поделиться
            </button>
          </div>

          {navTab === 'about' && (
            <div>
              <p className={styles.descBlock}>
                {book.description || 'Нет описания.'}
              </p>

              {token && user && book.author_id === user.id && (
                <div className={styles.promoSection}>
                  <div className={styles.promoHeader}>
                    <span className={styles.promoTitle}>Промо-материалы</span>
                    <Button
                      size="small"
                      type="primary"
                      loading={promoGenerating}
                      onClick={handleGeneratePromo}
                    >
                      {promoText ? 'Перегенерировать' : 'Сгенерировать промо-текст'}
                    </Button>
                  </div>

                  {promoError && (
                    <Alert
                      type="error"
                      message={promoError}
                      showIcon
                      style={{ marginBottom: 12 }}
                    />
                  )}

                  {promoGenerating && (
                    <div className={styles.promoLoading}>
                      <Spin size="small" />
                      <span>Генерация промо-текста…</span>
                    </div>
                  )}

                  {promoText && !promoGenerating && (
                    <div className={styles.promoResult}>
                      <div className={styles.promoBlock}>
                        <div className={styles.promoBlockLabel}>Рекламное описание</div>
                        <p className={styles.promoAdText}>{promoText.ad_text}</p>
                      </div>

                      {promoText.theses.length > 0 && (
                        <div className={styles.promoBlock}>
                          <div className={styles.promoBlockLabel}>Ключевые тезисы</div>
                          <ul className={styles.thesesList}>
                            {promoText.theses.map((thesis, i) => (
                              <li key={i} className={styles.thesisItem}>
                                <span className={styles.thesisNum}>{i + 1}</span>
                                {thesis}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!promoText && !promoGenerating && (
                    <p className={styles.promoHint}>
                      Нажмите кнопку чтобы сгенерировать рекламное описание и
                      ключевые тезисы на основе данных книги
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {navTab === 'reviews' && (
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
          {navTab === 'share' && (
            <div className={styles.shareSection}>
              <p className={styles.shareHint}>
                Так будет выглядеть карточка книги при публикации в социальных сетях
              </p>

              {/* VK превью */}
              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>
                  <span className={styles.previewLabelVk}>VK</span>
                  Превью для ВКонтакте
                </div>
                <div className={styles.vkCard}>
                  <div className={styles.vkImageWrap}>
                    {book.cover_image ? (
                      <img
                        src={getImageUrl(book.cover_image)}
                        alt=""
                        className={styles.vkImage}
                      />
                    ) : (
                      <div className={styles.vkImagePlaceholder} />
                    )}
                  </div>
                  <div className={styles.vkContent}>
                    <div className={styles.vkSite}>bookpromo.ru</div>
                    <div className={styles.vkTitle}>{book.title}</div>
                    <div className={styles.vkDescription}>
                      {book.description
                        ? book.description.slice(0, 120) + (book.description.length > 120 ? '…' : '')
                        : 'Откройте для себя эту книгу на BookPromo'}
                    </div>
                    {book.author_name && (
                      <div className={styles.vkAuthor}>Автор: {book.author_name}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Telegram превью */}
              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>
                  <span className={styles.previewLabelTg}>TG</span>
                  Превью для Telegram
                </div>
                <div className={styles.tgCard}>
                  <div className={styles.tgAccent} />
                  <div className={styles.tgBody}>
                    {book.cover_image && (
                      <img
                        src={getImageUrl(book.cover_image)}
                        alt=""
                        className={styles.tgImage}
                      />
                    )}
                    <div className={styles.tgContent}>
                      <div className={styles.tgSite}>bookpromo.ru</div>
                      <div className={styles.tgTitle}>{book.title}</div>
                      <div className={styles.tgDescription}>
                        {book.description
                          ? book.description.slice(0, 200) + (book.description.length > 200 ? '…' : '')
                          : 'Откройте для себя эту книгу на BookPromo'}
                      </div>
                      {book.author_name && (
                        <div className={styles.tgAuthor}>✍️ {book.author_name}</div>
                      )}
                      {book.genre && (
                        <div className={styles.tgGenre}>📚 {book.genre}</div>
                      )}
                      {book.publication_year && (
                        <div className={styles.tgYear}>📅 {book.publication_year}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className={styles.sidebarRight}>
          <RatingSidebar rating={rating} loading={reviewsLoading} />
        </aside>
      </div>
    </div>
  );
}
