"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Upload } from "lucide-react";
import { useLelangStore } from "@/stores/lelangStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useAlatStore } from "@/stores/alatStore";
import { PraKontrakLelang } from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type FormData = Omit<PraKontrakLelang, "id" | "createdAt" | "updatedAt">;

const initialFormData: FormData = {
  namaLelang: "",
  instansi: "",
  nilaiPagu: 0,
  nilaiPenawaran: 0,
  status: "persiapan",
  tanggalLelang: new Date(),
  tanggalHasil: null,
  timAssigned: [],
  alatAssigned: [],
  dokumen: [],
};

export default function LelangPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } =
    useLelangStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
  const { items: alatList, fetchItems: fetchAlat } = useAlatStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PraKontrakLelang | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchAlat();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: PraKontrakLelang) => {
    setSelectedItem(item);
    setFormData({
      namaLelang: item.namaLelang,
      instansi: item.instansi,
      nilaiPagu: item.nilaiPagu,
      nilaiPenawaran: item.nilaiPenawaran,
      status: item.status,
      tanggalLelang: new Date(item.tanggalLelang),
      tanggalHasil: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
      timAssigned: item.timAssigned,
      alatAssigned: item.alatAssigned,
      dokumen: item.dokumen,
    });
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: PraKontrakLelang) => {
    setSelectedItem(item);
    setFormData({
      namaLelang: item.namaLelang,
      instansi: item.instansi,
      nilaiPagu: item.nilaiPagu,
      nilaiPenawaran: item.nilaiPenawaran,
      status: item.status,
      tanggalLelang: new Date(item.tanggalLelang),
      tanggalHasil: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
      timAssigned: item.timAssigned,
      alatAssigned: item.alatAssigned,
      dokumen: item.dokumen,
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: PraKontrakLelang) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success("Data lelang berhasil dihapus");
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success("Data lelang berhasil diperbarui");
    } else {
      addItem(formData);
      toast.success("Data lelang berhasil ditambahkan");
    }
    setModalOpen(false);
  };

  const handleUploadDoc = () => {
    const newDoc = `Dokumen_${Date.now()}.pdf`;
    setFormData({ ...formData, dokumen: [...formData.dokumen, newDoc] });
    toast.success("Dokumen berhasil diunggah (mock)");
  };

  const columns = [
    {
      key: "namaLelang",
      header: "Nama Lelang",
      sortable: true,
      render: (item: PraKontrakLelang) => (
        <div>
          <p className="font-medium">{item.namaLelang}</p>
          <p className="text-sm text-muted-foreground">{item.instansi}</p>
        </div>
      ),
    },
    {
      key: "nilaiPagu",
      header: "Nilai Pagu",
      sortable: true,
      render: (item: PraKontrakLelang) => formatCurrency(item.nilaiPagu),
    },
    {
      key: "nilaiPenawaran",
      header: "Nilai Penawaran",
      render: (item: PraKontrakLelang) => formatCurrency(item.nilaiPenawaran),
    },
    {
      key: "status",
      header: "Status",
      render: (item: PraKontrakLelang) => <StatusBadge status={item.status} />,
    },
    {
      key: "tanggalLelang",
      header: "Tanggal Lelang",
      render: (item: PraKontrakLelang) => formatDate(item.tanggalLelang),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: PraKontrakLelang) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleView(item);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Project Lelang">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Kelola proses lelang dan tender proyek
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-sm text-muted-foreground">Total Lelang</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {items.filter((i) => i.status === "evaluasi").length}
              </div>
              <p className="text-sm text-muted-foreground">Dalam Evaluasi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {items.filter((i) => i.status === "menang").length}
              </div>
              <p className="text-sm text-muted-foreground">Menang</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {items.filter((i) => i.status === "kalah").length}
              </div>
              <p className="text-sm text-muted-foreground">Kalah</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Lelang</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari lelang..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode
                  ? "Detail Lelang"
                  : selectedItem
                  ? "Edit Lelang"
                  : "Tambah Lelang Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="namaLelang">Nama Lelang</Label>
                  <Input
                    id="namaLelang"
                    value={formData.namaLelang}
                    onChange={(e) =>
                      setFormData({ ...formData, namaLelang: e.target.value })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="instansi">Instansi</Label>
                  <Input
                    id="instansi"
                    value={formData.instansi}
                    onChange={(e) =>
                      setFormData({ ...formData, instansi: e.target.value })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        status: value as FormData["status"],
                      })
                    }
                    disabled={viewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persiapan">Persiapan</SelectItem>
                      <SelectItem value="pengajuan">Pengajuan</SelectItem>
                      <SelectItem value="evaluasi">Evaluasi</SelectItem>
                      <SelectItem value="menang">Menang</SelectItem>
                      <SelectItem value="kalah">Kalah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nilaiPagu">Nilai Pagu</Label>
                  <Input
                    id="nilaiPagu"
                    type="number"
                    value={formData.nilaiPagu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nilaiPagu: Number(e.target.value),
                      })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nilaiPenawaran">Nilai Penawaran</Label>
                  <Input
                    id="nilaiPenawaran"
                    type="number"
                    value={formData.nilaiPenawaran}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nilaiPenawaran: Number(e.target.value),
                      })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalLelang">Tanggal Lelang</Label>
                  <Input
                    id="tanggalLelang"
                    type="date"
                    value={formatDateInput(formData.tanggalLelang)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalLelang: new Date(e.target.value),
                      })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalHasil">Tanggal Hasil</Label>
                  <Input
                    id="tanggalHasil"
                    type="date"
                    value={
                      formData.tanggalHasil
                        ? formatDateInput(formData.tanggalHasil)
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalHasil: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                    disabled={viewMode}
                  />
                </div>
              </div>

              {/* Tim Assignment */}
              <div>
                <Label>Tim yang Ditugaskan</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tenagaAhliList.map((ta) => (
                    <Badge
                      key={ta.id}
                      variant={
                        formData.timAssigned.includes(ta.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (viewMode) return;
                        setFormData({
                          ...formData,
                          timAssigned: formData.timAssigned.includes(ta.id)
                            ? formData.timAssigned.filter((id) => id !== ta.id)
                            : [...formData.timAssigned, ta.id],
                        });
                      }}
                    >
                      {ta.nama}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Alat Assignment */}
              <div>
                <Label>Alat yang Ditugaskan</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {alatList.map((alat) => (
                    <Badge
                      key={alat.id}
                      variant={
                        formData.alatAssigned.includes(alat.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        if (viewMode) return;
                        setFormData({
                          ...formData,
                          alatAssigned: formData.alatAssigned.includes(alat.id)
                            ? formData.alatAssigned.filter(
                                (id) => id !== alat.id
                              )
                            : [...formData.alatAssigned, alat.id],
                        });
                      }}
                    >
                      {alat.namaAlat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dokumen */}
              <div>
                <Label>Dokumen</Label>
                <div className="mt-2 space-y-2">
                  {formData.dokumen.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{doc}</Badge>
                      {!viewMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              dokumen: formData.dokumen.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!viewMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUploadDoc}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Dokumen (Mock)
                    </Button>
                  )}
                </div>
              </div>

              {!viewMode && (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedItem ? "Simpan Perubahan" : "Tambah"}
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
          title="Hapus Lelang"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaLelang}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />
      </div>
    </MainLayout>
  );
}
