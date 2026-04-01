import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../Components/Header';
import {
  HomePage,
  AuthPage,
  AuthorPage,
  CreateBookPage,
  EditBookPage,
  PromoPage,
  CatalogPage,
  ReviewPage,
  MyBooksPage,
} from '../Page';
import { ROUTES } from '../Constants/index';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'author', element: <AuthorPage /> },
      { path: 'author/create', element: <CreateBookPage /> },
      { path: 'author/edit/:id', element: <EditBookPage /> },
      { path: 'promo/:id', element: <PromoPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'my-books', element: <MyBooksPage /> },
      { path: 'review/:id', element: <ReviewPage /> },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
]);
