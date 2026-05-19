import api from '@/lib/api';
import { Alat, Peminjaman, HistoriPeminjaman } from '@/types';

// ── Backend response types ──────────────────────────────────────────────────

export interface GambarAlatAPI {
  id: string;
  alat: string;
  file: string;
  created_at: string;
  signed_file_url: string | null;
}

export interface AlatAPI {
  id: string;
  kode_alat: string;
  nama_alat: string;
  tanggal_pengadaan: string | null;
  nomor_seri: string;
  kelengkapan: 'lengkap' | 'tidak_lengkap' | '';
  status_alat: 'tersedia' | 'dipinjam' | 'rusak' | 'hilang';
  keterangan: string;
  gambar: GambarAlatAPI[];
  created_at: string;
  updated_at: string;
}

export interface PeminjamanAlatAPI {
  id: string;
  alat: string;
  peminjaman: string;
  status_kembali: '' | 'normal' | 'rusak' | 'hilang';
  tanggal_dikembalikan: string | null;
}

export interface PeminjamanAPI {
  id: string;
  nomor_peminjaman: string;
  nama_peminjam: string;
  tanggal_pinjam: string;
  tanggal_kembali: string | null;
  keterangan: string;
  status_peminjaman: 'aktif' | 'selesai';
  alat_dipinjam: PeminjamanAlatAPI[];
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AlatPayload {
  kode_alat: string;
  nama_alat: string;
  tanggal_pengadaan?: string;
  nomor_seri: string;
  kelengkapan: 'lengkap' | 'tidak_lengkap';
  status_alat: 'tersedia' | 'dipinjam' | 'rusak' | 'hilang';
  keterangan: string;
}

export interface PeminjamanPayload {
  nomor_peminjaman: string;
  nama_peminjam: string;
  tanggal_pinjam: string;
  tanggal_kembali?: string;
  keterangan: string;
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

const kelengkapanToFE: Record<string, 'Lengkap' | 'Tidak Lengkap'> = {
  lengkap: 'Lengkap',
  tidak_lengkap: 'Tidak Lengkap',
  '': 'Lengkap',
};

const statusAlatToFE: Record<string, 'Tersedia' | 'Dipinjam' | 'Rusak' | 'Hilang'> = {
  tersedia: 'Tersedia',
  dipinjam: 'Dipinjam',
  rusak: 'Rusak',
  hilang: 'Hilang',
};

const kelengkapanToBE: Record<string, 'lengkap' | 'tidak_lengkap'> = {
  Lengkap: 'lengkap',
  'Tidak Lengkap': 'tidak_lengkap',
};

const statusAlatToBE: Record<string, 'tersedia' | 'dipinjam' | 'rusak' | 'hilang'> = {
  Tersedia: 'tersedia',
  Dipinjam: 'dipinjam',
  Rusak: 'rusak',
  Hilang: 'hilang',
};

export const statusKembaliBE: Record<string, 'normal' | 'rusak' | 'hilang'> = {
  Tersedia: 'normal',
  Rusak: 'rusak',
  Hilang: 'hilang',
};

export function mapAlat(data: AlatAPI): Alat {
  return {
    id: data.id,
    kodeAlat: data.kode_alat,
    namaAlat: data.nama_alat,
    tanggalPengadaan: data.tanggal_pengadaan ? new Date(data.tanggal_pengadaan) : new Date(),
    nomorSeri: data.nomor_seri,
    kelengkapan: kelengkapanToFE[data.kelengkapan] ?? 'Lengkap',
    status: statusAlatToFE[data.status_alat] ?? 'Tersedia',
    keterangan: data.keterangan,
    gambarList: data.gambar.map((g) => g.signed_file_url).filter(Boolean) as string[],
    historiPeminjaman: [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export function mapPeminjaman(data: PeminjamanAPI, alatList: Alat[]): Peminjaman {
  const alatIds = data.alat_dipinjam.map((pa) => pa.alat);
  const tools = alatList.filter((a) => alatIds.includes(a.id));
  const rincianAlat = tools.length > 0 ? tools.map((t) => t.namaAlat).join(', ') : data.nomor_peminjaman;
  return {
    id: data.id,
    idPeminjaman: data.nomor_peminjaman,
    alatId: alatIds[0] ?? '',
    alatIds,
    tanggalPinjam: new Date(data.tanggal_pinjam),
    tanggalKembali: data.tanggal_kembali ? new Date(data.tanggal_kembali) : new Date(),
    peminjam: data.nama_peminjam,
    rincianAlat,
    keterangan: data.keterangan,
    status: data.status_peminjaman === 'aktif' ? 'Dipinjam' : 'Selesai',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export function buildHistoriForAlat(alatId: string, allPeminjaman: PeminjamanAPI[]): HistoriPeminjaman[] {
  const result: HistoriPeminjaman[] = [];
  for (const peminjaman of allPeminjaman) {
    for (const pa of peminjaman.alat_dipinjam) {
      if (pa.alat === alatId) {
        result.push({
          id: pa.id,
          peminjam: peminjaman.nama_peminjam,
          tanggalPinjam: new Date(peminjaman.tanggal_pinjam),
          tanggalKembali: pa.tanggal_dikembalikan ? new Date(pa.tanggal_dikembalikan) : null,
        });
      }
    }
  }
  return result;
}

export function buildAlatPayload(formData: {
  kodeAlat: string;
  namaAlat: string;
  tanggalPengadaan: Date;
  nomorSeri: string;
  kelengkapan: string;
  status: string;
  keterangan: string;
}): AlatPayload {
  return {
    kode_alat: formData.kodeAlat,
    nama_alat: formData.namaAlat,
    tanggal_pengadaan: formData.tanggalPengadaan ? formData.tanggalPengadaan.toISOString().split('T')[0] : undefined,
    nomor_seri: formData.nomorSeri,
    kelengkapan: kelengkapanToBE[formData.kelengkapan] ?? 'lengkap',
    status_alat: statusAlatToBE[formData.status] ?? 'tersedia',
    keterangan: formData.keterangan,
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

export const alatService = {
  // Alat
  getRawAlat: async (): Promise<AlatAPI[]> => {
    const res = await api.get<PaginatedResponse<AlatAPI>>('/api/alat/');
    return res.data.results;
  },

  createAlat: async (payload: AlatPayload): Promise<AlatAPI> => {
    const res = await api.post<AlatAPI>('/api/alat/', payload);
    return res.data;
  },

  updateAlat: async (id: string, payload: AlatPayload): Promise<AlatAPI> => {
    const res = await api.patch<AlatAPI>(`/api/alat/${id}/`, payload);
    return res.data;
  },

  deleteAlat: async (id: string): Promise<void> => {
    await api.delete(`/api/alat/${id}/`);
  },

  // Gambar Alat
  uploadGambar: async (alatId: string, file: File): Promise<GambarAlatAPI> => {
    const form = new FormData();
    form.append('alat', alatId);
    form.append('file', file);
    const res = await api.post<GambarAlatAPI>('/api/gambar-alat/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteGambar: async (gambarId: string): Promise<void> => {
    await api.delete(`/api/gambar-alat/${gambarId}/`);
  },

  // Peminjaman
  getRawPeminjaman: async (): Promise<PeminjamanAPI[]> => {
    const res = await api.get<PaginatedResponse<PeminjamanAPI>>('/api/peminjaman/');
    return res.data.results;
  },

  createPeminjaman: async (payload: PeminjamanPayload): Promise<PeminjamanAPI> => {
    const res = await api.post<PeminjamanAPI>('/api/peminjaman/', payload);
    return res.data;
  },

  createPeminjamanAlat: async (peminjamanId: string, alatId: string): Promise<PeminjamanAlatAPI> => {
    const res = await api.post<PeminjamanAlatAPI>('/api/peminjaman-alat/', {
      peminjaman: peminjamanId,
      alat: alatId,
    });
    return res.data;
  },

  updatePeminjaman: async (id: string, payload: Partial<PeminjamanPayload>): Promise<PeminjamanAPI> => {
    const res = await api.patch<PeminjamanAPI>(`/api/peminjaman/${id}/`, payload);
    return res.data;
  },

  deletePeminjaman: async (id: string): Promise<void> => {
    await api.delete(`/api/peminjaman/${id}/`);
  },

  // Alat status — update after return
  patchAlatStatus: async (id: string, status_alat: 'tersedia' | 'dipinjam' | 'rusak' | 'hilang'): Promise<void> => {
    await api.patch(`/api/alat/${id}/`, { status_alat });
  },

  // PeminjamanAlat — for return flow
  patchPeminjamanAlat: async (
    id: string,
    data: { status_kembali: 'normal' | 'rusak' | 'hilang'; tanggal_dikembalikan: string }
  ): Promise<PeminjamanAlatAPI> => {
    const res = await api.patch<PeminjamanAlatAPI>(`/api/peminjaman-alat/${id}/`, data);
    return res.data;
  },
};
