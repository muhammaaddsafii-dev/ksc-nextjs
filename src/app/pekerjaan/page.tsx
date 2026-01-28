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
import { Plus, Edit, Trash2, Eye, Upload, X, FileText, Download, Users, CheckCircle2, Circle, Calendar, Flag, AlertTriangle, Clock, Loader2, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { useLelangStore } from '@/stores/lelangStore';
import { usePraKontrakStore } from '@/stores/praKontrakStore';
import { Pekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { TenderBadge } from '@/components/TenderBadge';
import { FileIcon, FileUploadButton, FileItem, DocumentTable, ProgressSummary, DeadlineBadge } from './components';
import { PekerjaanFormModal } from './components/modals';
import { InfoTab, DokumenTab, TimTab, TahapanTab, AnggaranTab } from './components/tabs';
import { getFileIconClass } from './utils/fileHelpers';
import { useTahapanManagement, useAnggaranManagement, useFileManagement, useFormManagement, initialFormData, type FormData } from './hooks';
import { calculateWeightedProgress, calculateTotalBobot, calculateSisaBobot } from './utils/calculations';
import { validateForm, validateBobot, validateTahapan, validateAnggaran, validateSisaBobot } from './utils/validation';
import { transformToFormData, transformToApiData } from './utils/transformers';

export default function PekerjaanPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem, addTahapan, updateTahapan, deleteTahapan, addAnggaran, deleteAnggaran } = usePekerjaanStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: lelangList, fetchItems: fetchLelang } = useLelangStore();
  const { items: praKontrakList, fetchItems: fetchPraKontrak } = usePraKontrakStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Pekerjaan | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchLelang();
    fetchPraKontrak();
  }, []);

  const formManagement = useFormManagement({
    initialData: initialFormData,
  });
  
  const { formData, setFormData, newTahapan, setNewTahapan, newAnggaran, setNewAnggaran, resetForm, loadFromSource } = formManagement;


  const tahapanManagement = useTahapanManagement({
    tahapan: formData.tahapan,
    onUpdate: (updatedTahapan) => {
      setFormData({ ...formData, tahapan: updatedTahapan });
    }
  });

  const anggaranManagement = useAnggaranManagement({
    anggaran: formData.anggaran,
    onUpdate: (updatedAnggaran) => {
      setFormData({ ...formData, anggaran: updatedAnggaran });
    }
  });

  const fileManagement = useFileManagement();

  const handleCreate = () => {
    setSelectedItem(null);
    resetForm();
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleEdit = (item: Pekerjaan) => {
    setSelectedItem(item);
    setFormData(transformToFormData(item));
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleView = (item: Pekerjaan) => {
    setSelectedItem(item);
    setFormData(transformToFormData(item));
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

    if (formData.tahapan.length > 0) {
      const bobotValidation = validateBobot(formData.tahapan);
      if (!bobotValidation.valid) {
        toast.error(bobotValidation.message);
        setActiveTab('tahapan');
        return;
      }
    }

    const calculatedProgress = calculateWeightedProgress(formData.tahapan);
    const dataToSubmit = {
      ...transformToApiData(formData),
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

    if (newTahapan.bobot <= 0) {
      toast.error('Bobot harus lebih dari 0%');
      return;
    }

    const totalBobotSekarang = formData.tahapan.reduce((sum, t) => sum + t.bobot, 0);
    if (totalBobotSekarang + newTahapan.bobot > 100) {
      toast.error(`Total bobot melebihi 100%. Sisa bobot: ${(100 - totalBobotSekarang).toFixed(1)}%`);
      return;
    }

    const nomorBerikutnya = formData.tahapan.length > 0
      ? Math.max(...formData.tahapan.map(t => t.nomor || 0)) + 1
      : 1;

    setFormData({
      ...formData,
      tahapan: [...formData.tahapan, { ...newTahapan, id: Date.now().toString(), nomor: nomorBerikutnya }]
    });
    setNewTahapan({ nama: '', progress: 0, tanggalMulai: new Date(), tanggalSelesai: new Date(), status: 'pending', bobot: 0, files: [], nomor: 0 });
    toast.success('Tahapan ditambahkan');
  };

  const handleTahapanFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileNames = Array.from(files).map(file => {
      return `uploads/tahapan/${Date.now()}_${file.name}`;
    });

    setNewTahapan({
      ...newTahapan,
      files: [...(newTahapan.files || []), ...fileNames]
    });
    toast.success(`${files.length} file ditambahkan`);
  };

  const handleAnggaranFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileNames = Array.from(files).map(file => {
      return `uploads/anggaran/${Date.now()}_${file.name}`;
    });

    setNewAnggaran({
      ...newAnggaran,
      files: [...(newAnggaran.files || []), ...fileNames]
    });
    toast.success(`${files.length} file ditambahkan`);
  };

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



  const handleDownloadFile = (filePath: string) => {
    const fileName = filePath.split('/').pop() || 'document';
    const dummyContent = `Ini adalah file: ${fileName}\n\nFile ini merupakan dokumen bukti yang diupload.\n\nDalam production, file ini akan diambil dari server storage.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`Mengunduh: ${fileName}`);
  };

  const removeTahapanFile = (fileName: string) => {
    setNewTahapan({
      ...newTahapan,
      files: newTahapan.files?.filter(f => f !== fileName) || []
    });
  };

  const removeAnggaranFile = (fileName: string) => {
    setNewAnggaran({
      ...newAnggaran,
      files: newAnggaran.files?.filter(f => f !== fileName) || []
    });
  };


  const removeExistingTahapanFile = (tahapanIdx: number, fileName: string) => {
    const newTahapan = [...formData.tahapan];
    newTahapan[tahapanIdx].files = newTahapan[tahapanIdx].files?.filter(f => f !== fileName) || [];
    setFormData({ ...formData, tahapan: newTahapan });
  };

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

  const handleEditAnggaran = (anggaran: AnggaranItem) => {
    anggaranManagement.handleEditAnggaran(anggaran);
  };;

  const handleSaveEditAnggaran = () => {
    anggaranManagement.handleSaveEditAnggaran();
  };;

  const handleCancelEditAnggaran = () => {
    anggaranManagement.handleCancelEditAnggaran();
  };;

  const handleEditTahapan = (tahapan: TahapanKerja) => {
    tahapanManagement.handleEditTahapan(tahapan);
  };;

  const handleSaveEditTahapan = () => {
    tahapanManagement.handleSaveEditTahapan();
  };

  const handleCancelEditTahapan = () => {
    tahapanManagement.setEditTahapanData(null);
  };

  const handleMoveTahapanUp = (tahapanId: string) => {
    const currentIndex = formData.tahapan.findIndex(t => t.id === tahapanId);
    if (currentIndex <= 0) return;

    const newTahapan = [...formData.tahapan];
    [newTahapan[currentIndex - 1], newTahapan[currentIndex]] =
      [newTahapan[currentIndex], newTahapan[currentIndex - 1]];

    const reorderedTahapan = newTahapan.map((t, index) => ({
      ...t,
      nomor: index + 1
    }));

    setFormData({ ...formData, tahapan: reorderedTahapan });
    toast.success('Urutan tahapan diperbarui');
  };

  const handleMoveTahapanDown = (tahapanId: string) => {
    const currentIndex = formData.tahapan.findIndex(t => t.id === tahapanId);
    if (currentIndex >= formData.tahapan.length - 1) return;

    const newTahapan = [...formData.tahapan];
    [newTahapan[currentIndex], newTahapan[currentIndex + 1]] =
      [newTahapan[currentIndex + 1], newTahapan[currentIndex]];

    const reorderedTahapan = newTahapan.map((t, index) => ({
      ...t,
      nomor: index + 1
    }));

    setFormData({ ...formData, tahapan: reorderedTahapan });
    toast.success('Urutan tahapan diperbarui');
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
      key: 'deadline',
      header: 'Deadline',
      render: (item: Pekerjaan) => <DeadlineBadge item={item} />,
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
  const totalBobot = calculateTotalBobot(formData.tahapan);
  const sisaBobot = calculateSisaBobot(formData.tahapan);

  const handleLoadFromSource = (sourceType: 'lelang' | 'non-lelang', sourceId: string) => {
    const source = sourceType === 'lelang' 
      ? lelangList.find(l => l.id === sourceId)
      : praKontrakList.find(p => p.id === sourceId);
    
    if (source) {
      loadFromSource(sourceType, source);
    }
  };

  const lelangMenang = lelangList.filter(l => l.status === 'menang');

  const praKontrakDeal = praKontrakList.filter(p => p.status === 'kontrak');

  return (
    <MainLayout title="Pekerjaan / Project Execution">
      <div className="space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="nomorKontrak" className="text-xs sm:text-sm">Nomor Kontrak <span className="text-red-500">*</span></Label>
                      <Input
                        id="nomorKontrak"
                        value={formData.nomorKontrak}
                        onChange={(e) => setFormData({ ...formData, nomorKontrak: e.target.value })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-xs sm:text-sm">Status <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: string) => setFormData({ ...formData, status: value as FormData['status'] })}
                        disabled={viewMode}
                      >
                        <SelectTrigger className="text-sm">
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
                      <Label htmlFor="tenderType" className="text-xs sm:text-sm">Jenis Tender <span className="text-red-500">*</span></Label>
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
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Pilih jenis tender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lelang">Lelang</SelectItem>
                          <SelectItem value="non-lelang">Non Lelang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="jenisPekerjaan" className="text-xs sm:text-sm">Jenis Pekerjaan <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.jenisPekerjaan}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            jenisPekerjaan: value as FormData['jenisPekerjaan'],
                          })
                        }
                        disabled={viewMode}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Pilih jenis pekerjaan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AMDAL">AMDAL</SelectItem>
                          <SelectItem value="PPKH">PPKH</SelectItem>
                          <SelectItem value="LAIN-LAIN">LAIN-LAIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="namaProyek" className="text-xs sm:text-sm">Nama Proyek <span className="text-red-500">*</span></Label>
                      <Input
                        id="namaProyek"
                        value={formData.namaProyek}
                        onChange={(e) => setFormData({ ...formData, namaProyek: e.target.value })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="klien" className="text-xs sm:text-sm">Klien <span className="text-red-500">*</span></Label>
                      <Input
                        id="klien"
                        value={formData.klien}
                        onChange={(e) => setFormData({ ...formData, klien: e.target.value })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nilaiKontrak" className="text-xs sm:text-sm">Nilai Kontrak <span className="text-red-500">*</span></Label>
                      <Input
                        id="nilaiKontrak"
                        type="number"
                        value={formData.nilaiKontrak}
                        onChange={(e) => setFormData({ ...formData, nilaiKontrak: Number(e.target.value) })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="pic" className="text-xs sm:text-sm">PIC <span className="text-red-500">*</span></Label>
                      <Input
                        id="pic"
                        value={formData.pic}
                        onChange={(e) => setFormData({ ...formData, pic: e.target.value })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalMulai" className="text-xs sm:text-sm">Tanggal Mulai <span className="text-red-500">*</span></Label>
                      <Input
                        id="tanggalMulai"
                        type="date"
                        value={formatDateInput(formData.tanggalMulai)}
                        onChange={(e) => setFormData({ ...formData, tanggalMulai: new Date(e.target.value) })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalSelesai" className="text-xs sm:text-sm">Tanggal Selesai <span className="text-red-500">*</span></Label>
                      <Input
                        id="tanggalSelesai"
                        type="date"
                        value={formatDateInput(formData.tanggalSelesai)}
                        onChange={(e) => setFormData({ ...formData, tanggalSelesai: new Date(e.target.value) })}
                        disabled={viewMode}
                        required
                        className="text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Dokumen - Tabel Format */}
                <DokumenTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                />

                {/* Tab TIM - Format Tabel Tanpa Circle dan Status */}
                <TimTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                  tenagaAhliList={tenagaAhliList}
                />

                {/* Tab TAHAPAN - Timeline Infografis */}
                <TahapanTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                  newTahapan={newTahapan}
                  setNewTahapan={setNewTahapan}
                  tahapanManagement={tahapanManagement}
                  fileManagement={fileManagement}
                  handleAddTahapan={handleAddTahapan}
                  handleTahapanFileUpload={handleTahapanFileUpload}
                  handleExistingTahapanFileUpload={handleExistingTahapanFileUpload}
                  removeTahapanFile={removeTahapanFile}
                  removeExistingTahapanFile={removeExistingTahapanFile}
                />

                {/* MODIFIED: Tab Anggaran dengan pengelompokan berdasarkan tahapan */}
                <AnggaranTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                  newAnggaran={newAnggaran}
                  setNewAnggaran={setNewAnggaran}
                  anggaranManagement={anggaranManagement}
                  fileManagement={fileManagement}
                  handleAddAnggaran={handleAddAnggaran}
                  handleAnggaranFileUpload={handleAnggaranFileUpload}
                  handleExistingAnggaranFileUpload={handleExistingAnggaranFileUpload}
                  removeAnggaranFile={removeAnggaranFile}
                  removeExistingAnggaranFile={removeExistingAnggaranFile}
                  totalAnggaran={totalAnggaran}
                  totalRealisasi={totalRealisasi}
                />

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
