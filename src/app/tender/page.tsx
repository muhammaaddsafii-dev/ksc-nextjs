"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
import { Plus, Edit, Trash2, Eye, Upload, FileText, Download, Search, Loader2, ExternalLink } from "lucide-react";
import { useTenderStore } from "@/stores/lelangStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useDokumenStore } from "@/stores/dokumenStore";
import { Tender, Dokumen } from "@/types";
import { dokumenPekerjaanService } from "@/services/pekerjaan.service";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/helpers";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { usePerusahaanStore } from "@/stores/perusahaanStore";

type DocEntry = {
  id: string;
  nama: string;
  isNew: boolean;
  file?: File;
  fromSignedUrl?: string | null;
  existingSignedUrl?: string | null;
};

type DocKategori = "tender" | "administrasi" | "teknis" | "penawaran";

type FormData = Omit<Tender, "id" | "createdAt" | "updatedAt"> & {
  tanggalPengumuman?: Date | null;
  tanggalMulaiProyek?: Date | null;
  tanggalSelesaiProyek?: Date | null;
  dokumenTender: DocEntry[];
  dokumenAdministrasi: DocEntry[];
  dokumenTeknis: DocEntry[];
  dokumenPenawaran: DocEntry[];
  nominalTender?: number;
  keterangan?: string;
  jenisPekerjaan?: string;
  namaPerusahaan?: string;
};

const initialFormData: FormData = {
  namaTender: "",
  // jenisLelang removed
  namaPerusahaan: "",
  jenisPekerjaan: "AMDAL",
  instansi: "",
  nilaiPagu: 0,
  nilaiPenawaran: 0,
  status: "pengajuan",
  tanggalTender: new Date(),
  tanggalHasil: null,
  tanggalPengumuman: null,
  tanggalMulaiProyek: null,
  tanggalSelesaiProyek: null,
  timAssigned: [],
  alatAssigned: [],
  dokumen: [],
  dokumenTender: [] as DocEntry[],
  dokumenAdministrasi: [] as DocEntry[],
  dokumenTeknis: [] as DocEntry[],
  dokumenPenawaran: [] as DocEntry[],
  nominalTender: 0,
  keterangan: "",
};

