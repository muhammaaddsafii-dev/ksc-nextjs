import api from '@/lib/api';
import { Notifikasi } from '@/types';

const notifikasiService = {
  async getAll(isRead?: boolean): Promise<Notifikasi[]> {
    const params = isRead !== undefined ? { is_read: isRead } : {};
    const response = await api.get<Notifikasi[] | { results: Notifikasi[] }>('/api/notifikasi/', { params });
    return Array.isArray(response.data) ? response.data : response.data.results;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>('/api/notifikasi/jumlah-belum-baca/');
    return response.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/api/notifikasi/${id}/baca/`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifikasi/baca-semua/');
  },

  /**
   * Trigger pengecekan deadline di backend dan generate notifikasi baru jika perlu.
   * Dipanggil SEKALI per session (saat app load / login), bukan tiap buka panel.
   */
  async cekDeadline(): Promise<void> {
    await api.get('/api/notifikasi/cek-deadline/');
  },
};

export default notifikasiService;
