import api from '@/lib/api';
import { Dokumen, KategoriDokumen } from '@/types';

// ── Backend response types ──────────────────────────────────────────────────

export interface KategoriDokumenAPI {
  id: string;
  nama: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

export interface DokumenAPI {
  id: string;
  kategori: string | null;
  nama_dokumen: string;
  jenis_dokumen: 'dokumen_tender' | 'dokumen_administrasi' | 'dokumen_teknis' | 'dokumen_penawaran' | 'dokumen_pekerjaan';
  nomor_dokumen: string;
  tanggal_berlaku: string | null;
  file: string | null;
  keterangan: string;
  signed_file_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

export function mapKategori(data: KategoriDokumenAPI): KategoriDokumen {
  return {
    id: data.id,
    nama: data.nama,
    deskripsi: data.deskripsi,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export function mapDokumen(data: DokumenAPI): Dokumen {
  return {
    id: data.id,
    namaDokumen: data.nama_dokumen,
    jenisDokumen: data.jenis_dokumen,
    nomorDokumen: data.nomor_dokumen,
    tanggalBerlaku: data.tanggal_berlaku ? new Date(data.tanggal_berlaku) : null,
    keterangan: data.keterangan,
    signedFileUrl: data.signed_file_url,
    kategoriId: data.kategori,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

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

export const dokumenService = {
  // Kategori Dokumen
  getAllKategori: async (): Promise<KategoriDokumenAPI[]> => {
    const res = await api.get<PaginatedResponse<KategoriDokumenAPI>>('/api/kategori-dokumen/');
    return res.data.results;
  },

  createKategori: async (payload: { nama: string; deskripsi: string }): Promise<KategoriDokumenAPI> => {
    const res = await api.post<KategoriDokumenAPI>('/api/kategori-dokumen/', payload);
    return res.data;
  },

  updateKategori: async (id: string, payload: { nama: string; deskripsi: string }): Promise<KategoriDokumenAPI> => {
    const res = await api.patch<KategoriDokumenAPI>(`/api/kategori-dokumen/${id}/`, payload);
    return res.data;
  },

  deleteKategori: async (id: string): Promise<void> => {
    await api.delete(`/api/kategori-dokumen/${id}/`);
  },

  // Dokumen
  getAll: async (): Promise<DokumenAPI[]> => {
    const res = await api.get<PaginatedResponse<DokumenAPI>>('/api/dokumen/');
    return res.data.results;
  },

  create: async (payload: FormData | Record<string, unknown>): Promise<DokumenAPI> => {
    const isFormData = payload instanceof FormData;
    const res = await api.post<DokumenAPI>(
      '/api/dokumen/',
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  update: async (id: string, payload: FormData | Record<string, unknown>): Promise<DokumenAPI> => {
    const isFormData = payload instanceof FormData;
    const res = await api.patch<DokumenAPI>(
      `/api/dokumen/${id}/`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/dokumen/${id}/`);
  },
};
