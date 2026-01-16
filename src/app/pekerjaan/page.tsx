"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit, Trash2, Eye, Upload, X, FileText, Download, FileImage, File, FileSpreadsheet, Users, CheckCircle2, Circle, AlertCircle, Calendar, Flag, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { useLelangStore } from '@/stores/lelangStore';
import { usePraKontrakStore } from '@/stores/praKontrakStore';
import { Pekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { TenderBadge } from '@/components/TenderBadge';

type FormData = Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
  sourceType?: 'lelang' | 'non-lelang' | 'manual';
  sourceId?: string;
  dokumenLelang?: {
    dokumenTender?: string[];
    dokumenAdministrasi?: string[];
    dokumenTeknis?: string[];
    dokumenPenawaran?: string[];
  };
  dokumenNonLelang?: string[];
  dokumenSPK?: string[];
  dokumenInvoice?: string[];
};

const initialFormData: FormData = {
  nomorKontrak: '',
  namaProyek: '',
  klien: '',
  nilaiKontrak: 0,
  pic: '',
  tim: [],
  status: 'persiapan',
  tanggalMulai: new Date(),
  tanggalSelesai: new Date(),
  progress: 0,
  tahapan: [],
  anggaran: [],
  adendum: [],
  tenderType: 'non-lelang',
  sourceType: 'manual',
  sourceId: '',
  dokumenLelang: {
    dokumenTender: [],
    dokumenAdministrasi: [],
    dokumenTeknis: [],
    dokumenPenawaran: [],
  },
  dokumenNonLelang: [],
  dokumenSPK: [],
  dokumenInvoice: [],
};

