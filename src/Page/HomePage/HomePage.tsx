import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Typography, Spin, Alert } from 'antd';
import { ROUTES, getPromoPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import { getHomeSections, type HomeSections, type BookPublic } from '../../Api/books';
import styles from './HomePage.module.css';

const { Title, Paragraph } = Typography;

function BookCard({ book }: { book: BookPublic }) {
  return (
    <Link to={getPromoPath(book.id)} className={styles.card}>
      {book.cover_image ? (
        <img src={getImageUrl(book.cover_image)} alt="" className={styles.cover} />
      ) : (
        <div className={styles.cover} />
      )}
      <span className={styles.cardTitle}>{book.title}</span>
      <span className={styles.cardAuthor}>{book.author_name || '—'}</span>
      {(book.avg_rating > 0 || book.reviews_count > 0) && (
        <span className={styles.cardMeta}>
          ★ {book.avg_rating.toFixed(1)} ({book.reviews_count})
        </span>
      )}
    </Link>
  );
}

function CarouselSection({
  title,
  books,
}: {
  title: string;
  books: BookPublic[];
}) {
  if (books.length === 0) return null;
  return (
    <section className={styles.section}>
      <Title level={3}>{title}</Title>
      <div className={styles.carousel}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const { token } = useAuth();
  const [sections, setSections] = useState<HomeSections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getHomeSections(token)
      .then(setSections)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Title level={1} className={styles.title}>
          Электронная библиотека
        </Title>
        <Paragraph className={styles.subtitle}>
          Читайте и слушайте книги онлайн
        </Paragraph>
        <div className={styles.actions}>
          <Link to={ROUTES.CATALOG}>
            <Button type="primary" size="large">
              В каталог
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} showIcon style={{ marginTop: 24 }} />
      )}

      {loading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : sections ? (
        <>
          <CarouselSection title="Популярные" books={sections.popular} />
          <CarouselSection title="Рейтинговые" books={sections.topRated} />
          <CarouselSection title="Новые книги" books={sections.new} />
        </>
      ) : null}
    </div>
  );
}
