import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Typography,
  Spin,
  Empty,
  Tag,
  Popconfirm,
  message,
  Space,
  Modal,
  Form,
  Input,
  Upload,
} from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, CameraOutlined } from '@ant-design/icons';
import { ROUTES, getPromoPath, getEditBookPath, getImageUrl } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import { getAllBooks, deleteBook, uploadCover, type Book } from '../../Api/books';
import { getReviewsByBookID, type Review, type BookRating } from '../../Api/reviews';
import { updateProfile } from '../../Api/auth';
import styles from './AuthorPage.module.css';

const { Title, Text } = Typography;

type BookWithStats = Book & { rating: BookRating; reviews: Review[] };

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    author: 'Автор',
    reader: 'Читатель',
    admin: 'Администратор',
  };
  return map[role] ?? role;
}

function initial(name: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function AuthorPage() {
  const { token, user, refetchUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [booksWithStats, setBooksWithStats] = useState<BookWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined);
  const [form] = Form.useForm();

  // Один раз при открытии ЛК — запрос профиля (бэкенд при наличии книг выставит роль author)
  useEffect(() => {
    if (token) refetchUser();
  }, [token, refetchUser]);

  const loadMyBooks = useCallback(() => {
    if (!token || !user) {
      setLoading(false);
      setBooksWithStats([]);
      return;
    }
    setLoading(true);
    getAllBooks(token)
      .then((books) => books.filter((b) => b.author_id === user.id))
      .then((myBooks) => {
        return Promise.all(
          myBooks.map((book) =>
            getReviewsByBookID(book.id, token).then(({ reviews, rating }) => ({
              ...book,
              rating,
              reviews,
            }))
          )
        );
      })
      .then(setBooksWithStats)
      .catch(() => setBooksWithStats([]))
      .finally(() => setLoading(false));
  }, [token, user?.id]);

  // Загрузка книг только при смене token или user.id, чтобы не дублировать запросы при обновлении профиля (роль)
  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      setBooksWithStats([]);
      return;
    }
    loadMyBooks();
  }, [token, user?.id, loadMyBooks]);

  const openSettings = useCallback(() => {
    form.setFieldsValue({
      name: user?.name ?? '',
      email: user?.email ?? '',
      current_password: '',
      new_password: '',
    });
    setAvatarUrl(undefined);
    setSettingsOpen(true);
  }, [user, form]);

  const saveSettings = useCallback(async () => {
    if (!token || !user) return;
    const values = await form.validateFields();
    setSettingsLoading(true);
    try {
      const newEmail = values.email?.trim();
      const newPass = values.new_password?.trim();
      const emailChanged = newEmail && newEmail !== user.email;
      const passwordChanged = !!newPass;
      const payload = {
        name: values.name?.trim() || undefined,
        email: newEmail || undefined,
        new_password: newPass || undefined,
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
        ...((emailChanged || passwordChanged) && {
          current_password: values.current_password,
        }),
      };
      const updated = await updateProfile(token, payload);
      updateUser(updated);
      message.success('Профиль обновлён');
      setSettingsOpen(false);
      form.resetFields();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSettingsLoading(false);
    }
  }, [token, user, form, avatarUrl, updateUser]);

  if (!token) {
    return (
      <div className={styles.page}>
        <Empty
          description="Войдите, чтобы открыть личный кабинет"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => navigate(ROUTES.AUTH)}>
            Войти
          </Button>
        </Empty>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const isAuthor = user.role === 'author' || booksWithStats.length > 0;
  const allReviews = booksWithStats.flatMap((b) =>
    b.reviews.map((r) => ({ ...r, bookTitle: b.title }))
  );
  allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className={styles.page}>
      <Title level={3} className={styles.mainTitle}>
        Личный кабинет
      </Title>

      <Card className={styles.profileCard}>
        <div className={styles.profileRow}>
          <div className={styles.avatarWrap}>
            {user.avatar_url ? (
              <img
                src={getImageUrl(user.avatar_url)}
                alt=""
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarInitials}>{initial(user.name)}</span>
              </div>
            )}
          </div>
          <div className={styles.profileInfo}>
            <Title level={4} className={styles.profileName}>
              {user.name}
            </Title>
            <Text type="secondary" className={styles.profileEmail}>
              {user.email}
            </Text>
            <div className={styles.profileMeta}>
              <Tag color="blue">{roleLabel(user.role)}</Tag>
              <Text type="secondary" className={styles.profileDate}>
                Регистрация: {formatDate(user.created_at)}
              </Text>
            </div>
            <Button type="default" className={styles.settingsBtn} onClick={openSettings}>
              Настройки
            </Button>
          </div>
        </div>
      </Card>

      {booksWithStats.length > 0 && (
        <Card className={styles.statsCard}>
          <Title level={5} className={styles.statsTitle}>
            Сводная статистика
          </Title>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{booksWithStats.length}</span>
              <span className={styles.statLabel}>Книг</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{allReviews.length}</span>
              <span className={styles.statLabel}>Отзывов</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {allReviews.length > 0
                  ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
                  : '—'}
              </span>
              <span className={styles.statLabel}>Средний рейтинг</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {allReviews.filter(r => r.rating >= 4).length}
              </span>
              <span className={styles.statLabel}>Положительных</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>
                {allReviews.filter(r => r.rating <= 2).length}
              </span>
              <span className={styles.statLabel}>Критических</span>
            </div>
          </div>
        </Card>
      )}

      {isAuthor && (
        <>
          <div className={styles.sectionHead}>
            <Title level={4} className={styles.sectionTitle}>
              Мои книги
            </Title>
            <Link to={ROUTES.CREATE_BOOK}>
              <Button type="primary" size="small">
                Создать книгу
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <Spin size="large" />
            </div>
          ) : booksWithStats.length === 0 ? (
            <Card className={styles.card}>
              <Empty description="У вас пока нет книг">
                <Link to={ROUTES.CREATE_BOOK}>
                  <Button type="primary">Создать первую книгу</Button>
                </Link>
              </Empty>
            </Card>
          ) : (
            <div className={styles.list}>
              {booksWithStats.map((book) => (
                <Card key={book.id} className={styles.card}>
                  <div className={styles.cardInner}>
                    <div className={styles.cardLeft}>
                      {book.cover_image ? (
                        <img
                          src={getImageUrl(book.cover_image)}
                          alt=""
                          className={styles.cover}
                        />
                      ) : (
                        <div className={styles.coverPlaceholder} />
                      )}
                      <div className={styles.cardMeta}>
                        <Title level={5} className={styles.cardTitle}>
                          {book.title}
                        </Title>
                        <Text type="secondary" className={styles.cardStats}>
                          Отзывов: {book.rating?.total_reviews ?? 0} · Ср. рейтинг:{' '}
                          {(book.rating?.average_rating ?? 0).toFixed(1)}
                        </Text>
                        <Space wrap>
                          <Link to={getPromoPath(book.id)}>
                            <Button size="small">К странице книги</Button>
                          </Link>
                          <Link to={getEditBookPath(book.id)}>
                            <Button size="small">Редактировать</Button>
                          </Link>
                          <Popconfirm
                            title="Удалить книгу?"
                            description="Это действие нельзя отменить."
                            onConfirm={() => {
                              if (!token) return;
                              deleteBook(book.id, token)
                                .then(() => {
                                  message.success('Книга удалена');
                                  loadMyBooks();
                                })
                                .catch((e) => message.error(e instanceof Error ? e.message : 'Ошибка'));
                            }}
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{ danger: true }}
                          >
                            <Button size="small" danger>
                              Удалить
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {booksWithStats.length > 0 && booksWithStats.some(b => b.reviews.length > 0) && (
            <>
              <Title level={4} className={styles.sectionTitleReviews}>
                Отчёт по отзывам
              </Title>
              {booksWithStats
                .filter(b => b.reviews.length > 0)
                .map(book => {
                  const avgRating = book.rating?.average_rating ?? 0;
                  const positive = book.reviews.filter(r => r.rating >= 4);
                  const neutral = book.reviews.filter(r => r.rating === 3);
                  const critical = book.reviews.filter(r => r.rating <= 2);

                  return (
                    <Card key={book.id} className={styles.reportCard}>
                      <div className={styles.reportHeader}>
                        <Title level={5} className={styles.reportBookTitle}>
                          {book.title}
                        </Title>
                        <div className={styles.reportRating}>
                          <span className={styles.reportRatingValue}>
                            {avgRating.toFixed(1)} ★
                          </span>
                          <Text type="secondary">
                            {book.reviews.length} отзывов
                          </Text>
                        </div>
                      </div>

                      <div className={styles.ratingDistribution}>
                        <div className={styles.distRow}>
                          <span className={styles.distLabel}>Положительные (4-5 ★)</span>
                          <div className={styles.distBar}>
                            <div
                              className={styles.distBarFill}
                              style={{
                                width: book.reviews.length
                                  ? `${(positive.length / book.reviews.length) * 100}%`
                                  : '0%',
                                background: '#52c41a',
                              }}
                            />
                          </div>
                          <span className={styles.distCount}>{positive.length}</span>
                        </div>
                        <div className={styles.distRow}>
                          <span className={styles.distLabel}>Нейтральные (3 ★)</span>
                          <div className={styles.distBar}>
                            <div
                              className={styles.distBarFill}
                              style={{
                                width: book.reviews.length
                                  ? `${(neutral.length / book.reviews.length) * 100}%`
                                  : '0%',
                                background: '#faad14',
                              }}
                            />
                          </div>
                          <span className={styles.distCount}>{neutral.length}</span>
                        </div>
                        <div className={styles.distRow}>
                          <span className={styles.distLabel}>Критические (1-2 ★)</span>
                          <div className={styles.distBar}>
                            <div
                              className={styles.distBarFill}
                              style={{
                                width: book.reviews.length
                                  ? `${(critical.length / book.reviews.length) * 100}%`
                                  : '0%',
                                background: '#ff4d4f',
                              }}
                            />
                          </div>
                          <span className={styles.distCount}>{critical.length}</span>
                        </div>
                      </div>

                      {critical.length > 0 && (
                        <div className={styles.suggestions}>
                          <Text strong>Замечания читателей:</Text>
                          <ul className={styles.suggestionsList}>
                            {critical
                              .filter(r => r.comment)
                              .slice(0, 3)
                              .map(r => (
                                <li key={r.id} className={styles.suggestionItem}>
                                  <span className={styles.suggestionRating}>
                                    {r.rating} ★
                                  </span>
                                  <span className={styles.suggestionText}>
                                    {r.comment!.slice(0, 150)}
                                    {r.comment!.length > 150 ? '…' : ''}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {positive.length > 0 && positive.some(r => r.comment) && (
                        <div className={styles.bestReview}>
                          <Text strong>Лучший отзыв:</Text>
                          <p className={styles.bestReviewText}>
                            «{positive.find(r => r.comment)!.comment!.slice(0, 200)}»
                          </p>
                        </div>
                      )}

                      <div className={styles.reportConclusion}>
                        {avgRating >= 4 && (
                          <Text type="success">
                            ✓ Книга хорошо принята читателями
                          </Text>
                        )}
                        {avgRating >= 3 && avgRating < 4 && (
                          <Text type="warning">
                            ⚠ Смешанные отзывы — стоит обратить внимание на замечания
                          </Text>
                        )}
                        {avgRating < 3 && avgRating > 0 && (
                          <Text type="danger">
                            ✗ Книга требует доработки согласно отзывам читателей
                          </Text>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </>
          )}
        </>
      )}

      {user.role !== 'author' && (
        <Card className={styles.card}>
          <Text type="secondary">
            Здесь отображаются ваши книги и статистика, если вы зарегистрированы как автор.
          </Text>
        </Card>
      )}

      <Modal
        title="Настройки профиля"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        onOk={saveSettings}
        confirmLoading={settingsLoading}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
        width={400}
      >
        <Form form={form} layout="vertical" className={styles.settingsForm}>
          <div className={styles.avatarUploadWrap}>
            <div className={styles.avatarPreview}>
              {(avatarUrl !== undefined ? avatarUrl : user?.avatar_url) ? (
                <img
                  src={getImageUrl(avatarUrl !== undefined ? avatarUrl : user?.avatar_url ?? '')}
                  alt=""
                  className={styles.avatarPreviewImg}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span className={styles.avatarInitials}>
                    {initial(user?.name ?? '')}
                  </span>
                </div>
              )}
            </div>
            <Space direction="vertical" size={4}>
              <Upload
                accept="image/jpeg,image/jpg"
                showUploadList={false}
                beforeUpload={async (file) => {
                  if (!token) return false;
                  try {
                    const url = await uploadCover(file, token);
                    setAvatarUrl(url);
                    message.success('Фото загружено');
                  } catch (e) {
                    message.error(e instanceof Error ? e.message : 'Ошибка загрузки');
                  }
                  return false;
                }}
              >
                <Button size="small" icon={<CameraOutlined />}>
                  Загрузить фото (JPG)
                </Button>
              </Upload>
              {(avatarUrl !== undefined ? avatarUrl : user?.avatar_url) && (
                <Button
                  size="small"
                  type="text"
                  danger
                  onClick={() => setAvatarUrl(null)}
                >
                  Удалить фото
                </Button>
              )}
            </Space>
          </div>

          <Form.Item
            name="name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ваше имя" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Почта"
            rules={[
              { required: true, message: 'Введите почту' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            name="current_password"
            label="Текущий пароль (только при смене пароля или почты)"
            rules={[
              {
                validator: (_, value) => {
                  const newPass = form.getFieldValue('new_password');
                  const emailVal = form.getFieldValue('email');
                  const needPass =
                    (newPass?.trim() && newPass.trim() !== '') ||
                    (emailVal?.trim() && emailVal.trim() !== user?.email);
                  if (needPass && !value?.trim()) {
                    return Promise.reject(
                      new Error('Введите текущий пароль для смены пароля или почты')
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Текущий пароль" />
          </Form.Item>

          <Form.Item name="new_password" label="Новый пароль (оставьте пустым, чтобы не менять)">
            <Input.Password prefix={<LockOutlined />} placeholder="Новый пароль" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
