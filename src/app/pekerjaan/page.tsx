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
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
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
    nama: '', progress: 0, tanggalMulai: new Date(), tanggalSelesai: new Date(), status: 'pending'
  });

  // Anggaran form
  const [newAnggaran, setNewAnggaran] = useState<Omit<AnggaranItem, 'id'>>({
    kategori: '', deskripsi: '', jumlah: 0, realisasi: 0
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
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success('Pekerjaan berhasil diperbarui');
    } else {
      addItem(formData);
      toast.success('Pekerjaan berhasil ditambahkan');
    }
    setModalOpen(false);
  };

  const handleAddTahapan = () => {
    if (!newTahapan.nama) return;
    setFormData({
      ...formData,
      tahapan: [...formData.tahapan, { ...newTahapan, id: Date.now().toString() }]
    });
    setNewTahapan({ nama: '', progress: 0, tanggalMulai: new Date(), tanggalSelesai: new Date(), status: 'pending' });
    toast.success('Tahapan ditambahkan');
  };

  const handleAddAnggaran = () => {
    if (!newAnggaran.kategori) return;
    setFormData({
      ...formData,
      anggaran: [...formData.anggaran, { ...newAnggaran, id: Date.now().toString() }]
    });
    setNewAnggaran({ kategori: '', deskripsi: '', jumlah: 0, realisasi: 0 });
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
                    <div>
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
                      <Label htmlFor="progress">Progress (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                        disabled={viewMode}
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
                  <Label>Pilih Tim</Label>
                  <div className="flex flex-wrap gap-2">
                    {tenagaAhliList.map((ta) => (
                      <Badge
                        key={ta.id}
                        variant={formData.tim.includes(ta.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (viewMode) return;
                          setFormData({
                            ...formData,
                            tim: formData.tim.includes(ta.id)
                              ? formData.tim.filter(id => id !== ta.id)
                              : [...formData.tim, ta.id]
                          });
                        }}
                      >
                        {ta.nama} - {ta.jabatan}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tahapan" className="space-y-4 mt-4">
                  {!viewMode && (
                    <div className="grid grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
                      <Input
                        placeholder="Nama Tahapan"
                        value={newTahapan.nama}
                        onChange={(e) => setNewTahapan({ ...newTahapan, nama: e.target.value })}
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
                  )}
                  <div className="space-y-2">
                    {formData.tahapan.map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <span className="font-medium">{idx + 1}. {t.nama}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(t.tanggalMulai)} - {formatDate(t.tanggalSelesai)}
                        </span>
                        <StatusBadge status={t.status} />
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
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="anggaran" className="space-y-4 mt-4">
                  {!viewMode && (
                    <div className="grid grid-cols-5 gap-2 p-4 bg-muted rounded-lg">
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
                  )}
                  <div className="space-y-2">
                    {formData.anggaran.map((a, idx) => (
                      <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{a.kategori}</p>
                          <p className="text-sm text-muted-foreground">{a.deskripsi}</p>
                        </div>
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
                              anggaran: formData.anggaran.filter((_, i) => i !== idx)
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
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
