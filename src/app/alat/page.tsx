"use client";

import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, History, Wrench, Package, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { mockAlat } from '@/mocks/data';
import { Alat, Peminjaman, HistoriPeminjaman } from '@/types';

// ================= TYPES & INITIAL DATA =================

type AlatFormData = Omit<Alat, 'id' | 'createdAt' | 'updatedAt' | 'historiPeminjaman' | 'gambarList'>;
type PeminjamanFormData = Omit<Peminjaman, 'id' | 'createdAt' | 'updatedAt'>;

const initialAlatFormData: AlatFormData = {
  kodeAlat: '',
  namaAlat: '',
  tanggalPengadaan: new Date(),
  nomorSeri: '',
  kelengkapan: 'Lengkap',
  status: 'Tersedia',
  keterangan: '',
};

const initialPeminjamanFormData: PeminjamanFormData = {
  idPeminjaman: '',
  alatIds: [],
  alatId: '',
  tanggalPinjam: new Date(),
  tanggalKembali: new Date(),
  peminjam: '',
  rincianAlat: '',
  keterangan: '',
  status: 'Dipinjam',
};

// ================= HELPER COMPONENTS =================

const StatusCircle = ({ status }: { status: string }) => {
  let colorClass = 'bg-gray-400';

  switch (status) {
    case 'Tersedia':
      colorClass = 'bg-green-500';
      break;
    case 'Dipinjam':
      colorClass = 'bg-yellow-500';
      break;
    case 'Rusak':
      colorClass = 'bg-red-500';
      break;
    case 'Hilang':
      colorClass = 'bg-black';
      break;
    default:
      colorClass = 'bg-gray-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colorClass} ring-1 ring-offset-1 ring-gray-200`} />
      <span className="capitalize">{status}</span>
    </div>
  );
};

// Helper to generate initial Peminjaman list from Alat history
const getInitialPeminjamanList = (alatData: Alat[]): Peminjaman[] => {
  const list: Peminjaman[] = [];
  alatData.forEach(alat => {
    if (alat.status === 'Dipinjam' && alat.historiPeminjaman) {
      // Find active loan (where tanggalKembali is null)
      const activeHist = alat.historiPeminjaman.find(h => !h.tanggalKembali);
      if (activeHist) {
        list.push({
          id: activeHist.id,
          idPeminjaman: `PINJAM-${activeHist.id.replace('HP-', '')}`,
          alatId: alat.id,
          tanggalPinjam: activeHist.tanggalPinjam,
          tanggalKembali: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
          peminjam: activeHist.peminjam,
          rincianAlat: `${alat.kodeAlat} - ${alat.namaAlat} (${alat.nomorSeri})`,
          keterangan: alat.keterangan,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'Dipinjam',
        });
      }
    }
  });
  return list;
};

