import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { ROUTES, APP_NAME } from '../../Constants';
import { useAuth } from '../../Contexts/AuthContext';
import styles from './AppHeader.module.css';

const navItems = [
  { path: ROUTES.HOME, label: 'Главная' },
  { path: ROUTES.CATALOG, label: 'Каталог' },
  { path: ROUTES.MY_BOOKS, label: 'Мои книги' },
  { path: ROUTES.CREATE_BOOK, label: 'Создание книги' },
];

export function AppHeader() {
  const location = useLocation();
  const { isAuth, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const menuContent = (
    <div className={styles.menuContent}>
      <div className={styles.menuTitle}>{APP_NAME}</div>
      <nav className={styles.menuNav}>
        {navItems.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={location.pathname === path ? styles.menuLinkActive : styles.menuLink}
            onClick={closeMenu}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.menuActions}>
        <Link to={ROUTES.AUTHOR} onClick={closeMenu}>
          <Button type="primary" block size="large" className={styles.menuCabinetBtn}>
            Личный кабинет
          </Button>
        </Link>
        {isAuth ? (
          <Button type="default" block size="large" onClick={() => { logout(); closeMenu(); }}>
            Выйти
          </Button>
        ) : (
          <Link to={ROUTES.AUTH} onClick={closeMenu}>
            <Button type="default" block size="large">
              Вход
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.inner__block}>
          <Link to={ROUTES.HOME} className={styles.logo}>
            {APP_NAME}
          </Link>
          <button
            type="button"
            className={styles.burgerBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Меню"
          >
            <MenuOutlined />
          </button>
          <nav className={styles.nav}>
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={location.pathname === path ? styles.linkActive : styles.link}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.actions}>
          <Link to={ROUTES.AUTHOR}>
            <Button type="primary">
              Личный кабинет
            </Button>
          </Link>
          {isAuth ? (
            <Button type="default" onClick={logout}>
              Выйти
            </Button>
          ) : (
            <Link to={ROUTES.AUTH}>
              <Button type="default">
                Вход
              </Button>
            </Link>
          )}
        </div>
      </div>
      <Drawer
        title={null}
        placement="left"
        onClose={closeMenu}
        open={menuOpen}
        width={280}
        styles={{ body: { padding: 0 } }}
        className={styles.drawer}
      >
        {menuContent}
      </Drawer>
    </header>
  );
}
