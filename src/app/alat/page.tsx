"use client";

import { useEffect, useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Wrench, ImageIcon, Package, Upload, X, UserPlus, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { mockAlat } from '@/mocks/data';
import { Alat, PeminjamAlat } from '@/types';

interface PeminjamForm {
  nama: string;
  tanggalPinjam: string;
  estimasiKembali: string;
  jumlahDipinjam: number;
}

type KategoriAlat = {
  id: string;
  nama: string;
  deskripsi: string;
  createdAt: Date;
};

type FormData = Omit<Alat, 'id' | 'createdAt' | 'updatedAt'> & {
  kategoriId?: string;
};

const initialFormData: FormData = {
  namaAlat: '',
  kategori: '',
  merk: '',
  spesifikasi: '',
  kondisi: 'baik',
  status: 'tersedia',
  lokasiTerakhir: '',
  jumlahTotal: 1,
  jumlahTersedia: 1,
  gambarList: [],
  peminjam: [],
  kategoriId: undefined,
};

const initialPeminjamForm: PeminjamForm = {
  nama: '',
  tanggalPinjam: new Date().toISOString().split('T')[0],
  estimasiKembali: '',
  jumlahDipinjam: 1,
};

const kategoriOptions = ['Survey', 'Aerial Survey', 'Testing', 'Lab', 'Konstruksi', 'Lainnya'];

// Image Component with Error Handling
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Wrench className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)}
      unoptimized
    />
  );
};

