import api from '@/lib/api';
import { JenisPekerjaan, TahapanTemplate } from '@/types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Backend response types (snake_case) ─────────────────────────────────────

export interface SubTahapanTemplateAPI {
  id: string;
  tahapan_template: string;
  nama: string;
  urutan: number;
}

export interface TahapanTemplateAPI {
  id: string;
  jenis_pekerjaan: string;
  nomor_urut: number;
  bobot: string;
  nama_tahapan: string;
  deskripsi: string;
  sub_tahapan: SubTahapanTemplateAPI[];
  created_at: string;
  updated_at: string;
}

export interface JenisPekerjaanAPI {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  warna: string;
  tahapan_template: TahapanTemplateAPI[];
  created_at: string;
  updated_at: string;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

export function mapJenisPekerjaan(data: JenisPekerjaanAPI): JenisPekerjaan {
  return {
    id: data.id,
    kode: data.kode,
    nama: data.nama,
    deskripsi: data.deskripsi,
    warna: data.warna || '#3B82F6',
    aktif: true,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export function mapTahapanTemplate(data: TahapanTemplateAPI): TahapanTemplate {
  return {
    id: data.id,
    jenisPekerjaanId: data.jenis_pekerjaan,
    nama: data.nama_tahapan,
    deskripsi: data.deskripsi,
    urutan: data.nomor_urut,
    bobotDefault: parseFloat(data.bobot),
    aktif: true,
    subTahapan: data.sub_tahapan.sort((a, b) => a.urutan - b.urutan).map(s => s.nama),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ── Services ─────────────────────────────────────────────────────────────────

export const jenisPekerjaanService = {
  getAll: async (): Promise<JenisPekerjaanAPI[]> => {
    const res = await api.get<PaginatedResponse<JenisPekerjaanAPI>>('/api/jenis-pekerjaan/');
    return res.data.results;
  },

  create: async (payload: {
    kode: string;
    nama: string;
    deskripsi: string;
    warna: string;
  }): Promise<JenisPekerjaanAPI> => {
    const res = await api.post<JenisPekerjaanAPI>('/api/jenis-pekerjaan/', payload);
    return res.data;
  },

  update: async (id: string, payload: {
    kode: string;
    nama: string;
    deskripsi: string;
    warna: string;
  }): Promise<JenisPekerjaanAPI> => {
    const res = await api.patch<JenisPekerjaanAPI>(`/api/jenis-pekerjaan/${id}/`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/jenis-pekerjaan/${id}/`);
  },
};

export const tahapanTemplateService = {
  create: async (payload: {
    jenis_pekerjaan: string;
    nomor_urut: number;
    bobot: number;
    nama_tahapan: string;
    deskripsi: string;
  }): Promise<TahapanTemplateAPI> => {
    const res = await api.post<TahapanTemplateAPI>('/api/tahapan-template/', payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tahapan-template/${id}/`);
  },
};

export const subTahapanTemplateService = {
  create: async (payload: {
    tahapan_template: string;
    nama: string;
    urutan: number;
  }): Promise<SubTahapanTemplateAPI> => {
    const res = await api.post<SubTahapanTemplateAPI>('/api/sub-tahapan-template/', payload);
    return res.data;
  },
};
