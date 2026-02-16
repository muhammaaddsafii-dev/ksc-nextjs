// Common types
export type Status = 'draft' | 'active' | 'completed' | 'cancelled' | 'pending' | 'won' | 'lost';
export type TenderType = 'tender' | 'non-tender';

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
  status: 'penawaran' | 'kontrak' | 'batal';
  tanggalMulai: Date;
  tanggalTarget: Date;
  namaPerusahaan: string;
  catatan: string;
  dokumen: string[];
  jenisPekerjaan: string;
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
  jenisPekerjaan: string;
  namaPerusahaan: string;
}

// Pekerjaan / Project
export interface Pekerjaan extends BaseEntity {
  nomorKontrak: string;
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  namaPerusahaan: string;
  jenisPekerjaan: string;
  tim: string[];
  status: 'persiapan' | 'berjalan' | 'selesai' | 'serah_terima';
  tanggalMulai: Date;
  tanggalSelesai: Date;
  progress: number;
  tahapan: TahapanKerja[];
  anggaran: AnggaranItem[];
  adendum: Adendum[];
  tenderType: TenderType;
  aoiFile?: string; // Path to AOI file (GeoJSON/KML/Shapefile)
}

export interface TahapanKerja {
  id: string;
  nomor: number; // Nomor urut tahapan untuk sorting dan display
  nama: string;
  progress: number;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  status: 'pending' | 'progress' | 'done';
  bobot: number; // Bobot persentase tahapan (0-100), total semua tahapan harus 100%
  deskripsi?: string; // Deskripsi tambahan untuk tahapan
  adendum?: TahapanAdendum[]; // Riwayat adendum pada tahapan ini
  files?: string[]; // Array of file URLs/paths sebagai bukti tahapan selesai
  // Invoice Fields
  tanggalInvoice?: Date;
  perkiraanInvoiceMasuk?: Date;
  jumlahTagihanInvoice?: number;
  invoiceNote?: string;
  dokumenInvoice?: string[]; // Array of invoice document URLs
  statusPembayaran?: 'lunas' | 'pending' | 'overdue';
}

export interface TahapanAdendum {
  id: string;
  tanggal: Date;
  keterangan: string;
  files: string[]; // Dokumen pendukung adendum
}


// MODIFIED: Ditambahkan tahapanId untuk mengaitkan anggaran dengan tahapan
export interface AnggaranItem {
  id: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  realisasi: number;
  tahapanId: string; // ID tahapan yang terkait dengan anggaran ini
  files?: string[]; // Array of file URLs/paths sebagai bukti anggaran
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
  fileUrl?: string;
}

// Alat
export interface Alat extends BaseEntity {
  kodeAlat: string;
  namaAlat: string;
  tanggalPengadaan: Date;
  nomorSeri: string;
  kelengkapan: 'Lengkap' | 'Tidak Lengkap';
  status: 'Tersedia' | 'Dipinjam' | 'Rusak' | 'Hilang';
  keterangan: string;
  gambarList?: string[];
  historiPeminjaman: HistoriPeminjaman[];
  // Legacy optional fields if needed for other parts of app, though we are refactoring the main page
  kategori?: string;
  merk?: string;
  spesifikasi?: string;
  kondisi?: string;
  lokasiTerakhir?: string;
  jumlahTotal?: number;
  jumlahTersedia?: number;
  kategoriId?: string;
  peminjam?: any[];
}

export interface HistoriPeminjaman {
  id: string;
  peminjam: string;
  tanggalPinjam: Date;
  tanggalKembali: Date | null;
}

export interface Peminjaman extends BaseEntity {
  idPeminjaman: string;
  alatId: string; // Deprecated, keep for legacy simple ref
  alatIds?: string[]; // New: Supports multiple tools
  tanggalPinjam: Date;
  tanggalKembali: Date;
  peminjam: string;
  rincianAlat: string; // Comma separated names or summary
  keterangan: string;
  status: string;
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
  kategoriId?: string; // ID kategori dokumen
}

// Arsip
export interface ArsipPekerjaan extends BaseEntity {
  pekerjaanId: string;
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  tanggalSelesai: Date;
  dokumenArsip: string[]; // Array of document file paths/URLs
  catatan: string;
  aoiFile?: string;
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

// Jenis Pekerjaan
export interface JenisPekerjaan extends BaseEntity {
  kode: string; // Kode unik jenis pekerjaan (misal: AMDAL, PPKH)
  nama: string; // Nama lengkap jenis pekerjaan
  deskripsi?: string; // Deskripsi opsional
  warna: string; // Kode warna hex untuk UI (misal: #3B82F6)
  aktif: boolean; // Status aktif/tidak aktif
}

// Template Tahapan
export interface TahapanTemplate extends BaseEntity {
  jenisPekerjaanId: string; // ID jenis pekerjaan yang terkait
  nama: string; // Nama tahapan
  deskripsi?: string; // Deskripsi opsional
  urutan: number; // Urutan tahapan (1, 2, 3, dst)
  bobotDefault: number; // Bobot default dalam persen (0-100)
  aktif: boolean; // Status aktif/tidak aktif
}

// Data Perusahaan
export interface Perusahaan extends BaseEntity {
  nama: string;
  alamat?: string;
  email?: string;
  telepon?: string;
}
