import api from '@/lib/api';
import type { UserRole } from '@/stores/authStore';

export interface UserAPI {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole | null;
  is_active: boolean;
}

export interface UserPayload {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  password?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const usersService = {
  getAll: async (): Promise<UserAPI[]> => {
    const res = await api.get<PaginatedResponse<UserAPI>>('/api/users/');
    return res.data.results;
  },

  create: async (payload: UserPayload): Promise<UserAPI> => {
    const res = await api.post<UserAPI>('/api/users/', payload);
    return res.data;
  },

  update: async (id: number, payload: Partial<UserPayload>): Promise<UserAPI> => {
    const res = await api.patch<UserAPI>(`/api/users/${id}/`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}/`);
  },
};
