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
import { Plus, Edit, Trash2, Eye, Upload, FileText, Download, Search } from "lucide-react";
import { usePraKontrakStore } from "@/stores/praKontrakStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { PraKontrakNonLelang } from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { usePerusahaanStore } from "@/stores/perusahaanStore";

type FormData = Omit<PraKontrakNonLelang, "id" | "createdAt" | "updatedAt"> & {
  timAssigned?: string[];
  jenisPekerjaan?: string;
  namaPerusahaan?: string;
  // pic removed
};

const initialFormData: FormData = {
  namaProyek: "",
  klien: "",
  nilaiEstimasi: 0,
  status: "penawaran",
  tanggalMulai: new Date(),
  tanggalTarget: new Date(),
  // pic removed
  namaPerusahaan: "",
  catatan: "",
  dokumen: [],
  timAssigned: [],
  jenisPekerjaan: "AMDAL",
};

export default function PraKontrakPage() {
  const { items, isLoading, fetchItems, addItem, updateItem, deleteItem } =
    usePraKontrakStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
  const { items: legalitasList, fetchItems: fetchLegalitas } =
    useLegalitasStore();
  const { items: perusahaanList, fetchItems: fetchPerusahaan } = usePerusahaanStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PraKontrakNonLelang | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [searchDoc, setSearchDoc] = useState("");

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchLegalitas();
    fetchPerusahaan();
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
      jenisPekerjaan: (item as any).jenisPekerjaan || "AMDAL",
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalTarget: new Date(item.tanggalTarget),
      namaPerusahaan: (item as any).namaPerusahaan || "",
      catatan: item.catatan,
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
      jenisPekerjaan: (item as any).jenisPekerjaan || "AMDAL",
      tanggalMulai: new Date(item.tanggalMulai),
      tanggalTarget: new Date(item.tanggalTarget),
      namaPerusahaan: (item as any).namaPerusahaan || "",
      catatan: item.catatan,
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
    setSearchDoc("");
    setShowTemplateDialog(true);
  };

  const handleAddFromTemplate = (docName: string) => {
    setFormData({
      ...formData,
      dokumen: [...formData.dokumen, docName],
    });
    toast.success("Dokumen berhasil ditambahkan dari koleksi dokumen");
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
      key: "jenisPekerjaan",
      header: "Jenis Pekerjaan",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div className="text-center text-sm min-w-[120px]">
          {(item as any).jenisPekerjaan || "-"}
        </div>
      ),
    },
    {
      key: "namaPerusahaan",
      header: "Nama Perusahaan",
      sortable: true,
      render: (item: PraKontrakNonLelang) => (
        <div className="text-sm">{(item as any).namaPerusahaan || "-"}</div>
      ),
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
    <MainLayout title="Project Non-Tender">
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
            <CardTitle className="text-base">Daftar Non-Tender</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari proyek..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Form Modal - RESPONSIVE */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[98vw] sm:w-[90vw] md:w-full p-3 sm:p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base md:text-lg">
                {viewMode
                  ? "Detail Proyek"
                  : selectedItem
                    ? "Edit Proyek"
                    : "Tambah Proyek Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Informasi Dasar - RESPONSIVE GRID */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {/* Nama Proyek - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
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
                      placeholder="Masukkan nama proyek"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Klien - Half Width on Desktop */}
                  <div className="space-y-1.5">
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
                      placeholder="Nama klien"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Nilai Estimasi - Half Width on Desktop */}
                  <div className="space-y-1.5">
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
                      placeholder="0"
                      min="0"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Status - Half Width on Desktop */}
                  <div className="space-y-1.5">
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
                      <SelectTrigger className="text-sm h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="penawaran">Penawaran</SelectItem>
                        <SelectItem value="kontrak">Kontrak</SelectItem>
                        <SelectItem value="batal">Batal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Jenis Pekerjaan - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="jenisPekerjaan" className="text-xs sm:text-sm">
                      Jenis Pekerjaan <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.jenisPekerjaan}
                      onValueChange={(value: string) =>
                        setFormData({
                          ...formData,
                          jenisPekerjaan: value as FormData["jenisPekerjaan"],
                        })
                      }
                      disabled={viewMode}
                    >
                      <SelectTrigger className="text-sm h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMDAL">AMDAL</SelectItem>
                        <SelectItem value="PPKH">PPKH</SelectItem>
                        <SelectItem value="LAIN-LAIN">LAIN-LAIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nama Perusahaan - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="namaPerusahaan" className="text-xs sm:text-sm">
                      Nama Perusahaan <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.namaPerusahaan}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, namaPerusahaan: value })
                      }
                      disabled={viewMode}
                    >
                      <SelectTrigger className="text-sm h-9 sm:h-10">
                        <SelectValue placeholder="Pilih Perusahaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {perusahaanList.map((p) => (
                          <SelectItem key={p.id} value={p.nama}>{p.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tanggal Mulai - Half Width on Desktop */}
                  <div className="space-y-1.5">
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
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Tanggal Target - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggalTarget" className="text-xs sm:text-sm">
                      Tanggal Selesai <span className="text-red-500">*</span>
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
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Catatan - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
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
                      placeholder="Tambahkan catatan jika diperlukan"
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tim yang Ditugaskan - HORIZONTAL SCROLL ONLY */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Tim yang Ditugaskan
                </h3>
                {!viewMode && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">
                      Pilih Tim dari Daftar Tenaga Ahli
                    </Label>
                    <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs">
                      {(formData.timAssigned || []).length} dipilih
                    </Badge>
                  </div>
                )}
                {viewMode && (
                  <Label className="text-xs sm:text-sm">
                    Daftar Tim yang Ditugaskan
                  </Label>
                )}

                {/* Table with Horizontal Scroll Only */}
                <div className="w-full overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {!viewMode && (
                          <th className="text-center p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium w-10">
                            {/* Checkbox */}
                          </th>
                        )}
                        <th className="text-left p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                          Nama Pekerja
                        </th>
                        <th className="text-left p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                          Jabatan
                        </th>
                        <th className="text-left p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap">
                          Keahlian
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode ? (
                        (formData.timAssigned || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              Tidak ada tim yang ditugaskan
                            </td>
                          </tr>
                        ) : (
                          (formData.timAssigned || []).map((id) => {
                            const ta = tenagaAhliList.find((t) => t.id === id);
                            return ta ? (
                              <tr key={id} className="border-t hover:bg-muted/50">
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium">
                                  {ta.nama}
                                </td>
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm">
                                  {ta.jabatan}
                                </td>
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm">
                                  <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                    {ta.keahlian.slice(0, 2).map((k, i) => (
                                      <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                                        {k}
                                      </Badge>
                                    ))}
                                    {ta.keahlian.length > 2 && (
                                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                                        +{ta.keahlian.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : null;
                          })
                        )
                      ) : (
                        tenagaAhliList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              Belum ada data tenaga ahli
                            </td>
                          </tr>
                        ) : (
                          tenagaAhliList.map((ta) => {
                            const isSelected = (formData.timAssigned || []).includes(ta.id);
                            return (
                              <tr key={ta.id} className={`border-t hover:bg-muted/50 ${isSelected ? "bg-blue-50/50" : ""}`}>
                                <td className="p-1.5 sm:p-2 md:p-3 text-center">
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
                                    className="w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm font-medium">
                                  {ta.nama}
                                </td>
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm">
                                  {ta.jabatan}
                                </td>
                                <td className="p-1.5 sm:p-2 md:p-3 text-[10px] sm:text-xs md:text-sm">
                                  <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                    {ta.keahlian.slice(0, 2).map((k, i) => (
                                      <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                                        {k}
                                      </Badge>
                                    ))}
                                    {ta.keahlian.length > 2 && (
                                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                                        +{ta.keahlian.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )
                      )}
                    </tbody>
                  </table>
                </div>
                {!viewMode && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                    * Centang checkbox untuk menambahkan tim. Scroll horizontal untuk melihat semua kolom.
                  </p>
                )}
              </div>

              {/* Dokumen - HORIZONTAL SCROLL */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Dokumen
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                    <Label className="text-xs sm:text-sm">Dokumen Proyek</Label>
                    {!viewMode && (
                      <div className="flex gap-1.5 sm:gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectFromTemplate}
                          className="text-sm h-9 px-2 sm:px-3"
                        >
                          <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                          <span className="hidden sm:inline">Koleksi</span>Dokumen
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUploadDoc}
                          className="text-sm h-9 px-2 sm:px-3"
                        >
                          <Upload className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Table with Horizontal Scroll */}
                  <div className="border rounded-lg max-h-[120px] sm:max-h-[150px] overflow-auto">
                    <table className="w-full min-w-[350px]">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="text-left p-1.5 sm:p-2 text-[10px] sm:text-xs md:text-sm font-medium min-w-[180px]">
                            Nama File
                          </th>
                          <th className="text-right p-1.5 sm:p-2 text-[10px] sm:text-xs md:text-sm font-medium w-16 sm:w-20 md:w-24">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.dokumen.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground">
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          formData.dokumen.map((doc, idx) => (
                            <tr key={idx} className="border-t hover:bg-muted/50">
                              <td className="p-1.5 sm:p-2 text-[10px] sm:text-xs md:text-sm">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-blue-600 flex-shrink-0" />
                                  <span className="truncate">{doc}</span>
                                </div>
                              </td>
                              <td className="p-1.5 sm:p-2">
                                <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0"
                                    onClick={() => toast.success(`Mengunduh: ${doc}`)}
                                    title="Download"
                                  >
                                    <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-blue-600" />
                                  </Button>
                                  {!viewMode && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0"
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          dokumen: formData.dokumen.filter((_, i) => i !== idx),
                                        })
                                      }
                                    >
                                      <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-destructive" />
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
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto text-sm h-9 sm:h-10"
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto text-sm h-9 sm:h-10">
                    {selectedItem ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              )}

              {viewMode && (
                <div className="flex justify-end pt-3 sm:pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="w-full sm:w-auto text-sm h-9 sm:h-10"
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

        {/* Template Selection Dialog - COMPACT SIZE */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Pilih Dokumen dari Koleksi
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau jenis dokumen..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                {(() => {
                  const filteredDocs = legalitasList.filter(doc =>
                    doc.namaDokumen.toLowerCase().includes(searchDoc.toLowerCase()) ||
                    doc.jenisDokumen.toLowerCase().includes(searchDoc.toLowerCase())
                  );

                  if (filteredDocs.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">
                          {searchDoc ? "Tidak ada dokumen yang cocok" : "Belum ada dokumen koleksi"}
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {searchDoc ? "Coba kata kunci lain" : "Tambahkan dokumen di menu Legalitas"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Mobile List View (< 640px) */}
                      <div className="block sm:hidden space-y-3">
                        {filteredDocs.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors shadow-sm">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="space-y-1 min-w-0 flex-1">
                                  <p className="font-medium text-sm line-clamp-2 leading-tight">
                                    {doc.namaDokumen}
                                  </p>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                                    {doc.jenisDokumen.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="w-full text-xs h-8"
                                onClick={() =>
                                  handleAddFromTemplate(`${doc.namaDokumen} (${doc.nomorDokumen})`)
                                }
                              >
                                Pilih Dokumen
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View (>= 640px) */}
                      <div className="hidden sm:block border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Nama Dokumen</th>
                              <th className="text-left p-3 text-sm font-medium">Jenis</th>
                              <th className="text-center p-3 text-sm font-medium w-24">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredDocs.map((doc) => (
                              <tr key={doc.id} className="hover:bg-muted/50 transition-colors">
                                <td className="p-3 text-sm font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="line-clamp-1">{doc.namaDokumen}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-sm">
                                  <Badge variant="outline" className="capitalize text-xs font-normal">
                                    {doc.jenisDokumen.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    size="sm"
                                    className="h-8 px-3 text-xs"
                                    onClick={() =>
                                      handleAddFromTemplate(`${doc.namaDokumen} (${doc.nomorDokumen})`)
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
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateDialog(false)}
                className="w-full sm:w-auto"
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
