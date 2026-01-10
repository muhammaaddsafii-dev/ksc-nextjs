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
import { Plus, Edit, Trash2, Eye, Upload } from "lucide-react";
import { useLelangStore } from "@/stores/lelangStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
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
};

const initialFormData: FormData = {
  namaLelang: "",
  jenisLelang: "SWASTA",
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
      dokumenTender: (item as any).dokumenTender || [],
      dokumenAdministrasi: (item as any).dokumenAdministrasi || [],
      dokumenTeknis: (item as any).dokumenTeknis || [],
      dokumenPenawaran: (item as any).dokumenPenawaran || [],
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
      dokumenTender: (item as any).dokumenTender || [],
      dokumenAdministrasi: (item as any).dokumenAdministrasi || [],
      dokumenTeknis: (item as any).dokumenTeknis || [],
      dokumenPenawaran: (item as any).dokumenPenawaran || [],
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
    const key = `dokumen${
      type.charAt(0).toUpperCase() + type.slice(1)
    }` as keyof FormData;
    setFormData({
      ...formData,
      [key]: [...((formData[key] as string[]) || []), newDoc],
    });
    toast.success(`Dokumen ${type} berhasil diunggah (mock)`);
  };

  const handleRemoveDoc = (
    type: "tender" | "administrasi" | "teknis" | "penawaran",
    index: number
  ) => {
    const key = `dokumen${
      type.charAt(0).toUpperCase() + type.slice(1)
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
      key: "jenisLelang",
      header: "Jenis Lelang",
      render: (item: PraKontrakLelang) => (
        <Badge variant="outline">{(item as any).jenisLelang || "SWASTA"}</Badge>
      ),
    },
    {
      key: "nominalTender",
      header: "Nominal Tender",
      sortable: true,
      render: (item: PraKontrakLelang) =>
        formatCurrency((item as any).nominalTender || 0),
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
                {items.filter((i) => i.status === "pengajuan").length}
              </div>
              <p className="text-sm text-muted-foreground">Pengajuan</p>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewMode
                  ? "Detail Lelang"
                  : selectedItem
                  ? "Edit Lelang"
                  : "Tambah Lelang Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informasi Dasar */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Informasi Dasar
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 1. Nama Project Lelang */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="namaLelang">
                      Nama Project Lelang{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="namaLelang"
                      value={formData.namaLelang}
                      onChange={(e) =>
                        setFormData({ ...formData, namaLelang: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      placeholder="Masukkan nama project lelang"
                    />
                  </div>

                  {/* 2. Jenis Lelang */}
                  <div className="space-y-2">
                    <Label htmlFor="jenisLelang">
                      Jenis Lelang <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.jenisLelang}
                      onValueChange={(value: string) =>
                        setFormData({ ...formData, jenisLelang: value })
                      }
                      disabled={viewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis lelang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SWASTA">SWASTA</SelectItem>
                        <SelectItem value="BUMN">BUMN</SelectItem>
                        <SelectItem value="PEMERINTAH">PEMERINTAH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Instansi */}
                  <div className="space-y-2">
                    <Label htmlFor="instansi">
                      Instansi <span className="text-red-500">*</span>
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
                    />
                  </div>

                  {/* 4. Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">
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
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pengajuan">Pengajuan</SelectItem>
                        <SelectItem value="menang">Menang</SelectItem>
                        <SelectItem value="kalah">Kalah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 5. Tanggal Lelang */}
                  <div className="space-y-2">
                    <Label htmlFor="tanggalLelang">
                      Tanggal Lelang <span className="text-red-500">*</span>
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
                    />
                  </div>

                  {/* 6. Tanggal Pengumuman */}
                  <div className="space-y-2">
                    <Label htmlFor="tanggalPengumuman">
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
                    />
                  </div>

                  {/* 9. Nominal Tender */}
                  <div className="space-y-2">
                    <Label htmlFor="nominalTender">
                      Nominal Tender <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nominalTender"
                      type="number"
                      value={formData.nominalTender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nominalTender: Number(e.target.value),
                        })
                      }
                      disabled={viewMode}
                      required
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* 10. Keterangan */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="keterangan">Keterangan</Label>
                    <Textarea
                      id="keterangan"
                      value={formData.keterangan}
                      onChange={(e) =>
                        setFormData({ ...formData, keterangan: e.target.value })
                      }
                      disabled={viewMode}
                      placeholder="Tambahkan keterangan jika diperlukan"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Tim yang Ditugaskan */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Tim yang Ditugaskan
                </h3>
                {!viewMode && (
                  <div className="flex items-center justify-between mb-3">
                    <Label>Pilih Tim dari Daftar Tenaga Ahli</Label>
                    <Badge variant="secondary">
                      {formData.timAssigned.length} dipilih
                    </Badge>
                  </div>
                )}
                {viewMode && (
                  <div className="mb-3">
                    <Label>Daftar Tim yang Ditugaskan</Label>
                  </div>
                )}
                <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {!viewMode && (
                          <th className="text-center p-3 text-sm font-medium w-12"></th>
                        )}
                        <th className="text-left p-3 text-sm font-medium">
                          Nama Pekerja
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Jabatan
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Status
                        </th>
                        <th className="text-left p-3 text-sm font-medium">
                          Keahlian
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode ? (
                        // Mode View: Hanya tampilkan tim yang dipilih
                        formData.timAssigned.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center p-4 text-sm text-muted-foreground"
                            >
                              Tidak ada tim yang ditugaskan
                            </td>
                          </tr>
                        ) : (
                          formData.timAssigned.map((id) => {
                            const ta = tenagaAhliList.find((t) => t.id === id);
                            return ta ? (
                              <tr
                                key={id}
                                className="border-t hover:bg-muted/50"
                              >
                                <td className="p-3 text-sm font-medium">
                                  {ta.nama}
                                </td>
                                <td className="p-3 text-sm">{ta.jabatan}</td>
                                <td className="p-3 text-sm">
                                  <Badge
                                    variant={
                                      ta.status === "tersedia"
                                        ? "default"
                                        : ta.status === "ditugaskan"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {ta.status}
                                  </Badge>
                                </td>
                                <td className="p-3 text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {ta.keahlian.slice(0, 2).map((k, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {k}
                                      </Badge>
                                    ))}
                                    {ta.keahlian.length > 2 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
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
                            className="text-center p-4 text-sm text-muted-foreground"
                          >
                            Belum ada data tenaga ahli
                          </td>
                        </tr>
                      ) : (
                        tenagaAhliList.map((ta) => {
                          const isSelected = formData.timAssigned.includes(
                            ta.id
                          );
                          return (
                            <tr
                              key={ta.id}
                              className={`border-t hover:bg-muted/50 ${
                                isSelected ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <td className="p-3 text-center">
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
                                  className="w-4 h-4 cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-sm font-medium">
                                {ta.nama}
                              </td>
                              <td className="p-3 text-sm">{ta.jabatan}</td>
                              <td className="p-3 text-sm">
                                <Badge
                                  variant={
                                    ta.status === "tersedia"
                                      ? "default"
                                      : ta.status === "ditugaskan"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {ta.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {ta.keahlian.slice(0, 2).map((k, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {k}
                                    </Badge>
                                  ))}
                                  {ta.keahlian.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
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
                  <p className="text-xs text-muted-foreground mt-2">
                    * Centang checkbox untuk menambahkan tim ke project lelang
                    ini
                  </p>
                )}
              </div>

              {/* 8. Upload Dokumen */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">
                  Upload Dokumen
                </h3>

                {/* Dokumen Tender */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dokumen Tender</Label>
                    {!viewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDoc("tender")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium">
                            Nama File
                          </th>
                          {!viewMode && (
                            <th className="text-right p-2 text-xs font-medium w-16">
                              Aksi
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.dokumenTender || []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-center p-3 text-xs text-muted-foreground"
                            >
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          (formData.dokumenTender || []).map((doc, idx) => (
                            <tr
                              key={idx}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-2 text-xs">{doc}</td>
                              {!viewMode && (
                                <td className="p-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveDoc("tender", idx)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dokumen Administrasi */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dokumen Administrasi</Label>
                    {!viewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDoc("administrasi")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium">
                            Nama File
                          </th>
                          {!viewMode && (
                            <th className="text-right p-2 text-xs font-medium w-16">
                              Aksi
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.dokumenAdministrasi || []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-center p-3 text-xs text-muted-foreground"
                            >
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          (formData.dokumenAdministrasi || []).map(
                            (doc, idx) => (
                              <tr
                                key={idx}
                                className="border-t hover:bg-muted/50"
                              >
                                <td className="p-2 text-xs">{doc}</td>
                                {!viewMode && (
                                  <td className="p-2 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveDoc("administrasi", idx)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dokumen Teknis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dokumen Teknis</Label>
                    {!viewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDoc("teknis")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium">
                            Nama File
                          </th>
                          {!viewMode && (
                            <th className="text-right p-2 text-xs font-medium w-16">
                              Aksi
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.dokumenTeknis || []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-center p-3 text-xs text-muted-foreground"
                            >
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          (formData.dokumenTeknis || []).map((doc, idx) => (
                            <tr
                              key={idx}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-2 text-xs">{doc}</td>
                              {!viewMode && (
                                <td className="p-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveDoc("teknis", idx)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dokumen Penawaran */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Dokumen Penawaran</Label>
                    {!viewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadDoc("penawaran")}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                  <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-medium">
                            Nama File
                          </th>
                          {!viewMode && (
                            <th className="text-right p-2 text-xs font-medium w-16">
                              Aksi
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {(formData.dokumenPenawaran || []).length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-center p-3 text-xs text-muted-foreground"
                            >
                              Belum ada dokumen
                            </td>
                          </tr>
                        ) : (
                          (formData.dokumenPenawaran || []).map((doc, idx) => (
                            <tr
                              key={idx}
                              className="border-t hover:bg-muted/50"
                            >
                              <td className="p-2 text-xs">{doc}</td>
                              {!viewMode && (
                                <td className="p-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveDoc("penawaran", idx)
                                    }
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </td>
                              )}
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
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {selectedItem ? "Perbarui" : "Simpan"}
                  </Button>
                </div>
              )}

              {viewMode && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
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
      </div>
    </MainLayout>
  );
}
