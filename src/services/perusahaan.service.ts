import api from '@/lib/api';
import { Perusahaan } from '@/types';

// ── Backend response types ──────────────────────────────────────────────────

export interface PerusahaanAPI {
  id: string;
  nama: string;
  alamat: string;
  email: string;
  telepon: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PerusahaanPayload {
  nama: string;
  alamat?: string;
  email?: string;
  telepon?: string;
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

export function mapPerusahaan(data: PerusahaanAPI): Perusahaan {
  return {
    id: data.id,
    nama: data.nama,
    alamat: data.alamat || undefined,
    email: data.email || undefined,
    telepon: data.telepon || undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ── Error helper ─────────────────────────────────────────────────────────────

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;
    if (typeof data?.detail === 'string') return data.detail;
    if (data && typeof data === 'object') {
      const messages = Object.values(data)
        .flat()
        .filter((v): v is string => typeof v === 'string');
      if (messages.length) return messages.join(', ');
    }
  }
  return fallback;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const perusahaanService = {
  getAll: async (): Promise<Perusahaan[]> => {
    const res = await api.get<PaginatedResponse<PerusahaanAPI>>('/api/perusahaan/');
    return res.data.results.map(mapPerusahaan);
  },

  create: async (payload: PerusahaanPayload): Promise<Perusahaan> => {
    const res = await api.post<PerusahaanAPI>('/api/perusahaan/', payload);
    return mapPerusahaan(res.data);
  },

  update: async (id: string, payload: PerusahaanPayload): Promise<Perusahaan> => {
    const res = await api.patch<PerusahaanAPI>(`/api/perusahaan/${id}/`, payload);
    return mapPerusahaan(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/perusahaan/${id}/`);
  },
};
