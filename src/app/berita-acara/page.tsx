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
import { Plus, Edit, Trash2, Eye, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useDokumenStore } from '@/stores/dokumenStore';
import { Dokumen } from '@/types';
import { dokumenService, mapDokumen, getApiErrorMessage } from '@/services/dokumen.service';
import { formatDate, formatDateInput, getDaysRemaining, isExpiringSoon, isExpired } from '@/lib/helpers';
import { toast } from 'sonner';

type FormData = {
  namaDokumen: string;
  jenisDokumen: Dokumen['jenisDokumen'];
  nomorDokumen: string;
  tanggalBerlaku: Date | null;
  keterangan: string;
  kategoriId: string | null;
};

const initialFormData: FormData = {
  namaDokumen: '',
  jenisDokumen: 'dokumen_pekerjaan',
  nomorDokumen: '',
  tanggalBerlaku: null,
  keterangan: '',
  kategoriId: null,
};

export default function BeritaAcaraPage() {
  const { items, fetchItems, addItemToList, updateItemInList, deleteFromList } = useDokumenStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Dokumen | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
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
    });
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
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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
      if (selectedItem) {
        const result = await dokumenService.update(selectedItem.id, payload);
        updateItemInList(mapDokumen(result));
        toast.success('Dokumen berhasil diperbarui');
      } else {
        const result = await dokumenService.create(payload);
        addItemToList(mapDokumen(result));
        toast.success('Dokumen berhasil ditambahkan');
      }
      setModalOpen(false);
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{item.namaDokumen}</p>
            <p className="text-sm text-muted-foreground">{item.nomorDokumen}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'jenisDokumen',
      header: 'Jenis',
      render: (item: Dokumen) => (
        <Badge variant="outline" className="capitalize">
          {item.jenisDokumen.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'tanggalBerlaku',
      header: 'Masa Berlaku',
      sortable: true,
      render: (item: Dokumen) => {
        if (!item.tanggalBerlaku) return <p className="text-sm text-muted-foreground">-</p>;
        const days = getDaysRemaining(item.tanggalBerlaku);
        return (
          <div>
            <p>{formatDate(item.tanggalBerlaku)}</p>
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
      render: (item: Dokumen) => getStatusBadge(item),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Dokumen) => (
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

  const expiredCount = items.filter((i) => i.tanggalBerlaku && isExpired(i.tanggalBerlaku)).length;
  const expiringCount = items.filter((i) => i.tanggalBerlaku && !isExpired(i.tanggalBerlaku) && isExpiringSoon(i.tanggalBerlaku, 90)).length;

  return (
    <MainLayout title="Berita Acara">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Berita Acara Pekerjaan Telah Selesai
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Dokumen
          </Button>
        </div>

        {/* Alerts */}
        {(expiredCount > 0 || expiringCount > 0) && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  {expiredCount > 0 && (
                    <p className="text-sm font-medium text-destructive">
                      {expiredCount} dokumen sudah expired
                    </p>
                  )}
                  {expiringCount > 0 && (
                    <p className="text-sm font-medium text-warning">
                      {expiringCount} dokumen akan expired dalam 90 hari
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-sm text-muted-foreground">Total Dokumen</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {items.filter((i) => i.tanggalBerlaku && !isExpired(i.tanggalBerlaku) && !isExpiringSoon(i.tanggalBerlaku, 90)).length}
              </div>
              <p className="text-sm text-muted-foreground">Aktif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{expiringCount}</div>
              <p className="text-sm text-muted-foreground">Segera Expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{expiredCount}</div>
              <p className="text-sm text-muted-foreground">Expired</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari dokumen..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Dokumen' : selectedItem ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                  <Label htmlFor="jenisDokumen">Jenis Dokumen</Label>
                  <Select
                    value={formData.jenisDokumen}
                    onValueChange={(value: string) => setFormData({ ...formData, jenisDokumen: value as FormData['jenisDokumen'] })}
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
                <div className="col-span-2">
                  <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
                  <Input
                    id="tanggalBerlaku"
                    type="date"
                    value={formData.tanggalBerlaku ? formatDateInput(formData.tanggalBerlaku) : ''}
                    onChange={(e) => setFormData({ ...formData, tanggalBerlaku: e.target.value ? new Date(e.target.value) : null })}
                    disabled={viewMode}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Textarea
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    disabled={viewMode}
                    rows={2}
                  />
                </div>
              </div>
              {!viewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
