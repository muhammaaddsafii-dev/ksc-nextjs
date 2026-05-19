import api from '@/lib/api';

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiError {
  detail?: string;
  non_field_errors?: string[];
  [key: string]: unknown;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/auth/token/', credentials);
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await api.post<{ access: string }>('/api/auth/token/refresh/', { refresh });
    return response.data;
  },
};
