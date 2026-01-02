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
import { Plus, Edit, Trash2, Eye, Award } from 'lucide-react';
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
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{item.nama.split(' ').map(n => n[0]).join('').substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.nama}</p>
            <p className="text-sm text-muted-foreground">{item.jabatan}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'keahlian',
      header: 'Keahlian',
      render: (item: TenagaAhli) => (
        <div className="flex flex-wrap gap-1">
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
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-muted-foreground" />
          <span>{item.sertifikat.length}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: TenagaAhli) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: TenagaAhli) => (
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
    <MainLayout title="Database Tenaga Ahli">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Kelola data tenaga ahli dan sertifikasi
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tenaga Ahli
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {items.filter(i => i.status === 'ditugaskan').length}
              </div>
              <p className="text-sm text-muted-foreground">Ditugaskan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                {items.filter(i => i.status === 'cuti').length}
              </div>
              <p className="text-sm text-muted-foreground">Cuti</p>
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
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Tenaga Ahli' : selectedItem ? 'Edit Tenaga Ahli' : 'Tambah Tenaga Ahli Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                      <SelectItem value="ditugaskan">Ditugaskan</SelectItem>
                      <SelectItem value="cuti">Cuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
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
                  <div className="grid grid-cols-5 gap-2 mt-2 p-3 bg-muted rounded-lg">
                    <Input
                      placeholder="Nama Sertifikat"
                      value={newSertifikat.nama}
                      onChange={(e) => setNewSertifikat({ ...newSertifikat, nama: e.target.value })}
                    />
                    <Input
                      placeholder="Nomor"
                      value={newSertifikat.nomorSertifikat}
                      onChange={(e) => setNewSertifikat({ ...newSertifikat, nomorSertifikat: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={formatDateInput(newSertifikat.tanggalTerbit)}
                      onChange={(e) => setNewSertifikat({ ...newSertifikat, tanggalTerbit: new Date(e.target.value) })}
                    />
                    <Input
                      type="date"
                      value={formatDateInput(newSertifikat.tanggalBerlaku)}
                      onChange={(e) => setNewSertifikat({ ...newSertifikat, tanggalBerlaku: new Date(e.target.value) })}
                    />
                    <Button type="button" onClick={handleAddSertifikat}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="space-y-2 mt-2">
                  {formData.sertifikat.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{s.nama}</p>
                        <p className="text-sm text-muted-foreground">{s.nomorSertifikat}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>Berlaku: {formatDate(s.tanggalBerlaku)}</p>
                      </div>
                      {!viewMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({
                            ...formData,
                            sertifikat: formData.sertifikat.filter((_, i) => i !== idx)
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
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
