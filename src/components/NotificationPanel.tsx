'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Notifikasi } from '@/types';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  notifikasi: Notifikasi[];
  isLoading: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <Skeleton className="h-4 w-4 mt-0.5 rounded flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function NotificationPanel({ notifikasi, isLoading, onRead, onReadAll }: NotificationPanelProps) {
  const unread = notifikasi.filter((n) => !n.is_read);
  const read = notifikasi.filter((n) => n.is_read);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="font-semibold text-sm">Notifikasi</span>
        {unread.length > 0 && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-700 h-auto px-2 py-1"
            onClick={onReadAll}
          >
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifikasi.length === 0 ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifikasi.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Bell className="h-8 w-8 opacity-40" />
            <p className="text-sm">Tidak ada notifikasi</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <section>
                {read.length > 0 && (
                  <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30">
                    Belum Dibaca
                  </div>
                )}
                {unread.map((n) => (
                  <NotificationItem key={n.id} notif={n} onRead={onRead} />
                ))}
              </section>
            )}
            {read.length > 0 && (
              <section>
                {unread.length > 0 && (
                  <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted/30 border-t">
                    Sudah Dibaca
                  </div>
                )}
                {read.map((n) => (
                  <NotificationItem key={n.id} notif={n} onRead={onRead} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