export default function AlatPage() {
  // ================= STATE =================
  const [activeTab, setActiveTab] = useState("alat");

  // -- ALAT STATE --
  const [alatList, setAlatList] = useState<Alat[]>(mockAlat);
  const [alatModalOpen, setAlatModalOpen] = useState(false);
  const [alatDeleteDialogOpen, setAlatDeleteDialogOpen] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null);
  const [alatFormData, setAlatFormData] = useState<AlatFormData>(initialAlatFormData);
  const [alatViewMode, setAlatViewMode] = useState(false);

  // -- HISTORY LOG STATE --
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryAlat, setActiveHistoryAlat] = useState<Alat | null>(null);

  // -- PEMINJAMAN STATE --
  // Initialize mock peminjaman from existing alat history or empty
  // Initialize mock peminjaman from existing alat history
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>(() => getInitialPeminjamanList(mockAlat));
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null);
  const [viewPeminjamanData, setViewPeminjamanData] = useState<Peminjaman | null>(null);
  const [peminjamanModalOpen, setPeminjamanModalOpen] = useState(false);
  const [viewPeminjamanModalOpen, setViewPeminjamanModalOpen] = useState(false);
  const [peminjamanFormData, setPeminjamanFormData] = useState<PeminjamanFormData>(initialPeminjamanFormData);
  const [isReturnAction, setIsReturnAction] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnStatuses, setReturnStatuses] = useState<Record<string, 'Tersedia' | 'Rusak' | 'Hilang'>>({});

  // ================= HANDLERS: ALAT =================

  const handleCreateAlat = () => {
    setSelectedAlat(null);
    setAlatFormData(initialAlatFormData);
    setAlatViewMode(false);
    setAlatModalOpen(true);
  };

  const handleEditAlat = (item: Alat) => {
    setSelectedAlat(item);
    setAlatFormData({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      tanggalPengadaan: new Date(item.tanggalPengadaan),
      nomorSeri: item.nomorSeri,
      kelengkapan: item.kelengkapan,
      status: item.status,
      keterangan: item.keterangan,
    });
    setAlatViewMode(false);
    setAlatModalOpen(true);
  };

  const handleViewAlat = (item: Alat) => {
    setSelectedAlat(item);
    setAlatFormData({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      tanggalPengadaan: new Date(item.tanggalPengadaan),
      nomorSeri: item.nomorSeri,
      kelengkapan: item.kelengkapan,
      status: item.status,
      keterangan: item.keterangan,
    });
    setAlatViewMode(true);
    setAlatModalOpen(true);
  };

  const handleDeleteAlat = (item: Alat) => {
    setSelectedAlat(item);
    setAlatDeleteDialogOpen(true);
  };

  const confirmDeleteAlat = () => {
    if (selectedAlat) {
      setAlatList(prev => prev.filter(al => al.id !== selectedAlat.id));
      toast.success('Alat berhasil dihapus');
    }
    setAlatDeleteDialogOpen(false);
    setSelectedAlat(null);
  };

  const handleSubmitAlat = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAlat) {
      // Update
      setAlatList(prev => prev.map(item =>
        item.id === selectedAlat.id
          ? {
            ...item,
            ...alatFormData,
            updatedAt: new Date()
          }
          : item
      ));
      toast.success('Alat berhasil diperbarui');
    } else {
      // Create
      const newAlat: Alat = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        historiPeminjaman: [],
        gambarList: [],
        ...alatFormData,
      };
      setAlatList(prev => [...prev, newAlat]);
      toast.success('Alat berhasil ditambahkan');
    }
    setAlatModalOpen(false);
  };

  const handleShowHistory = (item: Alat) => {
    setActiveHistoryAlat(item);
    setHistoryModalOpen(true);
  };

  // ================= HANDLERS: PEMINJAMAN =================

  const handleCreatePeminjaman = () => {
    setSelectedPeminjaman(null);
    setIsReturnAction(false);
    setPeminjamanFormData({
      ...initialPeminjamanFormData,
      idPeminjaman: `PINJAM-${Date.now().toString().slice(-6)}`, // Auto-generate simple ID
      tanggalPinjam: new Date(),
      tanggalKembali: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default +7 days
    });
    setPeminjamanModalOpen(true);
  };

  const handleEditPeminjaman = (item: Peminjaman) => {
    setSelectedPeminjaman(item);
    setIsReturnAction(false);
    setPeminjamanFormData({
      idPeminjaman: item.idPeminjaman,
      alatId: item.alatId,
      tanggalPinjam: new Date(item.tanggalPinjam),
      tanggalKembali: new Date(item.tanggalKembali),
      peminjam: item.peminjam,
      rincianAlat: item.rincianAlat,
      keterangan: item.keterangan || '',
      status: item.status || 'Dipinjam',
    });
    setPeminjamanModalOpen(true);
  };

  const handleViewPeminjaman = (item: Peminjaman) => {
    setViewPeminjamanData(item);
    setViewPeminjamanModalOpen(true);
  };

  const handleKembalikanAlat = (item: Peminjaman) => {
    setSelectedPeminjaman(item);

    // Initialize status for each tool in this loan
    const initialStatuses: Record<string, 'Tersedia' | 'Rusak' | 'Hilang'> = {};
    const toolsInLoan = item.alatIds || [item.alatId]; // Fallback for legacy

    toolsInLoan.forEach(id => {
      initialStatuses[id] = 'Tersedia';
    });

    setReturnStatuses(initialStatuses);
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = () => {
    if (!selectedPeminjaman) return;

    const returnDate = new Date();

    // 1. Remove from Active Peminjaman List
    setPeminjamanList(prev => prev.filter(p => p.id !== selectedPeminjaman.id));

    // 2. Identify all alat IDs in this loan
    const alatIdsToReturn = selectedPeminjaman.alatIds || [selectedPeminjaman.alatId];

    // 3. Update Alat Status individually
    setAlatList(prev => prev.map(alat => {
      // Check if this alat is part of the returned loan
      if (alatIdsToReturn.includes(alat.id)) {
        // Get the specific status chosen for this tool
        const chosenStatus = returnStatuses[alat.id] || 'Tersedia';

        // Update history
        const updatedHistory = alat.historiPeminjaman.map(h => {
          if (h.peminjam === selectedPeminjaman.peminjam && !h.tanggalKembali) {
            return { ...h, tanggalKembali: returnDate };
          }
          return h;
        });

        return {
          ...alat,
          status: chosenStatus,
          historiPeminjaman: updatedHistory
        };
      }
      return alat;
    }));

    toast.success(`Peminjaman selesai. Status alat telah diperbarui.`);
    setReturnModalOpen(false);
    setSelectedPeminjaman(null);
  };

  const handleSubmitPeminjaman = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPeminjaman) {
      // Mode Edit Info ONLY (Not returning)
      // Just update the metadata of the loan
      setPeminjamanList(prev => prev.map(item =>
        item.id === selectedPeminjaman.id
          ? { ...item, ...peminjamanFormData, updatedAt: new Date() }
          : item
      ));

      // Also need to update the history record in Alat if critical info changed (like peminjam name)
      // But for simplicity, we focus on Peminjaman tab update.
      setAlatList(prev => prev.map(alat => {
        if (alat.id === selectedPeminjaman.alatId) {
          const updatedHistory = alat.historiPeminjaman.map(h => {
            // Try to link back to this loan. 
            // Ideally we should have stored HistoryID in Peminjaman to link them.
            // For now, we update if peminjam matches.
            if (h.peminjam === selectedPeminjaman.peminjam && !h.tanggalKembali) {
              return {
                ...h,
                peminjam: peminjamanFormData.peminjam,
                tanggalPinjam: peminjamanFormData.tanggalPinjam
              };
            }
            return h;
          });
          return { ...alat, historiPeminjaman: updatedHistory };
        }
        return alat;
      }));

      toast.success('Data peminjaman diperbarui');
    } else {
      // Mode Create (New Loan)
      if (!peminjamanFormData.alatIds || peminjamanFormData.alatIds.length === 0) {
        toast.error('Pilih minimal satu alat terlebih dahulu');
        return;
      }

      const newHistoryTemplate: HistoriPeminjaman = {
        id: `H-TEMP`, // Will be generated per tool
        peminjam: peminjamanFormData.peminjam,
        tanggalPinjam: peminjamanFormData.tanggalPinjam,
        tanggalKembali: null, // Still active
      };

      const newPeminjaman: Peminjaman = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...peminjamanFormData,
        // Ensure alatId (legacy) is at least set to first one
        alatId: peminjamanFormData.alatIds[0]
      };

      setAlatList(prev => prev.map(item => {
        if (peminjamanFormData.alatIds?.includes(item.id)) {
          const uniqueHistoryId = `H-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          return {
            ...item,
            status: 'Dipinjam',
            historiPeminjaman: [{ ...newHistoryTemplate, id: uniqueHistoryId }, ...item.historiPeminjaman]
          };
        }
        return item;
      }));

      setPeminjamanList(prev => [newPeminjaman, ...prev]);
      toast.success(`${peminjamanFormData.alatIds.length} Alat berhasil dipinjam`);
    }
    setPeminjamanModalOpen(false);
  };

  const handleAlatSelect = (alatId: string) => {
    const alat = alatList.find(a => a.id === alatId);
    if (alat) {
      setPeminjamanFormData({
        ...peminjamanFormData,
        alatId: alatId,
        rincianAlat: `${alat.kodeAlat} - ${alat.namaAlat} (${alat.nomorSeri})`
      });
    }
  };



  const toggleAlatSelection = (alatId: string) => {
    let newIds = [...(peminjamanFormData.alatIds || [])];
    if (newIds.includes(alatId)) {
      newIds = newIds.filter(id => id !== alatId);
    } else {
      newIds.push(alatId);
    }

    // Update Rincian Alat Text
    const selectedTools = alatList.filter(a => newIds.includes(a.id));
    const rincianText = selectedTools.map(t => t.namaAlat).join(', ');

    setPeminjamanFormData({
      ...peminjamanFormData,
      alatIds: newIds,
      rincianAlat: rincianText
    });
  };

  // ================= COLUMNS: ALAT =================
  const alatColumns = [
    {
      key: 'namaAlat',
      header: 'Nama Alat',
      sortable: true,
      render: (item: Alat) => (
        <div className="text-center font-medium">
          {item.namaAlat}
        </div>
      )
    },
    {
      key: 'tanggalPengadaan',
      header: 'Tgl Pengadaan',
      sortable: true,
      render: (item: Alat) => (
        <div className="text-center text-sm">
          {format(new Date(item.tanggalPengadaan), 'dd MMM yyyy')}
        </div>
      )
    },
    {
      key: 'kodeAlat',
      header: 'Kode',
      sortable: true,
      render: (item: Alat) => <div className="text-center font-medium">{item.kodeAlat}</div>
    },
    {
      key: 'nomorSeri',
      header: 'Nomor Seri',
      sortable: true,
      render: (item: Alat) => <div className="text-center text-sm text-muted-foreground">{item.nomorSeri}</div>
    },
    {
      key: 'kelengkapan',
      header: 'Kelengkapan',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <Badge variant={item.kelengkapan === 'Lengkap' ? 'secondary' : 'outline'}>
            {item.kelengkapan}
          </Badge>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item: Alat) => (
        <div className="flex justify-center">
          <StatusCircle status={item.status} />
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Alat) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="icon" onClick={() => handleShowHistory(item)} title="Log Peminjaman">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleViewAlat(item)} title="Lihat">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEditAlat(item)} title="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteAlat(item)} title="Hapus">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  // ================= COLUMNS: PEMINJAMAN =================

  const peminjamanColumns = [
    {
      key: 'idPeminjaman',
      header: 'ID Peminjaman',
      sortable: true,
      render: (item: Peminjaman) => <div className="text-center font-mono text-xs">{item.idPeminjaman}</div>
    },
    {
      key: 'rincianAlat',
      header: 'Alat',
      render: (item: Peminjaman) => <p className="text-sm font-medium text-center">{item.rincianAlat}</p>
    },
    {
      key: 'peminjam',
      header: 'Peminjam',
      render: (item: Peminjaman) => (
        <div className="text-center">
          <p className="text-sm font-medium">{item.peminjam}</p>
        </div>
      )
    },
    {
      key: 'tanggal',
      header: 'Jadwal',
      render: (item: Peminjaman) => (
        <div className="text-sm text-center">
          <p className="text-green-600">Pinjam: {format(new Date(item.tanggalPinjam), 'dd MMM yyyy')}</p>
          <p className="text-orange-600">Kembali: {format(new Date(item.tanggalKembali), 'dd MMM yyyy')}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Peminjaman) => (
        <div className="flex justify-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Selesai'
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
            }`}>
            {item.status || 'Dipinjam'}
          </span>
        </div>
      )
    },
    {
      key: 'keterangan',
      header: 'Keterangan',
      render: (item: Peminjaman) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block mx-auto text-center">{item.keterangan}</span>
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Peminjaman) => (
        <div className="flex items-center gap-1 justify-center">
          <Button variant="ghost" size="icon" onClick={() => handleViewPeminjaman(item)} title="Lihat Detail">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleEditPeminjaman(item)} title="Edit Info">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-green-600 text-green-600 hover:bg-green-50 hover:text-green-600"
            onClick={() => handleKembalikanAlat(item)}
          >
            Dikembalikan
          </Button>
        </div>
      )
    }
  ];

  const historyColumns = [
    {
      key: 'peminjam',
      header: 'Peminjam',
      render: (item: HistoriPeminjaman) => <div className="text-center font-medium">{item.peminjam}</div>
    },
    {
      key: 'tanggalPinjam',
      header: 'Tanggal Pinjam',
      sortable: true,
      render: (item: HistoriPeminjaman) => (
        <div className="text-center text-sm">
          {format(new Date(item.tanggalPinjam), 'dd MMM yyyy')}
        </div>
      )
    },
    {
      key: 'tanggalKembali',
      header: 'Tanggal Kembali',
      sortable: true,
      render: (item: HistoriPeminjaman) => (
        <div className={`text-center text-sm ${item.tanggalKembali ? "text-green-600" : "text-yellow-600 font-medium"}`}>
          {item.tanggalKembali
            ? format(new Date(item.tanggalKembali), 'dd MMM yyyy')
            : 'Sedang Dipinjam'}
        </div>
      )
    }
  ];

  const selectionAlatColumns = [
    {
      key: 'select',
      header: 'Pilih',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={peminjamanFormData.alatIds?.includes(item.id) || false}
            onChange={() => toggleAlatSelection(item.id)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
        </div>
      )
    },
    {
      key: 'kodeAlat',
      header: 'Kode',
      sortable: true,
      render: (item: Alat) => <span className="font-mono text-xs">{item.kodeAlat}</span>
    },
    {
      key: 'namaAlat',
      header: 'Nama Alat',
      sortable: true,
      render: (item: Alat) => <span className="text-sm font-medium">{item.namaAlat}</span>
    }
  ];

  // ================= RENDER =================

  const availableAlat = alatList.filter(a => a.status === 'Tersedia');

  const renderMobileHistory = (item: HistoriPeminjaman) => (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <span className="font-medium">{item.peminjam}</span>
        <span className={item.tanggalKembali ? "text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full" : "text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full"}>
          {item.tanggalKembali ? 'Selesai' : 'Dipinjam'}
        </span>
      </div>
      <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
        <div>
          <span className="block text-xs font-semibold">Tanggal Pinjam</span>
          {format(new Date(item.tanggalPinjam), 'dd MMM yyyy')}
        </div>
        <div>
          <span className="block text-xs font-semibold">Tanggal Kembali</span>
          {item.tanggalKembali ? format(new Date(item.tanggalKembali), 'dd MMM yyyy') : '-'}
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Manajemen Aset & Peminjaman">
      <div className="space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 min-w-[300px]">
              <TabsTrigger value="alat" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Daftar Alat
              </TabsTrigger>
              <TabsTrigger value="peminjaman" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Peminjaman
              </TabsTrigger>
            </TabsList>

            {activeTab === 'alat' ? (
              <Button onClick={handleCreateAlat}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Alat Baru
              </Button>
            ) : (
              <Button onClick={handleCreatePeminjaman}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Peminjaman
              </Button>
            )}
          </div>

          {/* TAB 1: ALAT */}
          <TabsContent value="alat" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Inventaris Alat</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={alatList}
                  columns={alatColumns}
                  searchPlaceholder="Cari kode, nama alat, atau status..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PEMINJAMAN */}
          <TabsContent value="peminjaman" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Peminjaman Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                {peminjamanList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada data peminjaman aktif</p>
                    <Button variant="link" onClick={handleCreatePeminjaman}>Buat Peminjaman Baru</Button>
                  </div>
                ) : (
                  <DataTable
                    data={peminjamanList}
                    columns={peminjamanColumns}
                    searchPlaceholder="Cari peminjam atau ID..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG: FORM ALAT */}
        <Dialog open={alatModalOpen} onOpenChange={setAlatModalOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {alatViewMode ? 'Detail Alat' : selectedAlat ? 'Edit Data Alat' : 'Tambah Alat Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAlat} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kode">Kode Alat</Label>
                  <Input
                    id="kode"
                    required
                    value={alatFormData.kodeAlat}
                    onChange={e => setAlatFormData({ ...alatFormData, kodeAlat: e.target.value })}
                    disabled={alatViewMode}
                    placeholder="Contoh: ALT-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Alat</Label>
                  <Input
                    id="nama"
                    required
                    value={alatFormData.namaAlat}
                    onChange={e => setAlatFormData({ ...alatFormData, namaAlat: e.target.value })}
                    disabled={alatViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tgl">Tanggal Pengadaan</Label>
                  <Input
                    id="tgl"
                    type="date"
                    required
                    value={alatFormData.tanggalPengadaan ? format(alatFormData.tanggalPengadaan, 'yyyy-MM-dd') : ''}
                    onChange={e => setAlatFormData({ ...alatFormData, tanggalPengadaan: new Date(e.target.value) })}
                    disabled={alatViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seri">Nomor Seri</Label>
                  <Input
                    id="seri"
                    required
                    value={alatFormData.nomorSeri}
                    onChange={e => setAlatFormData({ ...alatFormData, nomorSeri: e.target.value })}
                    disabled={alatViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelengkapan">Kelengkapan</Label>
                  <Select
                    value={alatFormData.kelengkapan}
                    onValueChange={(val: any) => setAlatFormData({ ...alatFormData, kelengkapan: val })}
                    disabled={alatViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lengkap">Lengkap</SelectItem>
                      <SelectItem value="Tidak Lengkap">Tidak Lengkap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Alat</Label>
                  <Select
                    value={alatFormData.status}
                    onValueChange={(val: any) => setAlatFormData({ ...alatFormData, status: val })}
                    disabled={alatViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tersedia">Tersedia</SelectItem>
                      <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                      <SelectItem value="Rusak">Rusak</SelectItem>
                      <SelectItem value="Hilang">Hilang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ket">Keterangan</Label>
                <Textarea
                  id="ket"
                  value={alatFormData.keterangan}
                  onChange={e => setAlatFormData({ ...alatFormData, keterangan: e.target.value })}
                  disabled={alatViewMode}
                />
              </div>

              {!alatViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAlatModalOpen(false)}>Batal</Button>
                  <Button type="submit">Simpan Data</Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: FORM PEMINJAMAN */}
        <Dialog open={peminjamanModalOpen} onOpenChange={setPeminjamanModalOpen}>
          <DialogContent className="w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPeminjaman ? 'Edit Data Peminjaman' : 'Form Peminjaman Alat'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitPeminjaman} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* 1. ID Peminjaman */}
              <div className="space-y-2 sm:col-span-1">
                <Label>ID Peminjaman</Label>
                <Input
                  value={peminjamanFormData.idPeminjaman}
                  onChange={e => setPeminjamanFormData({ ...peminjamanFormData, idPeminjaman: e.target.value })}
                  required
                />
              </div>

              {/* 2. Nama Peminjam (Moved here) */}
              <div className="space-y-2 sm:col-span-1">
                <Label>Nama Peminjam</Label>
                <Input
                  value={peminjamanFormData.peminjam}
                  onChange={e => setPeminjamanFormData({ ...peminjamanFormData, peminjam: e.target.value })}
                  required
                  placeholder="Nama lengkap peminjam"
                />
              </div>

              {/* 3. Dates */}
              <div className="space-y-2 sm:col-span-1">
                <Label>Tanggal Peminjaman</Label>
                <Input
                  type="date"
                  required
                  value={format(peminjamanFormData.tanggalPinjam, 'yyyy-MM-dd')}
                  onChange={e => setPeminjamanFormData({ ...peminjamanFormData, tanggalPinjam: new Date(e.target.value) })}
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label>Tanggal Pengembalian</Label>
                <Input
                  type="date"
                  required
                  value={format(peminjamanFormData.tanggalKembali, 'yyyy-MM-dd')}
                  onChange={e => setPeminjamanFormData({ ...peminjamanFormData, tanggalKembali: new Date(e.target.value) })}
                />
              </div>

              {/* 4. Daftar Alat (Selection) */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Pilih Alat {selectedPeminjaman ? '(Daftar alat tidak dapat diubah saat edit)' : '(Bisa pilih > 1)'}</Label>
                {!selectedPeminjaman && (
                  <div className="border rounded-md overflow-hidden bg-background">
                    <DataTable
                      data={availableAlat}
                      columns={selectionAlatColumns}
                      pageSize={5}
                      searchPlaceholder="Cari alat..."
                      searchable={true}
                    />
                  </div>
                )}
                {selectedPeminjaman && (
                  <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground italic">
                    Edit daftar alat tidak tersedia. Silakan buat peminjaman baru jika ingin mengubah alat.
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  * Centang kotak di kolom paling kiri untuk memilih alat
                </p>
              </div>

              {/* 5. Rincian Alat Terpilih (Now as Table) */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Rincian Alat Terpilih</Label>
                <div className="border rounded-md overflow-hidden bg-muted/20">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted">
                      <tr className="border-b">
                        <th className="py-2 px-3 font-medium w-24">Kode</th>
                        <th className="py-2 px-3 font-medium">Nama Alat</th>
                        <th className="py-2 px-3 font-medium w-32">No. Seri</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const selectedIds = peminjamanFormData.alatIds || [];
                        const tools = alatList.filter(a => selectedIds.includes(a.id));

                        if (tools.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-muted-foreground text-xs">Belum ada alat yang dipilih</td>
                            </tr>
                          );
                        }
                        return tools.map(t => (
                          <tr key={t.id} className="border-b last:border-0 border-muted-foreground/10 bg-background/50">
                            <td className="py-2 px-3 font-mono text-xs">{t.kodeAlat}</td>
                            <td className="py-2 px-3">{t.namaAlat}</td>
                            <td className="py-2 px-3 text-xs text-muted-foreground">{t.nomorSeri}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Keterangan */}
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label>Keterangan</Label>
                <Textarea
                  value={peminjamanFormData.keterangan}
                  onChange={e => setPeminjamanFormData({ ...peminjamanFormData, keterangan: e.target.value })}
                  placeholder="Catatan tambahan (opsional)..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 col-span-1 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setPeminjamanModalOpen(false)}>Batal</Button>
                <Button type="submit">{selectedPeminjaman ? 'Simpan Perubahan' : 'Buat Peminjaman'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG: VIEW PEMINJAMAN DETAIL */}
        <Dialog open={viewPeminjamanModalOpen} onOpenChange={setViewPeminjamanModalOpen}>
          <DialogContent className="w-[95vw] max-w-lg">
            <DialogHeader>
              <DialogTitle>Detail Peminjaman</DialogTitle>
            </DialogHeader>
            {viewPeminjamanData && (
              <div className="space-y-6 py-2">
                {/* INFO UTAMA */}
                <div className="overflow-hidden border rounded-lg">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b bg-muted/30">
                        <td className="py-2 px-3 font-medium w-1/3">ID Peminjaman</td>
                        <td className="py-2 px-3 font-mono">{viewPeminjamanData.idPeminjaman}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium">Peminjam</td>
                        <td className="py-2 px-3">{viewPeminjamanData.peminjam}</td>
                      </tr>

                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium">Tgl Pinjam</td>
                        <td className="py-2 px-3">{format(new Date(viewPeminjamanData.tanggalPinjam), 'dd MMMM yyyy')}</td>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <td className="py-2 px-3 font-medium">Tgl Kembali</td>
                        <td className="py-2 px-3">{format(new Date(viewPeminjamanData.tanggalKembali), 'dd MMMM yyyy')}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium align-top">Keterangan</td>
                        <td className="py-2 px-3 align-top italic text-muted-foreground">{viewPeminjamanData.keterangan || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* DAFTAR ALAT */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Daftar Alat Dipinjam</h4>
                  <div className="overflow-hidden border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted">
                        <tr>
                          <th className="py-2 px-3 font-medium w-32">Kode</th>
                          <th className="py-2 px-3 font-medium">Nama Alat</th>
                          <th className="py-2 px-3 font-medium w-32">No. Seri</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Use alatIds if available, fallback to legacy alatId
                          const ids = viewPeminjamanData.alatIds || (viewPeminjamanData.alatId ? [viewPeminjamanData.alatId] : []);
                          // Filter alatList to find matches
                          const tools = alatList.filter(a => ids.includes(a.id));

                          if (tools.length === 0) return (
                            <tr>
                              <td colSpan={3} className="py-3 px-3 text-center text-muted-foreground">Tidak ada data alat</td>
                            </tr>
                          );

                          return tools.map((tool, idx) => (
                            <tr key={tool.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                              <td className="py-2 px-3 font-mono text-xs">{tool.kodeAlat}</td>
                              <td className="py-2 px-3">{tool.namaAlat}</td>
                              <td className="py-2 px-3 text-xs text-muted-foreground">{tool.nomorSeri}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setViewPeminjamanModalOpen(false)}>Tutup</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: RETURN CONFIRMATION */}
        <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
          <DialogContent className="w-[95vw] max-w-lg">
            <DialogHeader>
              <DialogTitle>Konfirmasi Pengembalian Alat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Silakan perbarui status kondisi untuk setiap alat yang dikembalikan.
              </p>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr className="border-b">
                      <th className="p-3 font-medium">Alat</th>
                      <th className="p-3 font-medium w-48">Kondisi Pengembalian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const ids = selectedPeminjaman?.alatIds || (selectedPeminjaman?.alatId ? [selectedPeminjaman.alatId] : []);
                      const tools = alatList.filter(a => ids.includes(a.id));

                      return tools.map(tool => (
                        <tr key={tool.id} className="border-t">
                          <td className="p-3">
                            <div className="font-medium">{tool.namaAlat}</div>
                            <div className="text-xs text-muted-foreground font-mono">{tool.kodeAlat}</div>
                          </td>
                          <td className="p-3">
                            <Select
                              value={returnStatuses[tool.id]}
                              onValueChange={(val: any) => setReturnStatuses(prev => ({ ...prev, [tool.id]: val }))}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tersedia">Tersedia (Normal)</SelectItem>
                                <SelectItem value="Rusak">Rusak</SelectItem>
                                <SelectItem value="Hilang">Hilang</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-800 dark:text-yellow-200 flex gap-2">
                  <span className="font-bold">Info:</span>
                  Peminjaman akan ditandai selesai dan tanggal kembali dicatat hari ini ({format(new Date(), 'dd MMM yyyy')}).
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReturnModalOpen(false)}>Batal</Button>
              <Button onClick={handleConfirmReturn}>Konfirmasi Pengembalian</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DIALOG: HISTORY LOG */}
        <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Peminjaman - {activeHistoryAlat?.namaAlat}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {activeHistoryAlat?.historiPeminjaman && activeHistoryAlat.historiPeminjaman.length > 0 ? (
                <DataTable
                  data={activeHistoryAlat.historiPeminjaman}
                  columns={historyColumns}
                  pageSize={5}
                  searchPlaceholder="Cari riwayat..."
                  renderMobileItem={renderMobileHistory}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>Belum ada riwayat peminjaman</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setHistoryModalOpen(false)}>Tutup</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION */}
        <ConfirmDialog
          open={alatDeleteDialogOpen}
          onOpenChange={setAlatDeleteDialogOpen}
          title="Hapus Alat?"
          description={`Anda yakin ingin menghapus alat "${selectedAlat?.namaAlat}"? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDeleteAlat}
        />

      </div>
    </MainLayout>
  );
}
