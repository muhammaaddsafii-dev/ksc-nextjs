import api from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface HomeAPI {
  id: number;
  file_hero_image: string;
  signed_file_hero_image_url: string | null;
}

export interface LayananAPI {
  id: string;
  file_icon: string;
  signed_file_icon_url: string | null;
  title: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

export interface ProyekImageAPI {
  id: string;
  file_images: string;
  signed_file_images_url: string | null;
}

export interface ProyekAPI {
  id: string;
  nama_proyek: string;
  slug: string;
  file_image_cover: string;
  signed_file_image_cover_url: string | null;
  deskripsi: string;
  klien: string;
  lokasi: string;
  tahun_pelaksanaan: string;
  durasi: string;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
  kategori: string;
  kategori_display: string;
  images: ProyekImageAPI[];
  created_at: string;
  updated_at: string;
}

export interface AboutAPI {
  id: number;
  header: string;
  deskripsi: string;
  visi: string;
  misi: string;
  standard: string;
}

export interface KontakAPI {
  id: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  jam_operasional: string;
  koordinat_lat: number | null;
  koordinat_lng: number | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

// ── Home ──────────────────────────────────────────────────────────────────────

export const homeService = {
  get: async (): Promise<HomeAPI | null> => {
    const res = await api.get<HomeAPI>('/api/landing-page/home/');
    return res.data;
  },
  update: async (formData: FormData): Promise<HomeAPI> => {
    const res = await api.patch<HomeAPI>('/api/landing-page/home/1/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

// ── Layanan ───────────────────────────────────────────────────────────────────

export const layananService = {
  getAll: async (): Promise<LayananAPI[]> => {
    const res = await api.get<PaginatedResponse<LayananAPI>>('/api/landing-page/layanan/');
    return res.data.results ?? [];
  },
  create: async (formData: FormData): Promise<LayananAPI> => {
    const res = await api.post<LayananAPI>('/api/landing-page/layanan/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  update: async (id: string, formData: FormData): Promise<LayananAPI> => {
    const res = await api.patch<LayananAPI>(`/api/landing-page/layanan/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/landing-page/layanan/${id}/`);
  },
};

// ── Proyek ────────────────────────────────────────────────────────────────────

export const proyekService = {
  getAll: async (): Promise<ProyekAPI[]> => {
    const res = await api.get<PaginatedResponse<ProyekAPI>>('/api/landing-page/proyek/');
    return res.data.results ?? [];
  },
  create: async (formData: FormData): Promise<ProyekAPI> => {
    const res = await api.post<ProyekAPI>('/api/landing-page/proyek/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  update: async (id: string, formData: FormData): Promise<ProyekAPI> => {
    const res = await api.patch<ProyekAPI>(`/api/landing-page/proyek/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/landing-page/proyek/${id}/`);
  },
};

// ── Proyek Images ─────────────────────────────────────────────────────────────

export const proyekImageService = {
  addImage: async (proyekId: string, file: File): Promise<ProyekImageAPI> => {
    const fd = new FormData();
    fd.append('proyek', proyekId);
    fd.append('file_images', file);
    const res = await api.post<ProyekImageAPI>('/api/landing-page/proyek-images/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/landing-page/proyek-images/${id}/`);
  },
};

// ── About ─────────────────────────────────────────────────────────────────────

export const aboutService = {
  get: async (): Promise<AboutAPI | null> => {
    const res = await api.get<AboutAPI>('/api/landing-page/about/');
    return res.data;
  },
  update: async (data: Partial<AboutAPI>): Promise<AboutAPI> => {
    const res = await api.patch<AboutAPI>('/api/landing-page/about/1/', data);
    return res.data;
  },
};

// ── Kontak ────────────────────────────────────────────────────────────────────

export const kontakService = {
  get: async (): Promise<KontakAPI | null> => {
    const res = await api.get<KontakAPI>('/api/landing-page/kontak/');
    return res.data;
  },
  update: async (data: Partial<KontakAPI>): Promise<KontakAPI> => {
    const res = await api.patch<KontakAPI>('/api/landing-page/kontak/1/', data);
    return res.data;
  },
};
