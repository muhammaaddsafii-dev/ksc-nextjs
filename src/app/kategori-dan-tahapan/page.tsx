'use client';

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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Eye, FolderOpen, ListChecks, X, Save } from 'lucide-react';
import { mockJenisPekerjaan, mockTahapanTemplate } from '@/mocks/data';
import { JenisPekerjaan, TahapanTemplate } from '@/types';
import { toast } from 'sonner';

type JenisFormData = Omit<JenisPekerjaan, 'id' | 'createdAt' | 'updatedAt'>;
type TahapanFormData = Omit<TahapanTemplate, 'id' | 'createdAt' | 'updatedAt'>;
type TahapanInput = {
  tempId: string;
  nama: string;
  deskripsi: string;
  urutan: number;
  bobotDefault: number;
  aktif: boolean;
};

const initialJenisFormData: JenisFormData = {
  kode: '',
  nama: '',
  deskripsi: '',
  warna: '#3B82F6',
  aktif: true,
};

const initialTahapanInput: TahapanInput = {
  tempId: '',
  nama: '',
  deskripsi: '',
  urutan: 1,
  bobotDefault: 0,
  aktif: true,
};

export default function KategoriDanTahapanPage() {
  // State untuk Jenis Pekerjaan
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<JenisPekerjaan[]>(mockJenisPekerjaan);
  const [jenisModalOpen, setJenisModalOpen] = useState(false);
  const [jenisDeleteDialogOpen, setJenisDeleteDialogOpen] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState<JenisPekerjaan | null>(null);
  const [jenisFormData, setJenisFormData] = useState<JenisFormData>(initialJenisFormData);
  const [jenisViewMode, setJenisViewMode] = useState(false);

  // State untuk Tahapan Template
  const [tahapanTemplateList, setTahapanTemplateList] = useState<TahapanTemplate[]>(mockTahapanTemplate);
  const [tahapanModalOpen, setTahapanModalOpen] = useState(false);
  const [tahapanDeleteDialogOpen, setTahapanDeleteDialogOpen] = useState(false);
  const [selectedTahapan, setSelectedTahapan] = useState<TahapanTemplate | null>(null);
  const [tahapanViewMode, setTahapanViewMode] = useState(false);

  // State untuk batch input tahapan
  const [selectedJenisId, setSelectedJenisId] = useState<string>('');
  const [tahapanInputList, setTahapanInputList] = useState<TahapanInput[]>([]);
  const [currentTahapanInput, setCurrentTahapanInput] = useState<TahapanInput>(initialTahapanInput);

  // ========== JENIS PEKERJAAN HANDLERS ==========

  const handleCreateJenis = () => {
    setSelectedJenis(null);
    setJenisFormData(initialJenisFormData);
    setJenisViewMode(false);
    setJenisModalOpen(true);
  };

  const handleEditJenis = (item: JenisPekerjaan) => {
    setSelectedJenis(item);
    setJenisFormData({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      warna: item.warna,
      aktif: item.aktif,
    });
    setJenisViewMode(false);
    setJenisModalOpen(true);
  };

  const handleViewJenis = (item: JenisPekerjaan) => {
    setSelectedJenis(item);
    setJenisFormData({
      kode: item.kode,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      warna: item.warna,
      aktif: item.aktif,
    });
    setJenisViewMode(true);
    setJenisModalOpen(true);
  };

  const handleDeleteJenis = (item: JenisPekerjaan) => {
    setSelectedJenis(item);
    setJenisDeleteDialogOpen(true);
  };

  const confirmDeleteJenis = () => {
    if (selectedJenis) {
      setJenisPekerjaanList(prev => prev.filter(j => j.id !== selectedJenis.id));
      setTahapanTemplateList(prev => prev.filter(t => t.jenisPekerjaanId !== selectedJenis.id));
      toast.success('Jenis pekerjaan berhasil dihapus');
    }
    setJenisDeleteDialogOpen(false);
    setSelectedJenis(null);
  };

  const handleSubmitJenis = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jenisFormData.kode || !jenisFormData.nama) {
      toast.error('Kode dan Nama harus diisi!');
      return;
    }

    if (selectedJenis) {
      setJenisPekerjaanList(prev =>
        prev.map(jenis =>
          jenis.id === selectedJenis.id
            ? { ...jenis, ...jenisFormData, updatedAt: new Date() }
            : jenis
        )
      );
      toast.success('Jenis pekerjaan berhasil diperbarui');
    } else {
      const newJenis: JenisPekerjaan = {
        id: Date.now().toString(),
        ...jenisFormData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setJenisPekerjaanList(prev => [...prev, newJenis]);
      toast.success('Jenis pekerjaan berhasil ditambahkan');
    }

    setJenisModalOpen(false);
  };

  // ========== TAHAPAN TEMPLATE HANDLERS ==========

  const handleCreateTahapan = () => {
    setSelectedTahapan(null);
    setSelectedJenisId('');
    setTahapanInputList([]);
    setCurrentTahapanInput({ ...initialTahapanInput, urutan: 1 });
    setTahapanViewMode(false);
    setTahapanModalOpen(true);
  };

  const handleViewTahapan = (item: TahapanTemplate) => {
    setSelectedTahapan(item);
    setSelectedJenisId(item.jenisPekerjaanId);
    setTahapanInputList([{
      tempId: item.id,
      nama: item.nama,
      deskripsi: item.deskripsi || '',
      urutan: item.urutan,
      bobotDefault: item.bobotDefault,
      aktif: item.aktif,
    }]);
    setTahapanViewMode(true);
    setTahapanModalOpen(true);
  };

  const handleDeleteTahapan = (item: TahapanTemplate) => {
    setSelectedTahapan(item);
    setTahapanDeleteDialogOpen(true);
  };

  const confirmDeleteTahapan = () => {
    if (selectedTahapan) {
      setTahapanTemplateList(prev => prev.filter(t => t.id !== selectedTahapan.id));
      toast.success('Template tahapan berhasil dihapus');
    }
    setTahapanDeleteDialogOpen(false);
    setSelectedTahapan(null);
  };

  // Add tahapan to list
  const handleAddTahapanToList = () => {
    if (!selectedJenisId) {
      toast.error('Pilih jenis pekerjaan terlebih dahulu!');
      return;
    }
    if (!currentTahapanInput.nama) {
      toast.error('Nama tahapan harus diisi!');
      return;
    }
    if (currentTahapanInput.bobotDefault < 0 || currentTahapanInput.bobotDefault > 100) {
      toast.error('Bobot harus antara 0-100!');
      return;
    }

    const newTahapan: TahapanInput = {
      ...currentTahapanInput,
      tempId: Date.now().toString(),
      urutan: tahapanInputList.length + 1,
    };

    setTahapanInputList(prev => [...prev, newTahapan]);
    setCurrentTahapanInput({
      ...initialTahapanInput,
      urutan: tahapanInputList.length + 2,
    });
    toast.success('Tahapan ditambahkan ke daftar');
  };

  // Remove tahapan from list
  const handleRemoveTahapanFromList = (tempId: string) => {
    setTahapanInputList(prev => {
      const updated = prev.filter(t => t.tempId !== tempId);
      // Re-number urutan
      return updated.map((t, idx) => ({ ...t, urutan: idx + 1 }));
    });
    setCurrentTahapanInput({
      ...currentTahapanInput,
      urutan: tahapanInputList.length, // Will be length - 1 + 1
    });
    toast.success('Tahapan dihapus dari daftar');
  };

  // Edit tahapan in list
  const handleEditTahapanInList = (tahapan: TahapanInput) => {
    setCurrentTahapanInput(tahapan);
    setTahapanInputList(prev => prev.filter(t => t.tempId !== tahapan.tempId));
  };

  // Save all tahapan
  const handleSaveAllTahapan = () => {
    if (!selectedJenisId) {
      toast.error('Pilih jenis pekerjaan terlebih dahulu!');
      return;
    }

    if (tahapanInputList.length === 0) {
      toast.error('Tambahkan minimal satu tahapan!');
      return;
    }

    // Check total bobot
    const totalBobot = tahapanInputList.reduce((sum, t) => sum + t.bobotDefault, 0);
    if (totalBobot > 100) {
      toast.error(`Total bobot melebihi 100% (${totalBobot}%)`);
      return;
    }

    // Save all tahapan
    const newTahapanList: TahapanTemplate[] = tahapanInputList.map(input => ({
      id: Date.now().toString() + Math.random().toString(),
      jenisPekerjaanId: selectedJenisId,
      nama: input.nama,
      deskripsi: input.deskripsi,
      urutan: input.urutan,
      bobotDefault: input.bobotDefault,
      aktif: input.aktif,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    setTahapanTemplateList(prev => [...prev, ...newTahapanList]);
    toast.success(`${newTahapanList.length} template tahapan berhasil ditambahkan!`);
    setTahapanModalOpen(false);
  };

  // ========== HELPER FUNCTIONS ==========

  const getJenisNama = (jenisId: string) => {
    return jenisPekerjaanList.find(j => j.id === jenisId)?.nama || 'Unknown';
  };

  const getJenisKode = (jenisId: string) => {
    return jenisPekerjaanList.find(j => j.id === jenisId)?.kode || 'N/A';
  };

  const getJenisWarna = (jenisId: string) => {
    return jenisPekerjaanList.find(j => j.id === jenisId)?.warna || '#3B82F6';
  };

  const getTotalBobotByJenis = (jenisId: string) => {
    return tahapanTemplateList
      .filter(t => t.jenisPekerjaanId === jenisId && t.aktif)
      .reduce((sum, t) => sum + t.bobotDefault, 0);
  };

  const getTahapanCountByJenis = (jenisId: string) => {
    return tahapanTemplateList.filter(t => t.jenisPekerjaanId === jenisId).length;
  };

  // Calculate total bobot from current input list
  const getTotalBobotInputList = () => {
    return tahapanInputList.reduce((sum, t) => sum + t.bobotDefault, 0);
  };

  // Calculate remaining weight
  const getSisaBobot = () => {
    return 100 - getTotalBobotInputList();
  };

  // Group tahapan by jenis pekerjaan
  const groupedTahapan = useMemo(() => {
    const groups: Record<string, TahapanTemplate[]> = {};

    tahapanTemplateList.forEach(tahapan => {
      if (!groups[tahapan.jenisPekerjaanId]) {
        groups[tahapan.jenisPekerjaanId] = [];
      }
      groups[tahapan.jenisPekerjaanId].push(tahapan);
    });

    // Sort tahapan by urutan within each group
    Object.keys(groups).forEach(jenisId => {
      groups[jenisId].sort((a, b) => a.urutan - b.urutan);
    });

    return groups;
  }, [tahapanTemplateList]);

  // ========== TABLE COLUMNS ==========

  const jenisColumns = [
    {
      key: 'kode',
      header: 'Jenis Pekerjaan',
      sortable: true,
      render: (item: JenisPekerjaan) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
          <div
            className="w-4 h-4 rounded flex-shrink-0"
            style={{ backgroundColor: item.warna }}
          />
          <div className="min-w-0">
            <p className="font-medium text-sm">{item.kode}</p>
            <p className="text-xs text-muted-foreground truncate">{item.nama}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'deskripsi',
      header: 'Deskripsi',
      render: (item: JenisPekerjaan) => (
        <p className="text-sm text-muted-foreground line-clamp-2 min-w-[200px]">
          {item.deskripsi || '-'}
        </p>
      ),
    },
    {
      key: 'tahapan',
      header: 'Tahapan',
      render: (item: JenisPekerjaan) => (
        <div className="text-center min-w-[100px]">
          <p className="text-sm font-medium">{getTahapanCountByJenis(item.id)}</p>
          <p className="text-xs text-muted-foreground">template</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: JenisPekerjaan) => (
        <div className="flex items-center gap-1 justify-center min-w-[120px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleViewJenis(item);
            }}
            title="Lihat Detail"
          >
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEditJenis(item);
            }}
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteJenis(item);
            }}
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState("jenis");

  return (
    <MainLayout title="Kategori & Tahapan Pekerjaan">
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 min-w-[300px]">
              <TabsTrigger value="jenis" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Jenis Pekerjaan
              </TabsTrigger>
              <TabsTrigger value="tahapan" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Template Tahapan
              </TabsTrigger>
            </TabsList>

            {activeTab === 'jenis' ? (
              <Button onClick={handleCreateJenis}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jenis Pekerjaan
              </Button>
            ) : (
              <Button onClick={handleCreateTahapan}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Template Tahapan
              </Button>
            )}
          </div>

          {/* Jenis Pekerjaan Tab */}
          <TabsContent value="jenis" className="space-y-4 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daftar Jenis Pekerjaan</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={jenisPekerjaanList}
                  columns={jenisColumns}
                  searchPlaceholder="Cari jenis pekerjaan..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Template Tahapan Tab */}
          <TabsContent value="tahapan" className="space-y-4 mt-0">

            {/* Grouped Tahapan by Jenis Pekerjaan */}
            <div className="space-y-4">
              {Object.entries(groupedTahapan).map(([jenisId, tahapanList]) => {
                const jenis = jenisPekerjaanList.find(j => j.id === jenisId);
                if (!jenis) return null;

                const totalBobot = tahapanList.reduce((sum, t) => sum + t.bobotDefault, 0);
                const activeCount = tahapanList.filter(t => t.aktif).length;

                return (
                  <Card key={jenisId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: jenis.warna }}
                          />
                          <div>
                            <CardTitle className="text-base">
                              {jenis.kode} - {jenis.nama}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tahapanList.length} tahapan • {activeCount} aktif • Total bobot: {totalBobot}%
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={totalBobot === 100 ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {totalBobot}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tahapanList.map((tahapan) => (
                          <div
                            key={tahapan.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                #{tahapan.urutan}
                              </Badge>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{tahapan.nama}</p>
                                  {!tahapan.aktif && (
                                    <Badge variant="secondary" className="text-xs">
                                      Nonaktif
                                    </Badge>
                                  )}
                                </div>
                                {tahapan.deskripsi && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {tahapan.deskripsi}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {tahapan.bobotDefault}%
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 ml-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => handleViewTahapan(tahapan)}
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => handleDeleteTahapan(tahapan)}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {Object.keys(groupedTahapan).length === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Belum ada template tahapan</p>
                      <p className="text-xs mt-1">Silakan tambah template tahapan baru</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Form Modal Jenis Pekerjaan */}
        <Dialog open={jenisModalOpen} onOpenChange={setJenisModalOpen}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>
                {jenisViewMode
                  ? 'Detail Jenis Pekerjaan'
                  : selectedJenis
                    ? 'Edit Jenis Pekerjaan'
                    : 'Tambah Jenis Pekerjaan Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitJenis} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="kode">Kode</Label>
                  <Input
                    id="kode"
                    value={jenisFormData.kode}
                    onChange={(e) =>
                      setJenisFormData({ ...jenisFormData, kode: e.target.value.toUpperCase() })
                    }
                    disabled={jenisViewMode}
                    placeholder="AMDAL, PPKH, dll"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nama">Nama</Label>
                  <Input
                    id="nama"
                    value={jenisFormData.nama}
                    onChange={(e) =>
                      setJenisFormData({ ...jenisFormData, nama: e.target.value })
                    }
                    disabled={jenisViewMode}
                    placeholder="Nama lengkap jenis pekerjaan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={jenisFormData.deskripsi}
                    onChange={(e) =>
                      setJenisFormData({ ...jenisFormData, deskripsi: e.target.value })
                    }
                    disabled={jenisViewMode}
                    placeholder="Deskripsi singkat (opsional)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="warna">Warna</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      id="warna"
                      type="color"
                      value={jenisFormData.warna}
                      onChange={(e) =>
                        setJenisFormData({ ...jenisFormData, warna: e.target.value })
                      }
                      disabled={jenisViewMode}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={jenisFormData.warna}
                      onChange={(e) =>
                        setJenisFormData({ ...jenisFormData, warna: e.target.value })
                      }
                      disabled={jenisViewMode}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                {jenisViewMode ? (
                  <Button type="button" onClick={() => setJenisModalOpen(false)} className="w-full sm:w-auto">
                    Tutup
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setJenisModalOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Batal
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      {selectedJenis ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Form Modal Template Tahapan - Batch Input */}
        <Dialog open={tahapanModalOpen} onOpenChange={setTahapanModalOpen}>
          <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {tahapanViewMode ? 'Detail Template Tahapan' : 'Tambah Template Tahapan'}
              </DialogTitle>
            </DialogHeader>

            {!tahapanViewMode ? (
              <div className="space-y-6">
                {/* Select Jenis Pekerjaan */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-700">
                    Pilih Jenis Pekerjaan <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedJenisId}
                    onValueChange={setSelectedJenisId}
                  >
                    <SelectTrigger className="h-10 border-gray-300">
                      <SelectValue placeholder="Pilih Jenis Pekerjaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisPekerjaanList
                        .filter((j) => j.aktif)
                        .map((jenis) => (
                          <SelectItem key={jenis.id} value={jenis.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: jenis.warna }}
                              />
                              {jenis.kode} - {jenis.nama}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedJenisId && (
                  <>
                    {/* Form Input Tahapan */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Tambah Tahapan</h3>
                          <p className="text-xs text-gray-500">Isi form dan klik tombol Tambah ke Daftar</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Row 1: Nomor & Nama */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">Nomor Urut</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={currentTahapanInput.urutan}
                                className="h-10 pr-8 font-semibold text-center bg-gray-100 border-gray-300"
                                disabled
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                                Auto
                              </div>
                            </div>
                          </div>
                          <div className="sm:col-span-3 space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-700">
                              Nama Tahapan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              placeholder="Contoh: Perencanaan, Desain, Pengembangan..."
                              value={currentTahapanInput.nama}
                              onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, nama: e.target.value })}
                              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Row 2: Deskripsi */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">Deskripsi</Label>
                          <Textarea
                            placeholder="Deskripsi singkat tentang tahapan ini (opsional)"
                            value={currentTahapanInput.deskripsi}
                            onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, deskripsi: e.target.value })}
                            rows={2}
                          />
                        </div>

                        {/* Row 3: Bobot */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-700">
                            Bobot (%) <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.0"
                              min="0"
                              max="100"
                              step="0.1"
                              value={currentTahapanInput.bobotDefault || ''}
                              onChange={(e) => setCurrentTahapanInput({ ...currentTahapanInput, bobotDefault: parseFloat(e.target.value) || 0 })}
                              className="h-10 pr-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                              %
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Sisa bobot: <span className="font-semibold">{getSisaBobot().toFixed(1)}%</span>
                          </p>
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            onClick={handleAddTahapanToList}
                            className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah ke Daftar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* List Tahapan yang sudah ditambahkan */}
                    {tahapanInputList.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">
                            Daftar Tahapan ({tahapanInputList.length})
                          </Label>
                          <Badge variant={getTotalBobotInputList() === 100 ? 'default' : 'secondary'}>
                            Total: {getTotalBobotInputList().toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {tahapanInputList.map((tahapan) => (
                            <div
                              key={tahapan.tempId}
                              className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  #{tahapan.urutan}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm">{tahapan.nama}</p>
                                  {tahapan.deskripsi && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                      {tahapan.deskripsi}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {tahapan.bobotDefault}%
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 ml-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => handleEditTahapanInList(tahapan)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => handleRemoveTahapanFromList(tahapan.tempId)}
                                  title="Hapus"
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setTahapanModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveAllTahapan}
                    disabled={tahapanInputList.length === 0}
                    className="w-full sm:w-auto h-10 px-6 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Semua ({tahapanInputList.length})
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Jenis Pekerjaan</Label>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getJenisWarna(selectedJenisId) }}
                    />
                    <span>{getJenisKode(selectedJenisId)} - {getJenisNama(selectedJenisId)}</span>
                  </div>
                </div>

                {tahapanInputList.map((tahapan) => (
                  <div key={tahapan.tempId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nama Tahapan</Label>
                        <p className="font-medium">{tahapan.nama}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Urutan</Label>
                        <p className="font-medium">#{tahapan.urutan}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                        <p className="text-sm">{tahapan.deskripsi || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Bobot</Label>
                        <p className="font-medium">{tahapan.bobotDefault}%</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="button"
                    onClick={() => setTahapanModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Jenis Pekerjaan */}
        <ConfirmDialog
          open={jenisDeleteDialogOpen}
          onOpenChange={setJenisDeleteDialogOpen}
          title="Hapus Jenis Pekerjaan"
          description={`Apakah Anda yakin ingin menghapus "${selectedJenis?.nama}"? Semua template tahapan terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDeleteJenis}
          confirmText="Hapus"
          variant="destructive"
        />

        {/* Delete Confirmation Template Tahapan */}
        <ConfirmDialog
          open={tahapanDeleteDialogOpen}
          onOpenChange={setTahapanDeleteDialogOpen}
          title="Hapus Template Tahapan"
          description={`Apakah Anda yakin ingin menghapus template "${selectedTahapan?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDeleteTahapan}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
