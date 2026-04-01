import { useParams, Link } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { ROUTES, getPromoPath } from '../../Constants';
import styles from './ReviewPage.module.css';

const { Title, Paragraph } = Typography;

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Link to={id ? getPromoPath(id) : ROUTES.CATALOG}>
          <Button>Назад к книге</Button>
        </Link>
      </div>
      <Title level={3}>Книга</Title>
      <Paragraph className={styles.author}>Автор</Paragraph>
      <div className={styles.content}>
        <Paragraph>
          Глава 1. Начало. Здесь отображается текст книги для чтения. В реальном приложении
          контент будет подгружаться с сервера.
        </Paragraph>
        <Paragraph>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua.
        </Paragraph>
      </div>
    </div>
  );
}
