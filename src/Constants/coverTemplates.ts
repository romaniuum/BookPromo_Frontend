export type CoverTemplate = {
  id: string;
  name: string;
  genre: string;
  previewUrl: string;
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  style: 'minimal' | 'classic' | 'modern' | 'dark';
};

export const coverTemplates: CoverTemplate[] = [
  {
    id: 'fiction-classic',
    name: 'Классика',
    genre: 'Художественная литература',
    previewUrl: '/templates/preview-fiction-classic.jpg',
    colors: { background: '#2C3E50', text: '#ECF0F1', accent: '#E74C3C' },
    style: 'classic',
  },
  {
    id: 'scifi-modern',
    name: 'Будущее',
    genre: 'Фантастика',
    previewUrl: '/templates/preview-scifi-modern.jpg',
    colors: { background: '#0A0E27', text: '#00D4FF', accent: '#7B2FBE' },
    style: 'modern',
  },
  {
    id: 'detective-dark',
    name: 'Тёмная ночь',
    genre: 'Детектив',
    previewUrl: '/templates/preview-detective-dark.jpg',
    colors: { background: '#1A1A2E', text: '#E0E0E0', accent: '#F5A623' },
    style: 'dark',
  },
  {
    id: 'romance-minimal',
    name: 'Нежность',
    genre: 'Романтика',
    previewUrl: '/templates/preview-romance-minimal.jpg',
    colors: { background: '#FDF0F0', text: '#4A1942', accent: '#E8789C' },
    style: 'minimal',
  },
  {
    id: 'business-modern',
    name: 'Успех',
    genre: 'Бизнес / нонфикшн',
    previewUrl: '/templates/preview-business-modern.jpg',
    colors: { background: '#1B4F72', text: '#FFFFFF', accent: '#F39C12' },
    style: 'modern',
  },
  {
    id: 'children-bright',
    name: 'Радуга',
    genre: 'Детская литература',
    previewUrl: '/templates/preview-children-bright.jpg',
    colors: { background: '#FFF9C4', text: '#333333', accent: '#FF6B35' },
    style: 'classic',
  },
  {
    id: 'poetry-minimal',
    name: 'Простота',
    genre: 'Поэзия',
    previewUrl: '/templates/preview-poetry-minimal.jpg',
    colors: { background: '#F8F9FA', text: '#212529', accent: '#6C757D' },
    style: 'minimal',
  },
  {
    id: 'history-classic',
    name: 'Эпоха',
    genre: 'История',
    previewUrl: '/templates/preview-history-classic.jpg',
    colors: { background: '#4A3728', text: '#F5E6D3', accent: '#C9A84C' },
    style: 'classic',
  },
];