export default function PekerjaanPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem, addTahapan, updateTahapan, deleteTahapan, addAnggaran, deleteAnggaran } = usePekerjaanStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: lelangList, fetchItems: fetchLelang } = useLelangStore();
  const { items: praKontrakList, fetchItems: fetchPraKontrak } = usePraKontrakStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Pekerjaan | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Tahapan form
  const [newTahapan, setNewTahapan] = useState<Omit<TahapanKerja, 'id'>>({
    nama: '', progress: 0, tanggalMulai: new Date(), tanggalSelesai: new Date(), status: 'pending', bobot: 0, files: []
  });

  // Anggaran form - MODIFIED: Ditambahkan tahapanId
  const [newAnggaran, setNewAnggaran] = useState<Omit<AnggaranItem, 'id'>>({
    kategori: '', deskripsi: '', jumlah: 0, realisasi: 0, tahapanId: '', files: []
  });

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchLelang();
    fetchPraKontrak();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleEdit = (item: Pekerjaan) => {
    setSelectedItem(item);

    // Tentukan tenderType - prioritaskan yang sudah ada, fallback ke 'lelang' untuk demo
    const actualTenderType = item.tenderType || 'lelang';

    setFormData({
      nomorKontrak: item.nomorKontrak,
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiKontrak: item.nilaiKontrak,
      pic: item.pic,
      tim: item.tim,
      status: item.status,
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalSelesai: new Date(item.tanggalSelesai),
      progress: item.progress,
      tahapan: item.tahapan,
      anggaran: item.anggaran,
      adendum: item.adendum,
      tenderType: actualTenderType,
      sourceType: (item as any).sourceType || (actualTenderType === 'lelang' ? 'lelang' : 'non-lelang'),
      sourceId: (item as any).sourceId || '',
      // Tambahkan dokumen dummy berdasarkan tenderType - SELALU GENERATE untuk demo
      dokumenLelang: actualTenderType === 'lelang' ? {
        dokumenTender: [
          `Dokumen_RKS_Tender_${item.namaProyek.substring(0, 10)}.pdf`,
          `Spesifikasi_Teknis_${item.klien.substring(0, 8)}.pdf`,
        ],
        dokumenAdministrasi: [
          `SIUP_Perusahaan.pdf`,
          `TDP_${item.klien.substring(0, 8)}.pdf`,
          `NPWP_Perusahaan.pdf`,
        ],
        dokumenTeknis: [
          `Gambar_Teknis_${item.namaProyek.substring(0, 10)}.dwg`,
          `RAB_Detail.xlsx`,
          `Metode_Pelaksanaan.pdf`,
          `Spesifikasi_Material.pdf`,
        ],
        dokumenPenawaran: [
          `Surat_Penawaran_Harga.pdf`,
          `Breakdown_Harga.xlsx`,
        ],
      } : {
        dokumenTender: [],
        dokumenAdministrasi: [],
        dokumenTeknis: [],
        dokumenPenawaran: [],
      },
      dokumenNonLelang: actualTenderType === 'non-lelang' ? [
        `Proposal_Teknis_${item.namaProyek.substring(0, 10)}.pdf`,
        `Company_Profile_${item.klien.substring(0, 8)}.pdf`,
        `RAB_${item.namaProyek.substring(0, 10)}.xlsx`,
        `Surat_Penawaran_Harga.pdf`,
        `Portfolio_Proyek.pdf`,
      ] : [],
      // Dummy data untuk SPK dan Invoice
      dokumenSPK: [
        `SPK_${item.nomorKontrak}_${item.namaProyek.substring(0, 10)}.pdf`,
        `SPK_Adendum_01_${item.nomorKontrak}.pdf`,
      ],
      dokumenInvoice: [
        `Invoice_Termin_1_${item.nomorKontrak}.pdf`,
        `Invoice_Termin_2_${item.nomorKontrak}.pdf`,
        `Invoice_Termin_3_${item.nomorKontrak}.pdf`,
      ],
    });
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleView = (item: Pekerjaan) => {
    setSelectedItem(item);

    // Tentukan tenderType - prioritaskan yang sudah ada, fallback ke 'lelang' untuk demo
    const actualTenderType = item.tenderType || 'lelang';

    setFormData({
      nomorKontrak: item.nomorKontrak,
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiKontrak: item.nilaiKontrak,
      pic: item.pic,
      tim: item.tim,
      status: item.status,
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalSelesai: new Date(item.tanggalSelesai),
      progress: item.progress,
      tahapan: item.tahapan,
      anggaran: item.anggaran,
      adendum: item.adendum,
      tenderType: actualTenderType,
      sourceType: (item as any).sourceType || (actualTenderType === 'lelang' ? 'lelang' : 'non-lelang'),
      sourceId: (item as any).sourceId || '',
      // Tambahkan dokumen dummy berdasarkan tenderType - SELALU GENERATE untuk demo
      dokumenLelang: actualTenderType === 'lelang' ? {
        dokumenTender: [
          `Dokumen_RKS_Tender_${item.namaProyek.substring(0, 10)}.pdf`,
          `Spesifikasi_Teknis_${item.klien.substring(0, 8)}.pdf`,
        ],
        dokumenAdministrasi: [
          `SIUP_Perusahaan.pdf`,
          `TDP_${item.klien.substring(0, 8)}.pdf`,
          `NPWP_Perusahaan.pdf`,
        ],
        dokumenTeknis: [
          `Gambar_Teknis_${item.namaProyek.substring(0, 10)}.dwg`,
          `RAB_Detail.xlsx`,
          `Metode_Pelaksanaan.pdf`,
          `Spesifikasi_Material.pdf`,
        ],
        dokumenPenawaran: [
          `Surat_Penawaran_Harga.pdf`,
          `Breakdown_Harga.xlsx`,
        ],
      } : {
        dokumenTender: [],
        dokumenAdministrasi: [],
        dokumenTeknis: [],
        dokumenPenawaran: [],
      },
      dokumenNonLelang: actualTenderType === 'non-lelang' ? [
        `Proposal_Teknis_${item.namaProyek.substring(0, 10)}.pdf`,
        `Company_Profile_${item.klien.substring(0, 8)}.pdf`,
        `RAB_${item.namaProyek.substring(0, 10)}.xlsx`,
        `Surat_Penawaran_Harga.pdf`,
        `Portfolio_Proyek.pdf`,
      ] : [],
      // Dummy data untuk SPK dan Invoice
      dokumenSPK: [
        `SPK_${item.nomorKontrak}_${item.namaProyek.substring(0, 10)}.pdf`,
        `SPK_Adendum_01_${item.nomorKontrak}.pdf`,
      ],
      dokumenInvoice: [
        `Invoice_Termin_1_${item.nomorKontrak}.pdf`,
        `Invoice_Termin_2_${item.nomorKontrak}.pdf`,
        `Invoice_Termin_3_${item.nomorKontrak}.pdf`,
      ],
    });
    setViewMode(true);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleDelete = (item: Pekerjaan) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Pekerjaan berhasil dihapus');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi total bobot tahapan
    if (formData.tahapan.length > 0) {
      const totalBobot = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
      if (Math.abs(totalBobot - 100) > 0.01) {
        toast.error(`Total bobot tahapan harus 100%. Saat ini: ${totalBobot.toFixed(1)}%`);
        setActiveTab('tahapan');
        return;
      }
    }

    // Hitung progress otomatis berdasarkan tahapan yang selesai
    const calculatedProgress = calculateWeightedProgress();
    const dataToSubmit = {
      ...formData,
      progress: calculatedProgress
    };

    if (selectedItem) {
      updateItem(selectedItem.id, dataToSubmit);
      toast.success('Pekerjaan berhasil diperbarui');
    } else {
      addItem(dataToSubmit);
      toast.success('Pekerjaan berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const handleAddTahapan = () => {
    if (!newTahapan.nama) return;

    // Validasi bobot
    if (newTahapan.bobot <= 0) {
      toast.error('Bobot harus lebih dari 0%');
      return;
    }

    const totalBobotSekarang = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
    if (totalBobotSekarang + newTahapan.bobot > 100) {
      toast.error(`Total bobot melebihi 100%. Sisa bobot: ${(100 - totalBobotSekarang).toFixed(1)}%`);
      return;
    }

    setFormData({
      ...formData,
      tahapan: [...formData.tahapan, { ...newTahapan, id: Date.now().toString() }]
    });
    setNewTahapan({ nama: '', progress: 0, tanggalMulai: new Date(), tanggalSelesai: new Date(), status: 'pending', bobot: 0, files: [] });
    toast.success('Tahapan ditambahkan');
  };

  // MODIFIED: Validasi tahapanId harus diisi
  // Handle file upload untuk tahapan
  const handleTahapanFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simulasi upload - dalam production, upload ke server/storage
    const fileNames = Array.from(files).map(file => {
      // Dalam production, ini akan return URL dari server
      return `uploads/tahapan/${Date.now()}_${file.name}`;
    });

    setNewTahapan({
      ...newTahapan,
      files: [...(newTahapan.files || []), ...fileNames]
    });
    toast.success(`${files.length} file ditambahkan`);
  };

  // Handle file upload untuk anggaran
  const handleAnggaranFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simulasi upload - dalam production, upload ke server/storage
    const fileNames = Array.from(files).map(file => {
      // Dalam production, ini akan return URL dari server
      return `uploads/anggaran/${Date.now()}_${file.name}`;
    });

    setNewAnggaran({
      ...newAnggaran,
      files: [...(newAnggaran.files || []), ...fileNames]
    });
    toast.success(`${files.length} file ditambahkan`);
  };

  // Handle file upload untuk tahapan yang sudah ada
  const handleExistingTahapanFileUpload = (tahapanIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileNames = Array.from(files).map(file => {
      return `uploads/tahapan/${Date.now()}_${file.name}`;
    });

    const newTahapan = [...formData.tahapan];
    newTahapan[tahapanIdx].files = [...(newTahapan[tahapanIdx].files || []), ...fileNames];
    setFormData({ ...formData, tahapan: newTahapan });
    toast.success(`${files.length} file ditambahkan`);
  };

  // Handle file upload untuk anggaran yang sudah ada
  const handleExistingAnggaranFileUpload = (anggaranId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileNames = Array.from(files).map(file => {
      return `uploads/anggaran/${Date.now()}_${file.name}`;
    });

    const newAnggaran = formData.anggaran.map(a =>
      a.id === anggaranId
        ? { ...a, files: [...(a.files || []), ...fileNames] }
        : a
    );
    setFormData({ ...formData, anggaran: newAnggaran });
    toast.success(`${files.length} file ditambahkan`);
  };

  // Get icon berdasarkan ekstensi file
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return FileImage;
      case 'pdf':
        return FileText;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return FileSpreadsheet;
      case 'doc':
      case 'docx':
        return FileText;
      case 'dwg':
      case 'dxf':
        return File;
      default:
        return FileText;
    }
  };

  // Get color berdasarkan ekstensi file
  const getFileColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'text-green-600';
      case 'pdf':
        return 'text-red-600';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'text-emerald-600';
      case 'doc':
      case 'docx':
        return 'text-blue-600';
      case 'dwg':
      case 'dxf':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // Handle download file
  const handleDownloadFile = (filePath: string) => {
    // Extract filename dari path
    const fileName = filePath.split('/').pop() || 'document';

    // Dalam production, ini akan download file dari server
    // Untuk sekarang, kita simulasikan dengan membuat link download

    // Simulasi: Buat dummy blob untuk demo
    const dummyContent = `Ini adalah file: ${fileName}\n\nFile ini merupakan dokumen bukti yang diupload.\n\nDalam production, file ini akan diambil dari server storage.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Buat link download temporary
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Mengunduh: ${fileName}`);
  };

  // Remove file dari tahapan baru
  const removeTahapanFile = (fileName: string) => {
    setNewTahapan({
      ...newTahapan,
      files: newTahapan.files?.filter(f => f !== fileName) || []
    });
  };

  // Remove file dari anggaran baru
  const removeAnggaranFile = (fileName: string) => {
    setNewAnggaran({
      ...newAnggaran,
      files: newAnggaran.files?.filter(f => f !== fileName) || []
    });
  };

  // Remove file dari tahapan yang sudah ada
  const removeExistingTahapanFile = (tahapanIdx: number, fileName: string) => {
    const newTahapan = [...formData.tahapan];
    newTahapan[tahapanIdx].files = newTahapan[tahapanIdx].files?.filter(f => f !== fileName) || [];
    setFormData({ ...formData, tahapan: newTahapan });
  };

  // Remove file dari anggaran yang sudah ada
  const removeExistingAnggaranFile = (anggaranId: string, fileName: string) => {
    const newAnggaran = formData.anggaran.map(a =>
      a.id === anggaranId
        ? { ...a, files: a.files?.filter(f => f !== fileName) || [] }
        : a
    );
    setFormData({ ...formData, anggaran: newAnggaran });
  };

  const handleAddAnggaran = () => {
    if (!newAnggaran.kategori || !newAnggaran.tahapanId) {
      toast.error('Kategori dan Tahapan harus diisi');
      return;
    }
    setFormData({
      ...formData,
      anggaran: [...formData.anggaran, { ...newAnggaran, id: Date.now().toString() }]
    });
    setNewAnggaran({ kategori: '', deskripsi: '', jumlah: 0, realisasi: 0, tahapanId: '', files: [] });
    toast.success('Anggaran ditambahkan');
  };

  const columns = [
    {
      key: 'namaProyek',
      header: 'Proyek',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm">{item.namaProyek}</p>
          <p className="text-xs text-muted-foreground">{item.nomorKontrak}</p>
        </div>
      ),
    },
    {
      key: 'klien',
      header: 'Klien',
      sortable: true,
      // LEFT – sudah benar
      render: (item: Pekerjaan) => (
        <div className="min-w-[150px] text-sm text-center">
          {item.klien}
        </div>
      ),
    },
    {
      key: 'nilaiKontrak',
      header: 'Nilai Kontrak',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[120px] text-sm text-center font-medium">
          {formatCurrency(item.nilaiKontrak)}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <div className="w-20 sm:w-24 min-w-[80px]">
            <div className="flex items-center gap-1 sm:gap-2">
              <Progress value={item.progress} className="h-2" />
              <span className="text-xs sm:text-sm whitespace-nowrap">
                {item.progress}%
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: 'tenderType',
      header: 'Tender',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <TenderBadge type={item.tenderType} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <div className="flex items-center gap-1 min-w-[120px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleView(item);
              }}
            >
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ),
    },

  ];

  const totalAnggaran = formData.anggaran.reduce((sum, a) => sum + a.jumlah, 0);
  const totalRealisasi = formData.anggaran.reduce((sum, a) => sum + a.realisasi, 0);
  const totalBobot = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
  const sisaBobot = 100 - totalBobot;

  // Hitung progress berdasarkan bobot tahapan yang sudah selesai
  const calculateWeightedProgress = () => {
    if (formData.tahapan.length === 0) return 0;
    return formData.tahapan.reduce((total, tahapan) => {
      // Hanya hitung tahapan yang statusnya 'done' (selesai)
      if (tahapan.status === 'done') {
        return total + tahapan.bobot;
      }
      return total;
    }, 0);
  };

  // Fungsi untuk load data dari project lelang/non-lelang
  const handleLoadFromSource = (sourceType: 'lelang' | 'non-lelang', sourceId: string) => {
    if (sourceType === 'lelang') {
      const lelang = lelangList.find(l => l.id === sourceId);
      if (lelang) {
        setFormData({
          ...formData,
          namaProyek: lelang.namaLelang,
          klien: lelang.instansi,
          nilaiKontrak: (lelang as any).nominalTender || lelang.nilaiPenawaran,
          tanggalMulai: lelang.tanggalLelang,
          tim: lelang.timAssigned,
          tenderType: 'lelang',
          sourceType: 'lelang',
          sourceId: lelang.id,
          dokumenLelang: {
            dokumenTender: (lelang as any).dokumenTender || [],
            dokumenAdministrasi: (lelang as any).dokumenAdministrasi || [],
            dokumenTeknis: (lelang as any).dokumenTeknis || [],
            dokumenPenawaran: (lelang as any).dokumenPenawaran || [],
          },
        });
        toast.success('Data dari lelang berhasil dimuat');
      }
    } else if (sourceType === 'non-lelang') {
      const praKontrak = praKontrakList.find(p => p.id === sourceId);
      if (praKontrak) {
        setFormData({
          ...formData,
          namaProyek: praKontrak.namaProyek,
          klien: praKontrak.klien,
          nilaiKontrak: praKontrak.nilaiEstimasi,
          tanggalMulai: praKontrak.tanggalMulai,
          pic: praKontrak.pic,
          tenderType: 'non-lelang',
          sourceType: 'non-lelang',
          sourceId: praKontrak.id,
          dokumenNonLelang: praKontrak.dokumen || [],
        });
        toast.success('Data dari non-lelang berhasil dimuat');
      }
    }
  };

  // Filter lelang yang menang saja
  const lelangMenang = lelangList.filter(l => l.status === 'menang');

  // Filter pra-kontrak yang deal (status kontrak) saja
  const praKontrakDeal = praKontrakList.filter(p => p.status === 'kontrak');

  return (
    <MainLayout title="Pekerjaan / Project Execution">
      <div className="space-y-6">
        {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Kelola proyek yang sedang berjalan
          </p>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pekerjaan
          </Button>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Pekerjaan</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari pekerjaan..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-0">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
              <DialogTitle className="text-lg sm:text-xl">
                {viewMode ? 'Detail Pekerjaan' : selectedItem ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop View - Tab List */}
              <div className="hidden lg:block px-4 sm:px-6 border-b">
                <TabsList className="w-full grid grid-cols-5 gap-1 bg-transparent h-auto p-0">
                  <TabsTrigger
                    value="info"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                  >
                    Informasi
                  </TabsTrigger>
                  <TabsTrigger
                    value="dokumen"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                  >
                    Dokumen
                  </TabsTrigger>
                  <TabsTrigger
                    value="tim"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                  >
                    Tim
                  </TabsTrigger>
                  <TabsTrigger
                    value="tahapan"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                  >
                    Tahapan
                  </TabsTrigger>
                  <TabsTrigger
                    value="anggaran"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2"
                  >
                    Anggaran
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mobile/Tablet View - Dropdown */}
              <div className="lg:hidden px-4 sm:px-6 py-3 border-b bg-muted/30">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Navigasi</Label>
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue>
                      {activeTab === 'info' && 'Informasi'}
                      {activeTab === 'dokumen' && 'Dokumen'}
                      {activeTab === 'tim' && 'Tim'}
                      {activeTab === 'tahapan' && 'Tahapan'}
                      {activeTab === 'anggaran' && 'Anggaran'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <span>Informasi</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dokumen">
                      <div className="flex items-center gap-2">
                        <span>Dokumen</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tim">
                      <div className="flex items-center gap-2">
                        <span>Tim</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="tahapan">
                      <div className="flex items-center gap-2">
                        <span>Tahapan</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="anggaran">
                      <div className="flex items-center gap-2">
                        <span>Anggaran</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit}>
                <TabsContent value="info" className="space-y-4 px-4 sm:px-6 py-4">
                  {/* Pilih Source Project - Hanya tampil saat create */}
                  {!selectedItem && !viewMode && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Load dari Project Sebelumnya</h3>
                      </div>
                      <p className="text-sm text-blue-700">
                        Pilih project lelang yang menang atau non-lelang yang sudah deal untuk mengisi data otomatis
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Project Lelang (Menang)</Label>
                          <Select
                            value={formData.sourceType === 'lelang' ? formData.sourceId : ''}
                            onValueChange={(value) => handleLoadFromSource('lelang', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih project lelang" />
                            </SelectTrigger>
                            <SelectContent>
                              {lelangMenang.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Tidak ada lelang yang menang
                                </SelectItem>
                              ) : (
                                lelangMenang.map((l) => (
                                  <SelectItem key={l.id} value={l.id}>
                                    {l.namaLelang} - {l.instansi}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Project Non-Lelang (Kontrak)</Label>
                          <Select
                            value={formData.sourceType === 'non-lelang' ? formData.sourceId : ''}
                            onValueChange={(value) => handleLoadFromSource('non-lelang', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih project non-lelang" />
                            </SelectTrigger>
                            <SelectContent>
                              {praKontrakDeal.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Tidak ada non-lelang yang deal
                                </SelectItem>
                              ) : (
                                praKontrakDeal.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.namaProyek} - {p.klien}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {formData.sourceType && formData.sourceType !== 'manual' && (
                        <div className="flex items-center gap-2 text-sm text-[#416F39] bg-[#E8F2E6] p-2 rounded border border-[#416F39]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            Data dimuat dari {formData.sourceType === 'lelang' ? 'Lelang' : 'Non-Lelang'}:
                            {' '}<strong>
                              {formData.sourceType === 'lelang'
                                ? lelangList.find(l => l.id === formData.sourceId)?.namaLelang
                                : praKontrakList.find(p => p.id === formData.sourceId)?.namaProyek}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info Source saat View/Edit */}
                  {/* {(selectedItem || viewMode) && formData.sourceType && formData.sourceType !== 'manual' && (
                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700">
                          Sumber: <strong>
                            {formData.sourceType === 'lelang'
                              ? `Lelang - ${lelangList.find(l => l.id === formData.sourceId)?.namaLelang || 'Unknown'}`
                              : `Non-Lelang - ${praKontrakList.find(p => p.id === formData.sourceId)?.namaProyek || 'Unknown'}`}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )} */}

                  {/* {formData.tahapan.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-blue-900">Progress Proyek (Berdasarkan Bobot)</h3>
                        <span className="text-2xl font-bold text-blue-700">
                          {calculateWeightedProgress().toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={calculateWeightedProgress()} className="h-3 mb-2" />
                      <p className="text-xs text-blue-700 mt-2">
                        Progress dihitung dari total bobot tahapan yang berstatus "Selesai"
                      </p>
                    </div>
                  )} */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nomorKontrak">Nomor Kontrak</Label>
                      <Input
                        id="nomorKontrak"
                        value={formData.nomorKontrak}
                        onChange={(e) => setFormData({ ...formData, nomorKontrak: e.target.value })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: string) => setFormData({ ...formData, status: value as FormData['status'] })}
                        disabled={viewMode}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persiapan">Persiapan</SelectItem>
                          <SelectItem value="berjalan">Berjalan</SelectItem>
                          <SelectItem value="selesai">Selesai</SelectItem>
                          <SelectItem value="serah_terima">Serah Terima</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tenderType">Jenis Tender</Label>
                      <Select
                        value={formData.tenderType}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            tenderType: value as FormData['tenderType'],
                          })
                        }
                        disabled={viewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis tender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lelang">Lelang</SelectItem>
                          <SelectItem value="non-lelang">Non Lelang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="namaProyek">Nama Proyek</Label>
                      <Input
                        id="namaProyek"
                        value={formData.namaProyek}
                        onChange={(e) => setFormData({ ...formData, namaProyek: e.target.value })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="klien">Klien</Label>
                      <Input
                        id="klien"
                        value={formData.klien}
                        onChange={(e) => setFormData({ ...formData, klien: e.target.value })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="nilaiKontrak">Nilai Kontrak</Label>
                      <Input
                        id="nilaiKontrak"
                        type="number"
                        value={formData.nilaiKontrak}
                        onChange={(e) => setFormData({ ...formData, nilaiKontrak: Number(e.target.value) })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="pic">PIC</Label>
                      <Input
                        id="pic"
                        value={formData.pic}
                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                      <Input
                        id="tanggalMulai"
                        type="date"
                        value={formatDateInput(formData.tanggalMulai)}
                        onChange={(e) => setFormData({ ...formData, tanggalMulai: new Date(e.target.value) })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
                      <Input
                        id="tanggalSelesai"
                        type="date"
                        value={formatDateInput(formData.tanggalSelesai)}
                        onChange={(e) => setFormData({ ...formData, tanggalSelesai: new Date(e.target.value) })}
                        disabled={viewMode}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Dokumen - Tabel Format */}
                <TabsContent value="dokumen" className="space-y-6 px-4 sm:px-6 py-4">
                  {(() => {
                    const hasLelangDocs = formData.sourceType === 'lelang' && formData.dokumenLelang && (
                      (formData.dokumenLelang.dokumenTender?.length || 0) > 0 ||
                      (formData.dokumenLelang.dokumenAdministrasi?.length || 0) > 0 ||
                      (formData.dokumenLelang.dokumenTeknis?.length || 0) > 0 ||
                      (formData.dokumenLelang.dokumenPenawaran?.length || 0) > 0
                    );
                    const hasNonLelangDocs = formData.sourceType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0;
                    const hasSPKDocs = formData.dokumenSPK && formData.dokumenSPK.length > 0;
                    const hasInvoiceDocs = formData.dokumenInvoice && formData.dokumenInvoice.length > 0;
                    const hasDocs = hasLelangDocs || hasNonLelangDocs || hasSPKDocs || hasInvoiceDocs;

                    if (!hasDocs) {
                      return (
                        <div className="flex items-center justify-center min-h-[400px]">
                          <div className="text-center space-y-3">
                            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <FileText className="h-10 w-10 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-700">Tidak Ada Dokumen</h3>
                              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                {formData.sourceType === 'manual'
                                  ? 'Pekerjaan ini dibuat manual tanpa dokumen referensi'
                                  : 'Belum ada dokumen yang tersedia untuk proyek ini'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {/* Header Info */}
                        {/* {formData.sourceType !== 'manual' && (
                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-white rounded-xl shadow-sm">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">Dokumen Proyek</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {formData.namaProyek} • {formData.klien}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge className={formData.sourceType === 'lelang' ? 'bg-[#416F39]' : 'bg-[#2F5F8C]'}>
                                    {formData.sourceType === 'lelang' ? '🏆 Menang Lelang' : '🤝 Non-Lelang'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formData.sourceType === 'lelang' 
                                      ? `${(formData.dokumenLelang?.dokumenTender?.length || 0) + 
                                          (formData.dokumenLelang?.dokumenAdministrasi?.length || 0) + 
                                          (formData.dokumenLelang?.dokumenTeknis?.length || 0) + 
                                          (formData.dokumenLelang?.dokumenPenawaran?.length || 0)} dokumen`
                                      : `${formData.dokumenNonLelang?.length || 0} dokumen`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )} */}

                        {/* Dokumen Lelang - Format Tabel */}
                        {formData.sourceType === 'lelang' && formData.dokumenLelang && (
                          <div className="space-y-6">
                            {/* Dokumen Tender */}
                            {formData.dokumenLelang.dokumenTender && formData.dokumenLelang.dokumenTender.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-[#D4E4F0] rounded-lg">
                                    <FileText className="h-5 w-5 text-[#2F5F8C]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">Dokumen Tender</h4>
                                    <p className="text-xs text-gray-500 truncate">Persyaratan dan spesifikasi tender</p>
                                  </div>
                                  <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                    {formData.dokumenLelang.dokumenTender.length}
                                  </Badge>
                                </div>
                                <div className="rounded-lg border overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-[#E8F0F7]">
                                      <tr>
                                        <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                        <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                        <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {formData.dokumenLelang.dokumenTender.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                          <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2F5F8C] flex-shrink-0" />
                                              <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                            </div>
                                          </td>
                                          <td className="p-2 sm:p-3 text-center">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                              onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                            >
                                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Dokumen Administrasi */}
                            {formData.dokumenLelang.dokumenAdministrasi && formData.dokumenLelang.dokumenAdministrasi.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                  <div className="p-1.5 sm:p-2 bg-[#D8E9D5] rounded-lg">
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#416F39]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm sm:text-base text-gray-900">Dokumen Administrasi</h4>
                                    <p className="text-xs text-gray-500 truncate">Kelengkapan administrasi perusahaan</p>
                                  </div>
                                  <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                    {formData.dokumenLelang.dokumenAdministrasi.length}
                                  </Badge>
                                </div>
                                <div className="rounded-lg border overflow-x-auto">
                                  <table className="w-full min-w-[500px]">
                                    <thead className="bg-[#E8F2E6]">
                                      <tr>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                                        <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {formData.dokumenLelang.dokumenAdministrasi.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                          <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#416F39] flex-shrink-0" />
                                              <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                            </div>
                                          </td>
                                          <td className="p-2 sm:p-3 text-center">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                              onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                            >
                                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Dokumen Teknis */}
                            {formData.dokumenLelang.dokumenTeknis && formData.dokumenLelang.dokumenTeknis.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-[#FFE8D1] rounded-lg">
                                    <FileText className="h-5 w-5 text-[#A67039]" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">Dokumen Teknis</h4>
                                    <p className="text-xs text-gray-500">Spesifikasi teknis dan gambar kerja</p>
                                  </div>
                                  <Badge variant="secondary" className="ml-auto">
                                    {formData.dokumenLelang.dokumenTeknis.length}
                                  </Badge>
                                </div>
                                <div className="rounded-lg border overflow-x-auto">
                                  <table className="w-full min-w-[500px]">
                                    <thead className="bg-[#FFF3E8]">
                                      <tr>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                                        <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {formData.dokumenLelang.dokumenTeknis.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                          <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#A67039] flex-shrink-0" />
                                              <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                            </div>
                                          </td>
                                          <td className="p-2 sm:p-3 text-center">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                              onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                            >
                                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Dokumen Penawaran */}
                            {formData.dokumenLelang.dokumenPenawaran && formData.dokumenLelang.dokumenPenawaran.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 bg-[#E8D9F0] rounded-lg">
                                    <FileText className="h-5 w-5 text-[#6F5485]" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">Dokumen Penawaran</h4>
                                    <p className="text-xs text-gray-500">Penawaran harga dan proposal</p>
                                  </div>
                                  <Badge variant="secondary" className="ml-auto">
                                    {formData.dokumenLelang.dokumenPenawaran.length}
                                  </Badge>
                                </div>
                                <div className="rounded-lg border overflow-x-auto">
                                  <table className="w-full min-w-[500px]">
                                    <thead className="bg-[#F3EBF7]">
                                      <tr>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                        <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                                        <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {formData.dokumenLelang.dokumenPenawaran.map((doc, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                          <td className="p-2 sm:p-3">
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#6F5485] flex-shrink-0" />
                                              <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                            </div>
                                          </td>
                                          <td className="p-2 sm:p-3 text-center">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                              onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                            >
                                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dokumen Non-Lelang - Format Tabel */}
                        {formData.sourceType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                              <div className="p-1.5 sm:p-2 bg-[#D4E4F0] rounded-lg">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#2F5F8C]" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Dokumen Proyek</h4>
                                <p className="text-xs text-gray-500">Proposal dan dokumen pendukung</p>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                {formData.dokumenNonLelang.length}
                              </Badge>
                            </div>
                            <div className="rounded-lg border overflow-x-auto">
                              <table className="w-full min-w-[500px]">
                                <thead className="bg-[#E8F0F7]">
                                  <tr>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                                    <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {formData.dokumenNonLelang.map((doc, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                      <td className="p-2 sm:p-3">
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#2F5F8C] flex-shrink-0" />
                                          <span className="text-xs sm:text-sm font-medium truncate">{doc}</span>
                                        </div>
                                      </td>
                                      <td className="p-2 sm:p-3 text-center">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Dokumen SPK */}
                        {!viewMode && (!formData.dokumenSPK || formData.dokumenSPK.length === 0) && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-[#FFF4E6] rounded-lg">
                                <FileText className="h-5 w-5 text-[#C88B4A]" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Dokumen SPK</h4>
                                <p className="text-xs text-gray-500">Surat Perintah Kerja</p>
                              </div>
                            </div>
                            <div className="p-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-sm text-gray-500 mb-4">Belum ada dokumen SPK</p>
                              <Input
                                id="spk-file-upload-initial"
                                type="file"
                                multiple
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files) return;
                                  const fileNames = Array.from(files).map(file => `uploads/spk/${Date.now()}_${file.name}`);
                                  setFormData({
                                    ...formData,
                                    dokumenSPK: [...(formData.dokumenSPK || []), ...fileNames]
                                  });
                                  toast.success(`${files.length} file SPK ditambahkan`);
                                }}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('spk-file-upload-initial')?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Dokumen SPK
                              </Button>
                            </div>
                          </div>
                        )}
                        {formData.dokumenSPK && formData.dokumenSPK.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-[#FFF4E6] rounded-lg">
                                <FileText className="h-5 w-5 text-[#C88B4A]" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Dokumen SPK</h4>
                                <p className="text-xs text-gray-500">Surat Perintah Kerja</p>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                {formData.dokumenSPK.length}
                              </Badge>
                            </div>
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[#FFF9F0]">
                                  <tr>
                                    <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                    <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                    <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {formData.dokumenSPK.map((doc, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-[#C88B4A]" />
                                          <span className="text-sm font-medium">{doc}</span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          {!viewMode && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setFormData({
                                                  ...formData,
                                                  dokumenSPK: formData.dokumenSPK?.filter((_, i) => i !== idx) || []
                                                });
                                                toast.success('Dokumen SPK dihapus');
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {!viewMode && (
                              <div className="mt-3">
                                <Input
                                  id="spk-file-upload"
                                  type="file"
                                  multiple
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files) return;
                                    const fileNames = Array.from(files).map(file => `uploads/spk/${Date.now()}_${file.name}`);
                                    setFormData({
                                      ...formData,
                                      dokumenSPK: [...(formData.dokumenSPK || []), ...fileNames]
                                    });
                                    toast.success(`${files.length} file SPK ditambahkan`);
                                  }}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-dashed hover:border-solid"
                                  onClick={() => document.getElementById('spk-file-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Dokumen SPK
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dokumen Invoice */}
                        {!viewMode && (!formData.dokumenInvoice || formData.dokumenInvoice.length === 0) && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-[#E8F5E9] rounded-lg">
                                <FileText className="h-5 w-5 text-[#4CAF50]" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Dokumen Invoice</h4>
                                <p className="text-xs text-gray-500">Invoice dan tagihan</p>
                              </div>
                            </div>
                            <div className="p-8 text-center border-2 border-dashed rounded-lg bg-gray-50">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="text-sm text-gray-500 mb-4">Belum ada dokumen Invoice</p>
                              <Input
                                id="invoice-file-upload-initial"
                                type="file"
                                multiple
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (!files) return;
                                  const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
                                  setFormData({
                                    ...formData,
                                    dokumenInvoice: [...(formData.dokumenInvoice || []), ...fileNames]
                                  });
                                  toast.success(`${files.length} file Invoice ditambahkan`);
                                }}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('invoice-file-upload-initial')?.click()}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Dokumen Invoice
                              </Button>
                            </div>
                          </div>
                        )}
                        {formData.dokumenInvoice && formData.dokumenInvoice.length > 0 && (
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-[#E8F5E9] rounded-lg">
                                <FileText className="h-5 w-5 text-[#4CAF50]" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Dokumen Invoice</h4>
                                <p className="text-xs text-gray-500">Invoice dan tagihan</p>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                {formData.dokumenInvoice.length}
                              </Badge>
                            </div>
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[#F1F8F4]">
                                  <tr>
                                    <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                    <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                    <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {formData.dokumenInvoice.map((doc, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-[#4CAF50]" />
                                          <span className="text-sm font-medium">{doc}</span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                          {!viewMode && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setFormData({
                                                  ...formData,
                                                  dokumenInvoice: formData.dokumenInvoice?.filter((_, i) => i !== idx) || []
                                                });
                                                toast.success('Dokumen Invoice dihapus');
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {!viewMode && (
                              <div className="mt-3">
                                <Input
                                  id="invoice-file-upload"
                                  type="file"
                                  multiple
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files) return;
                                    const fileNames = Array.from(files).map(file => `uploads/invoice/${Date.now()}_${file.name}`);
                                    setFormData({
                                      ...formData,
                                      dokumenInvoice: [...(formData.dokumenInvoice || []), ...fileNames]
                                    });
                                    toast.success(`${files.length} file Invoice ditambahkan`);
                                  }}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-dashed hover:border-solid"
                                  onClick={() => document.getElementById('invoice-file-upload')?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Dokumen Invoice
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </TabsContent>

                {/* Tab TIM - Format Tabel Tanpa Circle dan Status */}
                <TabsContent value="tim" className="space-y-3 px-4 sm:px-6 py-4">
                  <h3 className="font-semibold text-sm border-b pb-2">
                    Tim Proyek
                  </h3>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {formData.tim.length > 0
                          ? `${formData.tim.length} tenaga ahli terpilih`
                          : "Pilih tenaga ahli untuk proyek ini"}
                      </p>
                    </div>
                  </div>

                  {tenagaAhliList.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg">
                      Belum ada data tenaga ahli
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-[350px] overflow-x-auto overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            {!viewMode && (
                              <th className="text-center p-3 text-sm font-medium w-12"></th>
                            )}
                            <th className="text-left p-3 text-sm font-medium">Nama</th>
                            <th className="text-left p-3 text-sm font-medium">Jabatan</th>
                            <th className="text-left p-3 text-sm font-medium">Keahlian</th>
                            <th className="text-left p-3 text-sm font-medium">Sertifikat</th>
                          </tr>
                        </thead>

                        <tbody>
                          {tenagaAhliList.map((ta) => {
                            const isSelected = formData.tim.includes(ta.id);

                            return (
                              <tr
                                key={ta.id}
                                className={`border-t hover:bg-muted/50 ${isSelected ? "bg-blue-50/50" : ""
                                  } ${!viewMode ? "cursor-pointer" : ""}`}
                                onClick={() => {
                                  if (viewMode) return;
                                  setFormData({
                                    ...formData,
                                    tim: isSelected
                                      ? formData.tim.filter((id) => id !== ta.id)
                                      : [...formData.tim, ta.id],
                                  });
                                }}
                              >
                                {!viewMode && (
                                  <td className="p-3 text-center">
                                    {isSelected ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </td>
                                )}

                                <td className="p-3 text-sm font-medium">
                                  {ta.nama}
                                </td>

                                <td className="p-3 text-sm">
                                  {ta.jabatan}
                                </td>

                                <td className="p-3 text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {ta.keahlian &&
                                      ta.keahlian.slice(0, 2).map((skill, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-2 py-0.5 rounded-full border"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {ta.keahlian && ta.keahlian.length > 2 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full border">
                                        +{ta.keahlian.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-3 text-sm text-muted-foreground">
                                  {ta.sertifikat && ta.sertifikat.length > 0
                                    ? `${ta.sertifikat.length} sertifikat`
                                    : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>


                {/* Tab TAHAPAN - Timeline Infografis */}
                <TabsContent value="tahapan" className="space-y-4 px-4 sm:px-6 py-4">
                  {!viewMode && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Total Bobot Tahapan</p>
                          <p className="text-xs text-blue-700">Pastikan total bobot semua tahapan = 100%</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${Math.abs(totalBobot - 100) < 0.01 ? 'text-[#416F39]' : 'text-[#C88B4A]'
                            }`}>
                            {totalBobot.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sisa: {sisaBobot.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 p-3 sm:p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                          <Input
                            placeholder="Nama Tahapan"
                            value={newTahapan.nama}
                            onChange={(e) => setNewTahapan({ ...newTahapan, nama: e.target.value })}
                          />
                          <Input
                            type="number"
                            placeholder="Bobot %"
                            min="0"
                            max="100"
                            step="0.1"
                            value={newTahapan.bobot || ''}
                            onChange={(e) => setNewTahapan({ ...newTahapan, bobot: Number(e.target.value) })}
                          />
                          <Input
                            type="date"
                            value={formatDateInput(newTahapan.tanggalMulai)}
                            onChange={(e) => setNewTahapan({ ...newTahapan, tanggalMulai: new Date(e.target.value) })}
                          />
                          <Input
                            type="date"
                            value={formatDateInput(newTahapan.tanggalSelesai)}
                            onChange={(e) => setNewTahapan({ ...newTahapan, tanggalSelesai: new Date(e.target.value) })}
                          />
                          <Select
                            value={newTahapan.status}
                            onValueChange={(v: any) => setNewTahapan({ ...newTahapan, status: v as TahapanKerja['status'] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="progress">Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" onClick={handleAddTahapan}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Upload Bukti Tahapan (Multiple Files)</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="tahapan-file-upload"
                              type="file"
                              multiple
                              onChange={handleTahapanFileUpload}
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('tahapan-file-upload')?.click()}>
                              <Upload className="h-4 w-4 mr-2" />
                              Pilih File
                            </Button>
                          </div>
                          {newTahapan.files && newTahapan.files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {newTahapan.files.map((file, idx) => {
                                const FileIcon = getFileIcon(file);
                                const fileColor = getFileColor(file);
                                return (
                                  <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md border">
                                    <FileIcon className={`h-3 w-3 ${fileColor}`} />
                                    <span className="text-xs">{file.split('/').pop()}</span>
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                                      onClick={() => removeTahapanFile(file)}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Timeline Tahapan - Vertical Timeline Style */}
                  <div className="space-y-4">
                    {formData.tahapan.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>Belum ada tahapan yang ditambahkan</p>
                      </div>
                    ) : (
                      <>
                        {/* Progress Summary */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Progress Keseluruhan</h3>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {formData.tahapan.filter(t => t.status === 'done').length} dari {formData.tahapan.length} tahapan selesai
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-xl sm:text-2xl font-bold text-[#416F39]">
                                {calculateWeightedProgress().toFixed(0)}%
                              </div>
                              <p className="text-xs text-gray-500">Progress Total</p>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#5B8DB8] to-[#416F39] transition-all duration-500 rounded-full"
                                style={{ width: `${calculateWeightedProgress()}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Vertical Timeline */}
                        <div className="relative">
                          {/* Vertical Line */}
                          <div className="absolute left-[30px] sm:left-[44px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-[#5B8DB8] to-[#416F39]"></div>

                          {/* Timeline Items */}
                          <div className="space-y-6">
                            {formData.tahapan.map((t, idx) => {
                              // Check if overdue
                              const today = new Date();
                              const deadline = new Date(t.tanggalSelesai);
                              const isOverdue = t.status !== 'done' && deadline < today;

                              const statusConfig = {
                                pending: {
                                  icon: Circle,
                                  dotColor: 'bg-gray-400',
                                  cardBg: 'bg-gray-50',
                                  cardBorder: 'border-gray-300',
                                  titleColor: 'text-gray-700',
                                  badgeBg: 'bg-gray-100',
                                  badgeText: 'text-gray-700',
                                  yearBg: 'bg-gray-100',
                                  yearBorder: 'border-gray-300',
                                  yearText: 'text-gray-700'
                                },
                                progress: {
                                  icon: Circle,
                                  dotColor: 'bg-[#5B8DB8]',
                                  cardBg: 'bg-blue-50',
                                  cardBorder: 'border-[#5B8DB8]',
                                  titleColor: 'text-[#2F5F8C]',
                                  badgeBg: 'bg-[#5B8DB8]',
                                  badgeText: 'text-white',
                                  yearBg: 'bg-blue-100',
                                  yearBorder: 'border-[#5B8DB8]',
                                  yearText: 'text-[#2F5F8C]'
                                },
                                done: {
                                  icon: CheckCircle2,
                                  dotColor: 'bg-[#416F39]',
                                  cardBg: 'bg-green-50',
                                  cardBorder: 'border-[#416F39]',
                                  titleColor: 'text-[#416F39]',
                                  badgeBg: 'bg-[#416F39]',
                                  badgeText: 'text-white',
                                  yearBg: 'bg-green-100',
                                  yearBorder: 'border-[#416F39]',
                                  yearText: 'text-[#416F39]'
                                },
                                overdue: {
                                  icon: AlertCircle,
                                  dotColor: 'bg-red-500',
                                  cardBg: 'bg-red-50',
                                  cardBorder: 'border-red-400',
                                  titleColor: 'text-red-700',
                                  badgeBg: 'bg-red-500',
                                  badgeText: 'text-white',
                                  yearBg: 'bg-red-100',
                                  yearBorder: 'border-red-400',
                                  yearText: 'text-red-700'
                                }
                              };
                              const config = isOverdue ? statusConfig.overdue : statusConfig[t.status];
                              const StatusIcon = config.icon;

                              return (
                                <div key={t.id} className="relative flex gap-2 sm:gap-4">
                                  {/* Left: Number Box */}
                                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className={`w-[60px] sm:w-[88px] h-10 sm:h-12 ${config.yearBg} ${config.yearBorder} border-2 rounded-lg flex items-center justify-center shadow-sm`}>
                                      <span className={`text-lg sm:text-xl font-bold ${config.yearText}`}>
                                        {idx + 1}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Content Card */}
                                  <div className="flex-1 min-w-0">
                                    <div className={`${config.cardBg} border-2 ${config.cardBorder} rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all`}>
                                      {/* Header */}
                                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3 mb-3">
                                        <div className="flex-1 min-w-0 w-full">
                                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h4 className={`font-bold ${config.titleColor} text-sm sm:text-base truncate`}>{t.nama}</h4>
                                            <span className={`px-2.5 py-1 ${config.badgeBg} ${config.badgeText} rounded-full text-xs font-semibold flex items-center gap-1`}>
                                              {isOverdue && <AlertTriangle className="h-3.5 w-3.5" />}
                                              {!isOverdue && t.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                                              {!isOverdue && t.status === 'progress' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                              {!isOverdue && t.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                              {isOverdue ? 'Terlambat' : t.status === 'pending' ? 'Pending' : t.status === 'progress' ? 'In Progress' : 'Selesai'}
                                            </span>

                                          </div>
                                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                              <span className="font-semibold">Bobot:</span> {t.bobot}%
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                                              <span className="truncate">{formatDate(t.tanggalMulai)}</span>
                                            </span>

                                            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                                              <Flag className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`} />
                                              <span className="truncate">{formatDate(t.tanggalSelesai)}{isOverdue && ' (Terlewat)'}</span>
                                            </span>

                                          </div>
                                        </div>

                                        {/* Actions */}
                                        {!viewMode && (
                                          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                                            <Select
                                              value={t.status}
                                              onValueChange={(v: any) => {
                                                const newTahapan = [...formData.tahapan];
                                                newTahapan[idx].status = v as TahapanKerja['status'];
                                                setFormData({ ...formData, tahapan: newTahapan });
                                              }}
                                            >
                                              <SelectTrigger className="h-7 sm:h-8 text-xs w-full sm:w-32">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="pending">⏳ Pending</SelectItem>
                                                <SelectItem value="progress">🔄 In Progress</SelectItem>
                                                <SelectItem value="done">✅ Selesai</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                                              onClick={() => setFormData({
                                                ...formData,
                                                tahapan: formData.tahapan.filter((_, i) => i !== idx)
                                              })}
                                            >
                                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Files Section */}
                                      {t.files && t.files.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5 sm:gap-2">
                                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            Dokumen ({t.files.length})
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {t.files.map((file, fileIdx) => {
                                              const FileIcon = getFileIcon(file);
                                              const fileColor = getFileColor(file);
                                              const fileName = file.split('/').pop() || '';
                                              return (
                                                <div key={fileIdx} className="group flex items-center justify-between gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
                                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <FileIcon className={`h-4 w-4 ${fileColor} flex-shrink-0`} />
                                                    <span className="text-xs font-medium text-gray-700 truncate">
                                                      {fileName}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Button
                                                      type="button"
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      onClick={() => handleDownloadFile(file)}
                                                      title="Download"
                                                    >
                                                      <Download className="h-3.5 w-3.5 text-[#2F5F8C]" />
                                                    </Button>
                                                    {!viewMode && (
                                                      <button
                                                        type="button"
                                                        className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeExistingTahapanFile(idx, file)}
                                                        title="Hapus"
                                                      >
                                                        <X className="h-3.5 w-3.5 text-red-500 hover:text-red-700" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Upload Button */}
                                      {!viewMode && (
                                        <div className="mt-3">
                                          <Input
                                            id={`tahapan-file-${idx}`}
                                            type="file"
                                            multiple
                                            onChange={(e) => handleExistingTahapanFileUpload(idx, e)}
                                            className="hidden"
                                          />
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-xs border-dashed hover:border-solid"
                                            onClick={() => document.getElementById(`tahapan-file-${idx}`)?.click()}
                                          >
                                            <Upload className="h-3.5 w-3.5 mr-2" />
                                            Upload Dokumen
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* MODIFIED: Tab Anggaran dengan pengelompokan berdasarkan tahapan */}
                <TabsContent value="anggaran" className="space-y-4 px-4 sm:px-6 py-4">
                  {formData.tahapan.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">⚠️ Tambahkan Tahapan terlebih dahulu sebelum menambahkan anggaran.</p>
                    </div>
                  )}
                  {!viewMode && formData.tahapan.length > 0 && (
                    <div className="space-y-3 p-3 sm:p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                        <Select
                          value={newAnggaran.tahapanId}
                          onValueChange={(v) => setNewAnggaran({ ...newAnggaran, tahapanId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Tahapan" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.tahapan.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Kategori"
                          value={newAnggaran.kategori}
                          onChange={(e) => setNewAnggaran({ ...newAnggaran, kategori: e.target.value })}
                        />
                        <Input
                          placeholder="Deskripsi"
                          value={newAnggaran.deskripsi}
                          onChange={(e) => setNewAnggaran({ ...newAnggaran, deskripsi: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="Jumlah"
                          value={newAnggaran.jumlah || ''}
                          onChange={(e) => setNewAnggaran({ ...newAnggaran, jumlah: Number(e.target.value) })}
                        />
                        <Input
                          type="number"
                          placeholder="Realisasi"
                          value={newAnggaran.realisasi || ''}
                          onChange={(e) => setNewAnggaran({ ...newAnggaran, realisasi: Number(e.target.value) })}
                        />
                        <Button type="button" onClick={handleAddAnggaran}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Upload Bukti Anggaran (Multiple Files)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="anggaran-file-upload"
                            type="file"
                            multiple
                            onChange={handleAnggaranFileUpload}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('anggaran-file-upload')?.click()}>
                            <Upload className="h-4 w-4 mr-2" />
                            Pilih File
                          </Button>
                        </div>
                        {newAnggaran.files && newAnggaran.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newAnggaran.files.map((file, idx) => {
                              const FileIcon = getFileIcon(file);
                              const fileColor = getFileColor(file);
                              return (
                                <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-md border">
                                  <FileIcon className={`h-3 w-3 ${fileColor}`} />
                                  <span className="text-xs">{file.split('/').pop()}</span>
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                                    onClick={() => removeAnggaranFile(file)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODIFIED: Tampilan anggaran dalam format tabel dikelompokkan per tahapan */}
                  <div className="space-y-6">
                    {formData.tahapan.map((tahapan) => {
                      const anggaranTahapan = formData.anggaran.filter(a => a.tahapanId === tahapan.id);
                      const totalTahapan = anggaranTahapan.reduce((sum, a) => sum + a.jumlah, 0);
                      const realisasiTahapan = anggaranTahapan.reduce((sum, a) => sum + a.realisasi, 0);

                      return (
                        <div key={tahapan.id} className="space-y-3">
                          {/* Header Tahapan */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{tahapan.nama}</h3>
                                  <StatusBadge status={tahapan.status} />
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {anggaranTahapan.length} item anggaran
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto">
                              <div className="text-xs sm:text-sm text-gray-600">
                                <span className="font-semibold">Total:</span> {formatCurrency(totalTahapan)}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                <span className="font-semibold">Realisasi:</span> {formatCurrency(realisasiTahapan)}
                              </div>
                            </div>
                          </div>

                          {/* Tabel Anggaran */}
                          {anggaranTahapan.length === 0 ? (
                            <div className="p-8 text-center border rounded-lg bg-gray-50">
                              <p className="text-sm text-gray-500 italic">Belum ada anggaran untuk tahapan ini</p>
                            </div>
                          ) : (
                            <div className="rounded-lg border overflow-x-auto">
                              <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Kategori</th>
                                    <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm hidden lg:table-cell">Deskripsi</th>
                                    <th className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Anggaran</th>
                                    <th className="p-2 sm:p-3 text-right font-semibold text-xs sm:text-sm w-24 sm:w-32">Realisasi</th>
                                    <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-24 sm:w-32">Dokumen</th>
                                    {!viewMode && <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>}
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {anggaranTahapan.map((a, idx) => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                      <td className="p-2 sm:p-3">
                                        <span className="text-xs sm:text-sm font-medium text-gray-900">{a.kategori}</span>
                                      </td>
                                      <td className="p-2 sm:p-3 hidden lg:table-cell">
                                        <span className="text-xs sm:text-sm text-gray-600">{a.deskripsi}</span>
                                      </td>
                                      <td className="p-2 sm:p-3 text-right">
                                        <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(a.jumlah)}</span>
                                      </td>
                                      <td className="p-2 sm:p-3 text-right">
                                        <span className="text-xs sm:text-sm font-semibold text-emerald-600 whitespace-nowrap">{formatCurrency(a.realisasi)}</span>
                                      </td>
                                      <td className="p-2 sm:p-3">
                                        <div className="flex items-center justify-center gap-2">
                                          {/* Show file count */}
                                          {a.files && a.files.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary" className="text-xs">
                                                {a.files.length} file
                                              </Badge>
                                              {/* Download all files */}
                                              {a.files.map((file, fileIdx) => {
                                                const FileIcon = getFileIcon(file);
                                                const fileColor = getFileColor(file);
                                                return (
                                                  <Button
                                                    key={fileIdx}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                                    onClick={() => handleDownloadFile(file)}
                                                    title={file.split('/').pop()}
                                                  >
                                                    <FileIcon className={`h-3 w-3 sm:h-4 sm:w-4 ${fileColor}`} />
                                                  </Button>
                                                );
                                              })}
                                              {!viewMode && (
                                                <>
                                                  <Input
                                                    id={`anggaran-file-${a.id}`}
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => handleExistingAnggaranFileUpload(a.id, e)}
                                                    className="hidden"
                                                  />
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                                    onClick={() => document.getElementById(`anggaran-file-${a.id}`)?.click()}
                                                    title="Upload dokumen"
                                                  >
                                                    <Upload className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                                                  </Button>
                                                </>
                                              )}
                                            </div>
                                          ) : (
                                            !viewMode && (
                                              <>
                                                <Input
                                                  id={`anggaran-file-${a.id}`}
                                                  type="file"
                                                  multiple
                                                  onChange={(e) => handleExistingAnggaranFileUpload(a.id, e)}
                                                  className="hidden"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-6 sm:h-7 text-xs"
                                                  onClick={() => document.getElementById(`anggaran-file-${a.id}`)?.click()}
                                                >
                                                  <Upload className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                                  Upload
                                                </Button>
                                              </>
                                            )
                                          )}
                                        </div>
                                      </td>
                                      {!viewMode && (
                                        <td className="p-2 sm:p-3 text-center">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setFormData({
                                              ...formData,
                                              anggaran: formData.anggaran.filter((item) => item.id !== a.id)
                                            })}
                                          >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                          </Button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 sm:p-4 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Total Anggaran:</span>
                      <span className="font-bold">{formatCurrency(totalAnggaran)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Total Realisasi:</span>
                      <span className="font-bold">{formatCurrency(totalRealisasi)}</span>
                    </div>
                  </div>
                </TabsContent>

                {!viewMode && (
                  <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-muted/30">
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {selectedItem ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                  </div>
                )}
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Hapus Pekerjaan"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaProyek}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
