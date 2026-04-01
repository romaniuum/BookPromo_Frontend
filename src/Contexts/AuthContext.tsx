import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getProfile, type UserResponse } from '../Api/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

type AuthContextValue = {
  isAuth: boolean;
  token: string | null;
  user: UserResponse | null;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
  updateUser: (profile: UserResponse) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getStoredUser(): UserResponse | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as UserResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<UserResponse | null>(getStoredUser);

  // Если есть токен, но нет user (перезагрузка или старый вход) — подгружаем профиль с сервера
  useEffect(() => {
    if (!token || user != null) return;
    getProfile(token)
      .then((profile) => {
        setUser(profile);
        try {
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        } catch (e) {
          console.log(e)
        }
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        } catch (e) {
          console.log(e)
        }
      });
  }, [token, user]);

  const login = useCallback((newToken: string, newUser: UserResponse) => {
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch (e) {
      console.log(e)
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.log(e)
    }
  }, []);

  const refetchUser = useCallback(async () => {
    if (!token) return;
    const profile = await getProfile(token);
    setUser(profile);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.log(e)
    }
  }, [token]);

  const updateUser = useCallback((profile: UserResponse) => {
    setUser(profile);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.log(e)
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth: !!token, token, user, login, logout, refetchUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
