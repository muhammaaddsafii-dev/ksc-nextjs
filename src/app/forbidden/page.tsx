'use client';

import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <ShieldX className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold mb-2">Akses Ditolak</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Super Admin jika
        menurut Anda ini adalah kesalahan.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}
