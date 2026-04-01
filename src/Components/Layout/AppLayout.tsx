import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '../Header/AppHeader';
import styles from './AppLayout.module.css';

const { Content } = Layout;

export function AppLayout() {
  return (
    <Layout className={styles.layout}>
      <AppHeader />
      <Content className={styles.content}>
        <Outlet />
      </Content>
    </Layout>
  );
}
