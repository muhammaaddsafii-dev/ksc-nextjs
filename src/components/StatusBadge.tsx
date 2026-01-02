import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline';
  className?: string;
}

const statusColors: Record<string, string> = {
  // Pra Kontrak Non Lelang
  potensi: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  penawaran: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  negosiasi: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  kontrak: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  batal: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  
  // Lelang
  persiapan: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  pengajuan: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  evaluasi: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  menang: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  kalah: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  
  // Pekerjaan
  berjalan: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  selesai: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  serah_terima: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  
  // Tahapan
  pending: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  
  // Tenaga Ahli
  tersedia: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  ditugaskan: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  cuti: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  
  // Alat kondisi
  baik: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rusak_ringan: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  rusak_berat: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  
  // Alat status
  digunakan: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  diperbaiki: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  
  // Default
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  potensi: 'Potensi',
  penawaran: 'Penawaran',
  negosiasi: 'Negosiasi',
  kontrak: 'Kontrak',
  batal: 'Batal',
  persiapan: 'Persiapan',
  pengajuan: 'Pengajuan',
  evaluasi: 'Evaluasi',
  menang: 'Menang',
  kalah: 'Kalah',
  berjalan: 'Berjalan',
  selesai: 'Selesai',
  serah_terima: 'Serah Terima',
  pending: 'Pending',
  progress: 'Progress',
  done: 'Selesai',
  tersedia: 'Tersedia',
  ditugaskan: 'Ditugaskan',
  cuti: 'Cuti',
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  maintenance: 'Maintenance',
  digunakan: 'Digunakan',
  diperbaiki: 'Diperbaiki',
};

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const colorClass = statusColors[status] || statusColors.default;
  const label = statusLabels[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}