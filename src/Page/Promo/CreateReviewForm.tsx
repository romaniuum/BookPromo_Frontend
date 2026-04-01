import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Rate, Input, Checkbox, Dropdown, Modal, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  HeartOutlined,
  HeartFilled,
  MoreOutlined,
} from '@ant-design/icons';
import { ROUTES } from '../../Constants';
import { createReview, deleteReview, updateReview, likeReview, unlikeReview, type Review } from '../../Api/reviews';
import styles from './CreateReviewForm.module.css';

const { TextArea } = Input;

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
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type CreateReviewFormProps = {
  bookId: string;
  token: string | null;
  onSuccess: (opts?: { silent?: boolean }) => void;
  userReview?: Review | null;
};

export function CreateReviewForm({ bookId, token, onSuccess, userReview }: CreateReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [optimisticLike, setOptimisticLike] = useState<{ is_liked: boolean; likes_count: number } | null>(null);

  useEffect(() => {
    if (userReview && optimisticLike !== null) {
      if (userReview.is_liked === optimisticLike.is_liked && (userReview.likes_count ?? 0) === optimisticLike.likes_count) {
        setOptimisticLike(null);
      }
    }
  }, [userReview?.is_liked, userReview?.likes_count, optimisticLike]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      message.warning('Выберите оценку от 1 до 5 звёзд');
      return;
    }
    if (!token) {
      message.warning('Войдите, чтобы оставить отзыв');
      return;
    }
    setSubmitting(true);
    try {
      await createReview(
        {
          book_id: bookId,
          rating,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
        },
        token
      );
      message.success('Отзыв добавлен');
      setRating(0);
      setComment('');
      setIsAnonymous(false);
      onSuccess();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('уже')) {
        message.warning('Вы уже оставили отзыв на эту книгу. Отредактируйте его в списке ниже.');
        onSuccess();
      } else {
        message.error(msg || 'Не удалось отправить отзыв');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.loginHint}>
          <Link to={ROUTES.AUTH}>Войдите</Link>, чтобы оставить отзыв о книге.
        </p>
      </div>
    );
  }

  const startEdit = () => {
    if (!userReview) return;
    setEditRating(userReview.rating);
    setEditComment(userReview.comment ?? '');
    setEditAnonymous(userReview.is_anonymous);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!userReview || !token || editRating < 1 || editRating > 5) return;
    if (editComment.trim().length === 0) {
      message.warning('Введите текст отзыва');
      return;
    }
    setEditSubmitting(true);
    try {
      await updateReview(
        userReview.id,
        {
          book_id: bookId,
          rating: editRating,
          comment: editComment.trim(),
          is_anonymous: editAnonymous,
        },
        token
      );
      message.success('Отзыв обновлён');
      setIsEditing(false);
      onSuccess();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Не удалось обновить отзыв');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!userReview || !token) return;
    Modal.confirm({
      title: 'Удалить отзыв?',
      content: 'Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        setDeleting(true);
        try {
          await deleteReview(userReview.id, token);
          message.success('Отзыв удалён');
          onSuccess();
        } catch (e) {
          message.error(e instanceof Error ? e.message : 'Не удалось удалить отзыв');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (userReview) {
    return (
      <div className={styles.wrapper}>
        <h3 className={styles.title}>Ваш отзыв</h3>
        <div className={styles.userReviewCard}>
          <div className={styles.userReviewHead}>
            <div className={styles.userReviewAvatar}>
              {userReview.is_anonymous ? '?' : initial(userReview.reader_name)}
            </div>
            <div className={styles.userReviewMeta}>
              <div className={styles.userReviewAuthorRow}>
                <span className={styles.userReviewAuthor}>
                  {userReview.is_anonymous ? 'Анонимный пользователь' : userReview.reader_name}
                </span>
              </div>
              <p className={styles.userReviewTime}>{timeAgo(userReview.created_at)}</p>
            </div>
            {isEditing ? (
              <Rate value={editRating} onChange={setEditRating} className={styles.userReviewStars} />
            ) : (
              <Rate value={userReview.rating} count={5} disabled className={styles.userReviewStars} />
            )}
            {!isEditing && (
              <span className={styles.userReviewHeadMore}>
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'edit',
                        label: 'Редактировать',
                        icon: <EditOutlined />,
                        onClick: () => startEdit(),
                      },
                      {
                        key: 'delete',
                        label: 'Удалить',
                        icon: <DeleteOutlined />,
                        danger: true,
                        disabled: deleting,
                        onClick: () => handleDelete(),
                      },
                    ] as MenuProps['items'],
                  }}
                  placement="bottomRight"
                >
                  <button type="button" className={styles.userReviewMoreBtn} aria-label="Ещё">
                    <MoreOutlined className={styles.userReviewMoreIcon} />
                  </button>
                </Dropdown>
              </span>
            )}
          </div>
          {isEditing ? (
            <>
              <div className={styles.userReviewEditWrap}>
                <TextArea
                  placeholder="Текст отзыва"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className={styles.userReviewEditTextarea}
                  maxLength={2000}
                  showCount
                  rows={4}
                />
              </div>
              <Checkbox
                checked={editAnonymous}
                onChange={(e) => setEditAnonymous(e.target.checked)}
                className={styles.userReviewEditCheckbox}
              >
                Оставить анонимно
              </Checkbox>
              <div className={styles.userReviewActions}>
                <Button size="small" onClick={cancelEdit} className={styles.userReviewBtn}>
                  Отмена
                </Button>
                <Button
                  type="primary"
                  size="small"
                  loading={editSubmitting}
                  disabled={editRating < 1 || editComment.trim().length === 0}
                  onClick={handleUpdate}
                  className={styles.userReviewBtn}
                >
                  Сохранить
                </Button>
              </div>
            </>
          ) : (
            <>
              {userReview.comment ? (
                <p className={styles.userReviewComment}>{userReview.comment}</p>
              ) : (
                <p className={styles.userReviewCommentPlaceholder}>Нет текста отзыва</p>
              )}
              <div className={styles.userReviewEngagement}>
                <span className={styles.userReviewLikes}>
                  {Math.max(0, optimisticLike?.likes_count ?? userReview.likes_count ?? 0)} НРАВИТСЯ
                </span>
                <span className={styles.userReviewEngagementDot}>·</span>
                <span className={styles.userReviewCommentsCount}>0 КОММЕНТАРИЕВ</span>
              </div>
              <div className={styles.userReviewActionsRow}>
                <button
                  type="button"
                  className={`${styles.userReviewAction} ${(optimisticLike?.is_liked ?? userReview.is_liked) ? styles.userReviewActionLiked : ''}`}
                  aria-label="Нравится"
                  disabled={!token}
                  onClick={async () => {
                    if (!token) return;
                    const cur = optimisticLike ?? {
                      is_liked: userReview.is_liked === true,
                      likes_count: Math.max(0, userReview.likes_count ?? 0),
                    };
                    const next = { is_liked: !cur.is_liked, likes_count: cur.likes_count + (cur.is_liked ? -1 : 1) };
                    setOptimisticLike(next);
                    try {
                      if (cur.is_liked) {
                        await unlikeReview(userReview.id, token);
                      } else {
                        await likeReview(userReview.id, token);
                      }
                      onSuccess({ silent: true });
                    } catch {
                      setOptimisticLike(null);
                    }
                  }}
                >
                  {(optimisticLike?.is_liked ?? userReview.is_liked) ? (
                    <HeartFilled className={styles.userReviewActionIcon} />
                  ) : (
                    <HeartOutlined className={styles.userReviewActionIcon} />
                  )}
                  НРАВИТСЯ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Оставить отзыв</h3>
      <div className={styles.ratingRow}>
        <span className={styles.label}>Оценка:</span>
        <Rate value={rating} onChange={setRating} className={styles.rate} />
      </div>
      <TextArea
        placeholder="Напишите ваш отзыв (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={styles.textarea}
        maxLength={2000}
        showCount
      />
      <div className={styles.footer}>
        <Checkbox
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className={styles.checkbox}
        >
          Оставить анонимно
        </Checkbox>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={rating < 1}
        >
          Отправить отзыв
        </Button>
      </div>
    </div>
  );
}
