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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Wrench } from 'lucide-react';
import { useAlatStore } from '@/stores/alatStore';
import { Alat } from '@/types';
import { toast } from 'sonner';

type FormData = Omit<Alat, 'id' | 'createdAt' | 'updatedAt'>;

const initialFormData: FormData = {
  namaAlat: '',
  kategori: '',
  merk: '',
  spesifikasi: '',
  kondisi: 'baik',
  status: 'tersedia',
  lokasiTerakhir: '',
};

const kategoriOptions = ['Survey', 'Aerial Survey', 'Testing', 'Lab', 'Konstruksi', 'Lainnya'];

export default function AlatPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } = useAlatStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Alat | null>(null);
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
    });
    setViewMode(false);
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
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: Alat) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Alat berhasil dihapus');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success('Alat berhasil diperbarui');
    } else {
      addItem(formData);
      toast.success('Alat berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const columns = [
    {
      key: 'namaAlat',
      header: 'Nama Alat',
      sortable: true,
      render: (item: Alat) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded">
            <Wrench className="h-4 w-4" />
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
    },
    {
      key: 'kondisi',
      header: 'Kondisi',
      render: (item: Alat) => <StatusBadge status={item.kondisi} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Alat) => <StatusBadge status={item.status} />,
    },
    {
      key: 'lokasiTerakhir',
      header: 'Lokasi',
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Alat) => (
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

  return (
    <MainLayout title="Database Alat">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Kelola inventaris alat dan peralatan
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Alat
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-sm text-muted-foreground">Total Alat</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(i => i.status === 'tersedia').length}
              </div>
              <p className="text-sm text-muted-foreground">Tersedia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {items.filter(i => i.status === 'digunakan').length}
              </div>
              <p className="text-sm text-muted-foreground">Digunakan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {items.filter(i => i.status === 'diperbaiki').length}
              </div>
              <p className="text-sm text-muted-foreground">Diperbaiki</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Alat</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari alat..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Alat' : selectedItem ? 'Edit Alat' : 'Tambah Alat Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="namaAlat">Nama Alat</Label>
                  <Input
                    id="namaAlat"
                    value={formData.namaAlat}
                    onChange={(e) => setFormData({ ...formData, namaAlat: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value: string) => setFormData({ ...formData, kategori: value })}
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoriOptions.map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="merk">Merk</Label>
                  <Input
                    id="merk"
                    value={formData.merk}
                    onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kondisi">Kondisi</Label>
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
                      <SelectItem value="tersedia">Tersedia</SelectItem>
                      <SelectItem value="digunakan">Digunakan</SelectItem>
                      <SelectItem value="diperbaiki">Diperbaiki</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="lokasiTerakhir">Lokasi Terakhir</Label>
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
