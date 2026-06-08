import api from '@/lib/api';
import {
  Tender,
  NonTender,
  Pekerjaan,
  ArsipPekerjaan,
  TahapanKerja,
  SubTahapan,
  DeskripsiLog,
  Invoice,
} from '@/types';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Backend API shapes ─────────────────────────────────────────────────────────

interface SubTahapanAPI {
  id: string;
  tahapan: string;
  deskripsi: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

interface DokumenInvoiceAPI {
  id: string;
  invoice: string;
  nama: string;
  file: string;
  signed_file_url: string | null;
}

interface DokumenAdendumAPIItem {
  id: string;
  adendum: string;
  nama: string;
  file: string;
  signed_file_url: string | null;
}

export interface AdendumAPI {
  id: string;
  tahapan: string;
  tanggal_adendum: string;
  keterangan: string;
  dokumen: DokumenAdendumAPIItem[];
  created_at: string;
  updated_at: string;
}

interface InvoiceAPI {
  id: string;
  tahapan: string;
  nomor_invoice: string;
  tanggal_terbit: string | null;
  jatuh_tempo: string | null;
  status: string;
  nilai_invoice: string;
  ppn_persen: string;
  catatan: string;
  dokumen?: DokumenInvoiceAPI[];
  created_at: string;
  updated_at: string;
}

interface TahapanAPI {
  id: string;
  pekerjaan: string;
  nomor_urut: number;
  nama_tahapan: string;
  deskripsi: string;
  bobot_pekerjaan: string;
  progress: string;
  status: string; // 'pending' | 'in_progress' | 'selesai'
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  nilai_tahapan: string;
  total_invoice_lunas: number;
  sisa_tagihan: number;
  nilai_kontrak: string;
  sub_tahapan: SubTahapanAPI[];
  created_at: string;
  updated_at: string;
}

interface TenagaAhliPekerjaanAPI {
  id: string;
  pekerjaan: string;
  tenaga_ahli: string;
}

interface LogPekerjaanAPI {
  id: string;
  pekerjaan: string;
  date: string;
  deskripsi: string;
  created_at: string;
  updated_at: string;
}

export interface DokumenPekerjaanAPI {
  id: string;
  pekerjaan: string;
  kategori: string | null;
  jenis_dokumen: string;
  nama: string;
  keterangan: string;
  tanggal_berlaku: string | null;
  file: string | null;
  signed_file_url: string | null;
}

export interface PekerjaanAPI {
  id: string;
  nama_proyek: string;
  perusahaan: string | null;
  jenis_pekerjaan: string | null;
  klien: string;
  jenis_tender: string;
  status_tender: string;
  status_pekerjaan: string | null;
  nomor_kontrak: string;
  keterangan: string;
  tanggal_tender: string | null;
  tanggal_pengumuman: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  nilai_kontrak: string;
  tahapan: TahapanAPI[];
  tenaga_ahli_pekerjaan: TenagaAhliPekerjaanAPI[];
  log_pekerjaan: LogPekerjaanAPI[];
  dokumen_pekerjaan: DokumenPekerjaanAPI[];
  created_at: string;
  updated_at: string;
}

// ── Lookup maps ────────────────────────────────────────────────────────────────

interface LookupMaps {
  perusahaanById: Record<string, string>;   // id → nama
  perusahaanByNama: Record<string, string>; // nama → id
  jenisById: Record<string, string>;         // id → kode
  jenisByKode: Record<string, string>;       // kode → id
}

async function getLookupMaps(): Promise<LookupMaps> {
  const [perusahaanRes, jenisRes] = await Promise.all([
    api.get<PaginatedResponse<{ id: string; nama: string }>>('/api/perusahaan/'),
    api.get<PaginatedResponse<{ id: string; kode: string }>>('/api/jenis-pekerjaan/'),
  ]);

  const perusahaanById: Record<string, string> = {};
  const perusahaanByNama: Record<string, string> = {};
  perusahaanRes.data.results.forEach((p) => {
    perusahaanById[p.id] = p.nama;
    perusahaanByNama[p.nama] = p.id;
  });

  const jenisById: Record<string, string> = {};
  const jenisByKode: Record<string, string> = {};
  jenisRes.data.results.forEach((j) => {
    jenisById[j.id] = j.kode;
    jenisByKode[j.kode] = j.id;
  });

  return { perusahaanById, perusahaanByNama, jenisById, jenisByKode };
}

// ── Mapper helpers ─────────────────────────────────────────────────────────────

function mapTahapanStatus(s: string): 'pending' | 'progress' | 'done' {
  if (s === 'in_progress') return 'progress';
  if (s === 'selesai') return 'done';
  return 'pending';
}

function mapTahapanStatusToBackend(s: 'pending' | 'progress' | 'done'): string {
  if (s === 'progress') return 'in_progress';
  if (s === 'done') return 'selesai';
  return 'pending';
}

function mapInvoiceStatus(s: string): Invoice['status'] {
  if (s === 'lunas') return 'lunas';
  if (s === 'menunggu_bayar') return 'Menunggu Bayar';
  if (s === 'terlambat_bayar') return 'Terlambat Bayar';
  return 'Belum Tagih';
}

function mapInvoiceStatusToBackend(s: Invoice['status']): string {
  if (s === 'lunas') return 'lunas';
  if (s === 'Menunggu Bayar') return 'menunggu_bayar';
  if (s === 'Terlambat Bayar') return 'terlambat_bayar';
  return 'belum_tagih';
}

function mapSubTahapan(data: SubTahapanAPI): SubTahapan {
  return {
    id: data.id,
    nama: data.deskripsi,
    status: data.is_done ? 'done' : 'pending',
  };
}

function mapInvoice(data: InvoiceAPI): Invoice {
  const nilai = parseFloat(data.nilai_invoice) || 0;
  return {
    id: data.id,
    nomorInvoice: data.nomor_invoice,
    tanggalTerbit: data.tanggal_terbit ? new Date(data.tanggal_terbit) : undefined,
    jatuhTempo: data.jatuh_tempo ? new Date(data.jatuh_tempo) : undefined,
    status: mapInvoiceStatus(data.status),
    nilaiInvoice: nilai,
    ppn: parseFloat(data.ppn_persen) || 0,
    jumlahTerbayar: data.status === 'lunas' ? nilai : 0,
    catatan: data.catatan || undefined,
    files: (data.dokumen || []).map(d => d.signed_file_url || d.file).filter(Boolean) as string[],
  };
}

function mapAdendum(data: AdendumAPI): import('@/types').TahapanAdendum {
  return {
    id: data.id,
    tanggal: new Date(data.tanggal_adendum),
    keterangan: data.keterangan,
    files: (data.dokumen || []).map(d => d.signed_file_url || d.file).filter(Boolean) as string[],
  };
}

function mapTahapan(data: TahapanAPI, invoiceMap?: Record<string, InvoiceAPI[]>, adendumMap?: Record<string, AdendumAPI[]>): TahapanKerja {
  const sorted = [...(data.sub_tahapan || [])].sort((a, b) => 0);
  const invoices = (invoiceMap?.[data.id] || []).map(mapInvoice);
  const adendum = (adendumMap?.[data.id] || []).map(mapAdendum);
  return {
    id: data.id,
    nomor: data.nomor_urut,
    nama: data.nama_tahapan,
    deskripsi: data.deskripsi || undefined,
    bobot: parseFloat(data.bobot_pekerjaan) || 0,
    progress: parseFloat(data.progress) || 0,
    status: mapTahapanStatus(data.status),
    tanggalMulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : new Date(),
    tanggalSelesai: data.tanggal_selesai ? new Date(data.tanggal_selesai) : new Date(),
    nilaiTahapan: parseFloat(data.nilai_tahapan) || 0,
    subTahapan: sorted.map(mapSubTahapan),
    files: [],
    invoices,
    adendum: adendum.length > 0 ? adendum : undefined,
    statusPembayaran: invoices.length > 0 ? invoices[invoices.length - 1].status : 'Belum Tagih',
  };
}

function mapPekerjaanToTender(data: PekerjaanAPI, lookups: LookupMaps): Tender {
  return {
    id: data.id,
    namaTender: data.nama_proyek,
    instansi: data.klien,
    nilaiPagu: 0,
    nilaiPenawaran: parseFloat(data.nilai_kontrak) || 0,
    status: data.status_tender as Tender['status'],
    tanggalTender: data.tanggal_tender ? new Date(data.tanggal_tender) : new Date(),
    tanggalHasil: data.tanggal_pengumuman ? new Date(data.tanggal_pengumuman) : null,
    tanggalMulaiProyek: data.tanggal_mulai ? new Date(data.tanggal_mulai) : null,
    tanggalSelesaiProyek: data.tanggal_selesai ? new Date(data.tanggal_selesai) : null,
    timAssigned: (data.tenaga_ahli_pekerjaan || []).map((t) => t.tenaga_ahli),
    alatAssigned: [],
    dokumen: (data.dokumen_pekerjaan || []).map((d) => d.nama),
    jenisPekerjaan: (data.jenis_pekerjaan ? lookups.jenisById[data.jenis_pekerjaan] : '') || '',
    namaPerusahaan: (data.perusahaan ? lookups.perusahaanById[data.perusahaan] : '') || '',
    keterangan: data.keterangan || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapPekerjaanToNonTender(data: PekerjaanAPI, lookups: LookupMaps): NonTender {
  const firstLog = [...(data.log_pekerjaan || [])]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  return {
    id: data.id,
    namaProyek: data.nama_proyek,
    klien: data.klien,
    nilaiEstimasi: parseFloat(data.nilai_kontrak) || 0,
    status: data.status_tender as NonTender['status'],
    tanggalMulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : new Date(),
    tanggalTarget: data.tanggal_selesai ? new Date(data.tanggal_selesai) : new Date(),
    namaPerusahaan: (data.perusahaan ? lookups.perusahaanById[data.perusahaan] : '') || '',
    catatan: firstLog?.deskripsi || '',
    keterangan: data.keterangan || '',
    dokumen: (data.dokumen_pekerjaan || []).map((d) => d.nama),
    timAssigned: (data.tenaga_ahli_pekerjaan || []).map((tap) => tap.tenaga_ahli),
    jenisPekerjaan: (data.jenis_pekerjaan ? lookups.jenisById[data.jenis_pekerjaan] : '') || '',
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

function mapPekerjaan(data: PekerjaanAPI, lookups: LookupMaps, invoiceMap?: Record<string, InvoiceAPI[]>, adendumMap?: Record<string, AdendumAPI[]>): Pekerjaan {
  const tenderType: 'tender' | 'non-tender' =
    data.jenis_tender === 'non_tender' ? 'non-tender' : 'tender';

  const tahapan = [...(data.tahapan || [])]
    .sort((a, b) => a.nomor_urut - b.nomor_urut)
    .map(t => mapTahapan(t, invoiceMap, adendumMap));

  const totalProgress = tahapan.reduce((sum, t) => sum + (t.progress || 0), 0);

  return {
    id: data.id,
    nomorKontrak: data.nomor_kontrak,
    namaProyek: data.nama_proyek,
    klien: data.klien,
    nilaiKontrak: parseFloat(data.nilai_kontrak) || 0,
    namaPerusahaan: (data.perusahaan ? lookups.perusahaanById[data.perusahaan] : '') || '',
    jenisPekerjaan: (data.jenis_pekerjaan ? lookups.jenisById[data.jenis_pekerjaan] : '') || '',
    keterangan: data.keterangan || '',
    tim: (data.tenaga_ahli_pekerjaan || []).map((t) => t.tenaga_ahli),
    status: (data.status_pekerjaan as Pekerjaan['status']) || 'persiapan',
    tanggalMulai: data.tanggal_mulai ? new Date(data.tanggal_mulai) : new Date(),
    tanggalSelesai: data.tanggal_selesai ? new Date(data.tanggal_selesai) : new Date(),
    progress: Math.min(totalProgress, 100),
    tahapan,
    anggaran: [],
    adendum: [],
    tenderType,
    deskripsi: (data.log_pekerjaan || []).map((log) => ({
      id: log.id,
      tanggal: new Date(log.created_at),
      catatan: log.deskripsi,
    })),
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ── Write helpers ──────────────────────────────────────────────────────────────

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
}

async function recreateTimList(pekerjaanId: string, timIds: string[]): Promise<void> {
  for (const taId of timIds) {
    await api.post('/api/tenaga-ahli-pekerjaan/', {
      pekerjaan: pekerjaanId,
      tenaga_ahli: taId,
    });
  }
}

async function deleteExistingTimList(data: PekerjaanAPI): Promise<void> {
  for (const tap of data.tenaga_ahli_pekerjaan || []) {
    await api.delete(`/api/tenaga-ahli-pekerjaan/${tap.id}/`);
  }
}

async function fetchAllAdendum(): Promise<Record<string, AdendumAPI[]>> {
  const all: AdendumAPI[] = [];
  let page = 1;
  while (true) {
    const res = await api.get<PaginatedResponse<AdendumAPI>>(`/api/adendum/?page=${page}`);
    all.push(...res.data.results);
    if (!res.data.next) break;
    page++;
  }
  const map: Record<string, AdendumAPI[]> = {};
  for (const ad of all) {
    if (!map[ad.tahapan]) map[ad.tahapan] = [];
    map[ad.tahapan].push(ad);
  }
  return map;
}

async function fetchAllInvoices(): Promise<Record<string, InvoiceAPI[]>> {
  const all: InvoiceAPI[] = [];
  let page = 1;
  while (true) {
    const res = await api.get<PaginatedResponse<InvoiceAPI>>(`/api/invoice/?page=${page}`);
    all.push(...res.data.results);
    if (!res.data.next) break;
    page++;
  }
  const map: Record<string, InvoiceAPI[]> = {};
  for (const inv of all) {
    if (!map[inv.tahapan]) map[inv.tahapan] = [];
    map[inv.tahapan].push(inv);
  }
  return map;
}

async function recreateTahapanList(pekerjaanId: string, tahapanList: TahapanKerja[]): Promise<void> {
  for (let i = 0; i < tahapanList.length; i++) {
    const t = tahapanList[i];
    const res = await api.post<TahapanAPI>('/api/tahapan/', {
      pekerjaan: pekerjaanId,
      nomor_urut: t.nomor || i + 1,
      nama_tahapan: t.nama,
      deskripsi: t.deskripsi || '',
      bobot_pekerjaan: t.bobot,
      progress: t.progress,
      status: mapTahapanStatusToBackend(t.status),
      tanggal_mulai: formatDate(t.tanggalMulai),
      tanggal_selesai: formatDate(t.tanggalSelesai),
      nilai_tahapan: t.nilaiTahapan || 0,
    });

    const subList = t.subTahapan || [];
    for (const st of subList) {
      await api.post('/api/sub-tahapan/', {
        tahapan: res.data.id,
        deskripsi: st.nama,
        is_done: st.status === 'done',
      });
    }

    for (const inv of (t.invoices || [])) {
      await api.post('/api/invoice/', {
        tahapan: res.data.id,
        nomor_invoice: inv.nomorInvoice,
        tanggal_terbit: formatDate(inv.tanggalTerbit),
        jatuh_tempo: formatDate(inv.jatuhTempo),
        status: mapInvoiceStatusToBackend(inv.status),
        nilai_invoice: inv.nilaiInvoice,
        ppn_persen: inv.ppn || 0,
        catatan: inv.catatan || '',
      });
    }

    for (const ad of (t.adendum || [])) {
      await api.post('/api/adendum/', {
        tahapan: res.data.id,
        tanggal_adendum: formatDate(ad.tanggal),
        keterangan: ad.keterangan,
      });
    }
  }
}

async function deleteExistingTahapanList(data: PekerjaanAPI): Promise<void> {
  for (const t of data.tahapan || []) {
    await api.delete(`/api/tahapan/${t.id}/`);
  }
}

async function postNewLogs(pekerjaanId: string, deskripsi: DeskripsiLog[]): Promise<void> {
  const newLogs = (deskripsi || []).filter((log) => log.id.startsWith('desc-'));
  for (const log of newLogs) {
    await api.post('/api/log-pekerjaan/', {
      pekerjaan: pekerjaanId,
      date: formatDate(log.tanggal) || new Date().toISOString().split('T')[0],
      deskripsi: log.catatan,
    });
  }
}

// ── Tender Service ─────────────────────────────────────────────────────────────

export const tenderService = {
  getAll: async (): Promise<Tender[]> => {
    const [pekerjaanRes, lookups] = await Promise.all([
      api.get<PaginatedResponse<PekerjaanAPI>>('/api/pekerjaan/'),
      getLookupMaps(),
    ]);
    return pekerjaanRes.data.results
      .filter((p) => p.jenis_tender === 'tender')
      .map((p) => mapPekerjaanToTender(p, lookups));
  },

  create: async (
    data: Omit<Tender, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Tender> => {
    const lookups = await getLookupMaps();
    const res = await api.post<PekerjaanAPI>('/api/pekerjaan/', {
      jenis_tender: 'tender',
      nama_proyek: data.namaTender,
      klien: data.instansi,
      nilai_kontrak: data.nilaiPenawaran,
      status_tender: data.status,
      status_pekerjaan: null,
      nomor_kontrak: (data as any).nomorKontrak || '',
      keterangan: data.keterangan || '',
      tanggal_tender: formatDate(data.tanggalTender),
      tanggal_pengumuman: formatDate(data.tanggalHasil ?? null),
      tanggal_mulai: formatDate(data.tanggalMulaiProyek ?? null),
      tanggal_selesai: formatDate(data.tanggalSelesaiProyek ?? null),
      perusahaan: data.namaPerusahaan ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null) : null,
      jenis_pekerjaan: data.jenisPekerjaan ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null) : null,
    });

    await recreateTimList(res.data.id, data.timAssigned || []);

    const full = await api.get<PekerjaanAPI>(`/api/pekerjaan/${res.data.id}/`);
    return mapPekerjaanToTender(full.data, lookups);
  },

  update: async (
    id: string,
    data: Partial<Tender>
  ): Promise<Tender> => {
    const lookups = await getLookupMaps();
    const current = await api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`);

    await api.patch(`/api/pekerjaan/${id}/`, {
      nama_proyek: data.namaTender,
      klien: data.instansi,
      nilai_kontrak: data.nilaiPenawaran,
      status_tender: data.status,
      tanggal_tender: formatDate(data.tanggalTender),
      tanggal_pengumuman: formatDate(data.tanggalHasil ?? null),
      tanggal_mulai: formatDate(data.tanggalMulaiProyek ?? null),
      tanggal_selesai: formatDate(data.tanggalSelesaiProyek ?? null),
      perusahaan: data.namaPerusahaan
        ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null)
        : null,
      jenis_pekerjaan: data.jenisPekerjaan
        ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null)
        : null,
      ...((data as any).nomorKontrak !== undefined ? { nomor_kontrak: (data as any).nomorKontrak } : {}),
      ...(data.keterangan !== undefined ? { keterangan: data.keterangan } : {}),
    });

    await deleteExistingTimList(current.data);
    await recreateTimList(id, data.timAssigned || []);

    const full = await api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`);
    return mapPekerjaanToTender(full.data, lookups);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/pekerjaan/${id}/`);
  },
};

// ── Non-Tender Service ─────────────────────────────────────────────────────────

export const nonTenderService = {
  getAll: async (): Promise<NonTender[]> => {
    const [pekerjaanRes, lookups] = await Promise.all([
      api.get<PaginatedResponse<PekerjaanAPI>>('/api/pekerjaan/'),
      getLookupMaps(),
    ]);
    return pekerjaanRes.data.results
      .filter((p) => p.jenis_tender === 'non_tender')
      .map((p) => mapPekerjaanToNonTender(p, lookups));
  },

  create: async (
    data: Omit<NonTender, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<NonTender> => {
    const lookups = await getLookupMaps();
    const res = await api.post<PekerjaanAPI>('/api/pekerjaan/', {
      jenis_tender: 'non_tender',
      nama_proyek: data.namaProyek,
      klien: data.klien,
      nilai_kontrak: data.nilaiEstimasi,
      status_tender: data.status,
      status_pekerjaan: null,
      nomor_kontrak: (data as any).nomorKontrak || '',
      keterangan: data.keterangan || '',
      tanggal_tender: null,
      tanggal_pengumuman: null,
      tanggal_mulai: formatDate(data.tanggalMulai),
      tanggal_selesai: formatDate(data.tanggalTarget),
      perusahaan: data.namaPerusahaan ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null) : null,
      jenis_pekerjaan: data.jenisPekerjaan ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null) : null,
    });

    await recreateTimList(res.data.id, data.timAssigned || []);

    if (data.catatan) {
      await api.post('/api/log-pekerjaan/', {
        pekerjaan: res.data.id,
        date: new Date().toISOString().split('T')[0],
        deskripsi: data.catatan,
      });
    }

    const full = await api.get<PekerjaanAPI>(`/api/pekerjaan/${res.data.id}/`);
    return mapPekerjaanToNonTender(full.data, lookups);
  },

  update: async (
    id: string,
    data: Partial<NonTender>
  ): Promise<NonTender> => {
    const lookups = await getLookupMaps();
    const current = await api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`);

    await api.patch(`/api/pekerjaan/${id}/`, {
      nama_proyek: data.namaProyek,
      klien: data.klien,
      nilai_kontrak: data.nilaiEstimasi,
      status_tender: data.status,
      tanggal_mulai: formatDate(data.tanggalMulai),
      tanggal_selesai: formatDate(data.tanggalTarget),
      perusahaan: data.namaPerusahaan
        ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null)
        : null,
      jenis_pekerjaan: data.jenisPekerjaan
        ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null)
        : null,
      ...((data as any).nomorKontrak !== undefined ? { nomor_kontrak: (data as any).nomorKontrak } : {}),
      ...(data.keterangan !== undefined ? { keterangan: data.keterangan } : {}),
    });

    await deleteExistingTimList(current.data);
    await recreateTimList(id, data.timAssigned || []);

    const firstLog = [...(current.data.log_pekerjaan || [])]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    if (data.catatan && data.catatan !== (firstLog?.deskripsi || '')) {
      await api.post('/api/log-pekerjaan/', {
        pekerjaan: id,
        date: new Date().toISOString().split('T')[0],
        deskripsi: data.catatan,
      });
    }

    const full = await api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`);
    return mapPekerjaanToNonTender(full.data, lookups);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/pekerjaan/${id}/`);
  },
};

