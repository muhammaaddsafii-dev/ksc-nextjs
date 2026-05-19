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
import { Plus, Edit, Trash2, Eye, Award, Upload, FileText, Download, Mail, Phone, Camera, Loader2 } from 'lucide-react';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { tenagaAhliService, getApiErrorMessage } from '@/services/tenagaAhli.service';
import { TenagaAhli, Sertifikat } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ── Types ────────────────────────────────────────────────────────────────────

type FormData = Omit<TenagaAhli, 'id' | 'createdAt' | 'updatedAt'>;

const initialFormData: FormData = {
  nama: '',
  jabatan: '',
  sertifikat: [],
  email: '',
  telepon: '',
  status: 'tersedia',
  fotoUrl: undefined,
};

// Sertifikat dengan ID temp (belum diupload) dimulai dengan prefix ini
const NEW_PREFIX = 'new_';
const isNewSertifikat = (id: string) => id.startsWith(NEW_PREFIX);

// ── Component ────────────────────────────────────────────────────────────────

export default function TenagaAhliPage() {
  const { items, isLoading, fetchItems, deleteItem, addItemToList, updateItemInList } =
    useTenagaAhliStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TenagaAhli | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File tracking
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | undefined>(undefined);
  // uploadedFiles: sertifikat id → file name (for display)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  // sertifikatFiles: sertifikat id → File object (for upload)
  const [sertifikatFiles, setSertifikatFiles] = useState<Record<string, File>>({});
  // IDs of existing sertifikat marked for deletion
  const [deletedSertifikatIds, setDeletedSertifikatIds] = useState<string[]>([]);

  // New sertifikat input
  const [newSertifikatNama, setNewSertifikatNama] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  // ── Reset state ─────────────────────────────────────────────────────────────

  const resetFormState = () => {
    setFormData(initialFormData);
    setFotoFile(null);
    setFotoPreview(undefined);
    setUploadedFiles({});
    setSertifikatFiles({});
    setDeletedSertifikatIds([]);
    setNewSertifikatNama('');
  };

  // ── Handlers — modal open ────────────────────────────────────────────────────

  const handleCreate = () => {
    setSelectedItem(null);
    resetFormState();
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: TenagaAhli) => {
    setSelectedItem(item);
    resetFormState();
    setFormData({
      nama: item.nama,
      jabatan: item.jabatan,
      sertifikat: item.sertifikat,
      email: item.email,
      telepon: item.telepon,
      status: item.status,
      fotoUrl: item.fotoUrl,
    });
    setFotoPreview(item.fotoUrl);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: TenagaAhli) => {
    setSelectedItem(item);
    resetFormState();
    setFormData({
      nama: item.nama,
      jabatan: item.jabatan,
      sertifikat: item.sertifikat,
      email: item.email,
      telepon: item.telepon,
      status: item.status,
      fotoUrl: item.fotoUrl,
    });
    setFotoPreview(item.fotoUrl);
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: TenagaAhli) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  // ── Handlers — delete ────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await deleteItem(selectedItem.id);
      toast.success('Tenaga ahli berhasil dihapus');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menghapus tenaga ahli'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  // ── Handlers — file upload ───────────────────────────────────────────────────

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    setFotoFile(file);
    const preview = URL.createObjectURL(file);
    setFotoPreview(preview);
    setFormData((prev) => ({ ...prev, fotoUrl: preview }));
    toast.success('Foto profil berhasil dipilih');
    e.target.value = '';
  };

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    setSertifikatFiles((prev) => ({ ...prev, [key]: file }));
    setUploadedFiles((prev) => ({ ...prev, [key]: file.name }));
    toast.success('File berhasil dipilih');
    e.target.value = '';
  };

  // ── Handlers — sertifikat ────────────────────────────────────────────────────

  const handleAddSertifikat = () => {
    if (!newSertifikatNama.trim()) {
      toast.error('Nama sertifikat harus diisi');
      return;
    }
    if (!sertifikatFiles['new']) {
      toast.error('File sertifikat harus dipilih');
      return;
    }

    const tempId = `${NEW_PREFIX}${Date.now()}`;

    // Move pending file from 'new' key to tempId key
    setSertifikatFiles((prev) => {
      const updated = { ...prev, [tempId]: prev['new'] };
      delete updated['new'];
      return updated;
    });
    setUploadedFiles((prev) => {
      const updated = { ...prev, [tempId]: prev['new'] };
      delete updated['new'];
      return updated;
    });

    const newEntry: Sertifikat = {
      id: tempId,
      nama: newSertifikatNama.trim(),
      nomorSertifikat: '',
      tanggalTerbit: new Date(),
      tanggalBerlaku: new Date(),
    };

    setFormData((prev) => ({
      ...prev,
      sertifikat: [...prev.sertifikat, newEntry],
    }));
    setNewSertifikatNama('');
    toast.success('Sertifikat ditambahkan');
  };

  const handleRemoveSertifikat = (idx: number) => {
    const target = formData.sertifikat[idx];
    if (!isNewSertifikat(target.id)) {
      // Mark existing (backend) sertifikat for deletion on submit
      setDeletedSertifikatIds((prev) => [...prev, target.id]);
    }
    setFormData((prev) => ({
      ...prev,
      sertifikat: prev.sertifikat.filter((_, i) => i !== idx),
    }));
    // Clean up file tracking
    setSertifikatFiles((prev) => {
      const updated = { ...prev };
      delete updated[target.id];
      return updated;
    });
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[target.id];
      return updated;
    });
  };

  const handleDownloadSertifikat = (fileUrl: string) => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
    }
    toast.success('Membuka file...');
  };

  // ── Handlers — submit ────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      nama: formData.nama,
      jabatan: formData.jabatan,
      email: formData.email,
      telepon: formData.telepon,
    };

    try {
      let saved: TenagaAhli;

      if (selectedItem) {
        saved = await tenagaAhliService.update(
          selectedItem.id,
          payload,
          fotoFile ?? undefined
        );
      } else {
        saved = await tenagaAhliService.create(payload, fotoFile ?? undefined);
      }

      // Delete removed sertifikat
      await Promise.all(
        deletedSertifikatIds.map((id) => tenagaAhliService.deleteSertifikat(id))
      );

      // Upload new sertifikat
      const newSertifikatEntries = formData.sertifikat.filter((s) =>
        isNewSertifikat(s.id)
      );
      const uploadedSertifikat = await Promise.all(
        newSertifikatEntries.map((s) => {
          const file = sertifikatFiles[s.id];
          if (file) return tenagaAhliService.createSertifikat(saved.id, s.nama, file);
          return Promise.resolve(null);
        })
      );

      // Build final saved item with all sertifikat
      const existingSertifikat = formData.sertifikat.filter(
        (s) => !isNewSertifikat(s.id) && !deletedSertifikatIds.includes(s.id)
      );
      const finalSertifikat = [
        ...existingSertifikat,
        ...uploadedSertifikat.filter((s): s is NonNullable<typeof s> => s !== null),
      ];
      const finalItem: TenagaAhli = { ...saved, sertifikat: finalSertifikat };

      if (selectedItem) {
        updateItemInList(finalItem);
        toast.success('Tenaga ahli berhasil diperbarui');
      } else {
        addItemToList(finalItem);
        toast.success('Tenaga ahli berhasil ditambahkan');
      }

      setModalOpen(false);
      resetFormState();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Terjadi kesalahan. Coba lagi.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'nama',
      header: 'Nama',
      sortable: true,
      render: (item: TenagaAhli) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[180px]">
          <div className="flex-shrink-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              {item.fotoUrl && <AvatarImage src={item.fotoUrl} alt={item.nama} />}
              <AvatarFallback className="text-xs sm:text-sm">
                {item.nama.substring(0, 2).toUpperCase()}
              </AvatarFallback>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleView(item); }}
          >
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
          >
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

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
                        {item.fotoUrl && <AvatarImage src={item.fotoUrl} alt={item.nama} />}
                        <AvatarFallback>{item.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-sm">{item.nama}</h4>
                        <p className="text-xs text-muted-foreground">{item.jabatan}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 pt-2 border-t text-sm text-gray-500">
                      <Award className="h-4 w-4" />
                      <span>{item.sertifikat.length} Sertifikat</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); handleView(item); }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      >
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

        {/* ── Form Modal ─────────────────────────────────────────────────────── */}
        <Dialog
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) resetFormState();
            setModalOpen(open);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>
                {viewMode
                  ? 'Detail Tenaga Ahli'
                  : selectedItem
                  ? 'Edit Tenaga Ahli'
                  : 'Tambah Tenaga Ahli Baru'}
              </DialogTitle>
            </DialogHeader>

            {/* ── VIEW MODE ─────────────────────────────────────────────────── */}
            {viewMode ? (
              <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-muted/30 rounded-xl border">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white shadow-sm">
                    {fotoPreview && <AvatarImage src={fotoPreview} alt={formData.nama} />}
                    <AvatarFallback className="text-xl sm:text-2xl">
                      {formData.nama.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
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

                {/* Sertifikat */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Sertifikat ({formData.sertifikat.length})
                  </h4>
                  {formData.sertifikat.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {formData.sertifikat.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-sm truncate">{s.nama}</p>
                          </div>
                          {s.fileUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => handleDownloadSertifikat(s.fileUrl!)}
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
                  <Button onClick={() => { if (selectedItem) handleEdit(selectedItem); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            ) : (
              /* ── EDIT / CREATE MODE ────────────────────────────────────────── */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Foto Profil */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-muted shadow-sm">
                      {fotoPreview && (
                        <AvatarImage src={fotoPreview} alt={formData.nama || 'Foto Profil'} />
                      )}
                      <AvatarFallback className="text-2xl">
                        {formData.nama
                          ? formData.nama.substring(0, 2).toUpperCase()
                          : <Camera className="h-8 w-8 text-muted-foreground" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => document.getElementById('foto-profil-upload')?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('foto-profil-upload')?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {fotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                    </Button>
                    {fotoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFotoFile(null);
                          setFotoPreview(undefined);
                          setFormData((prev) => ({ ...prev, fotoUrl: undefined }));
                          toast.success('Foto profil dihapus');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <input
                    id="foto-profil-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFotoUpload}
                  />
                  <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — Maks 5MB</p>
                </div>

                {/* Basic fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                      placeholder="Contoh: Ahmad Fauzi"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={formData.jabatan}
                      onChange={(e) => setFormData((prev) => ({ ...prev, jabatan: e.target.value }))}
                      placeholder="Contoh: Surveyor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telepon">Telepon</Label>
                    <Input
                      id="telepon"
                      value={formData.telepon}
                      onChange={(e) => setFormData((prev) => ({ ...prev, telepon: e.target.value }))}
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Sertifikat */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Sertifikat</Label>
                    <Badge variant="secondary">{formData.sertifikat.length} File</Badge>
                  </div>

                  {/* Input tambah sertifikat baru */}
                  <div className="space-y-3 p-4 bg-gray-50/50 rounded-lg border">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Nama Sertifikat</Label>
                      <Input
                        placeholder="Contoh: SKA Geodesi"
                        value={newSertifikatNama}
                        onChange={(e) => setNewSertifikatNama(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        File Dokumen Sertifikat
                      </Label>
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
                            onClick={() =>
                              document.getElementById('sertifikat-file-upload')?.click()
                            }
                            className="flex-1 w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadedFiles['new'] ? 'Ganti File' : 'Pilih File'}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleAddSertifikat}
                            className="shrink-0"
                          >
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
                            onClick={() => {
                              setSertifikatFiles((prev) => {
                                const updated = { ...prev };
                                delete updated['new'];
                                return updated;
                              });
                              setUploadedFiles((prev) => {
                                const updated = { ...prev };
                                delete updated['new'];
                                return updated;
                              });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* List sertifikat */}
                  {formData.sertifikat.length > 0 && (
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {formData.sertifikat.map((s, idx) => (
                        <div key={s.id} className="p-3 border rounded-lg bg-white shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{s.nama}</p>
                              {isNewSertifikat(s.id) && (
                                <p className="text-xs text-amber-500">Belum disimpan</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 self-end sm:self-center">
                              {/* Download: hanya untuk sertifikat dari backend yang punya fileUrl */}
                              {!isNewSertifikat(s.id) && s.fileUrl && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDownloadSertifikat(s.fileUrl!)}
                                >
                                  <Download className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleRemoveSertifikat(idx)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {/* File preview untuk sertifikat pending */}
                          {isNewSertifikat(s.id) && uploadedFiles[s.id] && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-md text-xs border">
                              <FileText className="h-3 w-3 text-blue-500" />
                              <span className="text-muted-foreground truncate">
                                {uploadedFiles[s.id]}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : selectedItem ? (
                      'Simpan Perubahan'
                    ) : (
                      'Tambah'
                    )}
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
          confirmText={isDeleting ? 'Menghapus...' : 'Hapus'}
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
