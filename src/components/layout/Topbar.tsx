"use client";

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSettingsStore } from '@/stores/settingsStore';
import { useState } from 'react';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { profil } = useSettingsStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Topbar: Menu button clicked');
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b bg-card flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden flex-shrink-0 hover:bg-accent touch-manipulation"
          onClick={handleMenuClick}
          aria-label="Open menu"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Title - truncated on mobile */}
        <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative flex-shrink-0 hover:bg-accent touch-manipulation">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[80vh] overflow-y-auto">
            <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium text-sm">SBU akan expired</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Sertifikat Badan Usaha akan berakhir dalam 30 hari
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium text-sm">Deadline proyek</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Proyek Pertamina memasuki fase akhir
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer">
              <span className="font-medium text-sm">Lelang baru</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Ada 2 lelang baru yang sesuai kualifikasi
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 sm:px-3 hover:bg-accent touch-manipulation"
            >
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {profil.direktur.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
                {profil.direktur}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profil.direktur}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profil.namaPerusahaan}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer w-full"
              onClick={() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userEmail');
                window.location.href = '/login';
              }}
            >
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
