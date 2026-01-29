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
import { Plus, Edit, Trash2, Eye, Award, Upload, FileText, Download } from 'lucide-react';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { TenagaAhli, Sertifikat } from '@/types';
import { formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type FormData = Omit<TenagaAhli, 'id' | 'createdAt' | 'updatedAt'>;

const initialFormData: FormData = {
  nama: '',
  jabatan: '',
  keahlian: [],
  sertifikat: [],
  email: '',
  telepon: '',
  status: 'tersedia',
};

const keahlianOptions = [
  'Struktur', 'Arsitektur', 'Geoteknik', 'MEP', 'Manajemen Proyek',
  'Survey', 'Estimasi', 'Drainase', 'Jalan', 'Jembatan'
];

export default function TenagaAhliPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } = useTenagaAhliStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TenagaAhli | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [newKeahlian, setNewKeahlian] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({});

  // Sertifikat form
  const [newSertifikat, setNewSertifikat] = useState<Omit<Sertifikat, 'id'>>({
    nama: '', nomorSertifikat: '', tanggalTerbit: new Date(), tanggalBerlaku: new Date()
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: TenagaAhli) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama,
      jabatan: item.jabatan,
      keahlian: item.keahlian,
      sertifikat: item.sertifikat,
      email: item.email,
      telepon: item.telepon,
      status: item.status,
    });
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: TenagaAhli) => {
    setSelectedItem(item);
    setFormData({
      nama: item.nama,
      jabatan: item.jabatan,
      keahlian: item.keahlian,
      sertifikat: item.sertifikat,
      email: item.email,
      telepon: item.telepon,
      status: item.status,
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: TenagaAhli) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Tenaga ahli berhasil dihapus');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleFileUpload = (sertifikatId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG');
        return;
      }
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      // Simpan nama file
      setUploadedFiles(prev => ({ ...prev, [sertifikatId]: file.name }));
      toast.success('File berhasil dipilih');
    }
  };

  const handleDownloadSertifikat = (fileName: string) => {
    if (fileName) {
      // Simulasi download - sama seperti di legalitas
      const dummyContent = `Ini adalah file sertifikat: ${fileName}\n\nFile ini merupakan dokumen sertifikat tenaga ahli.\nDalam production, file ini akan diambil dari server storage.`;
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
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success('Tenaga ahli berhasil diperbarui');
    } else {
      addItem(formData);
      toast.success('Tenaga ahli berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const handleAddSertifikat = () => {
    if (!newSertifikat.nama) return;
    setFormData({
      ...formData,
      sertifikat: [...formData.sertifikat, { ...newSertifikat, id: Date.now().toString() }]
    });
    setNewSertifikat({ nama: '', nomorSertifikat: '', tanggalTerbit: new Date(), tanggalBerlaku: new Date() });
    toast.success('Sertifikat ditambahkan');
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama',
      sortable: true,
      render: (item: TenagaAhli) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[180px]">
          <div className="p-1.5 sm:p-2 bg-muted rounded flex-shrink-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarFallback className="text-xs sm:text-sm">{item.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.nama}</p>
            <p className="text-xs text-muted-foreground truncate">{item.jabatan}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'keahlian',
      header: 'Keahlian',
      render: (item: TenagaAhli) => (
        <div className="flex flex-wrap gap-1 min-w-[150px]">
          {item.keahlian.slice(0, 2).map((k, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
          ))}
          {item.keahlian.length > 2 && (
            <Badge variant="outline" className="text-xs">+{item.keahlian.length - 2}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'sertifikat',
      header: 'Sertifikat',
      render: (item: TenagaAhli) => (
        <div className="flex items-center gap-1 sm:gap-2 justify-center min-w-[80px]">
          <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          <span className="text-sm">{item.sertifikat.length}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: TenagaAhli) => (
        <div className="flex items-center gap-1 justify-center min-w-[120px]">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleView(item); }}>
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Database Tenaga Ahli">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Kelola data tenaga ahli dan sertifikasi
          </p>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tenaga Ahli
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-sm text-muted-foreground">Total Tenaga Ahli</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {items.reduce((sum, item) => sum + item.sertifikat.length, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Sertifikat</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Tenaga Ahli</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari tenaga ahli..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Tenaga Ahli' : selectedItem ? 'Edit Tenaga Ahli' : 'Tambah Tenaga Ahli Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input
                    id="jabatan"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telepon">Telepon</Label>
                  <Input
                    id="telepon"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
              </div>

              {/* Keahlian */}
              <div>
                <Label>Keahlian</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {keahlianOptions.map((k) => (
                    <Badge
                      key={k}
                      variant={formData.keahlian.includes(k) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (viewMode) return;
                        setFormData({
                          ...formData,
                          keahlian: formData.keahlian.includes(k)
                            ? formData.keahlian.filter(x => x !== k)
                            : [...formData.keahlian, k]
                        });
                      }}
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Sertifikat */}
              <div>
                <Label>Sertifikat</Label>
                {!viewMode && (
                  <div className="space-y-3 mt-2 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Upload Dokumen Sertifikat (Opsional)</Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="sertifikat-file-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('new', e)}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('sertifikat-file-upload')?.click()}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadedFiles['new'] ? 'Ganti File' : 'Pilih File'}
                        </Button>
                        <Button type="button" onClick={handleAddSertifikat}>
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah
                        </Button>
                      </div>
                      {uploadedFiles['new'] && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-background rounded-md border">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{uploadedFiles['new']}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadedFiles(prev => { const newFiles = { ...prev }; delete newFiles['new']; return newFiles; })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="space-y-2 mt-2">
                  {formData.sertifikat.map((s, idx) => (
                    <div key={s.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium">{s.nama}</p>
                          <p className="text-sm text-muted-foreground">{s.nomorSertifikat}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(uploadedFiles[s.id] || s.fileUrl) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadSertifikat(uploadedFiles[s.id] || s.fileUrl || '')}
                              title="Download Dokumen"
                            >
                              <Download className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {!viewMode && (
                            <>
                              <input
                                id={`sertifikat-file-${s.id}`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(s.id, e)}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById(`sertifikat-file-${s.id}`)?.click()}
                                title="Upload Dokumen"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  sertifikat: formData.sertifikat.filter((_, i) => i !== idx)
                                })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {(uploadedFiles[s.id] || s.fileUrl) && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{uploadedFiles[s.id] || s.fileUrl}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!viewMode && (
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {selectedItem ? 'Simpan Perubahan' : 'Tambah'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Hapus Tenaga Ahli"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
