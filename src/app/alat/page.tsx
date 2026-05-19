"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Plus, Edit, Trash2, Eye, History, Wrench, Package, Briefcase, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Alat, Peminjaman, HistoriPeminjaman } from '@/types';
import {
  alatService,
  mapAlat,
  mapPeminjaman,
  buildHistoriForAlat,
  buildAlatPayload,
  statusKembaliBE,
  getApiErrorMessage,
  GambarAlatAPI,
  PeminjamanAlatAPI,
  PeminjamanAPI,
} from '@/services/alat.service';

// ================= TYPES =================

type AlatFormData = Omit<Alat, 'id' | 'createdAt' | 'updatedAt' | 'historiPeminjaman'>;
type PeminjamanFormData = Omit<Peminjaman, 'id' | 'createdAt' | 'updatedAt'>;

const initialAlatFormData: AlatFormData = {
  kodeAlat: '',
  namaAlat: '',
  tanggalPengadaan: new Date(),
  nomorSeri: '',
  kelengkapan: 'Lengkap',
  status: 'Tersedia',
  keterangan: '',
  gambarList: [],
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

export default function AlatPage() {
  // ================= STATE =================
  const [activeTab, setActiveTab] = useState("alat");

  // -- Core data --
  const [alatList, setAlatList] = useState<Alat[]>([]);
  const [rawPeminjaman, setRawPeminjaman] = useState<PeminjamanAPI[]>([]);
  const [peminjamanList, setPeminjamanList] = useState<Peminjaman[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // -- Gambar metadata: alatId → gambar with BE IDs --
  const [gambarByAlatId, setGambarByAlatId] = useState<Record<string, GambarAlatAPI[]>>({});

  // -- PeminjamanAlat map: peminjamanId → alat_dipinjam[] --
  const [peminjamanAlatMap, setPeminjamanAlatMap] = useState<Record<string, PeminjamanAlatAPI[]>>({});

  // -- Gambar edit state --
  const [editGambarExisting, setEditGambarExisting] = useState<{ id: string; url: string }[]>([]);
  const [editGambarNewFiles, setEditGambarNewFiles] = useState<File[]>([]);
  const [editGambarNewPreviews, setEditGambarNewPreviews] = useState<string[]>([]);
  const [deletedGambarIds, setDeletedGambarIds] = useState<string[]>([]);

  // -- ALAT STATE --
  const [alatModalOpen, setAlatModalOpen] = useState(false);
  const [alatDeleteDialogOpen, setAlatDeleteDialogOpen] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState<Alat | null>(null);
  const [alatFormData, setAlatFormData] = useState<AlatFormData>(initialAlatFormData);
  const [alatViewMode, setAlatViewMode] = useState(false);
  const [alatFilterStatus, setAlatFilterStatus] = useState<string>('all');

  // -- HISTORY LOG STATE --
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeHistoryAlat, setActiveHistoryAlat] = useState<Alat | null>(null);

  // -- PEMINJAMAN STATE --
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null);
  const [viewPeminjamanData, setViewPeminjamanData] = useState<Peminjaman | null>(null);
  const [peminjamanModalOpen, setPeminjamanModalOpen] = useState(false);
  const [viewPeminjamanModalOpen, setViewPeminjamanModalOpen] = useState(false);
  const [peminjamanFormData, setPeminjamanFormData] = useState<PeminjamanFormData>(initialPeminjamanFormData);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnStatuses, setReturnStatuses] = useState<Record<string, 'Tersedia' | 'Rusak' | 'Hilang' | 'BelumDikembalikan'>>({});

  // -- Loading states --
  const [isSubmittingAlat, setIsSubmittingAlat] = useState(false);
  const [isDeletingAlat, setIsDeletingAlat] = useState(false);
  const [isSubmittingPeminjaman, setIsSubmittingPeminjaman] = useState(false);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);

  // ================= DATA FETCHING =================

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rawAlat, rawPeminjamanData] = await Promise.all([
        alatService.getRawAlat(),
        alatService.getRawPeminjaman(),
      ]);

      // Build gambar metadata
      const gambarMeta: Record<string, GambarAlatAPI[]> = {};
      rawAlat.forEach((a) => { gambarMeta[a.id] = a.gambar; });
      setGambarByAlatId(gambarMeta);

      // Build peminjaman-alat map
      const paminjamanAlatData: Record<string, PeminjamanAlatAPI[]> = {};
      rawPeminjamanData.forEach((p) => { paminjamanAlatData[p.id] = p.alat_dipinjam; });
      setPeminjamanAlatMap(paminjamanAlatData);

      // Build set of alat IDs currently being borrowed (status_kembali === '' means not yet returned)
      const borrowedAlatIds = new Set<string>();
      rawPeminjamanData.forEach((p) => {
        p.alat_dipinjam.forEach((pa) => {
          if (pa.status_kembali === '') borrowedAlatIds.add(pa.alat);
        });
      });

      // Map alat with computed status and history
      // Backend does not auto-update status_alat when PeminjamanAlat is created,
      // so we derive the real status from active peminjaman data.
      const mappedAlat = rawAlat.map((a) => {
        const mapped = mapAlat(a);
        if (mapped.status === 'Tersedia' && borrowedAlatIds.has(a.id)) {
          mapped.status = 'Dipinjam';
        }
        return { ...mapped, historiPeminjaman: buildHistoriForAlat(a.id, rawPeminjamanData) };
      });
      setAlatList(mappedAlat);

      // Keep raw peminjaman for history refresh after operations
      setRawPeminjaman(rawPeminjamanData);

      // Map peminjaman using the mapped alat list
      const mappedPeminjaman = rawPeminjamanData.map((p) => mapPeminjaman(p, mappedAlat));
      setPeminjamanList(mappedPeminjaman);
    } catch {
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ================= GAMBAR HELPERS =================

  const resetGambarState = () => {
    editGambarNewPreviews.forEach((url) => URL.revokeObjectURL(url));
    setEditGambarExisting([]);
    setEditGambarNewFiles([]);
    setEditGambarNewPreviews([]);
    setDeletedGambarIds([]);
  };

  const getDisplayGambarList = () => [
    ...editGambarExisting.map((g) => g.url),
    ...editGambarNewPreviews,
  ];

  // ================= HANDLERS: ALAT =================

  const handleCreateAlat = () => {
    resetGambarState();
    setSelectedAlat(null);
    setAlatFormData(initialAlatFormData);
    setAlatViewMode(false);
    setAlatModalOpen(true);
  };

  const handleEditAlat = (item: Alat) => {
    resetGambarState();
    const gambar = gambarByAlatId[item.id] || [];
    const existing = gambar
      .filter((g) => g.signed_file_url)
      .map((g) => ({ id: g.id, url: g.signed_file_url! }));
    setEditGambarExisting(existing);

    setSelectedAlat(item);
    setAlatFormData({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      tanggalPengadaan: new Date(item.tanggalPengadaan),
      nomorSeri: item.nomorSeri,
      kelengkapan: item.kelengkapan,
      status: item.status,
      keterangan: item.keterangan,
      gambarList: existing.map((g) => g.url),
    });
    setAlatViewMode(false);
    setAlatModalOpen(true);
  };

  const handleViewAlat = (item: Alat) => {
    resetGambarState();
    const gambar = gambarByAlatId[item.id] || [];
    const existing = gambar
      .filter((g) => g.signed_file_url)
      .map((g) => ({ id: g.id, url: g.signed_file_url! }));
    setEditGambarExisting(existing);

    setSelectedAlat(item);
    setAlatFormData({
      kodeAlat: item.kodeAlat,
      namaAlat: item.namaAlat,
      tanggalPengadaan: new Date(item.tanggalPengadaan),
      nomorSeri: item.nomorSeri,
      kelengkapan: item.kelengkapan,
      status: item.status,
      keterangan: item.keterangan,
      gambarList: existing.map((g) => g.url),
    });
    setAlatViewMode(true);
    setAlatModalOpen(true);
  };

  const handleDeleteAlat = (item: Alat) => {
    setSelectedAlat(item);
    setAlatDeleteDialogOpen(true);
  };

  const confirmDeleteAlat = async () => {
    if (!selectedAlat) return;
    setIsDeletingAlat(true);
    try {
      await alatService.deleteAlat(selectedAlat.id);
      setAlatList((prev) => prev.filter((a) => a.id !== selectedAlat.id));
      toast.success('Alat berhasil dihapus');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus alat'));
    } finally {
      setIsDeletingAlat(false);
    }
    setAlatDeleteDialogOpen(false);
    setSelectedAlat(null);
  };

  const handleSubmitAlat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAlat(true);
    try {
      const payload = buildAlatPayload(alatFormData);

      if (selectedAlat) {
        // Update alat (text fields)
        const updated = await alatService.updateAlat(selectedAlat.id, payload);

        // Delete removed gambar
        await Promise.all(deletedGambarIds.map((id) => alatService.deleteGambar(id)));

        // Upload new gambar
        const newGambar = await Promise.all(
          editGambarNewFiles.map((file) => alatService.uploadGambar(updated.id, file))
        );

        // Update local gambar metadata
        const keptExisting = (gambarByAlatId[updated.id] || []).filter(
          (g) => !deletedGambarIds.includes(g.id)
        );
        setGambarByAlatId((prev) => ({ ...prev, [updated.id]: [...keptExisting, ...newGambar] }));

        const mappedAlat = {
          ...mapAlat(updated),
          gambarList: [
            ...editGambarExisting.filter((g) => !deletedGambarIds.includes(g.id)).map((g) => g.url),
            ...newGambar.map((g) => g.signed_file_url).filter(Boolean) as string[],
          ],
          historiPeminjaman: selectedAlat.historiPeminjaman,
        };
        setAlatList((prev) => prev.map((a) => (a.id === updated.id ? mappedAlat : a)));
        toast.success('Alat berhasil diperbarui');
      } else {
        // Create alat
        const created = await alatService.createAlat(payload);

        // Upload gambar
        const newGambar = await Promise.all(
          editGambarNewFiles.map((file) => alatService.uploadGambar(created.id, file))
        );

        setGambarByAlatId((prev) => ({ ...prev, [created.id]: newGambar }));

        const mappedAlat = {
          ...mapAlat(created),
          gambarList: newGambar.map((g) => g.signed_file_url).filter(Boolean) as string[],
          historiPeminjaman: [],
        };
        setAlatList((prev) => [...prev, mappedAlat]);
        toast.success('Alat berhasil ditambahkan');
      }
      setAlatModalOpen(false);
      resetGambarState();
    } catch (err) {
      toast.error(getApiErrorMessage(err, selectedAlat ? 'Gagal memperbarui alat' : 'Gagal menambahkan alat'));
    } finally {
      setIsSubmittingAlat(false);
    }
  };

  const handleShowHistory = (item: Alat) => {
    setActiveHistoryAlat(item);
    setHistoryModalOpen(true);
  };

  // ================= HANDLERS: PEMINJAMAN =================

  const handleCreatePeminjaman = () => {
    setSelectedPeminjaman(null);
    setPeminjamanFormData({
      ...initialPeminjamanFormData,
      idPeminjaman: `PINJAM-${Date.now().toString().slice(-6)}`,
      tanggalPinjam: new Date(),
      tanggalKembali: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    setPeminjamanModalOpen(true);
  };

  const handleEditPeminjaman = (item: Peminjaman) => {
    setSelectedPeminjaman(item);
    setPeminjamanFormData({
      idPeminjaman: item.idPeminjaman,
      alatId: item.alatId,
      alatIds: item.alatIds || [],
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
    // Only init statuses for alat that haven't been returned yet (status_kembali === '')
    const alatDipinjam = peminjamanAlatMap[item.id] || [];
    const notReturnedIds = alatDipinjam.filter((pa) => pa.status_kembali === '').map((pa) => pa.alat);
    const initialStatuses: Record<string, 'Tersedia' | 'Rusak' | 'Hilang' | 'BelumDikembalikan'> = {};
    notReturnedIds.forEach((id) => { initialStatuses[id] = 'BelumDikembalikan'; });
    setReturnStatuses(initialStatuses);
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedPeminjaman) return;
    setIsConfirmingReturn(true);
    try {
      const alatDipinjam = peminjamanAlatMap[selectedPeminjaman.id] || [];
      // Only patch alat that user has chosen a return condition for (not 'BelumDikembalikan')
      const toReturn = alatDipinjam.filter(
        (pa) => pa.status_kembali === '' && returnStatuses[pa.alat] !== 'BelumDikembalikan'
      );
      const returnDate = new Date().toISOString();

      await Promise.all(
        toReturn.map(async (pa) => {
          const statusFE = returnStatuses[pa.alat] as 'Tersedia' | 'Rusak' | 'Hilang';
          const statusBE = statusKembaliBE[statusFE];

          await alatService.patchPeminjamanAlat(pa.id, {
            status_kembali: statusBE,
            tanggal_dikembalikan: returnDate,
          });

          // If returned damaged or lost, update the alat's own status in backend
          if (statusFE === 'Rusak') await alatService.patchAlatStatus(pa.alat, 'rusak');
          else if (statusFE === 'Hilang') await alatService.patchAlatStatus(pa.alat, 'hilang');
          else await alatService.patchAlatStatus(pa.alat, 'tersedia');
        })
      );

      toast.success('Peminjaman selesai. Status alat telah diperbarui.');
      setReturnModalOpen(false);
      setSelectedPeminjaman(null);
      await fetchAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memproses pengembalian'));
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  const handleSubmitPeminjaman = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPeminjaman(true);
    try {
      if (selectedPeminjaman) {
        // Update mode: only update metadata (not alat list)
        const updated = await alatService.updatePeminjaman(selectedPeminjaman.id, {
          nomor_peminjaman: peminjamanFormData.idPeminjaman,
          nama_peminjam: peminjamanFormData.peminjam,
          tanggal_pinjam: format(peminjamanFormData.tanggalPinjam, 'yyyy-MM-dd'),
          tanggal_kembali: format(peminjamanFormData.tanggalKembali, 'yyyy-MM-dd'),
          keterangan: peminjamanFormData.keterangan,
        });
        const mappedUpdated = mapPeminjaman(updated, alatList);
        setPeminjamanList((prev) => prev.map((p) => (p.id === selectedPeminjaman.id ? mappedUpdated : p)));
        toast.success('Data peminjaman diperbarui');
      } else {
        // Create mode
        if (!peminjamanFormData.alatIds || peminjamanFormData.alatIds.length === 0) {
          toast.error('Pilih minimal satu alat terlebih dahulu');
          setIsSubmittingPeminjaman(false);
          return;
        }

        const created = await alatService.createPeminjaman({
          nomor_peminjaman: peminjamanFormData.idPeminjaman,
          nama_peminjam: peminjamanFormData.peminjam,
          tanggal_pinjam: format(peminjamanFormData.tanggalPinjam, 'yyyy-MM-dd'),
          tanggal_kembali: format(peminjamanFormData.tanggalKembali, 'yyyy-MM-dd'),
          keterangan: peminjamanFormData.keterangan,
        });

        await Promise.all(
          peminjamanFormData.alatIds.map((alatId) =>
            alatService.createPeminjamanAlat(created.id, alatId)
          )
        );

        toast.success(`${peminjamanFormData.alatIds.length} Alat berhasil dipinjam`);
        await fetchAll();
      }
      setPeminjamanModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, selectedPeminjaman ? 'Gagal memperbarui peminjaman' : 'Gagal membuat peminjaman'));
    } finally {
      setIsSubmittingPeminjaman(false);
    }
  };

  const toggleAlatSelection = (alatId: string) => {
    let newIds = [...(peminjamanFormData.alatIds || [])];
    if (newIds.includes(alatId)) {
      newIds = newIds.filter((id) => id !== alatId);
    } else {
      newIds.push(alatId);
    }
    const selectedTools = alatList.filter((a) => newIds.includes(a.id));
    const rincianText = selectedTools.map((t) => t.namaAlat).join(', ');
    setPeminjamanFormData({ ...peminjamanFormData, alatIds: newIds, rincianAlat: rincianText });
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

  // ================= COMPUTED =================

  const filteredAlatList = useMemo(() => {
    if (alatFilterStatus === 'all') return alatList;
    return alatList.filter((a) => a.status === alatFilterStatus);
  }, [alatList, alatFilterStatus]);

  const statsAlat = {
    total: alatList.length,
    tersedia: alatList.filter((a) => a.status === 'Tersedia').length,
    dipinjam: alatList.filter((a) => a.status === 'Dipinjam').length,
    rusak: alatList.filter((a) => a.status === 'Rusak').length
  };

  const availableAlat = alatList.filter((a) => a.status === 'Tersedia');

  // Only show aktif peminjaman in the tab
  const aktifPeminjamanList = peminjamanList.filter((p) => p.status === 'Dipinjam');

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

  // ================= RENDER =================

  return (
    <MainLayout title="Manajemen Alat & Peminjaman">
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
              <Button onClick={handleCreateAlat} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Alat Baru
              </Button>
            ) : (
              <Button onClick={handleCreatePeminjaman} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Peminjaman
              </Button>
            )}
          </div>

          {/* TAB 1: ALAT */}
          <TabsContent value="alat" className="mt-0 space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Alat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsAlat.total}</div>
                  <p className="text-xs text-muted-foreground">Unit dalam inventaris</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tersedia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{statsAlat.tersedia}</div>
                  <p className="text-xs text-muted-foreground">Siap digunakan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sedang Dipinjam</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{statsAlat.dipinjam}</div>
                  <p className="text-xs text-muted-foreground">Unit sedang digunakan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kondisi Rusak</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{statsAlat.rusak}</div>
                  <p className="text-xs text-muted-foreground">Perlu perbaikan/tindakan</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Informasi Alat</CardTitle>
                <div className="w-[200px]">
                  <Select value={alatFilterStatus} onValueChange={setAlatFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Tersedia">Tersedia</SelectItem>
                      <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                      <SelectItem value="Rusak">Rusak</SelectItem>
                      <SelectItem value="Hilang">Hilang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredAlatList}
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
                {aktifPeminjamanList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Belum ada data peminjaman aktif</p>
                    <Button variant="link" onClick={handleCreatePeminjaman}>Buat Peminjaman Baru</Button>
                  </div>
                ) : (
                  <DataTable
                    data={aktifPeminjamanList}
                    columns={peminjamanColumns}
                    searchPlaceholder="Cari peminjam atau ID..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG: FORM ALAT */}
        <Dialog open={alatModalOpen} onOpenChange={(open) => { if (!open) resetGambarState(); setAlatModalOpen(open); }}>
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

              {/* Gambar Alat Section */}
              <div className="space-y-3">
                <Label>Gambar Alat</Label>
                {alatViewMode ? (
                  // View mode: gallery grid
                  (editGambarExisting.length > 0) ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editGambarExisting.map((g, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                          <img
                            src={g.url}
                            alt={`${alatFormData.namaAlat} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                      <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Belum ada gambar</p>
                    </div>
                  )
                ) : (
                  // Edit/Create mode
                  <div className="space-y-3">
                    {/* Existing + New Preview Images */}
                    {getDisplayGambarList().length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {getDisplayGambarList().map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={url}
                              alt={`Gambar ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const existingCount = editGambarExisting.length;
                                if (idx < existingCount) {
                                  const removed = editGambarExisting[idx];
                                  setDeletedGambarIds((prev) => [...prev, removed.id]);
                                  setEditGambarExisting((prev) => prev.filter((_, i) => i !== idx));
                                } else {
                                  const newIdx = idx - existingCount;
                                  URL.revokeObjectURL(editGambarNewPreviews[newIdx]);
                                  setEditGambarNewFiles((prev) => prev.filter((_, i) => i !== newIdx));
                                  setEditGambarNewPreviews((prev) => prev.filter((_, i) => i !== newIdx));
                                }
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <div
                      className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => document.getElementById('gambar-alat-upload')?.click()}
                    >
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Klik untuk upload gambar</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP (bisa pilih beberapa file)</p>
                    </div>
                    <input
                      id="gambar-alat-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const newFiles = Array.from(files);
                        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
                        setEditGambarNewFiles((prev) => [...prev, ...newFiles]);
                        setEditGambarNewPreviews((prev) => [...prev, ...newPreviews]);
                        toast.success(`${files.length} gambar ditambahkan`);
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}
              </div>

              {!alatViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAlatModalOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={isSubmittingAlat}>
                    {isSubmittingAlat && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan Data
                  </Button>
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

              {/* 2. Nama Peminjam */}
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

              {/* 5. Rincian Alat Terpilih */}
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
                <Button type="submit" disabled={isSubmittingPeminjaman}>
                  {isSubmittingPeminjaman && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedPeminjaman ? 'Simpan Perubahan' : 'Buat Peminjaman'}
                </Button>
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
                          const ids = viewPeminjamanData.alatIds || (viewPeminjamanData.alatId ? [viewPeminjamanData.alatId] : []);
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
                      // Only show alat that haven't been returned yet (status_kembali === '')
                      const alatDipinjam = peminjamanAlatMap[selectedPeminjaman?.id || ''] || [];
                      const notReturnedIds = alatDipinjam
                        .filter((pa) => pa.status_kembali === '')
                        .map((pa) => pa.alat);
                      const tools = alatList.filter(a => notReturnedIds.includes(a.id));

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
                                <SelectItem value="BelumDikembalikan">Belum dikembalikan</SelectItem>
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
              <Button variant="outline" onClick={() => setReturnModalOpen(false)} disabled={isConfirmingReturn}>Batal</Button>
              <Button onClick={handleConfirmReturn} disabled={isConfirmingReturn}>
                {isConfirmingReturn && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Konfirmasi Pengembalian
              </Button>
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
