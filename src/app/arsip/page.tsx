"use client";

import { useEffect, useState, useRef } from 'react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DokumenTab } from './components/tabs/DokumenTab';
import { TimTab } from './components/tabs/TimTab';

import { FileIcon } from './components/FileIcon';
import { Plus, Trash2, Eye, Archive, Download, FileText, CheckCircle2, FolderArchive, FileCheck, Award, Calendar, DollarSign, Users, Circle, AlertCircle, X, Upload, FileImage, File, FileSpreadsheet, Flag, MapPin } from 'lucide-react';
import { useArsipStore } from '@/stores/arsipStore';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { ArsipPekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { TenderBadge } from '@/components/TenderBadge';
import 'leaflet/dist/leaflet.css';


type FormData = Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'> & {
  tim?: string[];
  tahapan?: TahapanKerja[];
  anggaran?: AnggaranItem[];
  tenderType?: 'tender' | 'non-tender';
  dokumenLelang?: {
    dokumenTender?: string[];
    dokumenAdministrasi?: string[];
    dokumenTeknis?: string[];
    dokumenPenawaran?: string[];
  };
  dokumenNonLelang?: string[];
  dokumenSPK?: string[];
  dokumenInvoice?: string[];
  aoiFile?: string;
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
  tenderType: 'tender',
  dokumenLelang: {
    dokumenTender: [],
    dokumenAdministrasi: [],
    dokumenTeknis: [],
    dokumenPenawaran: [],
  },
  dokumenNonLelang: [],
  dokumenSPK: [],
  dokumenInvoice: [],
  aoiFile: undefined,
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

  // Dummy polygon coordinates (Jakarta area)
  const dummyPolygon = [
    [-6.2088, 106.8456],
    [-6.2088, 106.8656],
    [-6.1888, 106.8656],
    [-6.1888, 106.8456],
    [-6.2088, 106.8456]
  ];

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Remove !mapRef.current from initial check to allow retry in timeout
    if (!formData.aoiFile || activeTab !== 'info' || !modalOpen) return;

    // Use a delay to ensure the modal/tab transition is complete and the container has dimensions
    // Increased delay slightly and added retry logic could be considered, but 500ms is usually safe
    const timer = setTimeout(() => {
      // Check for map container existence inside the timeout
      if (!mapRef.current) {
        // If map container is still not found, we could try again or just return
        console.warn('Map container not found after delay');
        return;
      }

      // Load Leaflet dynamically
      import('leaflet').then((L) => {
        // Prevent reinitialization
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Double check ref after async load
        if (!mapRef.current) return;

        // Create map
        const map = L.map(mapRef.current).setView([-6.1988, 106.8556], 12);
        mapInstanceRef.current = map;

        // Force a resize calculation immediately
        map.invalidateSize();

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add polygon
        const polygon = L.polygon(dummyPolygon as [number, number][], {
          color: '#1976D2',
          fillColor: '#1976D2',
          fillOpacity: 0.3,
          weight: 2
        }).addTo(map);

        // Add popup
        polygon.bindPopup('<b>Area of Interest</b><br>Area proyek');

        // Fit bounds
        map.fitBounds(polygon.getBounds());
      }).catch((error) => {
        console.error('Error loading Leaflet:', error);
      });
    }, 500); // 500ms delay for modal animation

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [formData.aoiFile, activeTab, modalOpen]);

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
  const generateDummyData = (item: ArsipPekerjaan, existingTahapan?: TahapanKerja[]) => {
    // Dummy Tim - ambil 2-3 tenaga ahli pertama jika ada
    const dummyTim = tenagaAhliList.slice(0, Math.min(3, tenagaAhliList.length)).map(ta => ta.id);

    // Dummy Tahapan (Default Story)
    const defaultDummyTahapan: TahapanKerja[] = [
      {
        id: '1',
        nomor: 1,
        nama: 'Persiapan dan Mobilisasi',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 6)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 5)),
        status: 'done',
        bobot: 15,
        deskripsi: 'Tahap awal meliputi perizinan, mobilisasi alat berat, dan setup kantor lapangan.',
        files: [
          `uploads/tahapan/Laporan_Mobilisasi_${item.namaProyek.substring(0, 10)}.pdf`,
          `uploads/tahapan/Dokumentasi_Persiapan.jpg`,
        ],
        tanggalInvoice: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 5)),
        perkiraanInvoiceMasuk: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 4)),
        jumlahTagihanInvoice: item.nilaiKontrak * 0.13,
        statusPembayaran: 'lunas',
        dokumenInvoice: [`uploads/invoice/Inv_DP_${item.namaProyek.substring(0, 5)}.pdf`]
      },
      {
        id: '2',
        nomor: 2,
        nama: 'Pelaksanaan Pekerjaan Utama',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 5)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 2)),
        status: 'done',
        bobot: 50,
        deskripsi: 'Konstruksi struktur utama, pemasangan atap, dan pekerjaan ME (Mekanikal Elektrikal).',
        files: [
          `uploads/tahapan/Progress_Report_Week_1-12.pdf`,
          `uploads/tahapan/Foto_Pelaksanaan.jpg`,
          `uploads/tahapan/Quality_Control_Check.xlsx`,
        ],
        tanggalInvoice: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 2)),
        perkiraanInvoiceMasuk: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        jumlahTagihanInvoice: item.nilaiKontrak * 0.60,
        statusPembayaran: 'lunas',
        dokumenInvoice: [`uploads/invoice/Inv_Termin1_${item.namaProyek.substring(0, 5)}.pdf`]
      },
      {
        id: '3',
        nomor: 3,
        nama: 'Finishing dan Quality Control',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 2)),
        tanggalSelesai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        status: 'done',
        bobot: 20,
        deskripsi: 'Pekerjaan arsitektur, pengecatan, pemasangan lantai, dan pengujian sistem.',
        files: [
          `uploads/tahapan/Quality_Control_Report.pdf`,
          `uploads/tahapan/Finishing_Photos.jpg`,
        ],
        tanggalInvoice: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        perkiraanInvoiceMasuk: new Date(item.tanggalSelesai),
        jumlahTagihanInvoice: item.nilaiKontrak * 0.18,
        statusPembayaran: 'lunas',
        dokumenInvoice: [`uploads/invoice/Inv_Termin2_${item.namaProyek.substring(0, 5)}.pdf`]
      },
      {
        id: '4',
        nomor: 4,
        nama: 'Serah Terima dan Dokumentasi',
        progress: 100,
        tanggalMulai: new Date(new Date(item.tanggalSelesai).setMonth(new Date(item.tanggalSelesai).getMonth() - 1)),
        tanggalSelesai: new Date(item.tanggalSelesai),
        status: 'done',
        bobot: 15,
        deskripsi: 'Serah terima pertama (PHO), penyerahan as-built drawing, dan dokumentasi proyek selesai.',
        files: [
          `uploads/tahapan/BAST_${item.namaProyek.substring(0, 10)}.pdf`,
          `uploads/tahapan/Dokumentasi_Serah_Terima.pdf`,
          `uploads/tahapan/As_Built_Drawing.dwg`,
        ],
        tanggalInvoice: new Date(item.tanggalSelesai),
        perkiraanInvoiceMasuk: new Date(item.tanggalSelesai),
        jumlahTagihanInvoice: item.nilaiKontrak * 0.09,
        statusPembayaran: 'lunas',
        dokumenInvoice: [`uploads/invoice/Inv_Pelunasan_${item.namaProyek.substring(0, 5)}.pdf`]
      },
    ];

    // Dummy Anggaran
    let dummyAnggaran: AnggaranItem[] = [];

    const tahapanToList = (existingTahapan && existingTahapan.length > 0) ? existingTahapan : defaultDummyTahapan;

    // Generate matching budget for whatever tahapan we have
    if (tahapanToList === defaultDummyTahapan) {
      // Use the detailed story-based dummy anggaran
      dummyAnggaran = [
        {
          id: '1',
          tahapanId: '1',
          kategori: 'Mobilisasi',
          deskripsi: 'Biaya mobilisasi peralatan dan personel',
          jumlah: item.nilaiKontrak * 0.08,
          realisasi: 0,
          files: [`uploads/anggaran/Invoice_Mobilisasi.pdf`, `uploads/anggaran/Bukti_Transfer.jpg`]
        },
        {
          id: '2',
          tahapanId: '1',
          kategori: 'Setup Kantor Lapangan',
          deskripsi: 'Pembangunan dan setup kantor proyek',
          jumlah: item.nilaiKontrak * 0.05,
          realisasi: 0,
          files: [`uploads/anggaran/Bukti_Setup_Kantor.pdf`]
        },
        {
          id: '3',
          tahapanId: '2',
          kategori: 'Material Utama',
          deskripsi: 'Pengadaan material konstruksi utama',
          jumlah: item.nilaiKontrak * 0.35,
          realisasi: 0,
          files: [`uploads/anggaran/PO_Material.pdf`, `uploads/anggaran/Delivery_Note.pdf`, `uploads/anggaran/Invoice_Material.pdf`]
        },
        {
          id: '4',
          tahapanId: '2',
          kategori: 'Upah Tenaga Kerja',
          deskripsi: 'Biaya tenaga kerja pelaksanaan',
          jumlah: item.nilaiKontrak * 0.25,
          realisasi: 0,
          files: [`uploads/anggaran/Daftar_Hadir.xlsx`, `uploads/anggaran/Slip_Gaji.pdf`]
        },
        {
          id: '5',
          tahapanId: '3',
          kategori: 'Material Finishing',
          deskripsi: 'Material finishing dan aksesoris',
          jumlah: item.nilaiKontrak * 0.12,
          realisasi: 0,
          files: [`uploads/anggaran/Invoice_Finishing.pdf`]
        },
        {
          id: '6',
          tahapanId: '3',
          kategori: 'Quality Testing',
          deskripsi: 'Biaya testing dan quality control',
          jumlah: item.nilaiKontrak * 0.06,
          realisasi: 0,
          files: [`uploads/anggaran/Lab_Test_Invoice.pdf`, `uploads/anggaran/Test_Results.pdf`]
        },
        {
          id: '7',
          tahapanId: '4',
          kategori: 'Dokumentasi',
          deskripsi: 'Biaya pembuatan as-built drawing dan dokumentasi',
          jumlah: item.nilaiKontrak * 0.04,
          realisasi: 0,
          files: [`uploads/anggaran/Invoice_Documentation.pdf`]
        },
        {
          id: '8',
          tahapanId: '4',
          kategori: 'Administrasi Serah Terima',
          deskripsi: 'Biaya administrasi dan pengurusan BAST',
          jumlah: item.nilaiKontrak * 0.05,
          realisasi: 0,
          files: [`uploads/anggaran/Biaya_Admin_BAST.pdf`]
        },
      ];
    } else {
      // Generate generic budget items for custom tahapan based on invoice amount
      dummyAnggaran = tahapanToList.flatMap((t, idx) => {
        const seed = t.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const itemsCount = (seed % 2) + 1; // 1 or 2 items
        const result: AnggaranItem[] = [];

        // Use the invoice amount as the basis for budget
        const stageBudget = t.jumlahTagihanInvoice || 0;

        if (stageBudget > 0) {
          if (itemsCount === 1) {
            result.push({
              id: `dummy-anggaran-${t.id}-0`,
              tahapanId: t.id,
              kategori: 'Pelaksanaan',
              deskripsi: `Biaya pelaksanaan tahapan ${t.nama}`,
              jumlah: stageBudget,
              realisasi: 0,
              files: []
            });
          } else {
            // Split 60/40 for variety
            const amount1 = stageBudget * 0.6;
            const amount2 = stageBudget - amount1;

            result.push({
              id: `dummy-anggaran-${t.id}-0`,
              tahapanId: t.id,
              kategori: 'Personil & Tenaga Ahli',
              deskripsi: `Biaya personil untuk tahapan ${t.nama}`,
              jumlah: amount1,
              realisasi: 0,
              files: []
            });

            result.push({
              id: `dummy-anggaran-${t.id}-1`,
              tahapanId: t.id,
              kategori: 'Operasional & Pendukung',
              deskripsi: `Biaya operasional untuk tahapan ${t.nama}`,
              jumlah: amount2,
              realisasi: 0,
              files: []
            });
          }
        } else {
          // Fallback only if no invoice info (should rarely happen for completed/archived projects)
          result.push({
            id: `dummy-anggaran-${t.id}-0`,
            tahapanId: t.id,
            kategori: 'Umum',
            deskripsi: `Estimasi biaya tahapan ${t.nama}`,
            jumlah: 0,
            realisasi: 0,
            files: []
          });
        }
        return result;
      });
    }

    return { dummyTim, dummyTahapan: defaultDummyTahapan, dummyAnggaran };
  };

  const handleView = (item: ArsipPekerjaan) => {
    setSelectedItem(item);

    // Cast item ke any untuk akses properti tambahan
    const itemData = item as any;
    const actualTenderType = itemData.tenderType || 'tender';

    // Generate dummy data
    const existingTahapan = (itemData.tahapan && itemData.tahapan.length > 0) ? itemData.tahapan : undefined;
    const { dummyTim, dummyTahapan, dummyAnggaran } = generateDummyData(item, existingTahapan);

    const tahapanToUse = existingTahapan || dummyTahapan;
    const anggaranToUse = (itemData.anggaran && itemData.anggaran.length > 0) ? itemData.anggaran : dummyAnggaran;

    setFormData({
      pekerjaanId: item.pekerjaanId,
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiKontrak: item.nilaiKontrak,
      tanggalSelesai: new Date(item.tanggalSelesai),
      dokumenArsip: item.dokumenArsip,
      catatan: item.catatan,
      tim: itemData.tim || dummyTim,
      tahapan: tahapanToUse,
      anggaran: anggaranToUse,
      tenderType: actualTenderType,
      // Generate dokumen dummy untuk demo
      dokumenLelang: actualTenderType === 'tender' ? {
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
      dokumenNonLelang: actualTenderType === 'non-tender' ? [
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
      aoiFile: item.aoiFile || 'uploads/aoi/dummy_aoi.geojson',
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
      const actualTenderType = pekerjaanData.tenderType || 'tender';

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
      // Generate dummy data
      const existingTahapan = (pekerjaan.tahapan && pekerjaan.tahapan.length > 0) ? pekerjaan.tahapan : undefined;
      const { dummyTim, dummyTahapan, dummyAnggaran } = generateDummyData(dummyItem, existingTahapan);

      // Determine values to use
      const tahapanToUse = existingTahapan || dummyTahapan;
      const anggaranToUse = (pekerjaan.anggaran && pekerjaan.anggaran.length > 0) ? pekerjaan.anggaran : dummyAnggaran;

      setFormData({
        pekerjaanId: pekerjaan.id,
        namaProyek: pekerjaan.namaProyek,
        klien: pekerjaan.klien,
        nilaiKontrak: pekerjaan.nilaiKontrak,
        tanggalSelesai: new Date(pekerjaan.tanggalSelesai),
        dokumenArsip: [],
        catatan: '',
        tim: pekerjaan.tim || dummyTim,
        tahapan: tahapanToUse,
        anggaran: anggaranToUse,
        tenderType: actualTenderType,
        // Generate dokumen dummy untuk demo
        dokumenLelang: actualTenderType === 'tender' ? {
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
        dokumenNonLelang: actualTenderType === 'non-tender' ? [
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
            <TenderBadge type={itemData.tenderType || 'tender'} />
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
          <DialogContent className="w-full h-full max-w-none sm:max-w-4xl sm:h-auto sm:max-h-[90vh] overflow-y-auto p-0 rounded-none sm:rounded-lg">
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <FolderArchive className="h-4 w-4 sm:h-5 sm:w-5" />
                {viewMode ? 'Detail Arsip Proyek' : 'Arsipkan Proyek'}
              </DialogTitle>
              <DialogDescription>
                {viewMode ? 'Informasi detail mengenai proyek yang diarsipkan.' : 'Formulir untuk mengarsipkan proyek.'}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop View - Tab List */}
              <div className="hidden lg:block px-4 sm:px-6 border-b">
                <TabsList className="w-full grid grid-cols-4 gap-1 bg-transparent h-auto p-0">
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
                  </SelectContent>
                </Select>
              </div>

              {/* Tab Info */}
              <TabsContent value="info" className="space-y-4 px-4 sm:px-6 py-4">
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
                        <TenderBadge type={formData.tenderType || "tender"} />
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

                {/* Map Display - Show when AOI file exists */}
                {formData.aoiFile && (
                  <div className="p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-black" />
                      <h3 className="text-black text-xs sm:text-sm">Area of Interest (AOI)</h3>
                    </div>
                    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-black/10">
                      <div ref={mapRef} className="w-full h-full" id="leaflet-map-container" />
                    </div>
                    <p className="text-xs text-black">
                      <strong>Note:</strong> Ini adalah tampilan preview AOI dengan data dummy. Klik polygon untuk melihat info.
                    </p>
                  </div>
                )}
              </TabsContent>


              {/* Tab Dokumen - Format Tabel */}
              {/* Tab Dokumen */}
              <DokumenTab
                formData={formData}
                setFormData={setFormData}
                viewMode={viewMode}
                handleDownloadDokumen={handleDownloadDokumen}
              />

              {/* Tab Tim */}
              <TimTab
                formData={formData}
                setFormData={setFormData}
                viewMode={viewMode}
                tenagaAhliList={tenagaAhliList}
              />

              {/* Tab Tahapan */}
              <TabsContent value="tahapan" className="space-y-4 px-4 sm:px-6 py-4">
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
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            Selesai
                                          </span>
                                        </div>

                                        {t.deskripsi && (
                                          <p className="text-sm text-gray-600 mb-2 italic">
                                            {t.deskripsi}
                                          </p>
                                        )}
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
                                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-2">
                                          {t.jumlahTagihanInvoice && (
                                            <span className="flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                              <span>Invoice:</span> {formatCurrency(t.jumlahTagihanInvoice)}
                                            </span>
                                          )}
                                          {formData.anggaran && formData.anggaran.some(a => a.tahapanId === t.id) && (
                                            <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                              <span>Anggaran:</span> {formatCurrency(
                                                formData.anggaran
                                                  .filter(a => a.tahapanId === t.id)
                                                  .reduce((sum, item) => sum + item.jumlah, 0)
                                              )}
                                            </span>
                                          )}
                                          {t.statusPembayaran && (
                                            <Badge variant="outline" className={`text-[10px] ${t.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                              t.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                                              }`}>
                                              {t.statusPembayaran.toUpperCase()}
                                            </Badge>
                                          )}
                                          {t.perkiraanInvoiceMasuk && (
                                            <span className="flex items-center gap-1 text-[10px]">
                                              Est. Masuk: {t.perkiraanInvoiceMasuk ? formatDate(t.perkiraanInvoiceMasuk) : '-'}
                                            </span>
                                          )}
                                          {t.dokumenInvoice && t.dokumenInvoice.length > 0 && (
                                            <div className="flex gap-1">
                                              {t.dokumenInvoice.map((f, i) => (
                                                <a key={i} href={f} target="_blank" className="text-blue-500 hover:underline text-[10px]">
                                                  <FileText className="h-3 w-3 inline" /> Inv {i + 1}
                                                </a>
                                              ))}
                                            </div>
                                          )}
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
                                            const fileName = file.split('/').pop() || '';
                                            return (
                                              <div key={fileIdx} className="group flex items-center justify-between gap-2 p-2 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-all">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <FileIcon fileName={file} className="h-4 w-4 flex-shrink-0" />
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
    </MainLayout >
  );
}
