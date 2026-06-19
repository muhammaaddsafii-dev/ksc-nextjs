import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useNotifikasiStore } from '@/stores/notifikasiStore';
import { useAuthStore } from '@/stores/authStore';
import { TipeNotifikasi } from '@/types';
import notifikasiService from '@/services/notifikasi.service';

const POLL_INTERVAL_MS = 60_000;

type ToastLevel = 'error' | 'warning' | 'info';

const TIPE_TOAST_LEVEL: Record<TipeNotifikasi, ToastLevel> = {
  TAHAPAN_DEADLINE_LEWAT: 'error',
  INVOICE_TERLAMBAT: 'error',
  PEKERJAAN_DEADLINE_LEWAT: 'error',
  TAHAPAN_BELUM_TAGIH: 'warning',
  TENDER_DEADLINE_DEKAT: 'info',
};

export function useNotifikasi() {
  const { notifikasi, unreadCount, isLoading, fetchNotifikasi, tandaiBaca, tandaiSemuaBaca } =
    useNotifikasiStore();
  const accessToken = useAuthStore((state) => state.accessToken);
  const toastedIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);
  const hasCekDeadline = useRef(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    try {
      if (!hasCekDeadline.current) {
        hasCekDeadline.current = true;
        await notifikasiService.cekDeadline();
      }

      await fetchNotifikasi();

      const current = useNotifikasiStore.getState().notifikasi;

      if (isFirstFetch.current) {
        // Tandai semua notif yang sudah ada saat mount agar tidak di-toast
        current.forEach((n) => toastedIds.current.add(n.id));
        isFirstFetch.current = false;
        return;
      }

      current
        .filter((n) => !n.is_read && !toastedIds.current.has(n.id))
        .forEach((n) => {
          const level = TIPE_TOAST_LEVEL[n.tipe];
          if (level === 'error') toast.error(n.judul, { description: n.pesan });
          else if (level === 'warning') toast.warning(n.judul, { description: n.pesan });
          else toast.info(n.judul, { description: n.pesan });
          toastedIds.current.add(n.id);
        });
    } catch {
      // Network error — store sudah set error state, interval akan coba lagi
    }
  }, [accessToken, fetchNotifikasi]);

  useEffect(() => {
    if (!accessToken) return;

    refresh();

    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [accessToken, refresh]);

  return { notifikasi, unreadCount, isLoading, tandaiBaca, tandaiSemuaBaca, refresh };
}