export default function TenderPage() {
  const { items, fetchItems, addItem, updateItem, deleteItem } =
    useTenderStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
  const { items: legalitasList, fetchItems: fetchLegalitas } =
    useDokumenStore();
  const { items: perusahaanList, fetchItems: fetchPerusahaan } = usePerusahaanStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Tender | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState<DocKategori | null>(null);
  const [searchDoc, setSearchDoc] = useState("");
  const [docsToDelete, setDocsToDelete] = useState<string[]>([]);
  const [pendingUploadType, setPendingUploadType] = useState<DocKategori | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters State
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [filterJenisPekerjaan, setFilterJenisPekerjaan] = useState<string>("all");

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchLegalitas();
    fetchPerusahaan();
  }, []);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.status === "menang") return false;

      const matchJenisPekerjaan =
        filterJenisPekerjaan === "all"
          ? true
          : (item as any).jenisPekerjaan === filterJenisPekerjaan;

      const itemYear = item.tanggalTender
        ? new Date(item.tanggalTender).getFullYear().toString()
        : "";
      const matchTahun =
        filterTahun === "all" ? true : itemYear === filterTahun;

      return matchJenisPekerjaan && matchTahun;
    });
  }, [items, filterTahun, filterJenisPekerjaan]);

  const uniqueYears = useMemo(() => {
    const years = items
      .map((item) =>
        item.tanggalTender ? new Date(item.tanggalTender).getFullYear() : null
      )
      .filter((year): year is number => year !== null);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [items]);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setDocsToDelete([]);
    setViewMode(false);
    setModalOpen(true);
  };

  const buildBaseForm = (item: Tender): FormData => ({
    namaTender: item.namaTender,
    namaPerusahaan: (item as any).namaPerusahaan || "",
    jenisPekerjaan: (item as any).jenisPekerjaan || "AMDAL",
    instansi: item.instansi,
    nilaiPagu: item.nilaiPagu,
    nilaiPenawaran: item.nilaiPenawaran,
    status: item.status,
    tanggalTender: new Date(item.tanggalTender),
    tanggalHasil: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
    tanggalPengumuman: item.tanggalHasil ? new Date(item.tanggalHasil) : null,
    tanggalMulaiProyek: item.tanggalMulaiProyek ? new Date(item.tanggalMulaiProyek) : null,
    tanggalSelesaiProyek: item.tanggalSelesaiProyek ? new Date(item.tanggalSelesaiProyek) : null,
    timAssigned: item.timAssigned,
    alatAssigned: item.alatAssigned,
    dokumen: item.dokumen,
    dokumenTender: [],
    dokumenAdministrasi: [],
    dokumenTeknis: [],
    dokumenPenawaran: [],
    nominalTender: (item as any).nominalTender || 0,
    keterangan: (item as any).keterangan || "",
  });

  const JENIS_TO_KAT: Record<string, DocKategori> = {
    dokumen_tender: "tender",
    dokumen_administrasi: "administrasi",
    dokumen_teknis: "teknis",
    dokumen_penawaran: "penawaran",
  };

  const KAT_TO_JENIS: Record<DocKategori, string> = {
    tender: "dokumen_tender",
    administrasi: "dokumen_administrasi",
    teknis: "dokumen_teknis",
    penawaran: "dokumen_penawaran",
  };

  const loadDocsFromBackend = async (pekerjaanId: string) => {
    const docs = await dokumenPekerjaanService.getByPekerjaan(pekerjaanId);
    const byKat: Record<DocKategori, DocEntry[]> = { tender: [], administrasi: [], teknis: [], penawaran: [] };
    docs.forEach((d) => {
      const kat = JENIS_TO_KAT[d.jenis_dokumen] ?? "tender";
      byKat[kat].push({ id: d.id, nama: d.nama, isNew: false, existingSignedUrl: d.signed_file_url });
    });
    return byKat;
  };

  const handleEdit = async (item: Tender) => {
    setSelectedItem(item);
    setDocsToDelete([]);
    setFormData(buildBaseForm(item));
    setViewMode(false);
    setModalOpen(true);
    try {
      const byKat = await loadDocsFromBackend(item.id);
      setFormData((prev) => ({
        ...prev,
        dokumenTender: byKat.tender,
        dokumenAdministrasi: byKat.administrasi,
        dokumenTeknis: byKat.teknis,
        dokumenPenawaran: byKat.penawaran,
      }));
    } catch {
      // gagal muat dokumen — tampil kosong
    }
  };

  const handleView = async (item: Tender) => {
    setSelectedItem(item);
    setFormData(buildBaseForm(item));
    setViewMode(true);
    setModalOpen(true);
    try {
      const byKat = await loadDocsFromBackend(item.id);
      setFormData((prev) => ({
        ...prev,
        dokumenTender: byKat.tender,
        dokumenAdministrasi: byKat.administrasi,
        dokumenTeknis: byKat.teknis,
        dokumenPenawaran: byKat.penawaran,
      }));
    } catch {
      // gagal muat dokumen — tampil kosong
    }
  };

  const handleDelete = (item: Tender) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        await deleteItem(selectedItem.id);
        toast.success("Data tender berhasil dihapus");
      } catch {
        toast.error("Gagal menghapus data tender");
      }
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = { ...formData, tanggalHasil: formData.tanggalPengumuman ?? null };
    setIsUploading(true);
    try {
      let pekerjaanId: string;
      let isUpdate: boolean;
      if (selectedItem) {
        await updateItem(selectedItem.id, submitData);
        pekerjaanId = selectedItem.id;
        isUpdate = true;
      } else {
        const created = await addItem(submitData);
        pekerjaanId = created.id;
        isUpdate = false;
      }

      // Upload dokumen baru
      const newDocs: { entry: DocEntry; kat: DocKategori }[] = [
        ...formData.dokumenTender.filter((d) => d.isNew).map((e) => ({ entry: e, kat: "tender" as DocKategori })),
        ...formData.dokumenAdministrasi.filter((d) => d.isNew).map((e) => ({ entry: e, kat: "administrasi" as DocKategori })),
        ...formData.dokumenTeknis.filter((d) => d.isNew).map((e) => ({ entry: e, kat: "teknis" as DocKategori })),
        ...formData.dokumenPenawaran.filter((d) => d.isNew).map((e) => ({ entry: e, kat: "penawaran" as DocKategori })),
      ];
      for (const { entry, kat } of newDocs) {
        const jenisDokumen = KAT_TO_JENIS[kat];
        if (entry.file) {
          await dokumenPekerjaanService.upload(pekerjaanId, entry.nama, '', entry.file, undefined, jenisDokumen);
        } else if (entry.fromSignedUrl) {
          const resp = await fetch(entry.fromSignedUrl);
          const blob = await resp.blob();
          await dokumenPekerjaanService.upload(pekerjaanId, entry.nama, '', blob, entry.nama, jenisDokumen);
        }
      }

      // Hapus dokumen yang dihapus user
      for (const docId of docsToDelete) {
        await dokumenPekerjaanService.delete(docId);
      }

      toast.success(isUpdate ? "Data tender berhasil diperbarui" : "Data tender berhasil ditambahkan");
      setModalOpen(false);
    } catch {
      toast.error("Gagal menyimpan data tender");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadDoc = (type: DocKategori) => {
    setPendingUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadType) return;
    const entry: DocEntry = { id: `new-${Date.now()}`, nama: file.name, isNew: true, file };
    const key = `dokumen${pendingUploadType.charAt(0).toUpperCase() + pendingUploadType.slice(1)}` as keyof FormData;
    setFormData((prev) => ({ ...prev, [key]: [...(prev[key] as DocEntry[]), entry] }));
    setPendingUploadType(null);
    e.target.value = "";
  };

  const handleSelectFromTemplate = (type: DocKategori) => {
    setSearchDoc("");
    setShowTemplateDialog(type);
  };

  const handleAddFromTemplate = (doc: Dokumen) => {
    if (!showTemplateDialog) return;
    const entry: DocEntry = {
      id: `new-col-${Date.now()}`,
      nama: doc.namaDokumen,
      isNew: true,
      fromSignedUrl: doc.signedFileUrl,
    };
    const key = `dokumen${showTemplateDialog.charAt(0).toUpperCase() + showTemplateDialog.slice(1)}` as keyof FormData;
    setFormData((prev) => ({ ...prev, [key]: [...(prev[key] as DocEntry[]), entry] }));
    toast.success(`Dokumen berhasil ditambahkan dari koleksi`);
    setShowTemplateDialog(null);
  };

  const handleRemoveDoc = (type: DocKategori, index: number) => {
    const key = `dokumen${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FormData;
    const docs = formData[key] as DocEntry[];
    const removing = docs[index];
    if (removing && !removing.isNew) {
      setDocsToDelete((prev) => [...prev, removing.id]);
    }
    setFormData((prev) => ({ ...prev, [key]: (prev[key] as DocEntry[]).filter((_, i) => i !== index) }));
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
      key: "namaTender",
      header: "Nama Tender",
      sortable: true,
      render: (item: Tender) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm truncate">{item.namaTender}</p>
          <p className="text-xs text-muted-foreground truncate">{item.instansi}</p>
        </div>
      ),
    },
    {
      key: "tanggalTender",
      header: "Tahun",
      sortable: true,
      render: (item: Tender) => (
        <div className="min-w-[80px] text-sm text-center">
          {item.tanggalTender ? new Date(item.tanggalTender).getFullYear() : "-"}
        </div>
      ),
    },
    {
      key: "jenisPekerjaan",
      header: "Jenis Pekerjaan",
      sortable: true,
      render: (item: Tender) => (
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
      render: (item: Tender) => (
        <div className="text-center font-medium text-sm min-w-[120px]">
          {formatCurrency((item as any).nilaiPenawaran || 0)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Tender) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: "tanggalHasil",
      header: "Tanggal Pengumuman",
      render: (item: Tender) => (
        <div className="text-center text-sm min-w-[100px]">
          {item.tanggalHasil ? formatDate(item.tanggalHasil) : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: Tender) => (
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
    <MainLayout title="Project Tender">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kelola proses pengajuan proyek tender.
            </p>
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-base">Daftar Tender</CardTitle>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={filterTahun} onValueChange={setFilterTahun}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9">
                    <SelectValue placeholder="Semua Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filterJenisPekerjaan}
                  onValueChange={setFilterJenisPekerjaan}
                >
                  <SelectTrigger className="w-full sm:w-[170px] h-9">
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="AMDAL">AMDAL</SelectItem>
                    <SelectItem value="PPKH">PPKH</SelectItem>
                    <SelectItem value="PEPC">PEPC</SelectItem>
                    <SelectItem value="PHR">PHR</SelectItem>
                    <SelectItem value="ANTAM">ANTAM</SelectItem>
                    <SelectItem value="TBT PPKH">TBT PPKH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredItems}
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
              {/* Hidden file input for upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelected}
                accept="*/*"
              />
              {/* Informasi Dasar - RESPONSIVE GRID */}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-xs sm:text-sm border-b pb-1.5 sm:pb-2">
                  Informasi Dasar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  {/* Nama Project Lelang - Full Width */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="namaTender" className="text-xs sm:text-sm">
                      Nama Project Tender <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="namaTender"
                      value={formData.namaTender}
                      onChange={(e) =>
                        setFormData({ ...formData, namaTender: e.target.value })
                      }
                      disabled={viewMode}
                      required
                      placeholder="Masukkan nama project tender"
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Nama Perusahaan - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="namaPerusahaan" className="text-xs sm:text-sm">
                      PIC Perusahaan <span className="text-red-500">*</span>
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
                        <SelectItem value="PEPC">PEPC</SelectItem>
                        <SelectItem value="PHR">PHR</SelectItem>
                        <SelectItem value="ANTAM">ANTAM</SelectItem>
                        <SelectItem value="TBT PPKH">TBT PPKH</SelectItem>
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
                    <Label htmlFor="tanggalTender" className="text-xs sm:text-sm">
                      Tanggal Tender <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tanggalTender"
                      type="date"
                      value={formatDateInput(formData.tanggalTender)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalTender: new Date(e.target.value),
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

                  {/* Tanggal Mulai Proyek - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggalMulaiProyek" className="text-xs sm:text-sm">
                      Tanggal Mulai Proyek
                    </Label>
                    <Input
                      id="tanggalMulaiProyek"
                      type="date"
                      value={
                        formData.tanggalMulaiProyek
                          ? formatDateInput(formData.tanggalMulaiProyek)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalMulaiProyek: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        })
                      }
                      disabled={viewMode}
                      className="text-sm h-9 sm:h-10"
                    />
                  </div>

                  {/* Tanggal Selesai Proyek - Half Width on Desktop */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tanggalSelesaiProyek" className="text-xs sm:text-sm">
                      Tanggal Selesai Proyek
                    </Label>
                    <Input
                      id="tanggalSelesaiProyek"
                      type="date"
                      value={
                        formData.tanggalSelesaiProyek
                          ? formatDateInput(formData.tanggalSelesaiProyek)
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalSelesaiProyek: e.target.value
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
                      type="text"
                      value={
                        formData.nilaiPenawaran === 0
                          ? ""
                          : new Intl.NumberFormat("id-ID").format(
                              formData.nilaiPenawaran
                            )
                      }
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, "");
                        setFormData({
                          ...formData,
                          nilaiPenawaran: rawValue ? Number(rawValue) : 0,
                        });
                      }}
                      disabled={viewMode}
                      required
                      placeholder="0"
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
                      </tr>
                    </thead>
                    <tbody>
                      {viewMode ? (
                        formData.timAssigned.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
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
                              </tr>
                            ) : null;
                          })
                        )
                      ) : (
                        tenagaAhliList.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-2 sm:p-3 md:p-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
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
                          {(formData[`dokumen${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FormData] as DocEntry[]).length === 0 ? (
                            <tr>
                              <td colSpan={2} className="text-center p-2 sm:p-3 text-[10px] sm:text-xs text-muted-foreground">
                                Belum ada dokumen
                              </td>
                            </tr>
                          ) : (
                            (formData[`dokumen${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FormData] as DocEntry[]).map((entry, idx) => (
                              <tr key={entry.id} className="border-t hover:bg-muted/50">
                                <td className="p-1.5 sm:p-2 text-[10px] sm:text-xs md:text-sm">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <FileText className={`h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-${color}-600 flex-shrink-0`} />
                                    <span className="truncate">{entry.nama}</span>
                                    {entry.isNew && (
                                      <span className="text-[9px] sm:text-[10px] text-muted-foreground shrink-0">
                                        {entry.file ? `(${(entry.file.size / 1024).toFixed(0)}KB)` : "(koleksi)"}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-1.5 sm:p-2">
                                  <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                    {entry.existingSignedUrl && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0"
                                        onClick={() => window.open(entry.existingSignedUrl!, "_blank")}
                                        title="Buka dokumen"
                                      >
                                        <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-blue-600" />
                                      </Button>
                                    )}
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
                    disabled={isUploading}
                    className="w-full sm:w-auto text-sm h-9 sm:h-10"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isUploading} className="w-full sm:w-auto text-sm h-9 sm:h-10">
                    {isUploading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                    ) : (
                      selectedItem ? "Perbarui" : "Simpan"
                    )}
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
          title="Hapus Tender"
          description="Apakah Anda yakin ingin menghapus data tender ini? Tindakan ini tidak dapat dibatalkan."
        />

        {/* Template Selection Dialog - COMPACT SIZE */}
        <Dialog
          open={showTemplateDialog !== null}
          onOpenChange={() => setShowTemplateDialog(null)}
        >
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
                                  handleAddFromTemplate(doc)
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
                                      handleAddFromTemplate(doc)
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
                onClick={() => setShowTemplateDialog(null)}
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
