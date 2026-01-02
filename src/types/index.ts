// Common types
export type Status = 'draft' | 'active' | 'completed' | 'cancelled' | 'pending' | 'won' | 'lost';
export type TenderType = 'lelang' | 'non-lelang';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Pra Kontrak Non Lelang
export interface PraKontrakNonLelang extends BaseEntity {
  namaProyek: string;
  klien: string;
  nilaiEstimasi: number;
  status: 'potensi' | 'penawaran' | 'negosiasi' | 'kontrak' | 'batal';
  tanggalMulai: Date;
  tanggalTarget: Date;
  pic: string;
  catatan: string;
  dokumen: string[];
}

// Pra Kontrak Lelang
export interface PraKontrakLelang extends BaseEntity {
  namaLelang: string;
  instansi: string;
  nilaiPagu: number;
  nilaiPenawaran: number;
  status: 'persiapan' | 'pengajuan' | 'evaluasi' | 'menang' | 'kalah';
  tanggalLelang: Date;
  tanggalHasil: Date | null;
  timAssigned: string[];
  alatAssigned: string[];
  dokumen: string[];
}

// Pekerjaan / Project
export interface Pekerjaan extends BaseEntity {
  nomorKontrak: string;
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  pic: string;
  tim: string[];
  status: 'persiapan' | 'berjalan' | 'selesai' | 'serah_terima';
  tanggalMulai: Date;
  tanggalSelesai: Date;
  progress: number;
  tahapan: TahapanKerja[];
  anggaran: AnggaranItem[];
  adendum: Adendum[];
  tenderType: TenderType;
}

export interface TahapanKerja {
  id: string;
  nama: string;
  progress: number;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  status: 'pending' | 'progress' | 'done';
}

export interface AnggaranItem {
  id: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  realisasi: number;
}

export interface Adendum {
  id: string;
  nomorAdendum: string;
  tanggal: Date;
  keterangan: string;
  nilaiPerubahan: number;
}

// Tenaga Ahli
export interface TenagaAhli extends BaseEntity {
  nama: string;
  jabatan: string;
  keahlian: string[];
  sertifikat: Sertifikat[];
  email: string;
  telepon: string;
  status: 'tersedia' | 'ditugaskan' | 'cuti';
  fotoUrl?: string;
}

export interface Sertifikat {
  id: string;
  nama: string;
  nomorSertifikat: string;
  tanggalTerbit: Date;
  tanggalBerlaku: Date;
}

// Alat
export interface Alat extends BaseEntity {
  namaAlat: string;
  kategori: string;
  merk: string;
  spesifikasi: string;
  kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat' | 'maintenance';
  status: 'tersedia' | 'digunakan' | 'diperbaiki';
  lokasiTerakhir: string;
}

// Legalitas
export interface Legalitas extends BaseEntity {
  namaDokumen: string;
  jenisDokumen: 'izin_usaha' | 'sertifikat' | 'akta' | 'npwp' | 'lainnya';
  nomorDokumen: string;
  tanggalTerbit: Date;
  tanggalBerlaku: Date;
  fileUrl?: string;
  reminder: boolean;
}

// Arsip
export interface ArsipPekerjaan extends BaseEntity {
  pekerjaanId: string;
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  tanggalSelesai: Date;
  dokumenArsip: string[];
  catatan: string;
}

// Settings
export interface ProfilPerusahaan {
  namaPerusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  npwp: string;
  direktur: string;
  logoUrl?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'id' | 'en';
  notifikasi: boolean;
}
