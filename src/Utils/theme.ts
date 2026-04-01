import type { ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  token: {
    colorPrimary: '#262626',
    colorBgContainer: '#ffffff',
    colorBorder: '#f0f0f0',
    colorText: '#262626',
    colorTextSecondary: '#595959',
    borderRadius: 6,
  },
  components: {
    Button: {
      defaultBorderColor: '#d9d9d9',
      defaultColor: '#262626',
    },
  },
};