// ── Dokumen Pekerjaan Service ─────────────────────────────────────────────────

export const dokumenPekerjaanService = {
  getByPekerjaan: async (pekerjaanId: string): Promise<DokumenPekerjaanAPI[]> => {
    const res = await api.get<PaginatedResponse<DokumenPekerjaanAPI>>(
      `/api/dokumen-pekerjaan/?pekerjaan=${pekerjaanId}`
    );
    return res.data.results;
  },

  upload: async (
    pekerjaanId: string,
    nama: string,
    keterangan: string,
    file: File | Blob,
    filename?: string,
    jenisDokumen?: string,
    tanggalBerlaku?: string,
  ): Promise<DokumenPekerjaanAPI> => {
    const fd = new globalThis.FormData();
    fd.append('pekerjaan', pekerjaanId);
    fd.append('nama', nama);
    fd.append('keterangan', keterangan);
    fd.append('jenis_dokumen', jenisDokumen ?? 'dokumen_pekerjaan');
    if (tanggalBerlaku) fd.append('tanggal_berlaku', tanggalBerlaku);
    fd.append('file', file, filename ?? nama);
    const res = await api.post<DokumenPekerjaanAPI>(
      '/api/dokumen-pekerjaan/',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  updateJenisDokumen: async (id: string, jenisDokumen: string): Promise<DokumenPekerjaanAPI> => {
    const res = await api.patch<DokumenPekerjaanAPI>(
      `/api/dokumen-pekerjaan/${id}/`,
      { jenis_dokumen: jenisDokumen }
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/dokumen-pekerjaan/${id}/`);
  },
};

// ── Dokumen Tahapan Service ───────────────────────────────────────────────────

export interface DokumenTahapanAPI {
  id: string;
  tahapan: string;
  nama: string;
  file: string | null;
  signed_file_url: string | null;
}

export const dokumenTahapanService = {
  getByTahapan: async (tahapanId: string): Promise<DokumenTahapanAPI[]> => {
    const res = await api.get<PaginatedResponse<DokumenTahapanAPI>>(
      `/api/dokumen-tahapan/?tahapan=${tahapanId}`
    );
    return res.data.results;
  },

  upload: async (
    tahapanId: string,
    nama: string,
    file: File | Blob,
    filename?: string,
  ): Promise<DokumenTahapanAPI> => {
    const fd = new globalThis.FormData();
    fd.append('tahapan', tahapanId);
    fd.append('nama', nama);
    fd.append('file', file, filename ?? nama);
    const res = await api.post<DokumenTahapanAPI>(
      '/api/dokumen-tahapan/',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/dokumen-tahapan/${id}/`);
  },
};

export const adendumService = {
  getByTahapan: async (tahapanId: string): Promise<AdendumAPI[]> => {
    const res = await api.get<PaginatedResponse<AdendumAPI>>(
      `/api/adendum/?tahapan=${tahapanId}`
    );
    return res.data.results;
  },
};

export const dokumenAdendumService = {
  upload: async (
    adendumId: string,
    nama: string,
    file: File | Blob,
    filename?: string,
  ): Promise<void> => {
    const fd = new globalThis.FormData();
    fd.append('adendum', adendumId);
    fd.append('nama', nama);
    fd.append('file', file, filename ?? nama);
    await api.post('/api/dokumen-adendum/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const dokumenInvoiceService = {
  upload: async (
    invoiceId: string,
    nama: string,
    file: File | Blob,
    filename?: string,
  ): Promise<DokumenInvoiceAPI> => {
    const fd = new globalThis.FormData();
    fd.append('invoice', invoiceId);
    fd.append('nama', nama);
    fd.append('file', file, filename ?? nama);
    const res = await api.post<DokumenInvoiceAPI>(
      '/api/dokumen-invoice/',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
};

// ── Active Pekerjaan Service ───────────────────────────────────────────────────

export const activePekerjaanService = {
  getAll: async (): Promise<Pekerjaan[]> => {
    const [pekerjaanRes, lookups, invoiceMap, adendumMap] = await Promise.all([
      api.get<PaginatedResponse<PekerjaanAPI>>('/api/pekerjaan/'),
      getLookupMaps(),
      fetchAllInvoices(),
      fetchAllAdendum(),
    ]);
    return pekerjaanRes.data.results
      .filter((p) => p.status_tender === 'menang' || p.status_tender === 'kontrak')
      .map((p) => mapPekerjaan(p, lookups, invoiceMap, adendumMap));
  },

  create: async (
    data: Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Pekerjaan> => {
    const lookups = await getLookupMaps();
    const backendJenisTender = data.tenderType === 'non-tender' ? 'non_tender' : 'tender';
    const statusTender = data.tenderType === 'non-tender' ? 'kontrak' : 'menang';
    const statusPekerjaan =
      data.status === 'serah_terima' ? 'selesai' : data.status;

    const res = await api.post<PekerjaanAPI>('/api/pekerjaan/', {
      jenis_tender: backendJenisTender,
      status_tender: statusTender,
      status_pekerjaan: statusPekerjaan,
      nama_proyek: data.namaProyek,
      klien: data.klien,
      nilai_kontrak: data.nilaiKontrak,
      nomor_kontrak: data.nomorKontrak,
      keterangan: data.keterangan || '',
      tanggal_mulai: formatDate(data.tanggalMulai),
      tanggal_selesai: formatDate(data.tanggalSelesai),
      tanggal_tender: null,
      tanggal_pengumuman: null,
      perusahaan: data.namaPerusahaan
        ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null)
        : null,
      jenis_pekerjaan: data.jenisPekerjaan
        ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null)
        : null,
    });

    await recreateTimList(res.data.id, data.tim || []);
    await recreateTahapanList(res.data.id, data.tahapan || []);
    await postNewLogs(res.data.id, data.deskripsi || []);

    const [full, invoiceMap, adendumMap] = await Promise.all([
      api.get<PekerjaanAPI>(`/api/pekerjaan/${res.data.id}/`),
      fetchAllInvoices(),
      fetchAllAdendum(),
    ]);
    return mapPekerjaan(full.data, lookups, invoiceMap, adendumMap);
  },

  update: async (id: string, data: Partial<Pekerjaan>): Promise<Pekerjaan> => {
    const lookups = await getLookupMaps();
    const current = await api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`);

    const backendJenisTender =
      data.tenderType === 'non-tender' ? 'non_tender' : 'tender';
    const statusTender = data.tenderType === 'non-tender' ? 'kontrak' : 'menang';
    const statusPekerjaan =
      data.status === 'serah_terima' ? 'selesai' : data.status;

    await api.patch(`/api/pekerjaan/${id}/`, {
      jenis_tender: backendJenisTender,
      status_tender: statusTender,
      status_pekerjaan: statusPekerjaan,
      nama_proyek: data.namaProyek,
      klien: data.klien,
      nilai_kontrak: data.nilaiKontrak,
      nomor_kontrak: data.nomorKontrak,
      keterangan: data.keterangan || '',
      tanggal_mulai: formatDate(data.tanggalMulai),
      tanggal_selesai: formatDate(data.tanggalSelesai),
      perusahaan: data.namaPerusahaan
        ? (lookups.perusahaanByNama[data.namaPerusahaan] ?? null)
        : null,
      jenis_pekerjaan: data.jenisPekerjaan
        ? (lookups.jenisByKode[data.jenisPekerjaan] ?? null)
        : null,
    });

    await deleteExistingTimList(current.data);
    await recreateTimList(id, data.tim || []);

    await deleteExistingTahapanList(current.data);
    await recreateTahapanList(id, data.tahapan || []);

    await postNewLogs(id, data.deskripsi || []);

    const [full, invoiceMap, adendumMap] = await Promise.all([
      api.get<PekerjaanAPI>(`/api/pekerjaan/${id}/`),
      fetchAllInvoices(),
      fetchAllAdendum(),
    ]);
    return mapPekerjaan(full.data, lookups, invoiceMap, adendumMap);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/pekerjaan/${id}/`);
  },
};

// ── Arsip Service ──────────────────────────────────────────────────────────────

export const arsipService = {
  getAll: async (): Promise<ArsipPekerjaan[]> => {
    const [pekerjaanRes, lookups, invoiceMap] = await Promise.all([
      api.get<PaginatedResponse<PekerjaanAPI>>('/api/pekerjaan/'),
      getLookupMaps(),
      fetchAllInvoices(),
    ]);
    return pekerjaanRes.data.results
      .filter((p) => p.status_pekerjaan === 'selesai')
      .map((p) => {
        const pekerjaan = mapPekerjaan(p, lookups, invoiceMap);
        const latestLog = [...(p.log_pekerjaan || [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        return {
          id: p.id,
          pekerjaanId: p.id,
          namaProyek: p.nama_proyek,
          klien: p.klien,
          nilaiKontrak: parseFloat(p.nilai_kontrak) || 0,
          tanggalSelesai: p.tanggal_selesai ? new Date(p.tanggal_selesai) : new Date(),
          tanggalMulai: p.tanggal_mulai ? new Date(p.tanggal_mulai) : undefined,
          jenisPekerjaan: pekerjaan.jenisPekerjaan || undefined,
          tenderType: pekerjaan.tenderType,
          dokumenArsip: (p.dokumen_pekerjaan || [])
            .map((d) => d.signed_file_url || d.file || d.nama)
            .filter(Boolean) as string[],
          catatan: latestLog?.deskripsi || '',
          aoiFile: undefined,
          tahapan: pekerjaan.tahapan,
          anggaran: [],
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        } satisfies ArsipPekerjaan;
      });
  },
};