// Image Slider Component
const ImageSlider = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        <div className="text-center">
          <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Tidak ada gambar</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted group">
      <SafeImage src={images[currentIndex]} alt={`Image ${currentIndex + 1}`} />

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Indicator Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'
                }`}
            />
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default function AlatPage() {
  const [items, setItems] = useState<Alat[]>(mockAlat);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Alat | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [peminjamForm, setPeminjamForm] = useState<PeminjamForm>(initialPeminjamForm);
  const [showPeminjamForm, setShowPeminjamForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk kategori alat
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriAlat[]>([
    { id: '1', nama: 'Survey', deskripsi: 'Alat-alat untuk kegiatan survey lapangan', createdAt: new Date() },
    { id: '2', nama: 'Testing', deskripsi: 'Alat-alat untuk testing dan pengujian material', createdAt: new Date() },
    { id: '3', nama: 'Aerial Survey', deskripsi: 'Alat untuk survey udara dan pemetaan', createdAt: new Date() },
  ]);
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [kategoriFormOpen, setKategoriFormOpen] = useState(false);
  const [kategoriFormData, setKategoriFormData] = useState({ nama: '', deskripsi: '' });
  const [editingKategori, setEditingKategori] = useState<KategoriAlat | null>(null);
  const [deleteKategoriDialogOpen, setDeleteKategoriDialogOpen] = useState(false);
  const [kategoriToDelete, setKategoriToDelete] = useState<KategoriAlat | null>(null);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setShowPeminjamForm(false);
    setModalOpen(true);
  };

  const handleEdit = (item: Alat) => {
    setSelectedItem(item);
    setFormData({
      namaAlat: item.namaAlat,
      kategori: item.kategori,
      merk: item.merk,
      spesifikasi: item.spesifikasi,
      kondisi: item.kondisi,
      status: item.status,
      lokasiTerakhir: item.lokasiTerakhir,
      jumlahTotal: item.jumlahTotal,
      jumlahTersedia: item.jumlahTersedia,
      gambarList: item.gambarList || [],
      peminjam: item.peminjam,
      kategoriId: (item as any).kategoriId,
    });
    setViewMode(false);
    setShowPeminjamForm(false);
    setModalOpen(true);
  };

  const handleView = (item: Alat) => {
    setSelectedItem(item);
    setFormData({
      namaAlat: item.namaAlat,
      kategori: item.kategori,
      merk: item.merk,
      spesifikasi: item.spesifikasi,
      kondisi: item.kondisi,
      status: item.status,
      lokasiTerakhir: item.lokasiTerakhir,
      jumlahTotal: item.jumlahTotal,
      jumlahTersedia: item.jumlahTersedia,
      gambarList: item.gambarList || [],
      peminjam: item.peminjam,
      kategoriId: (item as any).kategoriId,
    });
    setViewMode(true);
    setShowPeminjamForm(false);
    setModalOpen(true);
  };

  const handleDelete = (item: Alat) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setItems(items.filter(item => item.id !== selectedItem.id));
      toast.success('Alat berhasil dihapus');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      // Check file size (max 5MB per file)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} terlalu besar. Maksimal 5MB per file`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bukan file gambar`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        newImages.push(base64String);
        processedCount++;

        // When all files are processed
        if (processedCount === files.length) {
          const updatedImages = [...(formData.gambarList || []), ...newImages];
          setFormData({ ...formData, gambarList: updatedImages });
          toast.success(`${newImages.length} gambar berhasil diupload`);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = formData.gambarList?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, gambarList: updatedImages });
    toast.success('Gambar dihapus');
  };

  const handleAddPeminjam = () => {
    // Validasi
    if (!peminjamForm.nama.trim()) {
      toast.error('Nama peminjam harus diisi');
      return;
    }
    if (!peminjamForm.tanggalPinjam) {
      toast.error('Tanggal pinjam harus diisi');
      return;
    }
    if (!peminjamForm.estimasiKembali) {
      toast.error('Estimasi kembali harus diisi');
      return;
    }
    if (peminjamForm.jumlahDipinjam < 1) {
      toast.error('Jumlah pinjam minimal 1');
      return;
    }

    // Hitung total yang sudah dipinjam
    const totalDipinjam = (formData.peminjam || []).reduce((sum, p) => sum + p.jumlahDipinjam, 0);
    const sisaTersedia = formData.jumlahTotal - totalDipinjam;

    if (peminjamForm.jumlahDipinjam > sisaTersedia) {
      toast.error(`Jumlah tersedia hanya ${sisaTersedia} unit`);
      return;
    }

    // Tambahkan peminjam
    const newPeminjam = [...(formData.peminjam || []), peminjamForm];
    const newJumlahTersedia = formData.jumlahTotal - (totalDipinjam + peminjamForm.jumlahDipinjam);

    setFormData({
      ...formData,
      peminjam: newPeminjam,
      jumlahTersedia: newJumlahTersedia,
      status: newJumlahTersedia === 0 ? 'dipinjam' : formData.status,
    });

    // Reset form
    setPeminjamForm(initialPeminjamForm);
    setShowPeminjamForm(false);
    toast.success('Peminjam berhasil ditambahkan');
  };

  const handleRemovePeminjam = (index: number) => {
    const removedPeminjam = formData.peminjam![index];
    const newPeminjam = formData.peminjam!.filter((_, i) => i !== index);
    const newJumlahTersedia = formData.jumlahTersedia + removedPeminjam.jumlahDipinjam;

    setFormData({
      ...formData,
      peminjam: newPeminjam,
      jumlahTersedia: newJumlahTersedia,
    });

    toast.success('Peminjam berhasil dihapus');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItem) {
      setItems(items.map(item =>
        item.id === selectedItem.id
          ? {
            ...item,
            ...formData,
            updatedAt: new Date()
          }
          : item
      ));
      toast.success('Alat berhasil diperbarui');
    } else {
      const newItem: Alat = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setItems([...items, newItem]);
      toast.success('Alat berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'namaAlat',
      header: 'Alat',
      sortable: true,
      render: (item: Alat) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
            {item.gambarList && item.gambarList.length > 0 ? (
              <SafeImage src={item.gambarList[0]} alt={item.namaAlat} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">{item.namaAlat}</p>
            <p className="text-sm text-muted-foreground">{item.merk}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      sortable: true,
      render: (item: Alat) => (
        <div className="text-center font-medium">
          {item.kategori}
        </div>
      ),
    },

    {
      key: 'jumlah',
      header: 'Jumlah',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{item.jumlahTersedia}</span>
            <span className="text-muted-foreground">
              / {item.jumlahTotal}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'peminjam',
      header: 'Peminjam',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <div className="text-left">
            {item.peminjam && item.peminjam.length > 0 ? (
              <div className="space-y-1">
                {item.peminjam.slice(0, 2).map((p, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{p.nama}</span>
                    <span className="text-muted-foreground">
                      {' '}({p.jumlahDipinjam}x)
                    </span>
                  </div>
                ))}
                {item.peminjam.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{item.peminjam.length - 2} lainnya
                  </p>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        </div>
      ),
    },

    {
      key: 'kondisi',
      header: 'Kondisi',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <StatusBadge status={item.kondisi} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Alat) => (
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleView(item);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ),
    },

  ];

  // Handler untuk kategori alat
  const handleOpenKategoriModal = () => {
    setKategoriModalOpen(true);
  };

  const handleAddKategori = () => {
    setEditingKategori(null);
    setKategoriFormData({ nama: '', deskripsi: '' });
    setKategoriFormOpen(true);
  };

  const handleEditKategori = (kategori: KategoriAlat) => {
    setEditingKategori(kategori);
    setKategoriFormData({ nama: kategori.nama, deskripsi: kategori.deskripsi });
    setKategoriFormOpen(true);
  };

  const handleDeleteKategori = (kategori: KategoriAlat) => {
    setKategoriToDelete(kategori);
    setDeleteKategoriDialogOpen(true);
  };

  const confirmDeleteKategori = () => {
    if (kategoriToDelete) {
      setKategoriList(kategoriList.filter(k => k.id !== kategoriToDelete.id));
      toast.success('Kategori berhasil dihapus');
    }
    setDeleteKategoriDialogOpen(false);
    setKategoriToDelete(null);
  };

  const handleSubmitKategori = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKategori) {
      setKategoriList(kategoriList.map(k =>
        k.id === editingKategori.id
          ? { ...k, nama: kategoriFormData.nama, deskripsi: kategoriFormData.deskripsi }
          : k
      ));
      toast.success('Kategori berhasil diperbarui');
    } else {
      const newKategori: KategoriAlat = {
        id: Date.now().toString(),
        nama: kategoriFormData.nama,
        deskripsi: kategoriFormData.deskripsi,
        createdAt: new Date(),
      };
      setKategoriList([...kategoriList, newKategori]);
      toast.success('Kategori berhasil ditambahkan');
    }
    setKategoriFormOpen(false);
  };

  // Filter items berdasarkan kategori
  const filteredItems = selectedKategori === 'all'
    ? items
    : items.filter(item => (item as any).kategoriId === selectedKategori);

  const totalDipinjam = filteredItems.reduce((acc, item) => acc + (item.jumlahTotal - item.jumlahTersedia), 0);
  const totalTersedia = filteredItems.reduce((acc, item) => acc + item.jumlahTersedia, 0);

  return (
    <MainLayout title="Manajemen Alat">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Kelola inventaris alat, peminjaman, dan status peralatan
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleOpenKategoriModal} variant="outline" className="w-full sm:w-auto">
              <FolderOpen className="h-4 w-4 mr-2" />
              Kategori Alat
            </Button>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Alat
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredItems.length}</div>
              <p className="text-sm text-muted-foreground">Jenis Alat</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {totalTersedia}
              </div>
              <p className="text-sm text-muted-foreground">Unit Tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {totalDipinjam}
              </div>
              <p className="text-sm text-muted-foreground">Unit Dipinjam</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {filteredItems.filter(i => i.status === 'diperbaiki').length}
              </div>
              <p className="text-sm text-muted-foreground">Dalam Perbaikan</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Daftar Alat</CardTitle>
              <div className="w-full sm:w-64">
                <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoriList.map(kategori => (
                      <SelectItem key={kategori.id} value={kategori.id}>
                        {kategori.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredItems}
              columns={columns}
              searchPlaceholder="Cari alat..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Alat' : selectedItem ? 'Edit Alat' : 'Tambah Alat Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Slider/Gallery Section */}
              <div className="space-y-3">
                <Label>Gambar Alat ({formData.gambarList?.length || 0})</Label>

                {viewMode ? (
                  // View Mode: Show Slider
                  <ImageSlider images={formData.gambarList || []} />
                ) : (
                  // Edit Mode: Show Gallery with Add/Remove
                  <>
                    {formData.gambarList && formData.gambarList.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {formData.gambarList.map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-muted border-2 border-dashed group">
                            <SafeImage src={img} alt={`Image ${idx + 1}`} />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                              {idx + 1}
                            </div>
                          </div>
                        ))}

                        {/* Add More Button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Tambah Gambar</p>
                        </button>
                      </div>
                    ) : (
                      // No images yet
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload gambar alat (Max 5MB per file)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Pilih Gambar
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tip: Anda bisa memilih multiple gambar sekaligus
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="namaAlat">Nama Alat *</Label>
                  <Input
                    id="namaAlat"
                    value={formData.namaAlat}
                    onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="kategoriAlat">Kategori Alat</Label>
                  <Select
                    value={formData.kategoriId || 'none'}
                    onValueChange={(value: string) => {
                      const selectedKat = kategoriList.find(k => k.id === value);
                      setFormData({
                        ...formData,
                        kategoriId: value === 'none' ? undefined : value,
                        kategori: selectedKat ? selectedKat.nama : formData.kategori
                      });
                    }}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {kategoriList.map(kategori => (
                        <SelectItem key={kategori.id} value={kategori.id}>
                          {kategori.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="merk">Merk *</Label>
                  <Input
                    id="merk"
                    value={formData.merk}
                    onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jumlahTotal">Jumlah Total *</Label>
                  <Input
                    id="jumlahTotal"
                    type="number"
                    min="1"
                    value={formData.jumlahTotal}
                    onChange={(e) => {
                      const total = parseInt(e.target.value) || 1;
                      const currentDipinjam = formData.jumlahTotal - formData.jumlahTersedia;
                      setFormData({
                        ...formData,
                        jumlahTotal: total,
                        jumlahTersedia: Math.max(0, total - currentDipinjam)
                      });
                    }}
                    disabled={viewMode}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="jumlahTersedia">Jumlah Tersedia</Label>
                  <Input
                    id="jumlahTersedia"
                    type="number"
                    value={formData.jumlahTersedia}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Otomatis berdasarkan peminjaman
                  </p>
                </div>

                <div>
                  <Label htmlFor="kondisi">Kondisi *</Label>
                  <Select
                    value={formData.kondisi}
                    onValueChange={(value: string) => setFormData({ ...formData, kondisi: value as FormData['kondisi'] })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Baik</SelectItem>
                      <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                      <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) => setFormData({ ...formData, status: value as FormData['status'] })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tersedia">Tersedia</SelectItem>
                      <SelectItem value="dipinjam">Dipinjam</SelectItem>
                      <SelectItem value="diperbaiki">Diperbaiki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="lokasiTerakhir">Lokasi Terakhir *</Label>
                  <Input
                    id="lokasiTerakhir"
                    value={formData.lokasiTerakhir}
                    onChange={(e) => setFormData({ ...formData, lokasiTerakhir: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="spesifikasi">Spesifikasi</Label>
                  <Textarea
                    id="spesifikasi"
                    value={formData.spesifikasi}
                    onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                    disabled={viewMode}
                    rows={3}
                    placeholder="Masukkan spesifikasi detail alat..."
                  />
                </div>

                {/* Peminjam Section */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Daftar Peminjam ({formData.peminjam?.length || 0})</Label>
                    {!viewMode && !showPeminjamForm && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPeminjamForm(true)}
                        disabled={formData.jumlahTersedia === 0}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Tambah Peminjam
                      </Button>
                    )}
                  </div>

                  {/* Add Peminjam Form */}
                  {showPeminjamForm && (
                    <Card className="border-2 border-primary">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label htmlFor="peminjamNama">Nama Peminjam *</Label>
                              <Input
                                id="peminjamNama"
                                value={peminjamForm.nama}
                                onChange={(e) => setPeminjamForm({ ...peminjamForm, nama: e.target.value })}
                                placeholder="Masukkan nama peminjam"
                              />
                            </div>
                            <div>
                              <Label htmlFor="tanggalPinjam">Tanggal Pinjam *</Label>
                              <Input
                                id="tanggalPinjam"
                                type="date"
                                value={peminjamForm.tanggalPinjam}
                                onChange={(e) => setPeminjamForm({ ...peminjamForm, tanggalPinjam: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="estimasiKembali">Estimasi Kembali *</Label>
                              <Input
                                id="estimasiKembali"
                                type="date"
                                value={peminjamForm.estimasiKembali}
                                onChange={(e) => setPeminjamForm({ ...peminjamForm, estimasiKembali: e.target.value })}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="jumlahDipinjam">Jumlah Dipinjam *</Label>
                              <Input
                                id="jumlahDipinjam"
                                type="number"
                                min="1"
                                max={formData.jumlahTersedia}
                                value={peminjamForm.jumlahDipinjam}
                                onChange={(e) => setPeminjamForm({ ...peminjamForm, jumlahDipinjam: parseInt(e.target.value) || 1 })}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Tersedia: {formData.jumlahTersedia} unit
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowPeminjamForm(false);
                                setPeminjamForm(initialPeminjamForm);
                              }}
                            >
                              Batal
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddPeminjam}
                            >
                              Simpan Peminjam
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* List Peminjam */}
                  {formData.peminjam && formData.peminjam.length > 0 && (
                    <div className="space-y-3">
                      {formData.peminjam.map((p, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                                <div>
                                  <p className="text-muted-foreground">Nama</p>
                                  <p className="font-medium">{p.nama}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Jumlah</p>
                                  <p className="font-medium">{p.jumlahDipinjam} unit</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Tanggal Pinjam</p>
                                  <p className="font-medium">{new Date(p.tanggalPinjam).toLocaleDateString('id-ID')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Estimasi Kembali</p>
                                  <p className="font-medium">{new Date(p.estimasiKembali).toLocaleDateString('id-ID')}</p>
                                </div>
                              </div>
                              {!viewMode && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePeminjam(idx)}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {(!formData.peminjam || formData.peminjam.length === 0) && !showPeminjamForm && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada peminjam
                    </p>
                  )}
                </div>
              </div>

              {!viewMode && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedItem ? 'Simpan Perubahan' : 'Tambah Alat'}
                  </Button>
                </div>
              )}

              {viewMode && (
                <div className="flex justify-end pt-4 border-t">
                  <Button type="button" onClick={() => setModalOpen(false)}>
                    Tutup
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Kategori Alat */}
        <Dialog open={kategoriModalOpen} onOpenChange={setKategoriModalOpen}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Kategori Alat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddKategori} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kategori
                </Button>
              </div>
              <div className="border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Nama Kategori</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Deskripsi</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {kategoriList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            Belum ada kategori alat
                          </td>
                        </tr>
                      ) : (
                        kategoriList.map((kategori) => (
                          <tr key={kategori.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm">{kategori.nama}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{kategori.deskripsi}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditKategori(kategori)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteKategori(kategori)}
                                  title="Hapus"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Form Kategori Dialog */}
        <Dialog open={kategoriFormOpen} onOpenChange={setKategoriFormOpen}>
          <DialogContent className="max-w-md w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>
                {editingKategori ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitKategori} className="space-y-4">
              <div>
                <Label htmlFor="kategoriNama">Nama Kategori</Label>
                <Input
                  id="kategoriNama"
                  value={kategoriFormData.nama}
                  onChange={(e) => setKategoriFormData({ ...kategoriFormData, nama: e.target.value })}
                  placeholder="Contoh: Survey"
                  required
                />
              </div>
              <div>
                <Label htmlFor="kategoriDeskripsi">Deskripsi</Label>
                <Input
                  id="kategoriDeskripsi"
                  value={kategoriFormData.deskripsi}
                  onChange={(e) => setKategoriFormData({ ...kategoriFormData, deskripsi: e.target.value })}
                  placeholder="Deskripsi kategori"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setKategoriFormOpen(false)} className="w-full sm:w-auto">
                  Batal
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingKategori ? 'Simpan Perubahan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Kategori Confirmation */}
        <ConfirmDialog
          open={deleteKategoriDialogOpen}
          onOpenChange={setDeleteKategoriDialogOpen}
          title="Hapus Kategori"
          description={`Apakah Anda yakin ingin menghapus kategori "${kategoriToDelete?.nama}"? Alat dengan kategori ini tidak akan terhapus.`}
          onConfirm={confirmDeleteKategori}
          confirmText="Hapus"
          variant="destructive"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Hapus Alat"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaAlat}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
