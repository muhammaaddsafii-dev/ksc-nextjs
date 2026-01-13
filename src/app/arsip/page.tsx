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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Eye, Archive, Download, FileText, CheckCircle2, FolderArchive, FileCheck, Award, Calendar, DollarSign } from 'lucide-react';
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
    setActiveTab('info');
    setModalOpen(true);
  };

  const [activeTab, setActiveTab] = useState('info');

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

  // Handle download dokumen
  const handleDownloadDokumen = (dokumen: string) => {
    const dummyContent = `Dokumen: ${dokumen}\n\nIni adalah dokumen arsip proyek yang telah selesai.`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = dokumen;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success(`Mengunduh: ${dokumen}`);
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
        <Badge variant="secondary">{item.dokumenArsip?.length || 0} file</Badge>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderArchive className="h-5 w-5" />
                {viewMode ? 'Detail Arsip Proyek' : 'Arsipkan Proyek'}
              </DialogTitle>
            </DialogHeader>
            
            {viewMode ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informasi</TabsTrigger>
                  <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
                  <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
                </TabsList>

                {/* Tab Info */}
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-900">Proyek Selesai</h3>
                          <p className="text-sm text-green-700">Proyek telah diselesaikan dan diarsipkan</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nama Proyek</Label>
                      <p className="font-medium text-lg">{formData.namaProyek}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Klien</Label>
                      <p className="font-medium">{formData.klien}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Nilai Kontrak
                      </Label>
                      <p className="font-bold text-xl text-primary">{formatCurrency(formData.nilaiKontrak)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Tanggal Selesai
                      </Label>
                      <p className="font-medium">{formatDate(formData.tanggalSelesai)}</p>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="text-muted-foreground">Catatan</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{formData.catatan || 'Tidak ada catatan'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Dokumen */}
                <TabsContent value="dokumen" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Dokumen Arsip</h3>
                      <p className="text-sm text-muted-foreground">
                        {formData.dokumenArsip?.length || 0} dokumen tersedia
                      </p>
                    </div>
                  </div>

                  {formData.dokumenArsip?.length === 0 || !formData.dokumenArsip ? (
                    <div className="p-8 text-center border rounded-lg bg-muted/50">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">Belum ada dokumen arsip</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {formData.dokumenArsip?.map((doc: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{doc}</p>
                              <p className="text-xs text-muted-foreground">Dokumen proyek</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDokumen(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Tab Ringkasan */}
                <TabsContent value="ringkasan" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Status Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Status Penyelesaian
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <Award className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold text-green-600">100%</p>
                            <p className="text-xs text-muted-foreground">Proyek Selesai</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dokumen Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-blue-600" />
                          Kelengkapan Dokumen
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <FolderArchive className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{formData.dokumenArsip?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Dokumen Arsip</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Timeline Proyek</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-full mt-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Proyek Diselesaikan</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(formData.tanggalSelesai)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full mt-1">
                              <FolderArchive className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">Diarsipkan</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedItem ? formatDate(selectedItem.createdAt) : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Ringkasan Proyek</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Proyek:</span>
                            <span className="font-medium">{formData.namaProyek}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Klien:</span>
                            <span className="font-medium">{formData.klien}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Nilai Kontrak:</span>
                            <span className="font-medium text-primary">{formatCurrency(formData.nilaiKontrak)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Tanggal Selesai:</span>
                            <span className="font-medium">{formatDate(formData.tanggalSelesai)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-muted-foreground">Total Dokumen:</span>
                            <span className="font-medium">{formData.dokumenArsip?.length || 0} file</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
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
                {viewMode && formData.dokumenArsip && formData.dokumenArsip.length > 0 && (
                  <div className="col-span-2">
                    <Label>Dokumen Arsip</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.dokumenArsip?.map((doc: string, idx: number) => (
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
            )}
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
