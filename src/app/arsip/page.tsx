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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye, Archive, RotateCcw } from 'lucide-react';
import { useArsipStore } from '@/stores/arsipStore';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { ArsipPekerjaan } from '@/types';
import { formatCurrency, formatDate, formatDateInput } from '@/lib/helpers';
import { toast } from 'sonner';

type FormData = Omit<ArsipPekerjaan, 'id' | 'createdAt' | 'updatedAt'>;

const initialFormData: FormData = {
  pekerjaanId: '',
  namaProyek: '',
  klien: '',
  nilaiKontrak: 0,
  tanggalSelesai: new Date(),
  dokumenArsip: [],
  catatan: '',
};

export default function ArsipPage() {
  const { items, fetchItems, addItem, deleteItem } = useArsipStore();
  const { items: pekerjaanList, fetchItems: fetchPekerjaan } = usePekerjaanStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArsipPekerjaan | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchPekerjaan();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: ArsipPekerjaan) => {
    setSelectedItem(item);
    setFormData({
      pekerjaanId: item.pekerjaanId,
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiKontrak: item.nilaiKontrak,
      tanggalSelesai: new Date(item.tanggalSelesai),
      dokumenArsip: item.dokumenArsip,
      catatan: item.catatan,
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: ArsipPekerjaan) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success('Arsip berhasil dihapus secara permanen');
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem(formData);
    toast.success('Pekerjaan berhasil diarsipkan');
    setModalOpen(false);
  };

  const handleArchiveFromPekerjaan = (pekerjaanId: string) => {
    const pekerjaan = pekerjaanList.find(p => p.id === pekerjaanId);
    if (pekerjaan) {
      setFormData({
        pekerjaanId: pekerjaan.id,
        namaProyek: pekerjaan.namaProyek,
        klien: pekerjaan.klien,
        nilaiKontrak: pekerjaan.nilaiKontrak,
        tanggalSelesai: new Date(pekerjaan.tanggalSelesai),
        dokumenArsip: [],
        catatan: '',
      });
      setViewMode(false);
      setModalOpen(true);
    }
  };

  const columns = [
    {
      key: 'namaProyek',
      header: 'Proyek',
      sortable: true,
      render: (item: ArsipPekerjaan) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded">
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{item.namaProyek}</p>
            <p className="text-sm text-muted-foreground">{item.klien}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'nilaiKontrak',
      header: 'Nilai Kontrak',
      sortable: true,
      render: (item: ArsipPekerjaan) => formatCurrency(item.nilaiKontrak),
    },
    {
      key: 'tanggalSelesai',
      header: 'Tanggal Selesai',
      sortable: true,
      render: (item: ArsipPekerjaan) => formatDate(item.tanggalSelesai),
    },
    {
      key: 'dokumenArsip',
      header: 'Dokumen',
      render: (item: ArsipPekerjaan) => (
        <Badge variant="secondary">{item.dokumenArsip.length} file</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: ArsipPekerjaan) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleView(item); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const completedPekerjaan = pekerjaanList.filter(p => 
    p.status === 'selesai' || p.status === 'serah_terima'
  );

  return (
    <MainLayout title="Arsip Pekerjaan">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Kelola arsip proyek yang sudah selesai
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Arsipkan Proyek
          </Button>
        </div>

        {/* Quick Archive */}
        {completedPekerjaan.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Proyek Siap Diarsipkan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {completedPekerjaan.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{p.namaProyek}</p>
                      <p className="text-sm text-muted-foreground">{p.klien}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleArchiveFromPekerjaan(p.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Arsipkan
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Arsip</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari arsip..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {viewMode ? 'Detail Arsip' : 'Arsipkan Proyek'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="col-span-2">
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
                <div className="col-span-2">
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    disabled={viewMode}
                    rows={3}
                  />
                </div>
                {viewMode && formData.dokumenArsip.length > 0 && (
                  <div className="col-span-2">
                    <Label>Dokumen Arsip</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.dokumenArsip.map((doc, idx) => (
                        <Badge key={idx} variant="secondary">{doc}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {!viewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    Arsipkan
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
          title="Hapus Arsip Permanen"
          description={`Apakah Anda yakin ingin menghapus arsip "${selectedItem?.namaProyek}" secara permanen? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus Permanen"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
