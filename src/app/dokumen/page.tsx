"use client";

import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, AlertTriangle, FileText, Upload, Download, FileDown, FolderOpen, Loader2 } from 'lucide-react';
import { useDokumenStore } from '@/stores/dokumenStore';
import { Dokumen, KategoriDokumen } from '@/types';
import { dokumenService, mapDokumen, mapKategori, getApiErrorMessage } from '@/services/dokumen.service';
import { formatDate, formatDateInput, getDaysRemaining, isExpiringSoon, isExpired } from '@/lib/helpers';
import { toast } from 'sonner';

type FormData = {
  namaDokumen: string;
  jenisDokumen: Dokumen['jenisDokumen'];
  nomorDokumen: string;
  tanggalBerlaku: Date | null;
  keterangan: string;
  kategoriId: string | null;
  dokumenFile: File | null;
};

const initialFormData: FormData = {
  namaDokumen: '',
  jenisDokumen: 'dokumen_tender',
  nomorDokumen: '',
  tanggalBerlaku: null,
  keterangan: '',
  kategoriId: null,
  dokumenFile: null,
};

export default function DokumenPage() {
  const { items, fetchItems, addItemToList, updateItemInList, deleteFromList } = useDokumenStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Dokumen | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Kategori state
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [kategoriList, setKategoriList] = useState<KategoriDokumen[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [kategoriFormOpen, setKategoriFormOpen] = useState(false);
  const [kategoriFormData, setKategoriFormData] = useState({ nama: '', deskripsi: '' });
  const [editingKategori, setEditingKategori] = useState<KategoriDokumen | null>(null);
  const [deleteKategoriDialogOpen, setDeleteKategoriDialogOpen] = useState(false);
  const [kategoriToDelete, setKategoriToDelete] = useState<KategoriDokumen | null>(null);
  const [isSubmittingKategori, setIsSubmittingKategori] = useState(false);

  useEffect(() => {
    fetchItems();
    loadKategori();
  }, []);

  const loadKategori = async () => {
    try {
      const rawList = await dokumenService.getAllKategori();
      setKategoriList(rawList.map(mapKategori));
    } catch {
      toast.error('Gagal memuat kategori dokumen');
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setUploadedFileName('');
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: Dokumen) => {
    setSelectedItem(item);
    setFormData({
      namaDokumen: item.namaDokumen,
      jenisDokumen: item.jenisDokumen,
      nomorDokumen: item.nomorDokumen,
      tanggalBerlaku: item.tanggalBerlaku,
      keterangan: item.keterangan,
      kategoriId: item.kategoriId,
      dokumenFile: null,
    });
    setUploadedFileName(item.signedFileUrl ? 'File tersimpan' : '');
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: Dokumen) => {
    setSelectedItem(item);
    setFormData({
      namaDokumen: item.namaDokumen,
      jenisDokumen: item.jenisDokumen,
      nomorDokumen: item.nomorDokumen,
      tanggalBerlaku: item.tanggalBerlaku,
      keterangan: item.keterangan,
      kategoriId: item.kategoriId,
      dokumenFile: null,
    });
    setUploadedFileName(item.signedFileUrl ? 'Dokumen Template' : '');
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: Dokumen) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        await dokumenService.delete(selectedItem.id);
        deleteFromList(selectedItem.id);
        toast.success('Dokumen berhasil dihapus');
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Gagal menghapus dokumen'));
      }
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, atau PNG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setFormData({ ...formData, dokumenFile: file });
      setUploadedFileName(file.name);
      toast.success('File berhasil dipilih');
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, dokumenFile: null });
    setUploadedFileName(selectedItem?.signedFileUrl ? 'File tersimpan' : '');
  };

  const handleDownload = () => {
    const url = selectedItem?.signedFileUrl;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Tidak ada dokumen untuk diunduh');
    }
  };

  const handleDownloadFromTable = (item: Dokumen) => {
    if (item.signedFileUrl) {
      window.open(item.signedFileUrl, '_blank');
    } else {
      toast.error('Tidak ada dokumen template untuk diunduh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedItem) {
        let result;
        if (formData.dokumenFile) {
          const fd = new FormData();
          fd.append('nama_dokumen', formData.namaDokumen);
          fd.append('jenis_dokumen', formData.jenisDokumen);
          fd.append('nomor_dokumen', formData.nomorDokumen);
          if (formData.tanggalBerlaku) {
            fd.append('tanggal_berlaku', formData.tanggalBerlaku.toISOString().split('T')[0]);
          }
          fd.append('keterangan', formData.keterangan);
          if (formData.kategoriId) fd.append('kategori', formData.kategoriId);
          fd.append('file', formData.dokumenFile);
          result = await dokumenService.update(selectedItem.id, fd);
        } else {
          const payload: Record<string, unknown> = {
            nama_dokumen: formData.namaDokumen,
            jenis_dokumen: formData.jenisDokumen,
            nomor_dokumen: formData.nomorDokumen,
            keterangan: formData.keterangan,
            kategori: formData.kategoriId || null,
          };
          if (formData.tanggalBerlaku) {
            payload.tanggal_berlaku = formData.tanggalBerlaku.toISOString().split('T')[0];
          }
          result = await dokumenService.update(selectedItem.id, payload);
        }
        updateItemInList(mapDokumen(result));
        toast.success('Dokumen berhasil diperbarui');
      } else {
        const fd = new FormData();
        fd.append('nama_dokumen', formData.namaDokumen);
        fd.append('jenis_dokumen', formData.jenisDokumen);
        fd.append('nomor_dokumen', formData.nomorDokumen);
        if (formData.tanggalBerlaku) {
          fd.append('tanggal_berlaku', formData.tanggalBerlaku.toISOString().split('T')[0]);
        }
        fd.append('keterangan', formData.keterangan);
        if (formData.kategoriId) fd.append('kategori', formData.kategoriId);
        if (formData.dokumenFile) fd.append('file', formData.dokumenFile);
        const result = await dokumenService.create(fd);
        addItemToList(mapDokumen(result));
        toast.success('Dokumen berhasil ditambahkan');
      }
      setModalOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      toast.error(getApiErrorMessage(error, selectedItem ? 'Gagal memperbarui dokumen' : 'Gagal menambahkan dokumen'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (item: Dokumen) => {
    if (!item.tanggalBerlaku) return <Badge variant="secondary">Tidak ada tanggal</Badge>;
    if (isExpired(item.tanggalBerlaku)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isExpiringSoon(item.tanggalBerlaku, 90)) {
      return <Badge className="bg-warning text-warning-foreground">Segera Expired</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
  };

  const columns = [
    {
      key: 'namaDokumen',
      header: 'Dokumen',
      sortable: true,
      render: (item: Dokumen) => (
        <div className="flex items-center gap-2 sm:gap-3 min-w-[200px]">
          <div className="p-1.5 sm:p-2 bg-muted rounded flex-shrink-0">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.namaDokumen}</p>
            <p className="text-xs text-muted-foreground truncate">{item.nomorDokumen}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jenisDokumen',
      header: 'Jenis',
      render: (item: Dokumen) => (
        <div className="flex justify-center min-w-[100px]">
          <Badge variant="outline" className="capitalize text-xs">
            {item.jenisDokumen.replace(/_/g, ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'tanggalBerlaku',
      header: 'Masa Berlaku',
      sortable: true,
      render: (item: Dokumen) => {
        if (!item.tanggalBerlaku) {
          return <div className="text-center min-w-[120px] text-sm text-muted-foreground">-</div>;
        }
        const days = getDaysRemaining(item.tanggalBerlaku);
        return (
          <div className="text-center min-w-[120px]">
            <p className="text-sm">{formatDate(item.tanggalBerlaku)}</p>
            {days > 0 && days <= 90 && (
              <p className="text-xs text-warning">{days} hari lagi</p>
            )}
            {days < 0 && (
              <p className="text-xs text-destructive">Sudah expired</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Dokumen) => (
        <div className="flex justify-center min-w-[80px]">
          {getStatusBadge(item)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Dokumen) => (
        <div className="flex items-center gap-1 justify-center min-w-[140px]">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleView(item); }} title="Lihat Detail">
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(item); }} title="Edit">
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); handleDownloadFromTable(item); }}
            title={item.signedFileUrl ? 'Download Dokumen' : 'Tidak ada dokumen'}
          >
            <FileDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(item); }} title="Hapus">
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  // Kategori handlers
  const handleOpenKategoriModal = () => setKategoriModalOpen(true);

  const handleAddKategori = () => {
    setEditingKategori(null);
    setKategoriFormData({ nama: '', deskripsi: '' });
    setKategoriFormOpen(true);
  };

  const handleEditKategori = (kategori: KategoriDokumen) => {
    setEditingKategori(kategori);
    setKategoriFormData({ nama: kategori.nama, deskripsi: kategori.deskripsi });
    setKategoriFormOpen(true);
  };

  const handleDeleteKategori = (kategori: KategoriDokumen) => {
    setKategoriToDelete(kategori);
    setDeleteKategoriDialogOpen(true);
  };

  const confirmDeleteKategori = async () => {
    if (kategoriToDelete) {
      try {
        await dokumenService.deleteKategori(kategoriToDelete.id);
        setKategoriList((prev) => prev.filter((k) => k.id !== kategoriToDelete.id));
        toast.success('Kategori berhasil dihapus');
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Gagal menghapus kategori'));
      }
    }
    setDeleteKategoriDialogOpen(false);
    setKategoriToDelete(null);
  };

  const handleSubmitKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingKategori(true);
    try {
      if (editingKategori) {
        const updated = await dokumenService.updateKategori(editingKategori.id, kategoriFormData);
        setKategoriList((prev) =>
          prev.map((k) => (k.id === editingKategori.id ? mapKategori(updated) : k))
        );
        toast.success('Kategori berhasil diperbarui');
      } else {
        const created = await dokumenService.createKategori(kategoriFormData);
        setKategoriList((prev) => [...prev, mapKategori(created)]);
        toast.success('Kategori berhasil ditambahkan');
      }
      setKategoriFormOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, editingKategori ? 'Gagal memperbarui kategori' : 'Gagal menambahkan kategori'));
    } finally {
      setIsSubmittingKategori(false);
    }
  };

  const filteredItems = selectedKategori === 'all'
    ? items
    : items.filter((item) => item.kategoriId === selectedKategori);


  return (
    <MainLayout title="Legalitas & Sertifikat">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
          </p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={handleOpenKategoriModal} variant="outline" className="w-full sm:w-auto">
              <FolderOpen className="h-4 w-4 mr-2" />
              Kategori Dokumen
            </Button>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokumen
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="text-base">Daftar Dokumen</CardTitle>
              <div className="w-full sm:w-64">
                <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {kategoriList.map((kategori) => (
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
              searchPlaceholder="Cari dokumen..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Dokumen' : selectedItem ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="namaDokumen">Nama Dokumen</Label>
                  <Input
                    id="namaDokumen"
                    value={formData.namaDokumen}
                    onChange={(e) => setFormData({ ...formData, namaDokumen: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kategoriDokumen">Kategori Dokumen</Label>
                  <Select
                    value={formData.kategoriId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, kategoriId: value === 'none' ? null : value })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa Kategori</SelectItem>
                      {kategoriList.map((kategori) => (
                        <SelectItem key={kategori.id} value={kategori.id}>
                          {kategori.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jenisDokumen">Jenis Dokumen</Label>
                  <Select
                    value={formData.jenisDokumen}
                    onValueChange={(value) => setFormData({ ...formData, jenisDokumen: value as FormData['jenisDokumen'] })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dokumen_tender">Dokumen Tender</SelectItem>
                      <SelectItem value="dokumen_administrasi">Dokumen Administrasi</SelectItem>
                      <SelectItem value="dokumen_teknis">Dokumen Teknis</SelectItem>
                      <SelectItem value="dokumen_penawaran">Dokumen Penawaran</SelectItem>
                      <SelectItem value="dokumen_pekerjaan">Dokumen Pekerjaan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nomorDokumen">Nomor Dokumen</Label>
                  <Input
                    id="nomorDokumen"
                    value={formData.nomorDokumen}
                    onChange={(e) => setFormData({ ...formData, nomorDokumen: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
                  <Input
                    id="tanggalBerlaku"
                    type="date"
                    value={formData.tanggalBerlaku ? formatDateInput(formData.tanggalBerlaku) : ''}
                    onChange={(e) => setFormData({ ...formData, tanggalBerlaku: e.target.value ? new Date(e.target.value) : null })}
                    disabled={viewMode}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    disabled={viewMode}
                    rows={2}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="dokumenTemplate">Dokumen Template {!viewMode && '(Opsional)'}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {viewMode
                      ? 'Template dokumen yang tersimpan untuk dokumen ini'
                      : 'Upload template dokumen yang bisa digunakan berulang (PDF, DOC, DOCX, JPG, PNG - Max 5MB)'
                    }
                  </p>
                  {viewMode ? (
                    uploadedFileName ? (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted rounded-md border">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{uploadedFileName}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Dokumen Template</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleDownload}
                            className="w-full sm:w-auto text-xs sm:text-sm flex-shrink-0"
                          >
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            Download
                          </Button>
                        </div>
                        <div className="flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950 rounded">
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                          <span>Template ini dapat digunakan berulang untuk dokumen serupa</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                        <p className="text-sm text-muted-foreground text-center">Tidak ada dokumen template</p>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('dokumenTemplate')?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadedFileName ? 'Ganti File' : 'Pilih File'}
                        </Button>
                        <input
                          id="dokumenTemplate"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      {uploadedFileName && (
                        <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{uploadedFileName}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                {viewMode ? (
                  <Button type="button" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
                    Tutup
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="w-full sm:w-auto">
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {selectedItem ? 'Simpan Perubahan' : 'Tambah'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal Kategori Dokumen */}
        <Dialog open={kategoriModalOpen} onOpenChange={setKategoriModalOpen}>
          <DialogContent className="max-w-3xl w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Kategori Dokumen</DialogTitle>
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
                            Belum ada kategori dokumen
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
                  placeholder="Contoh: Izin Operasional"
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
                <Button type="submit" disabled={isSubmittingKategori} className="w-full sm:w-auto">
                  {isSubmittingKategori && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
          description={`Apakah Anda yakin ingin menghapus kategori "${kategoriToDelete?.nama}"? Dokumen dengan kategori ini tidak akan terhapus.`}
          onConfirm={confirmDeleteKategori}
          confirmText="Hapus"
          variant="destructive"
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Hapus Dokumen"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaDokumen}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
