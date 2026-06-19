'use client';

import { Notifikasi, TipeNotifikasi } from '@/types';
import { FileText, Clock, AlertCircle, AlertTriangle, Calendar, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notif: Notifikasi;
  onRead: (id: string) => void;
}

const TIPE_CONFIG: Record<TipeNotifikasi, { icon: LucideIcon; color: string }> = {
  TAHAPAN_BELUM_TAGIH: { icon: FileText, color: 'text-amber-500' },
  TAHAPAN_DEADLINE_LEWAT: { icon: Clock, color: 'text-red-500' },
  INVOICE_TERLAMBAT: { icon: AlertCircle, color: 'text-red-500' },
  PEKERJAAN_DEADLINE_LEWAT: { icon: AlertTriangle, color: 'text-red-500' },
  TENDER_DEADLINE_DEKAT: { icon: Calendar, color: 'text-blue-500' },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function NotificationItem({ notif, onRead }: NotificationItemProps) {
  const { icon: Icon, color } = TIPE_CONFIG[notif.tipe];

  return (
    <button
      type="button"
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors',
        notif.is_read ? 'bg-white' : 'bg-blue-50'
      )}
      onClick={() => onRead(notif.id)}
    >
      <div className={cn('mt-0.5 flex-shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight">{notif.judul}</p>
          {!notif.is_read && (
            <span className="flex-shrink-0 w-2 h-2 mt-1 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-sm text-black mt-0.5">{notif.pesan}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {notif.nama_pekerjaan && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
              {notif.nama_pekerjaan}
            </span>
          )}
          <span className="text-xs text-gray-400">{formatRelativeTime(notif.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
