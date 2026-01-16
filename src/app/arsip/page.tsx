"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable } from '@/components/DataTable';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Eye, Archive, Download, FileText, CheckCircle2, FolderArchive, FileCheck, Award, Calendar, DollarSign, Users, Circle, AlertCircle, X, Upload, FileImage, File, FileSpreadsheet, Flag } from 'lucide-react';
import { useArsipStore } from '@/stores/arsipStore';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { ArsipPekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { TenderBadge } from '@/components/TenderBadge';

type FormData = Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
  tim?: string[];
  tahapan?: TahapanKerja[];
  anggaran?: AnggaranItem[];
  tenderType?: 'lelang' | 'non-lelang';
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
  pekerjaanId: '',
  namaProyek: '',
  klien: '',
  nilaiKontrak: 0,
  tanggalSelesai: new Date(),
  dokumenArsip: [],
  catatan: '',
  tim: [],
  tahapan: [],
  anggaran: [],
  tenderType: 'lelang',
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

export default function ArsipPage() {
  const { items, fetchItems, addItem, deleteItem } = useArsipStore();
  const { items: pekerjaanList, fetchItems: fetchPekerjaan } = usePekerjaanStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArsipPekerjaan | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchItems();
    fetchPekerjaan();
    fetchTenagaAhli();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  // Generate dummy data untuk tim, tahapan, dan anggaran
  const generateDummyData = (item: ArsipPekerjaan) => {
    // Dummy Tim - ambil 2-3 tenaga ahli pertama jika ada
    const dummyTim = tenagaAhliList.slice(0, Math.min(3, tenagaAhliList.length)).map(ta => ta.id);

    // Dummy Tahapan
    const dummyTahapan: TahapanKerja[] = [
      {
        id: '1',
        nama: 'Persiapan dan Mobilisasi',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 6)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 5)),
        status: 'done',
        bobot: 15,
        files: [
          `uploads/tahapan/Laporan_Mobilisasi_${item.namaProyek.substring(0, 10)}.pdf`,
          `uploads/tahapan/Dokumentasi_Persiapan.jpg`,
        ]
      },
      {
        id: '2',
        nama: 'Pelaksanaan Pekerjaan Utama',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 5)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 2)),
        status: 'done',
        bobot: 50,
        files: [
          `uploads/tahapan/Progress_Report_Week_1-12.pdf`,
          `uploads/tahapan/Foto_Pelaksanaan.jpg`,
          `uploads/tahapan/Quality_Control_Check.xlsx`,
        ]
      },
      {
        id: '3',
        nama: 'Finishing dan Quality Control',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 2)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        status: 'done',
        bobot: 20,
        files: [
          `uploads/tahapan/Quality_Control_Report.pdf`,
          `uploads/tahapan/Finishing_Photos.jpg`,
        ]
      },
      {
        id: '4',
        nama: 'Serah Terima dan Dokumentasi',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        tanggalSelesai: new Date(item.tanggalSelesai),
        status: 'done',
        bobot: 15,
        files: [
          `uploads/tahapan/BAST_${item.namaProyek.substring(0, 10)}.pdf`,
          `uploads/tahapan/Dokumentasi_Serah_Terima.pdf`,
          `uploads/tahapan/As_Built_Drawing.dwg`,
        ]
      },
    ];

    // Dummy Anggaran
    const dummyAnggaran: AnggaranItem[] = [
      {
        id: '1',
        tahapanId: '1',
        kategori: 'Mobilisasi',
        deskripsi: 'Biaya mobilisasi peralatan dan personel',
        jumlah: item.nilaiKontrak * 0.08,
        realisasi: item.nilaiKontrak * 0.08,
        files: [
          `uploads/anggaran/Invoice_Mobilisasi.pdf`,
          `uploads/anggaran/Bukti_Transfer.jpg`,
        ]
      },
      {
        id: '2',
        tahapanId: '1',
        kategori: 'Setup Kantor Lapangan',
        deskripsi: 'Pembangunan dan setup kantor proyek',
        jumlah: item.nilaiKontrak * 0.05,
        realisasi: item.nilaiKontrak * 0.05,
        files: [
          `uploads/anggaran/Bukti_Setup_Kantor.pdf`,
        ]
      },
      {
        id: '3',
        tahapanId: '2',
        kategori: 'Material Utama',
        deskripsi: 'Pengadaan material konstruksi utama',
        jumlah: item.nilaiKontrak * 0.35,
        realisasi: item.nilaiKontrak * 0.35,
        files: [
          `uploads/anggaran/PO_Material.pdf`,
          `uploads/anggaran/Delivery_Note.pdf`,
          `uploads/anggaran/Invoice_Material.pdf`,
        ]
      },
      {
        id: '4',
        tahapanId: '2',
        kategori: 'Upah Tenaga Kerja',
        deskripsi: 'Biaya tenaga kerja pelaksanaan',
        jumlah: item.nilaiKontrak * 0.25,
        realisasi: item.nilaiKontrak * 0.25,
        files: [
          `uploads/anggaran/Daftar_Hadir.xlsx`,
          `uploads/anggaran/Slip_Gaji.pdf`,
        ]
      },
      {
        id: '5',
        tahapanId: '3',
        kategori: 'Material Finishing',
        deskripsi: 'Material finishing dan aksesoris',
        jumlah: item.nilaiKontrak * 0.12,
        realisasi: item.nilaiKontrak * 0.12,
        files: [
          `uploads/anggaran/Invoice_Finishing.pdf`,
        ]
      },
      {
        id: '6',
        tahapanId: '3',
        kategori: 'Quality Testing',
        deskripsi: 'Biaya testing dan quality control',
        jumlah: item.nilaiKontrak * 0.06,
        realisasi: item.nilaiKontrak * 0.06,
        files: [
          `uploads/anggaran/Lab_Test_Invoice.pdf`,
          `uploads/anggaran/Test_Results.pdf`,
        ]
      },
      {
        id: '7',
        tahapanId: '4',
        kategori: 'Dokumentasi',
        deskripsi: 'Biaya pembuatan as-built drawing dan dokumentasi',
        jumlah: item.nilaiKontrak * 0.04,
        realisasi: item.nilaiKontrak * 0.04,
        files: [
          `uploads/anggaran/Invoice_Documentation.pdf`,
        ]
      },
      {
        id: '8',
        tahapanId: '4',
        kategori: 'Administrasi Serah Terima',
        deskripsi: 'Biaya administrasi dan pengurusan BAST',
        jumlah: item.nilaiKontrak * 0.05,
        realisasi: item.nilaiKontrak * 0.05,
        files: [
          `uploads/anggaran/Biaya_Admin_BAST.pdf`,
        ]
      },
    ];

    return { dummyTim, dummyTahapan, dummyAnggaran };
  };

  const handleView = (item: ArsipPekerjaan) => {
    setSelectedItem(item);

    // Cast item ke any untuk akses properti tambahan
    const itemData = item as any;
    const actualTenderType = itemData.tenderType || 'lelang';

    // Generate dummy data
    const { dummyTim, dummyTahapan, dummyAnggaran } = generateDummyData(item);

    setFormData({
      pekerjaanId: item.pekerjaanId,
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiKontrak: item.nilaiKontrak,
      tanggalSelesai: new Date(item.tanggalSelesai),
      dokumenArsip: item.dokumenArsip,
      catatan: item.catatan,
      tim: itemData.tim || dummyTim,
      tahapan: itemData.tahapan || dummyTahapan,
      anggaran: itemData.anggaran || dummyAnggaran,
      tenderType: actualTenderType,
      // Generate dokumen dummy untuk demo
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
        `SPK_${itemData.pekerjaanId || 'UNKNOWN'}_${item.namaProyek.substring(0, 10)}.pdf`,
        `SPK_Adendum_01_${itemData.pekerjaanId || 'UNKNOWN'}.pdf`,
      ],
      dokumenInvoice: [
        `Invoice_Termin_1_${itemData.pekerjaanId || 'UNKNOWN'}.pdf`,
        `Invoice_Termin_2_${itemData.pekerjaanId || 'UNKNOWN'}.pdf`,
        `Invoice_Termin_3_${itemData.pekerjaanId || 'UNKNOWN'}.pdf`,
        `Invoice_Final_${itemData.pekerjaanId || 'UNKNOWN'}.pdf`,
      ],
    });
    setViewMode(true);
    setActiveTab('info');
    setModalOpen(true);
  };

  // Handle download dokumen
  const handleDownloadDokumen = (dokumen: string) => {
    const dummyContent = `Dokumen: ${dokumen}\n\nIni adalah dokumen arsip proyek yang telah selesai.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dokumen;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success(`Mengunduh: ${dokumen}`);
  };

  const handleDelete = (item: ArsipPekerjaan) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Arsip berhasil dihapus secara permanen');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem(formData);
    toast.success('Pekerjaan berhasil diarsipkan');
    setModalOpen(false);
  };

  const handleArchiveFromPekerjaan = (pekerjaanId: string) => {
    const pekerjaan = pekerjaanList.find(p => p.id === pekerjaanId);
    if (pekerjaan) {
      // Cast pekerjaan ke any untuk akses properti tambahan
      const pekerjaanData = pekerjaan as any;
      const actualTenderType = pekerjaanData.tenderType || 'lelang';

      // Generate dummy data
      const dummyItem: ArsipPekerjaan = {
        id: pekerjaan.id,
        pekerjaanId: pekerjaan.id,
        namaProyek: pekerjaan.namaProyek,
        klien: pekerjaan.klien,
        nilaiKontrak: pekerjaan.nilaiKontrak,
        tanggalSelesai: new Date(pekerjaan.tanggalSelesai),
        dokumenArsip: [],
        catatan: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const { dummyTim, dummyTahapan, dummyAnggaran } = generateDummyData(dummyItem);

      setFormData({
        pekerjaanId: pekerjaan.id,
        namaProyek: pekerjaan.namaProyek,
        klien: pekerjaan.klien,
        nilaiKontrak: pekerjaan.nilaiKontrak,
        tanggalSelesai: new Date(pekerjaan.tanggalSelesai),
        dokumenArsip: [],
        catatan: '',
        tim: pekerjaan.tim || dummyTim,
        tahapan: pekerjaan.tahapan || dummyTahapan,
        anggaran: pekerjaan.anggaran || dummyAnggaran,
        tenderType: actualTenderType,
        // Generate dokumen dummy untuk demo
        dokumenLelang: actualTenderType === 'lelang' ? {
          dokumenTender: [
            `Dokumen_RKS_Tender_${pekerjaan.namaProyek.substring(0, 10)}.pdf`,
            `Spesifikasi_Teknis_${pekerjaan.klien.substring(0, 8)}.pdf`,
          ],
          dokumenAdministrasi: [
            `SIUP_Perusahaan.pdf`,
            `TDP_${pekerjaan.klien.substring(0, 8)}.pdf`,
            `NPWP_Perusahaan.pdf`,
          ],
          dokumenTeknis: [
            `Gambar_Teknis_${pekerjaan.namaProyek.substring(0, 10)}.dwg`,
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
          `Proposal_Teknis_${pekerjaan.namaProyek.substring(0, 10)}.pdf`,
          `Company_Profile_${pekerjaan.klien.substring(0, 8)}.pdf`,
          `RAB_${pekerjaan.namaProyek.substring(0, 10)}.xlsx`,
          `Surat_Penawaran_Harga.pdf`,
          `Portfolio_Proyek.pdf`,
        ] : [],
        // Dummy data untuk SPK dan Invoice
        dokumenSPK: [
          `SPK_${pekerjaan.id}_${pekerjaan.namaProyek.substring(0, 10)}.pdf`,
          `SPK_Adendum_01_${pekerjaan.id}.pdf`,
        ],
        dokumenInvoice: [
          `Invoice_Termin_1_${pekerjaan.id}.pdf`,
          `Invoice_Termin_2_${pekerjaan.id}.pdf`,
          `Invoice_Termin_3_${pekerjaan.id}.pdf`,
          `Invoice_Final_${pekerjaan.id}.pdf`,
        ],
      });
      setViewMode(false);
      setActiveTab('info');
      setModalOpen(true);
    }
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

  const columns = [
    {
      key: 'namaProyek',
      header: 'Proyek',
      sortable: true,
      render: (item: ArsipPekerjaan) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
          <div className="p-1.5 sm:p-2 bg-muted rounded flex-shrink-0">
            <Archive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.namaProyek}</p>
            <p className="text-xs text-muted-foreground truncate">{item.klien}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'nilaiKontrak',
      header: 'Nilai Kontrak',
      sortable: true,
      render: (item: ArsipPekerjaan) => (
        <div className="text-center font-medium text-sm min-w-[120px]">
          {formatCurrency(item.nilaiKontrak)}
        </div>
      ),
    },
    {
      key: 'tanggalSelesai',
      header: 'Tanggal Selesai',
      sortable: true,
      render: (item: ArsipPekerjaan) => (
        <div className="text-center text-sm min-w-[100px]">
          {formatDate(item.tanggalSelesai)}
        </div>
      ),
    },
    {
      key: 'tenderType',
      header: 'Tender',
      render: (item: ArsipPekerjaan) => {
        const itemData = item as any;
        return (
          <div className="flex justify-center">
            <TenderBadge type={itemData.tenderType || 'lelang'} />
          </div>
        );
      },
    },
    {
      key: 'dokumenArsip',
      header: 'Dokumen',
      render: (item: ArsipPekerjaan) => (
        <div className="flex justify-center">
          <Badge variant="secondary">
            {item.dokumenArsip?.length || 0} file
          </Badge>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: ArsipPekerjaan) => (
        <div className="flex justify-center items-center gap-1 min-w-[100px]">
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
              handleDelete(item);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },

  ];

  const completedPekerjaan = pekerjaanList.filter(p =>
    p.status === 'selesai' || p.status === 'serah_terima'
  );

  const totalAnggaran = formData.anggaran?.reduce((sum, a) => sum + a.jumlah, 0) || 0;
  const totalRealisasi = formData.anggaran?.reduce((sum, a) => sum + a.realisasi, 0) || 0;

  return (
    <MainLayout title="Arsip Pekerjaan">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Kelola arsip proyek yang sudah selesai
          </p>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Arsipkan Proyek
          </Button>
        </div>

        {/* Quick Archive */}
        {completedPekerjaan.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proyek Siap Diarsipkan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedPekerjaan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{p.namaProyek}</p>
                      <p className="text-sm text-muted-foreground">{p.klien}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleArchiveFromPekerjaan(p.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arsipkan
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Arsip</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari arsip..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderArchive className="h-5 w-5" />
                {viewMode ? 'Detail Arsip Proyek' : 'Arsipkan Proyek'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1">
                <TabsTrigger value="info">Informasi</TabsTrigger>
                <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                <TabsTrigger value="tim">Tim</TabsTrigger>
                <TabsTrigger value="tahapan">Tahapan</TabsTrigger>
                <TabsTrigger value="anggaran">Anggaran</TabsTrigger>
              </TabsList>

              {/* Tab Info */}
              <TabsContent value="info" className="space-y-3 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewMode ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          Nama Proyek
                        </Label>
                        <p className="text-sm font-medium">
                          {formData.namaProyek}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          Klien
                        </Label>
                        <p className="text-sm font-medium">
                          {formData.klien}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          Nilai Kontrak
                        </Label>
                        <p className="text-sm font-semibold text-primary">
                          {formatCurrency(formData.nilaiKontrak)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Tanggal Selesai
                        </Label>
                        <p className="text-sm font-medium">
                          {formatDate(formData.tanggalSelesai)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground mx-2">
                          Jenis Tender
                        </Label>
                        <TenderBadge type={formData.tenderType || "lelang"} />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <Label className="text-sm text-muted-foreground">
                          Catatan
                        </Label>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {formData.catatan || "Tidak ada catatan"}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-green-900">
                              Proyek Selesai
                            </h3>
                            <p className="text-sm text-green-700">
                              Proyek telah diselesaikan dan diarsipkan
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleSubmit} className="col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="text-sm" htmlFor="namaProyek">
                            Nama Proyek
                          </Label>
                          <Input
                            id="namaProyek"
                            value={formData.namaProyek}
                            onChange={(e) =>
                              setFormData({ ...formData, namaProyek: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-sm" htmlFor="klien">
                            Klien
                          </Label>
                          <Input
                            id="klien"
                            value={formData.klien}
                            onChange={(e) =>
                              setFormData({ ...formData, klien: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label className="text-sm" htmlFor="nilaiKontrak">
                            Nilai Kontrak
                          </Label>
                          <Input
                            id="nilaiKontrak"
                            type="number"
                            value={formData.nilaiKontrak}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                nilaiKontrak: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-sm" htmlFor="tanggalSelesai">
                            Tanggal Selesai
                          </Label>
                          <Input
                            id="tanggalSelesai"
                            type="date"
                            value={formatDateInput(formData.tanggalSelesai)}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                tanggalSelesai: new Date(e.target.value),
                              })
                            }
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <Label className="text-sm" htmlFor="catatan">
                            Catatan
                          </Label>
                          <Textarea
                            id="catatan"
                            value={formData.catatan}
                            onChange={(e) =>
                              setFormData({ ...formData, catatan: e.target.value })
                            }
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline">
                          Batal
                        </Button>
                        <Button type="submit">
                          Arsipkan
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </TabsContent>


              {/* Tab Dokumen - Format Tabel */}
              <TabsContent value="dokumen" className="space-y-6 mt-4">
                {(() => {
                  const hasLelangDocs = formData.tenderType === 'lelang' && formData.dokumenLelang && (
                    (formData.dokumenLelang.dokumenTender?.length || 0) > 0 ||
                    (formData.dokumenLelang.dokumenAdministrasi?.length || 0) > 0 ||
                    (formData.dokumenLelang.dokumenTeknis?.length || 0) > 0 ||
                    (formData.dokumenLelang.dokumenPenawaran?.length || 0) > 0
                  );
                  const hasNonLelangDocs = formData.tenderType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0;
                  const hasSPKDocs = formData.dokumenSPK && formData.dokumenSPK.length > 0;
                  const hasInvoiceDocs = formData.dokumenInvoice && formData.dokumenInvoice.length > 0;
                  const hasDocs = hasLelangDocs || hasNonLelangDocs || hasSPKDocs || hasInvoiceDocs;

                  if (!hasDocs) {
                    return (
                      <div className="flex flex-col min-h-[300px] sm:min-h-[400px] items-center justify-center">
                        <div className="text-center space-y-3 px-4">
                          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-700">Tidak Ada Dokumen</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm">
                              Belum ada dokumen yang tersedia untuk arsip ini
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Dokumen Lelang - Format Tabel */}
                      {formData.tenderType === 'lelang' && formData.dokumenLelang && (
                        <div className="space-y-6">
                          {/* Dokumen Tender */}
                          {formData.dokumenLelang.dokumenTender && formData.dokumenLelang.dokumenTender.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                                <div className="p-1.5 sm:p-2 bg-[#D4E4F0] rounded-lg">
                                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#2F5F8C]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm sm:text-base text-gray-900">Dokumen Tender</h4>
                                  <p className="text-xs text-gray-500 truncate">Persyaratan dan spesifikasi tender</p>
                                </div>
                                <Badge variant="secondary" className="ml-auto flex-shrink-0">
                                  {formData.dokumenLelang.dokumenTender.length}
                                </Badge>
                              </div>
                              <div className="rounded-lg border overflow-x-auto">
                                <table className="w-full min-w-[500px]">
                                  <thead className="bg-[#E8F0F7]">
                                    <tr>
                                      <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-8 sm:w-12">#</th>
                                      <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm">Nama Dokumen</th>
                                      <th className="p-2 sm:p-3 text-left font-semibold text-xs sm:text-sm w-20 sm:w-32 hidden md:table-cell">Ukuran</th>
                                      <th className="p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm w-16 sm:w-24">Aksi</th>
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
                                        <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-500 hidden md:table-cell">2.3 MB</td>
                                        <td className="p-2 sm:p-3 text-center">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                            onClick={() => handleDownloadDokumen(doc)}
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
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-[#D8E9D5] rounded-lg">
                                  <FileText className="h-5 w-5 text-[#416F39]" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Dokumen Administrasi</h4>
                                  <p className="text-xs text-gray-500">Kelengkapan administrasi perusahaan</p>
                                </div>
                                <Badge variant="secondary" className="ml-auto">
                                  {formData.dokumenLelang.dokumenAdministrasi.length}
                                </Badge>
                              </div>
                              <div className="rounded-lg border overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-[#E8F2E6]">
                                    <tr>
                                      <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                      <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                      <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
                                      <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {formData.dokumenLelang.dokumenAdministrasi.map((doc, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#416F39]" />
                                            <span className="text-sm font-medium">{doc}</span>
                                          </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                        <td className="p-3 text-center">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownloadDokumen(doc)}
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
                              <div className="rounded-lg border overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-[#FFF3E8]">
                                    <tr>
                                      <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                      <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                      <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
                                      <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {formData.dokumenLelang.dokumenTeknis.map((doc, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#A67039]" />
                                            <span className="text-sm font-medium">{doc}</span>
                                          </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                        <td className="p-3 text-center">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownloadDokumen(doc)}
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
                              <div className="rounded-lg border overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-[#F3EBF7]">
                                    <tr>
                                      <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                      <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                      <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
                                      <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {formData.dokumenLelang.dokumenPenawaran.map((doc, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                        <td className="p-3">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-[#6F5485]" />
                                            <span className="text-sm font-medium">{doc}</span>
                                          </div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                        <td className="p-3 text-center">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownloadDokumen(doc)}
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
                        </div>
                      )}

                      {/* Dokumen Non-Lelang - Format Tabel */}
                      {formData.tenderType === 'non-lelang' && formData.dokumenNonLelang && formData.dokumenNonLelang.length > 0 && (
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-[#D4E4F0] rounded-lg">
                              <FileText className="h-5 w-5 text-[#2F5F8C]" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">Dokumen Proyek</h4>
                              <p className="text-xs text-gray-500">Proposal dan dokumen pendukung</p>
                            </div>
                            <Badge variant="secondary" className="ml-auto">
                              {formData.dokumenNonLelang.length}
                            </Badge>
                          </div>
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[#E8F0F7]">
                                <tr>
                                  <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                  <th className="p-3 text-left font-semibold text-sm">Nama Dokumen</th>
                                  <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
                                  <th className="p-3 text-center font-semibold text-sm w-24">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {formData.dokumenNonLelang.map((doc, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-[#2F5F8C]" />
                                        <span className="text-sm font-medium">{doc}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                    <td className="p-3 text-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadDokumen(doc)}
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
                                  <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
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
                                    <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                    <td className="p-3 text-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadDokumen(doc)}
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

                      {/* Dokumen Invoice */}
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
                                  <th className="p-3 text-left font-semibold text-sm w-32">Ukuran</th>
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
                                    <td className="p-3 text-sm text-gray-500">2.3 MB</td>
                                    <td className="p-3 text-center">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadDokumen(doc)}
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
                    </div>
                  );
                })()}
              </TabsContent>

              {/* Tab TIM - Format Tabel */}
              <TabsContent value="tim" className="space-y-3 mt-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Tim Proyek
                </h3>

                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {formData.tim && formData.tim.length > 0
                      ? `${formData.tim.length} tenaga ahli terpilih`
                      : "Belum ada tim yang terpilih"}
                  </p>
                </div>

                {!formData.tim || formData.tim.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg">
                    Belum ada data tim
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-[350px] overflow-x-auto overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Nama</th>
                          <th className="text-left p-3 text-sm font-medium">Jabatan</th>
                          <th className="text-left p-3 text-sm font-medium">Keahlian</th>
                          <th className="text-left p-3 text-sm font-medium">Sertifikat</th>
                        </tr>
                      </thead>

                      <tbody>
                        {tenagaAhliList
                          .filter((ta) => formData.tim?.includes(ta.id))
                          .map((ta) => (
                            <tr
                              key={ta.id}
                              className="border-t hover:bg-muted/50 transition-colors"
                            >
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
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>


              {/* Tab TAHAPAN - Timeline Infografis */}
              <TabsContent value="tahapan" className="space-y-4 mt-4">
                <div className="space-y-4">
                  {!formData.tahapan || formData.tahapan.length === 0 ? (
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
                            <div className="text-xl sm:text-2xl font-bold text-[#416F39]">100%</div>
                            <p className="text-xs text-gray-500">Selesai</p>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#5B8DB8] to-[#416F39] transition-all duration-500 rounded-full"
                              style={{ width: '100%' }}
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
                            const StatusIcon = CheckCircle2;
                            const config = {
                              dotColor: 'bg-[#416F39]',
                              cardBg: 'bg-green-50',
                              cardBorder: 'border-[#416F39]',
                              titleColor: 'text-[#416F39]',
                              badgeBg: 'bg-[#416F39]',
                              badgeText: 'text-white',
                              yearBg: 'bg-green-100',
                              yearBorder: 'border-[#416F39]',
                              yearText: 'text-[#416F39]'
                            };

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
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Selesai
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

                                          <span className="flex items-center gap-1">
                                            <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                                            <span className="truncate">{formatDate(t.tanggalSelesai)}</span>
                                          </span>

                                        </div>
                                      </div>
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
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => handleDownloadDokumen(file)}
                                                  title="Download"
                                                >
                                                  <Download className="h-3.5 w-3.5 text-[#2F5F8C]" />
                                                </Button>
                                              </div>
                                            );
                                          })}
                                        </div>
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

              {/* Tab ANGGARAN - Dikelompokkan per Tahapan */}
              <TabsContent value="anggaran" className="space-y-4 mt-4">
                <div className="space-y-6">
                  {!formData.tahapan || formData.tahapan.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500 italic">Belum ada data tahapan</p>
                    </div>
                  ) : (
                    formData.tahapan.map((tahapan) => {
                      const anggaranTahapan = formData.anggaran?.filter(a => a.tahapanId === tahapan.id) || [];
                      const totalTahapan = anggaranTahapan.reduce((sum, a) => sum + a.jumlah, 0);
                      const realisasiTahapan = anggaranTahapan.reduce((sum, a) => sum + a.realisasi, 0);

                      return (
                        <div key={tahapan.id} className="space-y-3">
                          {/* Header Tahapan */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{tahapan.nama}</h3>
                                  <Badge className="bg-[#416F39] text-white">Selesai</Badge>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  {anggaranTahapan.length} item anggaran
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                <span className="font-semibold">Total:</span> {formatCurrency(totalTahapan)}
                              </div>
                              <div className="text-sm text-gray-600">
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
                            <div className="rounded-lg border overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="p-3 text-left font-semibold text-sm w-12">#</th>
                                    <th className="p-3 text-left font-semibold text-sm">Kategori</th>
                                    <th className="p-3 text-left font-semibold text-sm">Deskripsi</th>
                                    <th className="p-3 text-right font-semibold text-sm w-32">Anggaran</th>
                                    <th className="p-3 text-right font-semibold text-sm w-32">Realisasi</th>
                                    <th className="p-3 text-center font-semibold text-sm w-32">Dokumen</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {anggaranTahapan.map((a, idx) => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="p-3 text-sm text-gray-600">{idx + 1}</td>
                                      <td className="p-3">
                                        <span className="text-sm font-medium text-gray-900">{a.kategori}</span>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-sm text-gray-600">{a.deskripsi}</span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(a.jumlah)}</span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(a.realisasi)}</span>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center justify-center gap-2">
                                          {a.files && a.files.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                              <Badge variant="secondary" className="text-xs">
                                                {a.files.length} file
                                              </Badge>
                                              {a.files.map((file, fileIdx) => {
                                                const FileIcon = getFileIcon(file);
                                                const fileColor = getFileColor(file);
                                                return (
                                                  <Button
                                                    key={fileIdx}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleDownloadDokumen(file)}
                                                    title={file.split('/').pop()}
                                                  >
                                                    <FileIcon className={`h-4 w-4 ${fileColor}`} />
                                                  </Button>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-500">-</span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Total Anggaran:</span>
                    <span className="font-bold">{formatCurrency(totalAnggaran)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Realisasi:</span>
                    <span className="font-bold">{formatCurrency(totalRealisasi)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Hapus Arsip Permanen"
          description={`Apakah Anda yakin ingin menghapus arsip "${selectedItem?.namaProyek}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus Permanen"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
