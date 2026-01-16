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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Upload, FileText, Download } from "lucide-react";
import { usePraKontrakStore } from "@/stores/praKontrakStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { PraKontrakNonLelang } from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type FormData = Omit<PraKontrakNonLelang, "id" | "createdAt" | "updatedAt">;

const initialFormData: FormData = {
  namaProyek: "",
  klien: "",
  nilaiEstimasi: 0,
  status: "potensi",
  tanggalMulai: new Date(),
  tanggalTarget: new Date(),
  pic: "",
  catatan: "",
  dokumen: [],
};

export default function PraKontrakPage() {
  const { items, isLoading, fetchItems, addItem, updateItem, deleteItem } =
    usePraKontrakStore();
  const { items: legalitasList, fetchItems: fetchLegalitas } =
    useLegalitasStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PraKontrakNonLelang | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchLegalitas();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setViewMode(false);
    setModalOpen(true);
  };

  const handleEdit = (item: PraKontrakNonLelang) => {
    setSelectedItem(item);
    setFormData({
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiEstimasi: item.nilaiEstimasi,
      status: item.status,
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalTarget: new Date(item.tanggalTarget),
      pic: item.pic,
      catatan: item.catatan,
      // Jika dokumen belum ada, tambahkan dokumen dummy untuk demo
      dokumen: item.dokumen?.length > 0
        ? item.dokumen
        : [
          `Proposal_Teknis_${item.namaProyek.substring(0, 10)}.pdf`,
          `Company_Profile_${item.klien.substring(0, 8)}.pdf`,
          `RAB_${item.namaProyek.substring(0, 10)}.xlsx`,
          `Surat_Penawaran_Harga.pdf`,
          `Portfolio_Proyek.pdf`,
        ],
    });
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: PraKontrakNonLelang) => {
    setSelectedItem(item);
    setFormData({
      namaProyek: item.namaProyek,
      klien: item.klien,
      nilaiEstimasi: item.nilaiEstimasi,
      status: item.status,
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalTarget: new Date(item.tanggalTarget),
      pic: item.pic,
      catatan: item.catatan,
      // Jika dokumen belum ada, tambahkan dokumen dummy untuk demo
      dokumen: item.dokumen?.length > 0
        ? item.dokumen
        : [
          `Proposal_Teknis_${item.namaProyek.substring(0, 10)}.pdf`,
          `Company_Profile_${item.klien.substring(0, 8)}.pdf`,
          `RAB_${item.namaProyek.substring(0, 10)}.xlsx`,
          `Surat_Penawaran_Harga.pdf`,
          `Portfolio_Proyek.pdf`,
        ],
    });
    setViewMode(true);
    setModalOpen(true);
  };

  const handleDelete = (item: PraKontrakNonLelang) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteItem(selectedItem.id);
      toast.success("Data berhasil dihapus");
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateItem(selectedItem.id, formData);
      toast.success("Data berhasil diperbarui");
    } else {
      addItem(formData);
      toast.success("Data berhasil ditambahkan");
    }
    setModalOpen(false);
  };

  const handleUploadDoc = () => {
    const newDoc = `Dokumen_${Date.now()}.pdf`;
    setFormData({
      ...formData,
      dokumen: [...formData.dokumen, newDoc],
    });
    toast.success("Dokumen berhasil diunggah (mock)");
  };

  const handleSelectFromTemplate = () => {
    setShowTemplateDialog(true);
  };

  const handleAddFromTemplate = (docName: string) => {
    setFormData({
      ...formData,
      dokumen: [...formData.dokumen, docName],
    });
    toast.success("Dokumen berhasil ditambahkan dari template");
    setShowTemplateDialog(false);
  };

  const columns = [
    {
      key: "namaProyek",
      header: "Nama Proyek",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div>
          <p className="font-medium">{item.namaProyek}</p>
          <p className="text-sm text-muted-foreground">{item.klien}</p>
        </div>
      ),
    },
    {
      key: "nilaiEstimasi",
      header: "Nilai Estimasi",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div className="text-center font-medium">
          {formatCurrency(item.nilaiEstimasi)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: PraKontrakNonLelang) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: "pic",
      header: "PIC",
      sortable: true,
    },
    {
      key: "tanggalTarget",
      header: "Target",
      render: (item: PraKontrakNonLelang) => (
        <div className="text-center">
          {formatDate(item.tanggalTarget)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: PraKontrakNonLelang) => (
        <div className="flex justify-center items-center gap-2">
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
    <MainLayout title="Project Non Lelang">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Kelola potensi proyek, penawaran, dan negosiasi
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Pra Kontrak</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari proyek..."
            />
          </CardContent>
        </Card>

        {/* Form Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {viewMode
                  ? "Detail Proyek"
                  : selectedItem
                    ? "Edit Proyek"
                    : "Tambah Proyek Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="namaProyek">Nama Proyek</Label>
                  <Input
                    id="namaProyek"
                    value={formData.namaProyek}
                    onChange={(e) =>
                      setFormData({ ...formData, namaProyek: e.target.value })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="klien">Klien</Label>
                  <Input
                    id="klien"
                    value={formData.klien}
                    onChange={(e) =>
                      setFormData({ ...formData, klien: e.target.value })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nilaiEstimasi">Nilai Estimasi</Label>
                  <Input
                    id="nilaiEstimasi"
                    type="number"
                    value={formData.nilaiEstimasi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nilaiEstimasi: Number(e.target.value),
                      })
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
                      <SelectItem value="potensi">Potensi</SelectItem>
                      <SelectItem value="penawaran">Penawaran</SelectItem>
                      <SelectItem value="negosiasi">Negosiasi</SelectItem>
                      <SelectItem value="kontrak">Kontrak</SelectItem>
                      <SelectItem value="batal">Batal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pic">PIC</Label>
                  <Input
                    id="pic"
                    value={formData.pic}
                    onChange={(e) =>
                      setFormData({ ...formData, pic: e.target.value })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                  <Input
                    id="tanggalMulai"
                    type="date"
                    value={formatDateInput(formData.tanggalMulai)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalMulai: new Date(e.target.value),
                      })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalTarget">Tanggal Target</Label>
                  <Input
                    id="tanggalTarget"
                    type="date"
                    value={formatDateInput(formData.tanggalTarget)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggalTarget: new Date(e.target.value),
                      })
                    }
                    disabled={viewMode}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="catatan">Catatan</Label>
                  <Textarea
                    id="catatan"
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    disabled={viewMode}
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dokumen</Label>
                    {!viewMode && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectFromTemplate}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Dari Template
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUploadDoc}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium">
                            Nama File
                          </th>
                          <th className="text-right p-2 text-xs font-medium w-24">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.dokumen.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-center p-3 text-xs text-muted-foreground"
                            >
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          formData.dokumen.map((doc, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/50">
                              <td className="p-2 text-xs flex items-center gap-2">
                                <FileText className="h-3 w-3 text-blue-600" />
                                {doc}
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = '#';
                                      link.download = doc;
                                      toast.success(`Mengunduh: ${doc}`);
                                    }}
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3 text-blue-600" />
                                  </Button>
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
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  )}
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
          title="Hapus Proyek"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaProyek}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />

        {/* Template Selection Dialog */}
        <Dialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Pilih Dokumen dari Template Legalitas
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {legalitasList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada template dokumen legalitas</p>
                  <p className="text-sm mt-1">
                    Silakan tambahkan dokumen di menu Legalitas & Sertifikat
                    terlebih dahulu
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">
                          Nama Dokumen
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Jenis
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Nomor
                        </th>
                        <th className="text-center p-3 text-sm font-medium w-24">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {legalitasList.map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-t hover:bg-muted/50"
                        >
                          <td className="p-3 text-sm font-medium">
                            {doc.namaDokumen}
                          </td>
                          <td className="p-3 text-sm">
                            <Badge variant="outline" className="capitalize">
                              {doc.jenisDokumen.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{doc.nomorDokumen}</td>
                          <td className="p-3 text-center">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleAddFromTemplate(
                                  `${doc.namaDokumen} (${doc.nomorDokumen})`
                                )
                              }
                            >
                              Pilih
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateDialog(false)}
              >
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
