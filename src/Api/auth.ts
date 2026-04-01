import { API_BASE_URL } from '../Constants';

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  avatar_url?: string | null;
};

export type AuthResponse = {
  token: string;
  user: UserResponse;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = text || 'Произошла ошибка';
    try {
      const json = JSON.parse(text);
      message = json.error ?? json.message ?? message;
    } catch {
      /* backend often returns plain text */
    }
    throw new Error(message);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string = 'reader'
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  return handleResponse<AuthResponse>(res);
}

/** Текущий пользователь по токену (для восстановления user после перезагрузки). */
export async function getProfile(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<UserResponse>(res);
}

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
  avatar_url?: string | null;
};

/** Обновление профиля (имя, почта, пароль, аватар). */
export async function updateProfile(
  token: string,
  payload: UpdateProfilePayload
): Promise<UserResponse> {
  const body: Record<string, unknown> = {};
  if (payload.current_password !== undefined) body.current_password = payload.current_password;
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.new_password !== undefined && payload.new_password.trim() !== '')
    body.new_password = payload.new_password;
  if (payload.avatar_url !== undefined) body.avatar_url = payload.avatar_url;

  const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return handleResponse<UserResponse>(res);
}
