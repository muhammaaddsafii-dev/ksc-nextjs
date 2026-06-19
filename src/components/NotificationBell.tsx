'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationPanel } from './NotificationPanel';
import { Notifikasi } from '@/types';

interface NotificationBellProps {
  notifikasi: Notifikasi[];
  unreadCount: number;
  isLoading: boolean;
  onRead: (id: string) => void;
  onReadAll: () => void;
}

export function NotificationBell({ notifikasi, unreadCount, isLoading, onRead, onReadAll }: NotificationBellProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative flex-shrink-0 hover:bg-accent touch-manipulation"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0" sideOffset={8}>
        <NotificationPanel notifikasi={notifikasi} isLoading={isLoading} onRead={onRead} onReadAll={onReadAll} />
      </PopoverContent>
    </Popover>
  );
}
