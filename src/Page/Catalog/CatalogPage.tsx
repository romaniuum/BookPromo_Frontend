import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input, Typography, Spin, Empty, Alert } from 'antd';
import { getPromoPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import { getAllBooks, type Book } from '../../Api/books';
import styles from './CatalogPage.module.css';

const { Title } = Typography;

function filterBooks(books: Book[], query: string): Book[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (book) =>
      book.title.toLowerCase().includes(q) ||
      (book.genre && book.genre.toLowerCase().includes(q)) ||
      (book.description && book.description.toLowerCase().includes(q))
  );
}

export function CatalogPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAllBooks(token)
      .then(setBooks)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredBooks = useMemo(
    () => filterBooks(books, searchQuery),
    [books, searchQuery]
  );

  return (
    <div className={styles.page}>
      <div className={styles.block__page}>
        <Title level={3} className={styles.title}>
          Каталог
        </Title>
        <Input
          placeholder="Поиск по названию, жанру или описанию"
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.search}
        />
      </div>
      {error && (
        <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
      )}
      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredBooks.length === 0 ? (
            <Empty
              description={books.length === 0 ? 'Книг пока нет' : 'Ничего не найдено'}
              style={{ gridColumn: '1 / -1' }}
            />
          ) : (
            filteredBooks.map((book) => (
              <Link key={book.id} to={getPromoPath(book.id)} className={styles.card}>
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
                <span className={styles.cardAuthor}>
                  {book.genre || '—'}
                </span>
                {book.description && (
                  <span className={styles.cardDesc}>
                    {book.description.slice(0, 60)}
                    {book.description.length > 60 ? '…' : ''}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
