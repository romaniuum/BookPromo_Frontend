import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import { ROUTES } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import * as authApi from '../../Api/auth';
import styles from './AuthPage.module.css';

const { Title } = Typography;

type TabKey = 'login' | 'register';

export function AuthPage() {
  const [tab, setTab] = useState<TabKey>('login');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const onFinishLogin = async () => {
    setLoading(true);
    try {
      const values = await loginForm.validateFields().catch(() => null);
      if (!values) {
        setLoading(false);
        return;
      }
      const email = String(values.email ?? '').trim();
      const password = String(values.password ?? '').trim();
      const { token, user } = await authApi.login(email, password);
      login(token, user);
      message.success('Вход выполнен');
      navigate(ROUTES.HOME);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const onFinishRegister = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const name = String(values.name ?? '').trim();
      const email = String(values.email ?? '').trim();
      const password = String(values.password ?? '').trim();
      const { token, user } = await authApi.register(name, email, password);
      login(token, user);
      message.success('Регистрация успешна');
      navigate(ROUTES.HOME);
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <Title level={3} className={styles.title}>
          {tab === 'login' ? 'Вход' : 'Регистрация'}
        </Title>
        <Tabs
          activeKey={tab}
          destroyInactiveTabPane
          onChange={(k) => {
            setTab(k as TabKey);
            loginForm.resetFields();
            registerForm.resetFields();
          }}
          items={[
            {
              key: 'login',
              label: 'Вход',
              children: (
                <Form form={loginForm} layout="vertical" onFinish={() => onFinishLogin()}>
                  <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                  <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
                    <Input.Password placeholder="Пароль" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      Войти
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: 'Регистрация',
              children: (
                <Form form={registerForm} layout="vertical" onFinish={onFinishRegister}>
                  <Form.Item name="name" label="Имя" rules={[{ required: true }]}>
                    <Input placeholder="Имя" />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                    <Input placeholder="email@example.com" />
                  </Form.Item>
                  <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
                    <Input.Password placeholder="Пароль" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      Зарегистрироваться
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
        <Link to={ROUTES.HOME} className={styles.back}>
          На главную
        </Link>
      </div>
    </div>
  );
}
