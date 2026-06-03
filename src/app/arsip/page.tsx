"use client";

import { useEffect, useState, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Eye, Edit, Trash2, Calendar, Filter, Briefcase, StickyNote, Clock, Loader2 } from 'lucide-react';
import { usePekerjaanStore } from '@/stores/pekerjaanStore';
import { useTenagaAhliStore } from '@/stores/tenagaAhliStore';
import { usePerusahaanStore } from '@/stores/perusahaanStore';
import { jenisPekerjaanService, mapJenisPekerjaan, mapTahapanTemplate } from '@/services/jenisPekerjaan.service';
import { dokumenTahapanService, dokumenInvoiceService } from '@/services/pekerjaan.service';
import { Pekerjaan, TahapanKerja, JenisPekerjaan, TahapanTemplate } from '@/types';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { TenderBadge } from '@/components/TenderBadge';
import { DeadlineBadge } from '../pekerjaan/components';
import { InfoTab, DokumenTab, TimTab, TahapanTab } from '../pekerjaan/components/tabs';
import {
  useFormManagement,
  useTahapanManagement,
  useFileManagement,
  initialFormData,
} from '../pekerjaan/hooks';
import { transformToFormData, transformToApiData } from '../pekerjaan/utils/transformers';
import { validateBobot } from '../pekerjaan/utils/validation';
import { calculateWeightedProgress } from '../pekerjaan/utils/calculations';
import { toast } from 'sonner';

