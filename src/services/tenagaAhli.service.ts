import api from '@/lib/api';
import { TenagaAhli, Sertifikat } from '@/types';

// ── Backend response types ──────────────────────────────────────────────────

export interface SertifikatAPI {
  id: string;
  tenaga_ahli: string;
  nama: string;
  file: string;
  created_at: string;
  signed_file_url: string | null;
}

export interface TenagaAhliAPI {
  id: string;
  nama: string;
  jabatan: string;
  email: string;
  telepon: string;
  file_foto: string | null;
  signed_file_url: string | null;
  sertifikat: SertifikatAPI[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TenagaAhliPayload {
  nama: string;
  jabatan: string;
  email: string;
  telepon: string;
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

export function mapSertifikat(data: SertifikatAPI): Sertifikat {
  return {
    id: data.id,
    nama: data.nama,
    nomorSertifikat: '',
    tanggalTerbit: new Date(data.created_at),
    tanggalBerlaku: new Date(data.created_at),
    fileUrl: data.signed_file_url ?? undefined,
  };
}

export function mapTenagaAhli(data: TenagaAhliAPI): TenagaAhli {
  return {
    id: data.id,
    nama: data.nama,
    jabatan: data.jabatan,
    email: data.email,
    telepon: data.telepon,
    fotoUrl: data.signed_file_url ?? undefined,
    status: 'tersedia',
    sertifikat: data.sertifikat.map(mapSertifikat),
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

export const tenagaAhliService = {
  getAll: async (): Promise<TenagaAhli[]> => {
    const res = await api.get<PaginatedResponse<TenagaAhliAPI>>('/api/tenaga-ahli/');
    return res.data.results.map(mapTenagaAhli);
  },

  create: async (payload: TenagaAhliPayload, fotoFile?: File): Promise<TenagaAhli> => {
    const form = new FormData();
    (Object.entries(payload) as [string, string][]).forEach(([k, v]) => form.append(k, v));
    if (fotoFile) form.append('file_foto', fotoFile);

    const res = await api.post<TenagaAhliAPI>('/api/tenaga-ahli/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapTenagaAhli(res.data);
  },

  update: async (id: string, payload: TenagaAhliPayload, fotoFile?: File): Promise<TenagaAhli> => {
    const form = new FormData();
    (Object.entries(payload) as [string, string][]).forEach(([k, v]) => form.append(k, v));
    if (fotoFile) form.append('file_foto', fotoFile);

    const res = await api.patch<TenagaAhliAPI>(`/api/tenaga-ahli/${id}/`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapTenagaAhli(res.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tenaga-ahli/${id}/`);
  },

  createSertifikat: async (
    tenagaAhliId: string,
    nama: string,
    file: File
  ): Promise<Sertifikat> => {
    const form = new FormData();
    form.append('tenaga_ahli', tenagaAhliId);
    form.append('nama', nama);
    form.append('file', file);

    const res = await api.post<SertifikatAPI>('/api/sertifikat/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapSertifikat(res.data);
  },

  deleteSertifikat: async (sertifikatId: string): Promise<void> => {
    await api.delete(`/api/sertifikat/${sertifikatId}/`);
  },
};
