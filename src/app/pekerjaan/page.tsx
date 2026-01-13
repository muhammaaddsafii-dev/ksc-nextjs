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
import { Plus, Edit, Trash2, Eye, Upload, X, FileText, Download, FileImage, File, FileSpreadsheet, Users, CheckCircle2, Circle } from 'lucide-react';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { Pekerjaan, TahapanKerja, AnggaranItem } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { TenderBadge } from '@/components/TenderBadge';

type FormData = Omit<Pekerjaan, 'id' | 'createdAt' | 'updatedAt'>;

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
};

export default function PekerjaanPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem, addTahapan, updateTahapan, deleteTahapan, addAnggaran, deleteAnggaran } = usePekerjaanStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
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
      tenderType: item.tenderType,

    });
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
  };

  const handleView = (item: Pekerjaan) => {
    setSelectedItem(item);
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
      tenderType: item.tenderType,
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
    switch(ext) {
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
    switch(ext) {
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
        <div>
          <p className="font-medium">{item.namaProyek}</p>
          <p className="text-sm text-muted-foreground">{item.nomorKontrak}</p>
        </div>
      ),
    },
    {
      key: 'klien',
      header: 'Klien',
      sortable: true,
    },
    {
      key: 'nilaiKontrak',
      header: 'Nilai Kontrak',
      sortable: true,
      render: (item: Pekerjaan) => formatCurrency(item.nilaiKontrak),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (item: Pekerjaan) => (
        <div className="w-24">
          <div className="flex items-center gap-2">
            <Progress value={item.progress} className="h-2" />
            <span className="text-sm">{item.progress}%</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Pekerjaan) => <StatusBadge status={item.status} />,
    },
    {
      key: 'tenderType',
      header: 'Tender',
      render: (item: Pekerjaan) => (
        <TenderBadge type={item.tenderType} />
      ),
    },

    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Pekerjaan) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(item); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
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

  return (
    <MainLayout title="Pekerjaan / Project Execution">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Kelola proyek yang sedang berjalan
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pekerjaan
          </Button>
        </div>

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Pekerjaan' : selectedItem ? 'Edit Pekerjaan' : 'Tambah Pekerjaan Baru'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informasi</TabsTrigger>
                <TabsTrigger value="tim">Tim</TabsTrigger>
                <TabsTrigger value="tahapan">Tahapan</TabsTrigger>
                <TabsTrigger value="anggaran">Anggaran</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="info" className="space-y-4 mt-4">
                  {formData.tahapan.length > 0 && (
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
                  )}
                  <div className="grid grid-cols-2 gap-4">
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

                <TabsContent value="tim" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Tim Proyek</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.tim.length > 0 
                          ? `${formData.tim.length} tenaga ahli terpilih` 
                          : 'Pilih tenaga ahli untuk proyek ini'}
                      </p>
                    </div>
                  </div>

                  {tenagaAhliList.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg bg-muted/50">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">Belum ada data tenaga ahli</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tenagaAhliList.map((ta) => {
                        const isSelected = formData.tim.includes(ta.id);
                        return (
                          <div
                            key={ta.id}
                            className={`relative p-4 border-2 rounded-lg transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-border hover:border-primary/50 hover:shadow-sm'
                            } ${
                              viewMode ? 'cursor-default' : ''
                            }`}
                            onClick={() => {
                              if (viewMode) return;
                              setFormData({
                                ...formData,
                                tim: isSelected
                                  ? formData.tim.filter(id => id !== ta.id)
                                  : [...formData.tim, ta.id]
                              });
                            }}
                          >
                            {/* Checkbox indicator */}
                            <div className="absolute top-3 right-3">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="pr-8">
                              {/* Header */}
                              <div className="flex items-start gap-3 mb-3">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {ta.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                
                                {/* Name & Position */}
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base leading-tight">{ta.nama}</h4>
                                  <p className="text-sm text-muted-foreground">{ta.jabatan}</p>
                                </div>
                              </div>

                              {/* Keahlian */}
                              {ta.keahlian && ta.keahlian.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {ta.keahlian.slice(0, 3).map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          isSelected 
                                            ? 'bg-primary/20 text-primary' 
                                            : 'bg-muted text-muted-foreground'
                                        }`}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {ta.keahlian.length > 3 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                        +{ta.keahlian.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Info tambahan */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${
                                    ta.status === 'tersedia' ? 'bg-green-500' :
                                    ta.status === 'ditugaskan' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`} />
                                  <span className="capitalize">{ta.status}</span>
                                </div>
                                {ta.sertifikat && ta.sertifikat.length > 0 && (
                                  <div>
                                    📜 {ta.sertifikat.length} sertifikat
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary */}
                  {formData.tim.length > 0 && (
                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Tim Terpilih</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.tim.map((timId) => {
                              const member = tenagaAhliList.find(ta => ta.id === timId);
                              if (!member) return null;
                              return (
                                <div key={timId} className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-md">
                                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                                    {member.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-sm">{member.nama}</span>
                                  {!viewMode && (
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData({
                                          ...formData,
                                          tim: formData.tim.filter(id => id !== timId)
                                        });
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tahapan" className="space-y-4 mt-4">
                  {!viewMode && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Total Bobot Tahapan</p>
                          <p className="text-xs text-blue-700">Pastikan total bobot semua tahapan = 100%</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            Math.abs(totalBobot - 100) < 0.01 ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {totalBobot.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Sisa: {sisaBobot.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 p-4 bg-muted rounded-lg">
                        <div className="grid grid-cols-6 gap-2">
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
                  <div className="space-y-2">
                    {formData.tahapan.map((t, idx) => (
                      <div key={t.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium text-lg">{idx + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{t.nama}</span>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {t.bobot}%
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(t.tanggalMulai)} - {formatDate(t.tanggalSelesai)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                          {!viewMode ? (
                            <div className="w-40">
                              <Label htmlFor={`status-${idx}`} className="text-xs text-muted-foreground">Status</Label>
                              <Select
                                value={t.status}
                                onValueChange={(v: any) => {
                                  const newTahapan = [...formData.tahapan];
                                  newTahapan[idx].status = v as TahapanKerja['status'];
                                  setFormData({ ...formData, tahapan: newTahapan });
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="progress">Progress</SelectItem>
                                  <SelectItem value="done">Selesai</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="w-32">
                              <div className="text-xs text-muted-foreground mb-1">Status</div>
                              <StatusBadge status={t.status} />
                            </div>
                          )}
                            {!viewMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  tahapan: formData.tahapan.filter((_, i) => i !== idx)
                                })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* File Upload Section */}
                        {!viewMode && (
                          <div className="space-y-2 pl-8">
                            <div className="flex items-center gap-2">
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
                                onClick={() => document.getElementById(`tahapan-file-${idx}`)?.click()}
                              >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload Bukti
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Display Files */}
                        {t.files && t.files.length > 0 && (
                          <div className="pl-8">
                            <Label className="text-xs text-muted-foreground">File Bukti:</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {t.files.map((file, fileIdx) => {
                                const FileIcon = getFileIcon(file);
                                const fileColor = getFileColor(file);
                                return (
                                  <div key={fileIdx} className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-md border hover:bg-secondary/80 transition-colors">
                                    <FileIcon className={`h-3 w-3 ${fileColor}`} />
                                    <span className="text-xs max-w-[200px] truncate" title={file.split('/').pop()}>
                                      {file.split('/').pop()}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                                      onClick={() => handleDownloadFile(file)}
                                      title="Download file"
                                    >
                                      <Download className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                                    </Button>
                                    {!viewMode && (
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center ml-1"
                                        onClick={() => removeExistingTahapanFile(idx, file)}
                                        title="Hapus file"
                                      >
                                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* MODIFIED: Tab Anggaran dengan pengelompokan berdasarkan tahapan */}
                <TabsContent value="anggaran" className="space-y-4 mt-4">
                  {formData.tahapan.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">⚠️ Tambahkan Tahapan terlebih dahulu sebelum menambahkan anggaran.</p>
                    </div>
                  )}
                  {!viewMode && formData.tahapan.length > 0 && (
                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-6 gap-2">
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
                  
                  {/* MODIFIED: Tampilan anggaran dikelompokkan per tahapan */}
                  <div className="space-y-4">
                    {formData.tahapan.map((tahapan) => {
                      const anggaranTahapan = formData.anggaran.filter(a => a.tahapanId === tahapan.id);
                      const totalTahapan = anggaranTahapan.reduce((sum, a) => sum + a.jumlah, 0);
                      const realisasiTahapan = anggaranTahapan.reduce((sum, a) => sum + a.realisasi, 0);
                      
                      return (
                        <div key={tahapan.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{tahapan.nama}</h3>
                              <StatusBadge status={tahapan.status} />
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Total: <span className="font-semibold">{formatCurrency(totalTahapan)}</span>
                              {" | "}
                              Realisasi: <span className="font-semibold">{formatCurrency(realisasiTahapan)}</span>
                            </div>
                          </div>
                          {anggaranTahapan.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">Belum ada anggaran untuk tahapan ini</p>
                          ) : (
                            <div className="space-y-2">
                              {anggaranTahapan.map((a, idx) => (
                                <div key={a.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{a.kategori}</p>
                                      <p className="text-sm text-muted-foreground">{a.deskripsi}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="font-medium">{formatCurrency(a.jumlah)}</p>
                                        <p className="text-sm text-muted-foreground">Realisasi: {formatCurrency(a.realisasi)}</p>
                                      </div>
                                      {!viewMode && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setFormData({
                                            ...formData,
                                            anggaran: formData.anggaran.filter((item) => item.id !== a.id)
                                          })}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* File Upload Section for existing anggaran */}
                                  {!viewMode && (
                                    <div className="pl-4">
                                      <div className="flex items-center gap-2">
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
                                          onClick={() => document.getElementById(`anggaran-file-${a.id}`)?.click()}
                                        >
                                          <Upload className="h-3 w-3 mr-1" />
                                          Upload Bukti
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Display Files */}
                                  {a.files && a.files.length > 0 && (
                                    <div className="pl-4">
                                      <Label className="text-xs text-muted-foreground">File Bukti:</Label>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {a.files.map((file, fileIdx) => {
                                          const FileIcon = getFileIcon(file);
                                          const fileColor = getFileColor(file);
                                          return (
                                            <div key={fileIdx} className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-md border hover:bg-gray-50 transition-colors">
                                              <FileIcon className={`h-3 w-3 ${fileColor}`} />
                                              <span className="text-xs max-w-[200px] truncate" title={file.split('/').pop()}>
                                                {file.split('/').pop()}
                                              </span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                                                onClick={() => handleDownloadFile(file)}
                                                title="Download file"
                                              >
                                                <Download className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                                              </Button>
                                              {!viewMode && (
                                                <button
                                                  type="button"
                                                  className="inline-flex items-center justify-center ml-1"
                                                  onClick={() => removeExistingAnggaranFile(a.id, file)}
                                                  title="Hapus file"
                                                >
                                                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between">
                      <span>Total Anggaran:</span>
                      <span className="font-bold">{formatCurrency(totalAnggaran)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Realisasi:</span>
                      <span className="font-bold">{formatCurrency(totalRealisasi)}</span>
                    </div>
                  </div>
                </TabsContent>

                {!viewMode && (
                  <div className="flex justify-end gap-2 mt-6">
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
