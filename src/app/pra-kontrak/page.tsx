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
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { PraKontrakNonLelang } from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type FormData = Omit<PraKontrakNonLelang, "id" | "createdAt" | "updatedAt"> & {
  timAssigned?: string[];
};

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
  timAssigned: [],
};

export default function PraKontrakPage() {
  const { items, isLoading, fetchItems, addItem, updateItem, deleteItem } =
    usePraKontrakStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
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
    fetchTenagaAhli();
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
      timAssigned: (item as any).timAssigned || [],
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
      timAssigned: (item as any).timAssigned || [],
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

  const handleRemoveTeam = (id: string) => {
    setFormData({
      ...formData,
      timAssigned: (formData.timAssigned || []).filter((tid) => tid !== id),
    });
  };

  const handleAddTeam = (id: string) => {
    if (!(formData.timAssigned || []).includes(id)) {
      setFormData({
        ...formData,
        timAssigned: [...(formData.timAssigned || []), id],
      });
    }
  };

  const columns = [
    {
      key: "namaProyek",
      header: "Nama Proyek",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm">{item.namaProyek}</p>
          <p className="text-xs text-muted-foreground truncate">{item.klien}</p>
        </div>
      ),
    },
    {
      key: "nilaiEstimasi",
      header: "Nilai Estimasi",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div className="text-center font-medium text-sm min-w-[120px]">
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
        <div className="text-center text-sm min-w-[100px]">
          {formatDate(item.tanggalTarget)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: PraKontrakNonLelang) => (
        <div className="flex justify-center items-center gap-1 min-w-[120px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleView(item);
            }}
          >
            <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Project Non Lelang">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kelola potensi proyek, penawaran, dan negosiasi
            </p>
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Non-Lelang</CardTitle>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {viewMode
                  ? "Detail Proyek"
                  : selectedItem
                    ? "Edit Proyek"
                    : "Tambah Proyek Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Informasi Dasar */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-semibold text-sm sm:text-base border-b pb-2">
                  Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="namaProyek" className="text-xs sm:text-sm">
                      Nama Proyek <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="namaProyek"
                      value={formData.namaProyek}
                      onChange={(e) =>
                        setFormData({ ...formData, namaProyek: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="klien" className="text-xs sm:text-sm">
                      Klien <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="klien"
                      value={formData.klien}
                      onChange={(e) =>
                        setFormData({ ...formData, klien: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nilaiEstimasi" className="text-xs sm:text-sm">
                      Nilai Estimasi <span className="text-red-500">*</span>
                    </Label>
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
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs sm:text-sm">
                      Status <span className="text-red-500">*</span>
                    </Label>
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
                      <SelectTrigger className="text-sm">
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
                    <Label htmlFor="pic" className="text-xs sm:text-sm">
                      PIC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pic"
                      value={formData.pic}
                      onChange={(e) =>
                        setFormData({ ...formData, pic: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalMulai" className="text-xs sm:text-sm">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </Label>
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
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalTarget" className="text-xs sm:text-sm">
                      Tanggal Target <span className="text-red-500">*</span>
                    </Label>
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
                      className="text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="catatan" className="text-xs sm:text-sm">
                      Catatan
                    </Label>
                    <Textarea
                      id="catatan"
                      value={formData.catatan}
                      onChange={(e) =>
                        setFormData({ ...formData, catatan: e.target.value })
                      }
                      disabled={viewMode}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tim yang Ditugaskan - FULLY RESPONSIVE */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm sm:text-base border-b pb-2">
                  Tim yang Ditugaskan
                </h3>
                {!viewMode && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <Label className="text-xs sm:text-sm">Pilih Tim dari Daftar Tenaga Ahli</Label>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {(formData.timAssigned || []).length} dipilih
                    </Badge>
                  </div>
                )}
                {viewMode && (
                  <div className="mb-3">
                    <Label className="text-xs sm:text-sm">Daftar Tim yang Ditugaskan</Label>
                  </div>
                )}
                <div className="border rounded-lg max-h-[350px] overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {!viewMode && (
                          <th className="text-center p-2 sm:p-3 text-xs sm:text-sm font-medium w-10 sm:w-12"></th>
                        )}
                        <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">
                          Nama Pekerja
                        </th>
                        <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">
                          Jabatan
                        </th>
                        <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">
                          Status
                        </th>
                        <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium">
                          Keahlian
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode ? (
                        // Mode View: Hanya tampilkan tim yang dipilih
                        (formData.timAssigned || []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground"
                            >
                              Tidak ada tim yang ditugaskan
                            </td>
                          </tr>
                        ) : (
                          (formData.timAssigned || []).map((id) => {
                            const ta = tenagaAhliList.find((t) => t.id === id);
                            return ta ? (
                              <tr
                                key={id}
                                className="border-t hover:bg-muted/50"
                              >
                                <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">
                                  {ta.nama}
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">{ta.jabatan}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                  <Badge
                                    variant={
                                      ta.status === "tersedia"
                                        ? "default"
                                        : ta.status === "ditugaskan"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {ta.status}
                                  </Badge>
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {ta.keahlian.slice(0, 2).map((k, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-[10px] sm:text-xs"
                                      >
                                        {k}
                                      </Badge>
                                    ))}
                                    {ta.keahlian.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] sm:text-xs"
                                      >
                                        +{ta.keahlian.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : null;
                          })
                        )
                      ) : // Mode Edit/Create: Tampilkan semua tim dengan checkbox
                        tenagaAhliList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground"
                            >
                              Belum ada data tenaga ahli
                            </td>
                          </tr>
                        ) : (
                          tenagaAhliList.map((ta) => {
                            const isSelected = (formData.timAssigned || []).includes(
                              ta.id
                            );
                            return (
                              <tr
                                key={ta.id}
                                className={`border-t hover:bg-muted/50 ${
                                  isSelected ? "bg-blue-50/50" : ""
                                }`}
                              >
                                <td className="p-2 sm:p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleAddTeam(ta.id);
                                      } else {
                                        handleRemoveTeam(ta.id);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm font-medium">
                                  {ta.nama}
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">{ta.jabatan}</td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                  <Badge
                                    variant={
                                      ta.status === "tersedia"
                                        ? "default"
                                        : ta.status === "ditugaskan"
                                          ? "secondary"
                                          : "outline"
                                    }
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {ta.status}
                                  </Badge>
                                </td>
                                <td className="p-2 sm:p-3 text-xs sm:text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {ta.keahlian.slice(0, 2).map((k, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-[10px] sm:text-xs"
                                      >
                                        {k}
                                      </Badge>
                                    ))}
                                    {ta.keahlian.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] sm:text-xs"
                                      >
                                        +{ta.keahlian.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                    </tbody>
                  </table>
                </div>
                {!viewMode && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                    * Centang checkbox untuk menambahkan tim ke project ini
                  </p>
                )}
              </div>

              {/* Dokumen */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm sm:text-base border-b pb-2">
                  Dokumen
                </h3>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <Label className="text-xs sm:text-sm">Dokumen Proyek</Label>
                    {!viewMode && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectFromTemplate}
                          className="text-xs sm:text-sm"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Dari </span>Template
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUploadDoc}
                          className="text-xs sm:text-sm"
                        >
                          <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[200px] overflow-x-auto overflow-y-auto">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs sm:text-sm font-medium">
                            Nama File
                          </th>
                          <th className="text-right p-2 text-xs sm:text-sm font-medium w-20 sm:w-24">
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
                              <td className="p-2 text-xs sm:text-sm flex items-center gap-2">
                                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 flex-shrink-0" />
                                <span className="truncate">{doc}</span>
                              </td>
                              <td className="p-2">
                                <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                    onClick={() => {
                                      toast.success(`Mengunduh: ${doc}`);
                                    }}
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                                  </Button>
                                  {!viewMode && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          dokumen: formData.dokumen.filter(
                                            (_, i) => i !== idx
                                          ),
                                        })
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
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

              {/* Action Buttons */}
              {!viewMode && (
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {selectedItem ? "Simpan Perubahan" : "Tambah"}
                  </Button>
                </div>
              )}

              {viewMode && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Tutup
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
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
