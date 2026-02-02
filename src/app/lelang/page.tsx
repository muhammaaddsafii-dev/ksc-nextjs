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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, Upload, FileText, Download, Search } from "lucide-react";
import { useLelangStore } from "@/stores/lelangStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { PraKontrakLelang } from "@/types";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type FormData = Omit<PraKontrakLelang, "id" | "createdAt" | "updatedAt"> & {
  jenisLelang?: string;
  tanggalPengumuman?: Date | null;
  dokumenTender?: string[];
  dokumenAdministrasi?: string[];
  dokumenTeknis?: string[];
  dokumenPenawaran?: string[];
  nominalTender?: number;
  keterangan?: string;
  jenisPekerjaan?: string;
};

const initialFormData: FormData = {
  namaLelang: "",
  jenisLelang: "SWASTA",
  jenisPekerjaan: "AMDAL",
  instansi: "",
  nilaiPagu: 0,
  nilaiPenawaran: 0,
  status: "pengajuan",
  tanggalLelang: new Date(),
  tanggalHasil: null,
  tanggalPengumuman: null,
  timAssigned: [],
  alatAssigned: [],
  dokumen: [],
  dokumenTender: [],
  dokumenAdministrasi: [],
  dokumenTeknis: [],
  dokumenPenawaran: [],
  nominalTender: 0,
  keterangan: "",
};

