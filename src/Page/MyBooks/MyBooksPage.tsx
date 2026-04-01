import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Spin, Empty, Alert, message } from 'antd';
import { getPromoPath, getReviewPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import type { Book } from '../../Api/books';
import { getMyReadingList, removeFromReadingList } from '../../Api/readingList';
import styles from './MyBooksPage.module.css';

const { Title } = Typography;

export function MyBooksPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getMyReadingList(token)
      .then(setBooks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setBooks([]);
      setError(null);
      return;
    }
    load();
  }, [token]);

  const handleRemove = (bookId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    removeFromReadingList(bookId, token).catch(() => {
      message.error('Не удалось убрать книгу');
      load();
    });
  };

  if (!token) {
    return (
      <div className={styles.page}>
        <Title level={3} className={styles.title}>
          Мои книги
        </Title>
        <Empty description="Войдите, чтобы видеть свои книги для чтения" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Title level={3} className={styles.title}>
        Мои книги
      </Title>
      <p className={styles.subtitle}>Книги, добавленные для чтения</p>
      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      )}
      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : (
        <div className={styles.grid}>
          {books.length === 0 ? (
            <Empty description="Вы ещё не добавили ни одной книги" style={{ gridColumn: '1 / -1' }} />
          ) : (
            books.map((book) => (
              <div key={book.id} className={styles.cardWrap}>
                <Link to={getPromoPath(book.id)} className={styles.card}>
                  {book.cover_image ? (
                    <img
                      src={getImageUrl(book.cover_image)}
                      alt=""
                      className={styles.cover}
                    />
                  ) : (
                    <div className={styles.cover} />
                  )}
                  <span className={styles.cardTitle}>{book.title}</span>
                  <span className={styles.cardAuthor}>{book.genre || '—'}</span>
                </Link>
                <div className={styles.cardActions}>
                  <Link to={getReviewPath(book.id)}>
                    <Button type="primary" size="middle">
                      Читать
                    </Button>
                  </Link>
                  <Button size="middle" danger onClick={(e) => handleRemove(book.id, e)}>
                    Убрать
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