export default function ArsipPage() {
  const { items, fetchItems, updateItem, deleteItem } = usePekerjaanStore();
  const { items: tenagaAhliList, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: perusahaanList, fetchItems: fetchPerusahaan } = usePerusahaanStore();
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<JenisPekerjaan[]>([]);
  const [tahapanTemplateList, setTahapanTemplateList] = useState<TahapanTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Pekerjaan | null>(null);
  const [viewMode, setViewMode] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [deskripsiPopup, setDeskripsiPopup] = useState<Pekerjaan | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  type TahapanDocEntry = { name: string; file?: File; signedUrl?: string };
  type InvoiceDocEntry = { name: string; file?: File; signedUrl?: string };
  const [tahapanDocsMap, setTahapanDocsMap] = useState<Record<string, TahapanDocEntry[]>>({});
  const [invoiceDocsMap, setInvoiceDocsMap] = useState<Record<string, InvoiceDocEntry[]>>({});

  // Filters
  const [filterTender, setFilterTender] = useState<string>('all');
  const [filterJenisPekerjaan, setFilterJenisPekerjaan] = useState<string>('all');
  const [filterProgress, setFilterProgress] = useState<string>('all');
  const [filterTahun, setFilterTahun] = useState<string>('all');

  // Hanya pekerjaan dengan status 'selesai'
  const arsipItems = useMemo(() => items.filter((p) => p.status === 'selesai'), [items]);

  const filteredItems = useMemo(() => {
    return arsipItems.filter((item) => {
      const matchTender = filterTender === 'all' ? true : item.tenderType === filterTender;
      const matchJenisPekerjaan =
        filterJenisPekerjaan === 'all' ? true : item.jenisPekerjaan === filterJenisPekerjaan;
      const matchProgress =
        filterProgress === 'all'
          ? true
          : filterProgress === 'above50'
          ? item.progress > 50
          : item.progress <= 50;
      const itemYear = item.tanggalMulai
        ? new Date(item.tanggalMulai).getFullYear().toString()
        : '';
      const matchTahun = filterTahun === 'all' ? true : itemYear === filterTahun;
      return matchTender && matchProgress && matchJenisPekerjaan && matchTahun;
    });
  }, [arsipItems, filterTender, filterProgress, filterJenisPekerjaan, filterTahun]);

  const uniqueYears = useMemo(() => {
    const years = arsipItems
      .map((item) => (item.tanggalMulai ? new Date(item.tanggalMulai).getFullYear() : null))
      .filter((y): y is number => y !== null);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [arsipItems]);

  const summaryStats = useMemo(
    () => ({
      totalProjects: arsipItems.length,
      filteredCount: filteredItems.length,
      filteredValue: filteredItems.reduce((sum, item) => sum + item.nilaiKontrak, 0),
    }),
    [arsipItems, filteredItems]
  );

  useEffect(() => {
    fetchItems();
    fetchTenagaAhli();
    fetchPerusahaan();
    jenisPekerjaanService.getAll().then((rawList) => {
      setJenisPekerjaanList(rawList.map(mapJenisPekerjaan));
      const templates = rawList.flatMap((jp) => jp.tahapan_template.map(mapTahapanTemplate));
      setTahapanTemplateList(templates);
    });
  }, []);

  const formManagement = useFormManagement({ initialData: initialFormData });
  const { formData, setFormData, newTahapan, setNewTahapan } = formManagement;

  const tahapanManagement = useTahapanManagement({
    tahapan: formData.tahapan,
    onUpdate: (updatedTahapan) => setFormData({ ...formData, tahapan: updatedTahapan }),
  });

  const fileManagement = useFileManagement();

  const loadTahapanDocs = async (tahapanList: TahapanKerja[]) => {
    const newMap: Record<string, TahapanDocEntry[]> = {};
    const filesByTahapanId: Record<string, string[]> = {};
    await Promise.all(
      tahapanList.map(async (t) => {
        if (!t.id || !t.id.includes('-')) return;
        try {
          const docs = await dokumenTahapanService.getByTahapan(t.id);
          if (docs.length > 0) {
            newMap[t.id] = docs.map((d) => ({
              name: d.nama,
              signedUrl: d.signed_file_url || undefined,
            }));
            filesByTahapanId[t.id] = docs.map((d) => d.signed_file_url || d.nama);
          }
        } catch {
          // ignore per-tahapan errors
        }
      })
    );
    setTahapanDocsMap(newMap);
    setFormData((prev) => ({
      ...prev,
      tahapan: prev.tahapan.map((t) => ({
        ...t,
        files: filesByTahapanId[t.id] || t.files || [],
      })),
    }));
  };

  const loadInvoiceDocs = (tahapanList: TahapanKerja[]) => {
    const newMap: Record<string, InvoiceDocEntry[]> = {};
    for (const t of tahapanList) {
      for (const inv of (t.invoices || [])) {
        if (inv.files && inv.files.length > 0) {
          newMap[inv.id] = inv.files.map((url) => {
            const name = url.split('?')[0].split('/').pop() || 'dokumen';
            return { name, signedUrl: url };
          });
        }
      }
    }
    setInvoiceDocsMap(newMap);
  };

  const handleView = (item: Pekerjaan) => {
    setSelectedItem(item);
    setFormData(transformToFormData(item));
    setTahapanDocsMap({});
    setInvoiceDocsMap({});
    setViewMode(true);
    setActiveTab('info');
    setModalOpen(true);
    loadTahapanDocs(item.tahapan);
  };

  const handleEdit = (item: Pekerjaan) => {
    setSelectedItem(item);
    setFormData(transformToFormData(item));
    setTahapanDocsMap({});
    setInvoiceDocsMap({});
    setViewMode(false);
    setActiveTab('info');
    setModalOpen(true);
    loadTahapanDocs(item.tahapan);
    loadInvoiceDocs(item.tahapan);
  };

  const handleDelete = (item: Pekerjaan) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        await deleteItem(selectedItem.id);
        toast.success('Pekerjaan berhasil dihapus');
      } catch {
        toast.error('Gagal menghapus pekerjaan');
      }
    }
    setDeleteDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.tahapan.length > 0) {
      const bobotValidation = validateBobot(formData.tahapan);
      if (!bobotValidation.valid) {
        toast.error(bobotValidation.message);
        setActiveTab('tahapan');
        return;
      }
    }

    const calculatedProgress = calculateWeightedProgress(formData.tahapan);
    const oldTahapanNomors: Record<string, number> = {};
    for (const t of formData.tahapan) {
      oldTahapanNomors[t.id] = t.nomor;
    }

    const dataToSubmit = {
      ...transformToApiData(formData),
      progress: calculatedProgress,
    };

    setIsUploading(true);
    try {
      if (!selectedItem) return;
      const savedPekerjaan = await updateItem(selectedItem.id, dataToSubmit);

      // Upload dokumen tahapan
      const docsEntries = Object.entries(tahapanDocsMap).filter(([, entries]) => entries.length > 0);
      if (docsEntries.length > 0) {
        const nomorToNewId: Record<number, string> = {};
        for (const t of savedPekerjaan.tahapan) {
          nomorToNewId[t.nomor] = t.id;
        }
        for (const [oldId, entries] of docsEntries) {
          const nomor = oldTahapanNomors[oldId];
          if (nomor === undefined) continue;
          const newTahapanId = nomorToNewId[nomor];
          if (!newTahapanId) continue;
          for (const entry of entries) {
            try {
              if (entry.file) {
                await dokumenTahapanService.upload(newTahapanId, entry.name, entry.file);
              } else if (entry.signedUrl) {
                const resp = await fetch(entry.signedUrl);
                const blob = await resp.blob();
                await dokumenTahapanService.upload(newTahapanId, entry.name, blob, entry.name);
              }
            } catch {
              // ignore per-file errors
            }
          }
        }
        setTahapanDocsMap({});
      }

      // Upload dokumen invoice
      const invoiceEntries = Object.entries(invoiceDocsMap).filter(([, entries]) => entries.length > 0);
      if (invoiceEntries.length > 0) {
        const nomorToInvId: Record<string, string> = {};
        for (const t of savedPekerjaan.tahapan) {
          for (const inv of t.invoices || []) {
            nomorToInvId[inv.nomorInvoice] = inv.id;
          }
        }
        const tempIdToNomor: Record<string, string> = {};
        for (const t of formData.tahapan) {
          for (const inv of t.invoices || []) {
            tempIdToNomor[inv.id] = inv.nomorInvoice;
          }
        }
        for (const [tempId, entries] of invoiceEntries) {
          const nomor = tempIdToNomor[tempId];
          const invId = nomor ? nomorToInvId[nomor] : undefined;
          if (!invId) continue;
          for (const entry of entries) {
            try {
              if (entry.file) {
                await dokumenInvoiceService.upload(invId, entry.name, entry.file);
              } else if (entry.signedUrl) {
                const resp = await fetch(entry.signedUrl);
                const blob = await resp.blob();
                await dokumenInvoiceService.upload(invId, entry.name, blob, entry.name);
              }
            } catch {
              // ignore per-file errors
            }
          }
        }
        setInvoiceDocsMap({});
        fetchItems();
      }

      toast.success('Pekerjaan berhasil diperbarui');
      setModalOpen(false);
    } catch {
      toast.error('Gagal menyimpan pekerjaan');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExistingTahapanFileUpload = (tahapanIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const tahapanId = formData.tahapan[tahapanIdx].id;
    const newEntries: TahapanDocEntry[] = Array.from(files).map((f) => ({ name: f.name, file: f }));
    setTahapanDocsMap((prev) => ({
      ...prev,
      [tahapanId]: [...(prev[tahapanId] || []), ...newEntries],
    }));
    const updated = [...formData.tahapan];
    updated[tahapanIdx] = {
      ...updated[tahapanIdx],
      files: [...(updated[tahapanIdx].files || []), ...newEntries.map((e) => e.name)],
    };
    setFormData({ ...formData, tahapan: updated });
    toast.success(`${files.length} file ditambahkan`);
  };

  const removeExistingTahapanFile = (tahapanIdx: number, fileName: string) => {
    const tahapanId = formData.tahapan[tahapanIdx].id;
    setTahapanDocsMap((prev) => ({
      ...prev,
      [tahapanId]: (prev[tahapanId] || []).filter(
        (e) => e.name !== fileName && e.signedUrl !== fileName
      ),
    }));
    const updated = [...formData.tahapan];
    updated[tahapanIdx] = {
      ...updated[tahapanIdx],
      files: updated[tahapanIdx].files?.filter((f) => f !== fileName) || [],
    };
    setFormData({ ...formData, tahapan: updated });
  };

  const handleInvoiceDocUpload = (invId: string, files: File[]) => {
    if (!files.length) return;
    setInvoiceDocsMap((prev) => ({
      ...prev,
      [invId]: [...(prev[invId] || []), ...files.map((f) => ({ name: f.name, file: f }))],
    }));
  };

  const noop = () => {};
  const noopFile = (_name: string) => {};
  const noopFileEvent = (_e: React.ChangeEvent<HTMLInputElement>) => {};

  const columns = [
    {
      key: 'namaProyek',
      header: 'Proyek',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-sm">{item.namaProyek}</p>
          <p className="text-xs text-muted-foreground">{item.nomorKontrak}</p>
        </div>
      ),
    },
    {
      key: 'tanggalMulai',
      header: 'Tahun',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[80px] text-sm text-center">
          {item.tanggalMulai ? new Date(item.tanggalMulai).getFullYear() : '-'}
        </div>
      ),
    },
    {
      key: 'klien',
      header: 'Klien',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[150px] text-sm text-center">{item.klien}</div>
      ),
    },
    {
      key: 'tenderType',
      header: 'Tender',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <TenderBadge type={item.tenderType} />
        </div>
      ),
    },
    {
      key: 'nilaiKontrak',
      header: 'Nilai Kontrak',
      sortable: true,
      render: (item: Pekerjaan) => (
        <div className="min-w-[120px] text-sm text-center font-medium">
          {formatCurrency(item.nilaiKontrak)}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (item: Pekerjaan) => {
        const currentProgress =
          item.tahapan && item.tahapan.length > 0
            ? item.tahapan.reduce((sum, t) => sum + (t.progress || 0), 0)
            : item.progress || 0;
        return (
          <div className="flex justify-center">
            <div className="w-20 sm:w-24 min-w-[80px]">
              <div className="flex items-center gap-1 sm:gap-2">
                <Progress value={Math.min(currentProgress, 100)} className="h-2" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{currentProgress}%</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'progressKeuangan',
      header: 'Progress Keuangan',
      render: (item: Pekerjaan) => {
        const nilaiKontrak = item.nilaiKontrak || 0;
        const allInvoices = (item.tahapan || []).flatMap((t) => t.invoices || []);
        const invLunas = allInvoices
          .filter((i) => i.status === 'lunas')
          .reduce((s, i) => s + (i.nilaiInvoice || 0), 0);
        const legacyLunas = (item.tahapan || [])
          .filter((t) => !t.invoices?.length && t.statusPembayaran === 'lunas')
          .reduce((s, t) => s + (t.jumlahTagihanInvoice || 0), 0);
        const totalLunas = invLunas + legacyLunas;
        const pct = nilaiKontrak > 0 ? Math.min((totalLunas / nilaiKontrak) * 100, 100) : 0;
        return (
          <div className="flex justify-center">
            <div className="w-20 sm:w-24 min-w-[80px]">
              <div className="flex items-center gap-1 sm:gap-2">
                <Progress value={pct} className="h-2" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <StatusBadge status={item.status} />
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (item: Pekerjaan) => <DeadlineBadge item={item} />,
    },
    {
      key: 'deskripsi',
      header: 'Catatan',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setDeskripsiPopup(item);
            }}
          >
            <StickyNote className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </Button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item: Pekerjaan) => (
        <div className="flex justify-center">
          <div className="flex items-center gap-1 min-w-[120px]">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleView(item); }}
            >
              <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            >
              <Edit className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Arsip Pekerjaan">
      <div className="space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summaryStats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Total Proyek Selesai</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-lg font-bold">{formatCurrency(summaryStats.filteredValue)}</div>
              <p className="text-xs text-muted-foreground">Total Nilai Kontrak (Filtered)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{summaryStats.filteredCount}</div>
              <p className="text-xs text-muted-foreground">Proyek Sesuai Filter</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-base">Daftar Arsip Pekerjaan</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={filterTahun} onValueChange={setFilterTahun}>
                  <SelectTrigger className="w-full sm:w-[130px] h-9">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Tahun" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tahun</SelectItem>
                    {uniqueYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterTender} onValueChange={setFilterTender}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Tipe Tender" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="tender">Tender</SelectItem>
                    <SelectItem value="non-tender">Non Tender</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterJenisPekerjaan} onValueChange={setFilterJenisPekerjaan}>
                  <SelectTrigger className="w-full sm:w-[170px] h-9">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Jenis Pekerjaan" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="PEPC">PEPC</SelectItem>
                    <SelectItem value="ANTAM">ANTAM</SelectItem>
                    <SelectItem value="PHR">PHR</SelectItem>
                    <SelectItem value="AMDAL">AMDAL</SelectItem>
                    <SelectItem value="PPKH">PPKH</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterProgress} onValueChange={setFilterProgress}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="Progress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Progress</SelectItem>
                    <SelectItem value="above50">Progress &gt; 50%</SelectItem>
                    <SelectItem value="below50">Progress &le; 50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredItems}
              columns={columns}
              searchPlaceholder="Cari arsip..."
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Modal View/Edit */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-0"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
              <DialogTitle className="text-lg sm:text-xl">
                {viewMode ? 'Detail Arsip Pekerjaan' : 'Edit Arsip Pekerjaan'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Desktop Tab List */}
              <div className="hidden lg:block px-4 sm:px-6 border-b">
                <TabsList className="w-full grid grid-cols-4 gap-1 bg-transparent h-auto p-0">
                  {['info', 'dokumen', 'tim', 'tahapan'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2 capitalize"
                    >
                      {tab === 'info' ? 'Informasi' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Mobile/Tablet Dropdown */}
              <div className="lg:hidden px-4 sm:px-6 py-3 border-b bg-muted/30">
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Navigasi</Label>
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue>
                      {activeTab === 'info' && 'Informasi'}
                      {activeTab === 'dokumen' && 'Dokumen'}
                      {activeTab === 'tim' && 'Tim'}
                      {activeTab === 'tahapan' && 'Tahapan'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informasi</SelectItem>
                    <SelectItem value="dokumen">Dokumen</SelectItem>
                    <SelectItem value="tim">Tim</SelectItem>
                    <SelectItem value="tahapan">Tahapan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Tab Informasi — tabel saat view, form saat edit */}
                {viewMode ? (
                  <TabsContent value="info" className="space-y-4 px-4 sm:px-6 py-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="w-[160px] sm:w-[200px] font-medium bg-muted/50 align-top">Nama Proyek</TableCell>
                            <TableCell className="font-medium align-top">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <span>{formData.namaProyek}</span>
                                <TenderBadge type={formData.tenderType} />
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Nomor Kontrak</TableCell>
                            <TableCell className="align-top">{formData.nomorKontrak || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Klien</TableCell>
                            <TableCell className="align-top">{formData.klien || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">PIC Perusahaan</TableCell>
                            <TableCell className="align-top">{formData.namaPerusahaan || '-'}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Jenis Pekerjaan</TableCell>
                            <TableCell className="align-top">
                              {formData.jenisPekerjaan
                                ? <Badge variant="outline">{formData.jenisPekerjaan}</Badge>
                                : '-'}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Status</TableCell>
                            <TableCell className="align-top">
                              <StatusBadge status={formData.status} />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Nilai Kontrak</TableCell>
                            <TableCell className="align-top font-semibold text-primary">
                              {formatCurrency(formData.nilaiKontrak)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Tanggal Mulai</TableCell>
                            <TableCell className="align-top">
                              {formData.tanggalMulai ? formatDate(formData.tanggalMulai) : '-'}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium bg-muted/50 align-top">Tanggal Selesai</TableCell>
                            <TableCell className="align-top">
                              {formData.tanggalSelesai ? formatDate(formData.tanggalSelesai) : '-'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Log Catatan */}
                    {(() => {
                      const logs = [...(formData.deskripsi || [])].sort(
                        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                      );
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <StickyNote className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold text-xs sm:text-sm">Log Catatan Pekerjaan</h3>
                            <Badge variant="secondary" className="text-xs">{logs.length} catatan</Badge>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {logs.length === 0 ? (
                              <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/20">
                                <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Belum ada catatan</p>
                              </div>
                            ) : logs.map((log, idx) => (
                              <div key={log.id} className="flex gap-3 items-start">
                                <div className="flex flex-col items-center shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                  {idx < logs.length - 1 && (
                                    <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />
                                  )}
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[11px] text-muted-foreground">
                                      {formatDate(new Date(log.tanggal))}
                                    </span>
                                  </div>
                                  <p className="text-sm bg-muted/30 rounded px-3 py-2 border">{log.catatan}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </TabsContent>
                ) : (
                  <InfoTab
                    formData={formData}
                    setFormData={setFormData}
                    viewMode={false}
                    selectedItem={selectedItem}
                    tenderList={[]}
                    nonTenderList={[]}
                    perusahaanList={perusahaanList}
                    jenisPekerjaanList={jenisPekerjaanList}
                    onLoadFromSource={noop as any}
                  />
                )}

                <DokumenTab
                  formData={formData}
                  viewMode={viewMode}
                  pekerjaanId={selectedItem?.id}
                />

                <TimTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                  tenagaAhliList={tenagaAhliList}
                />

                <TahapanTab
                  formData={formData}
                  setFormData={setFormData}
                  viewMode={viewMode}
                  newTahapan={newTahapan}
                  setNewTahapan={setNewTahapan}
                  tahapanManagement={tahapanManagement}
                  fileManagement={fileManagement}
                  handleAddTahapan={noop}
                  handleTahapanFileUpload={noopFileEvent}
                  handleExistingTahapanFileUpload={handleExistingTahapanFileUpload}
                  removeTahapanFile={noopFile}
                  removeExistingTahapanFile={removeExistingTahapanFile}
                  onInvoiceFileUpload={handleInvoiceDocUpload}
                  jenisPekerjaanList={jenisPekerjaanList}
                  tahapanTemplateList={tahapanTemplateList}
                />

                {!viewMode && (
                  <div className="flex justify-end gap-2 px-4 sm:px-6 py-4 border-t bg-muted/30">
                    <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={isUploading}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                      ) : (
                        'Simpan Perubahan'
                      )}
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
          title="Hapus Arsip"
          description={`Apakah Anda yakin ingin menghapus "${selectedItem?.namaProyek}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={confirmDelete}
          confirmText="Hapus"
          variant="destructive"
        />

        {/* Popup Log Catatan */}
        <Dialog open={!!deskripsiPopup} onOpenChange={(open) => !open && setDeskripsiPopup(null)}>
          <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[80vh] flex flex-col p-0">
            <DialogHeader className="px-5 pt-5 pb-3 border-b">
              <DialogTitle className="flex items-center gap-2 text-base">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Log Catatan
              </DialogTitle>
              {deskripsiPopup && (
                <p className="text-xs text-muted-foreground truncate">{deskripsiPopup.namaProyek}</p>
              )}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
              {(() => {
                const logs = [...(deskripsiPopup?.deskripsi || [])].sort(
                  (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
                );
                if (logs.length === 0) {
                  return (
                    <div className="text-center py-10 text-muted-foreground">
                      <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Belum ada catatan untuk proyek ini</p>
                    </div>
                  );
                }
                return logs.map((log, idx) => (
                  <div key={log.id} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 ring-2 ring-primary/20" />
                      {idx < logs.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDate(new Date(log.tanggal))}
                        </span>
                        {idx === 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1">Terbaru</Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed bg-muted/30 rounded-md px-3 py-2.5 border">
                        {log.catatan}
                      </p>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="px-5 pb-5 pt-3 border-t">
              <Button variant="outline" className="w-full" onClick={() => setDeskripsiPopup(null)}>
                Tutup
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
