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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, AlertTriangle, FileText } from 'lucide-react';
import { useLegalitasStore } from '@/stores/legalitasStore';
import { Legalitas } from '@/types';
import { formatDate, formatDateInput, getDaysRemaining, isExpiringSoon, isExpired } from '@/lib/helpers';
import { toast } from 'sonner';

type FormData = Omit<Legalitas, 'id' | 'createdAt' | 'updatedAt'>;

const initialFormData: FormData = {
  namaDokumen: '',
  jenisDokumen: 'sertifikat',
  nomorDokumen: '',
  tanggalTerbit: new Date(),
  tanggalBerlaku: new Date(),
  reminder: true,
};

export default function LegalitasPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } = useLegalitasStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Legalitas | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: Legalitas) => {
    setSelectedItem(item);
    setFormData({
      namaDokumen: item.namaDokumen,
      jenisDokumen: item.jenisDokumen,
      nomorDokumen: item.nomorDokumen,
      tanggalTerbit: new Date(item.tanggalTerbit),
      tanggalBerlaku: new Date(item.tanggalBerlaku),
      reminder: item.reminder,
    });
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: Legalitas) => {
    setSelectedItem(item);
    setFormData({
      namaDokumen: item.namaDokumen,
      jenisDokumen: item.jenisDokumen,
      nomorDokumen: item.nomorDokumen,
      tanggalTerbit: new Date(item.tanggalTerbit),
      tanggalBerlaku: new Date(item.tanggalBerlaku),
      reminder: item.reminder,
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: Legalitas) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Dokumen berhasil dihapus');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success('Dokumen berhasil diperbarui');
    } else {
      addItem(formData);
      toast.success('Dokumen berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const getStatusBadge = (item: Legalitas) => {
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
      render: (item: Legalitas) => (
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
      render: (item: Legalitas) => (
        <Badge variant="outline" className="capitalize">
          {item.jenisDokumen.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'tanggalBerlaku',
      header: 'Masa Berlaku',
      sortable: true,
      render: (item: Legalitas) => {
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
      render: (item: Legalitas) => getStatusBadge(item),
    },
    {
      key: 'reminder',
      header: 'Reminder',
      render: (item: Legalitas) => (
        <Badge variant={item.reminder ? 'default' : 'secondary'}>
          {item.reminder ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Legalitas) => (
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

  const expiredCount = items.filter(i => isExpired(i.tanggalBerlaku)).length;
  const expiringCount = items.filter(i => !isExpired(i.tanggalBerlaku) && isExpiringSoon(i.tanggalBerlaku, 90)).length;

  return (
    <MainLayout title="Legalitas & Sertifikat">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Kelola dokumen legalitas dan sertifikat perusahaan
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
                {items.filter(i => !isExpired(i.tanggalBerlaku) && !isExpiringSoon(i.tanggalBerlaku, 90)).length}
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
                      <SelectItem value="izin_usaha">Izin Usaha</SelectItem>
                      <SelectItem value="sertifikat">Sertifikat</SelectItem>
                      <SelectItem value="akta">Akta</SelectItem>
                      <SelectItem value="npwp">NPWP</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
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
                  <Label htmlFor="tanggalTerbit">Tanggal Terbit</Label>
                  <Input
                    id="tanggalTerbit"
                    type="date"
                    value={formatDateInput(formData.tanggalTerbit)}
                    onChange={(e) => setFormData({ ...formData, tanggalTerbit: new Date(e.target.value) })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalBerlaku">Tanggal Berlaku</Label>
                  <Input
                    id="tanggalBerlaku"
                    type="date"
                    value={formatDateInput(formData.tanggalBerlaku)}
                    onChange={(e) => setFormData({ ...formData, tanggalBerlaku: new Date(e.target.value) })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder">Reminder</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan notifikasi sebelum expired
                    </p>
                  </div>
                  <Switch
                    id="reminder"
                    checked={formData.reminder}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, reminder: checked })}
                    disabled={viewMode}
                  />
                </div>
              </div>
              {!viewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
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
