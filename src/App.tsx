import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { router } from './Routes';
import { appTheme } from './Utils/theme';
import { AuthProvider } from './Contexts/AuthContext';

export default function App() {
  return (
    <ConfigProvider locale={ruRU} theme={appTheme}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConfigProvider>
  );
}