export default function LelangPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } =
    useLelangStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
  const { items: legalitasList, fetchItems: fetchLegalitas } =
    useLegalitasStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PraKontrakLelang | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState<
    "tender" | "administrasi" | "teknis" | "penawaran" | null
  >(null);
  const [searchDoc, setSearchDoc] = useState("");

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

  const handleEdit = (item: PraKontrakLelang) => {
    setSelectedItem(item);
    setFormData({
      namaLelang: item.namaLelang,
      jenisLelang: (item as any).jenisLelang || "SWASTA",
      jenisPekerjaan: (item as any).jenisPekerjaan || "AMDAL",
      instansi: item.instansi,
      nilaiPagu: item.nilaiPagu,
      nilaiPenawaran: item.nilaiPenawaran,
      status: item.status,
      tanggalLelang: new Date(item.tanggalLelang),
      tanggalHasil: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
      tanggalPengumuman: (item as any).tanggalPengumuman
        ? new Date((item as any).tanggalPengumuman)
        : null,
      timAssigned: item.timAssigned,
      alatAssigned: item.alatAssigned,
      dokumen: item.dokumen,
      dokumenTender: (item as any).dokumenTender?.length > 0
        ? (item as any).dokumenTender
        : [
          `Dokumen_RKS_Tender_${item.namaLelang.substring(0, 10)}.pdf`,
          `Spesifikasi_Teknis_${item.instansi.substring(0, 8)}.pdf`,
        ],
      dokumenAdministrasi: (item as any).dokumenAdministrasi?.length > 0
        ? (item as any).dokumenAdministrasi
        : [
          `SIUP_Perusahaan.pdf`,
          `TDP_${item.instansi.substring(0, 8)}.pdf`,
          `NPWP_Perusahaan.pdf`,
        ],
      dokumenTeknis: (item as any).dokumenTeknis?.length > 0
        ? (item as any).dokumenTeknis
        : [
          `Gambar_Teknis_${item.namaLelang.substring(0, 10)}.dwg`,
          `RAB_Detail.xlsx`,
          `Metode_Pelaksanaan.pdf`,
          `Spesifikasi_Material.pdf`,
        ],
      dokumenPenawaran: (item as any).dokumenPenawaran?.length > 0
        ? (item as any).dokumenPenawaran
        : [
          `Surat_Penawaran_Harga.pdf`,
          `Breakdown_Harga.xlsx`,
        ],
      nominalTender: (item as any).nominalTender || 0,
      keterangan: (item as any).keterangan || "",
    });
    setViewMode(false);
    setModalOpen(true);
  };

  const handleView = (item: PraKontrakLelang) => {
    setSelectedItem(item);
    setFormData({
      namaLelang: item.namaLelang,
      jenisLelang: (item as any).jenisLelang || "SWASTA",
      jenisPekerjaan: (item as any).jenisPekerjaan || "AMDAL",
      instansi: item.instansi,
      nilaiPagu: item.nilaiPagu,
      nilaiPenawaran: item.nilaiPenawaran,
      status: item.status,
      tanggalLelang: new Date(item.tanggalLelang),
      tanggalHasil: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
      tanggalPengumuman: (item as any).tanggalPengumuman
        ? new Date((item as any).tanggalPengumuman)
        : null,
      timAssigned: item.timAssigned,
      alatAssigned: item.alatAssigned,
      dokumen: item.dokumen,
      dokumenTender: (item as any).dokumenTender?.length > 0
        ? (item as any).dokumenTender
        : [
          `Dokumen_RKS_Tender_${item.namaLelang.substring(0, 10)}.pdf`,
          `Spesifikasi_Teknis_${item.instansi.substring(0, 8)}.pdf`,
        ],
      dokumenAdministrasi: (item as any).dokumenAdministrasi?.length > 0
        ? (item as any).dokumenAdministrasi
        : [
          `SIUP_Perusahaan.pdf`,
          `TDP_${item.instansi.substring(0, 8)}.pdf`,
          `NPWP_Perusahaan.pdf`,
        ],
      dokumenTeknis: (item as any).dokumenTeknis?.length > 0
        ? (item as any).dokumenTeknis
        : [
          `Gambar_Teknis_${item.namaLelang.substring(0, 10)}.dwg`,
          `RAB_Detail.xlsx`,
          `Metode_Pelaksanaan.pdf`,
          `Spesifikasi_Material.pdf`,
        ],
      dokumenPenawaran: (item as any).dokumenPenawaran?.length > 0
        ? (item as any).dokumenPenawaran
        : [
          `Surat_Penawaran_Harga.pdf`,
          `Breakdown_Harga.xlsx`,
        ],
      nominalTender: (item as any).nominalTender || 0,
      keterangan: (item as any).keterangan || "",
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

  const handleUploadDoc = (
    type: "tender" | "administrasi" | "teknis" | "penawaran"
  ) => {
    const newDoc = `Dokumen_${type}_${Date.now()}.pdf`;
    const key = `dokumen${type.charAt(0).toUpperCase() + type.slice(1)
      }` as keyof FormData;
    setFormData({
      ...formData,
      [key]: [...((formData[key] as string[]) || []), newDoc],
    });
    toast.success(`Dokumen ${type} berhasil diunggah (mock)`);
  };

  const handleSelectFromTemplate = (
    type: "tender" | "administrasi" | "teknis" | "penawaran"
  ) => {
    setSearchDoc("");
    setShowTemplateDialog(type);
  };

  const handleAddFromTemplate = (docName: string) => {
    if (!showTemplateDialog) return;
    const key = `dokumen${showTemplateDialog.charAt(0).toUpperCase() + showTemplateDialog.slice(1)
      }` as keyof FormData;
    setFormData({
      ...formData,
      [key]: [...((formData[key] as string[]) || []), docName],
    });
    toast.success(`Dokumen berhasil ditambahkan dari koleksi dokumen`);
    setShowTemplateDialog(null);
  };

  const handleRemoveDoc = (
    type: "tender" | "administrasi" | "teknis" | "penawaran",
    index: number
  ) => {
    const key = `dokumen${type.charAt(0).toUpperCase() + type.slice(1)
      }` as keyof FormData;
    setFormData({
      ...formData,
      [key]: (formData[key] as string[]).filter((_, i) => i !== index),
    });
  };

  const handleRemoveTeam = (id: string) => {
    setFormData({
      ...formData,
      timAssigned: formData.timAssigned.filter((tid) => tid !== id),
    });
  };

  const handleAddTeam = (id: string) => {
    if (!formData.timAssigned.includes(id)) {
      setFormData({
        ...formData,
        timAssigned: [...formData.timAssigned, id],
      });
    }
  };

  const columns = [
    {
      key: "namaLelang",
      header: "Nama Tender",
      sortable: true,
      render: (item: PraKontrakLelang) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm truncate">{item.namaLelang}</p>
          <p className="text-xs text-muted-foreground truncate">{item.instansi}</p>
        </div>
      ),
    },
    {
      key: "jenisPekerjaan",
      header: "Jenis Pekerjaan",
      render: (item: PraKontrakLelang) => (
        <div className="flex justify-center">
          <Badge variant="outline">
            {(item as any).jenisPekerjaan || "AMDAL"}
          </Badge>
        </div>
      ),
    },
    {
      key: "nilaiPenawaran",
      header: "Nilai Penawaran",
      sortable: true,
      render: (item: PraKontrakLelang) => (
        <div className="text-center font-medium text-sm min-w-[120px]">
          {formatCurrency((item as any).nilaiPenawaran || 0)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: PraKontrakLelang) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: "tanggalLelang",
      header: "Tanggal Tender",
      render: (item: PraKontrakLelang) => (
        <div className="text-center text-sm min-w-[100px]">
          {formatDate(item.tanggalLelang)}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: PraKontrakLelang) => (
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
    <MainLayout title="Project Lelang">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kelola proses tender dan non-tender proyek
            </p>
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Tender</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={items}
              columns={columns}
              searchPlaceholder="Cari tender..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Form Modal - MOBILE RESPONSIVE */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[98vw] sm:w-[90vw] md:w-full p-3 sm:p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base md:text-lg">
                {viewMode
                  ? "Detail Tender"
                  : selectedItem
                    ? "Edit Tender"
                    : "Tambah Tender Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
              {/* Informasi Dasar - RESPONSIVE GRID */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {/* Nama Project Lelang - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="namaLelang" className="text-xs sm:text-sm">
                      Nama Project Tender <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="namaLelang"
                      value={formData.namaLelang}
                      onChange={(e) =>
                        setFormData({ ...formData, namaLelang: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      placeholder="Masukkan nama project tender"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Jenis Lelang - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="jenisLelang" className="text-xs sm:text-sm">
                      Jenis Tender <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.jenisLelang}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, jenisLelang: value })
                      }
                      disabled={viewMode}
                    >
                      <SelectTrigger className="text-sm h-9 sm:h-10">
                        <SelectValue placeholder="Pilih jenis lelang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SWASTA">SWASTA</SelectItem>
                        <SelectItem value="BUMN">BUMN</SelectItem>
                        <SelectItem value="PEMERINTAH">PEMERINTAH</SelectItem>
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
                        setFormData({ ...formData, jenisPekerjaan: value })
                      }
                      disabled={viewMode}
                    >
                      <SelectTrigger className="text-sm h-9 sm:h-10">
                        <SelectValue placeholder="Pilih jenis pekerjaan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AMDAL">AMDAL</SelectItem>
                        <SelectItem value="PPKH">PPKH</SelectItem>
                        <SelectItem value="LAIN-LAIN">LAIN-LAIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Klien - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="instansi" className="text-xs sm:text-sm">
                      Klien <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="instansi"
                      value={formData.instansi}
                      onChange={(e) =>
                        setFormData({ ...formData, instansi: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      placeholder="Nama instansi"
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
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pengajuan">Pengajuan</SelectItem>
                        <SelectItem value="menang">Menang</SelectItem>
                        <SelectItem value="kalah">Kalah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tanggal Lelang - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggalLelang" className="text-xs sm:text-sm">
                      Tanggal Tender <span className="text-red-500">*</span>
                    </Label>
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
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Tanggal Pengumuman - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggalPengumuman" className="text-xs sm:text-sm">
                      Tanggal Pengumuman
                    </Label>
                    <Input
                      id="tanggalPengumuman"
                      type="date"
                      value={
                        formData.tanggalPengumuman
                          ? formatDateInput(formData.tanggalPengumuman)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalPengumuman: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        })
                      }
                      disabled={viewMode}
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Nilai Penawaran - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="nominalTender" className="text-xs sm:text-sm">
                      Nilai Penawaran <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nominalTender"
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
                      placeholder="0"
                      min="0"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Keterangan - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="keterangan" className="text-xs sm:text-sm">
                      Keterangan
                    </Label>
                    <Textarea
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) =>
                        setFormData({ ...formData, keterangan: e.target.value })
                      }
                      disabled={viewMode}
                      placeholder="Tambahkan keterangan jika diperlukan"
                      rows={3}
                      className="resize-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tim yang Ditugaskan - HORIZONTAL SCROLL */}
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
                      {formData.timAssigned.length} dipilih
                    </Badge>
                  </div>
                )}
                {viewMode && (
                  <Label className="text-xs sm:text-sm">
                    Daftar Tim yang Ditugaskan
                  </Label>
                )}

                {/* Table with Horizontal Scroll Only - Like Main DataTable */}
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
                        formData.timAssigned.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                              Tidak ada tim yang ditugaskan
                            </td>
                          </tr>
                        ) : (
                          formData.timAssigned.map((id) => {
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
                            const isSelected = formData.timAssigned.includes(ta.id);
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
                                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 cursor-pointer"
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

              {/* Upload Dokumen - HORIZONTAL SCROLL */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Upload Dokumen
                </h3>

                {/* Helper function to render document table */}
                {[
                  { type: "tender" as const, label: "Dokumen Tender", color: "blue" },
                  { type: "administrasi" as const, label: "Dokumen Administrasi", color: "green" },
                  { type: "teknis" as const, label: "Dokumen Teknis", color: "orange" },
                  { type: "penawaran" as const, label: "Dokumen Penawaran", color: "purple" },
                ].map(({ type, label, color }) => (
                  <div key={type} className="space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                      <Label className="text-xs sm:text-sm">{label}</Label>
                      {!viewMode && (
                        <div className="flex gap-1.5 sm:gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectFromTemplate(type)}
                            className="text-sm h-9 px-2 sm:px-3"
                          >
                            <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 mr-1" />
                            <span className="hidden sm:inline">Koleksi</span>Dokumen
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleUploadDoc(type)}
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
                          {(formData[`dokumen${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FormData] as string[] || []).length === 0 ? (
                            <tr>
                              <td colSpan={2} className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground">
                                Belum ada dokumen
                              </td>
                            </tr>
                          ) : (
                            (formData[`dokumen${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FormData] as string[]).map((doc, idx) => (
                              <tr key={idx} className="border-t hover:bg-muted/50">
                                <td className="p-1.5 sm:p-2 text-[10px] sm:text-xs md:text-sm">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <FileText className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-${color}-600 flex-shrink-0`} />
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
                                        onClick={() => handleRemoveDoc(type, idx)}
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
                ))}
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

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Hapus Lelang"
          description="Apakah Anda yakin ingin menghapus data lelang ini? Tindakan ini tidak dapat dibatalkan."
        />

        {/* Template Selection Dialog - COMPACT SIZE */}
        <Dialog
          open={showTemplateDialog !== null}
          onOpenChange={() => setShowTemplateDialog(null)}
        >
          <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto w-[95vw] sm:w-full p-3 sm:p-4">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base">
                Pilih Dokumen dari Koleksi Dokumen
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari dokumen..."
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                {legalitasList.filter(doc =>
                  doc.namaDokumen.toLowerCase().includes(searchDoc.toLowerCase()) ||
                  doc.jenisDokumen.toLowerCase().includes(searchDoc.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-xs sm:text-sm">
                      {searchDoc ? "Dokumen tidak ditemukan" : "Belum ada template dokumen"}
                    </p>
                    {!searchDoc && (
                      <p className="text-[10px] sm:text-xs mt-1">
                        Tambahkan di menu Legalitas & Sertifikat
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-auto max-h-[40vh]">
                    <table className="w-full min-w-[400px]">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="text-left p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium">
                            Nama Dokumen
                          </th>
                          <th className="text-left p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium">
                            Jenis
                          </th>
                          <th className="text-center p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium w-16 sm:w-20">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {legalitasList
                          .filter(doc =>
                            doc.namaDokumen.toLowerCase().includes(searchDoc.toLowerCase()) ||
                            doc.jenisDokumen.toLowerCase().includes(searchDoc.toLowerCase())
                          )
                          .map((doc) => (
                            <tr key={doc.id} className="border-t hover:bg-muted/50">
                              <td className="p-1.5 sm:p-2 text-[10px] sm:text-xs font-medium">
                                {doc.namaDokumen}
                              </td>
                              <td className="p-1.5 sm:p-2 text-[10px] sm:text-xs">
                                <Badge variant="outline" className="capitalize text-[9px] sm:text-[10px]">
                                  {doc.jenisDokumen.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="p-1.5 sm:p-2 text-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    handleAddFromTemplate(
                                      `${doc.namaDokumen} (${doc.nomorDokumen})`
                                    )
                                  }
                                  className="text-[10px] sm:text-xs h-7 sm:h-8 px-2"
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
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateDialog(null)}
                className="text-sm h-9 sm:h-10"
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
