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
import { Plus, Edit, Trash2, Eye, Award, Upload, FileText, Download, Mail, Phone } from 'lucide-react';
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
              renderMobileItem={(item) => (
                <div className="p-3 border rounded-lg bg-white space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{item.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{item.nama}</h4>
                        <p className="text-xs text-muted-foreground">{item.jabatan}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Keahlian</p>
                      <div className="flex flex-wrap gap-1">
                        {item.keahlian.map((k, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t text-sm text-gray-500">
                      <Award className="h-4 w-4" />
                      <span>{item.sertifikat.length} Sertifikat</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); handleView(item); }}>
                        <Eye className="h-3 w-3 mr-1" />
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              )}
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

            {viewMode ? (
              <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-muted/30 rounded-xl border">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shadow-sm">
                    <AvatarFallback className="text-xl sm:text-2xl">{formData.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left space-y-1">
                    <h3 className="font-bold text-lg sm:text-xl">{formData.nama}</h3>
                    <p className="text-muted-foreground font-medium">{formData.jabatan}</p>
                    <div className="flex justify-center sm:justify-start">
                      <StatusBadge status={formData.status} />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg space-y-1">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 text-sm font-medium break-all">
                      <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                      {formData.email}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg space-y-1">
                    <Label className="text-xs text-muted-foreground">Telepon</Label>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                      {formData.telepon}
                    </div>
                  </div>
                </div>

                {/* Keahlian */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Keahlian
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.keahlian.length > 0 ? (
                      formData.keahlian.map((k) => (
                        <Badge key={k} variant="secondary">
                          {k}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Belum ada data keahlian</p>
                    )}
                  </div>
                </div>

                {/* Sertifikat */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Sertifikat ({formData.sertifikat.length})
                  </h4>
                  {formData.sertifikat.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {formData.sertifikat.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-sm truncate">{s.nama}</p>
                            <p className="text-xs text-muted-foreground truncate">{s.nomorSertifikat}</p>
                          </div>
                          {(uploadedFiles[s.id] || s.fileUrl) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => handleDownloadSertifikat(uploadedFiles[s.id] || s.fileUrl || '')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Belum ada sertifikat</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    Tutup
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedItem) {
                        handleEdit(selectedItem);
                      }
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Contoh: Arsitek Senior"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      placeholder="Contoh: Team Leader"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telepon">Telepon</Label>
                    <Input
                      id="telepon"
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      placeholder="+62..."
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
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Keahlian */}
                <div className="space-y-3">
                  <Label>Keahlian</Label>
                  <div className="p-4 border rounded-lg bg-gray-50/50">
                    <div className="flex flex-wrap gap-2">
                      {keahlianOptions.map((k) => (
                        <Badge
                          key={k}
                          variant={formData.keahlian.includes(k) ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all hover:opacity-80 ${formData.keahlian.includes(k) ? 'hover:bg-primary/90' : 'bg-white hover:bg-gray-100'}`}
                          onClick={() => {
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
                </div>

                {/* Sertifikat */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sertifikat</Label>
                    <Badge variant="secondary">{formData.sertifikat.length} File</Badge>
                  </div>

                  <div className="space-y-3 p-4 bg-gray-50/50 rounded-lg border">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Upload Dokumen Sertifikat (Opsional)</Label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="sertifikat-file-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload('new', e)}
                          className="hidden"
                        />
                        <div className="flex gap-2 flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('sertifikat-file-upload')?.click()}
                            className="flex-1 w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadedFiles['new'] ? 'Ganti File' : 'Pilih File'}
                          </Button>
                          <Button type="button" onClick={handleAddSertifikat} className="shrink-0">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Tambah</span>
                          </Button>
                        </div>
                      </div>
                      {uploadedFiles['new'] && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded-md border text-sm">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="flex-1 truncate">{uploadedFiles['new']}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setUploadedFiles(prev => { const newFiles = { ...prev }; delete newFiles['new']; return newFiles; })}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.sertifikat.length > 0 && (
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {formData.sertifikat.map((s, idx) => (
                        <div key={s.id} className="p-3 border rounded-lg bg-white shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{s.nama}</p>
                              <p className="text-xs text-muted-foreground truncate">{s.nomorSertifikat}</p>
                            </div>
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              {(uploadedFiles[s.id] || s.fileUrl) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDownloadSertifikat(uploadedFiles[s.id] || s.fileUrl || '')}
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
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
                                className="h-8 w-8 p-0"
                                onClick={() => document.getElementById(`sertifikat-file-${s.id}`)?.click()}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setFormData({
                                  ...formData,
                                  sertifikat: formData.sertifikat.filter((_, i) => i !== idx)
                                })}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {(uploadedFiles[s.id] || s.fileUrl) && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md text-xs border">
                              <FileText className="h-3 w-3 text-blue-500" />
                              <span className="text-muted-foreground truncate">{uploadedFiles[s.id] || s.fileUrl}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {selectedItem ? 'Simpan Perubahan' : 'Tambah'}
                  </Button>
                </div>
              </form>
            )}
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
