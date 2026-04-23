"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ChevronUp, ChevronDown, ChevronsUpDown, StickyNote, Clock } from "lucide-react";
import { Pekerjaan } from "@/types";
import { formatCurrency, formatDate } from "@/lib/helpers";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { calculateWeightedProgress } from "@/app/pekerjaan/utils/calculations";

interface JobStatisticsProps {
  pekerjaan: Pekerjaan[];
  hideCards?: boolean;
  hideFilterControls?: boolean;
  hideTitle?: boolean;
}

interface StatItem {
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  tahun: number;
  jenisProyek: string;
  status: string;
  tanggalSelesai: Date;
  progress: number;
  progressKeuangan: number;
  tahapanDone: number;
  tahapanTotal: number;
  catatan: string;
  _raw: Pekerjaan;
}

export function JobStatistics({ pekerjaan, hideCards = false, hideFilterControls = false, hideTitle = false }: JobStatisticsProps) {
  const [deskripsiPopup, setDeskripsiPopup] = useState<Pekerjaan | null>(null);
  const [filterType, setFilterType] = useState<"year" | "jobType">("year");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof StatItem | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const pageSize = 10;

  const handleSort = (field: keyof StatItem) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Prepare statistics data
  const statsData: StatItem[] = useMemo(() => {
    return pekerjaan.map((p) => {
      const sortedLogs = [...(p.deskripsi || [])].sort(
        (a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );
      const latestCatatan = sortedLogs.length > 0 ? sortedLogs[0].catatan : "";
      const nilaiKontrak = p.nilaiKontrak || 0;
      const totalTerbayar = (p.tahapan || []).reduce((sum: number, t: any) => {
        if (t.invoices && t.invoices.length > 0)
          return sum + t.invoices.reduce((s: number, i: any) => s + (i.jumlahTerbayar || 0), 0);
        if (t.statusPembayaran === 'lunas') return sum + (t.jumlahTagihanInvoice || 0);
        return sum;
      }, 0);
      const progressKeuangan = nilaiKontrak > 0 ? Math.min((totalTerbayar / nilaiKontrak) * 100, 100) : 0;
      return {
        namaProyek: p.namaProyek,
        klien: p.klien,
        nilaiKontrak: p.nilaiKontrak,
        tahun: p.tanggalSelesai.getFullYear(),
        jenisProyek: p.jenisPekerjaan,
        status: p.status,
        tanggalSelesai: p.tanggalSelesai,
        progress: p.tahapan && p.tahapan.length > 0 ? calculateWeightedProgress(p.tahapan) : (p.progress || 0),
        progressKeuangan,
        tahapanDone: (p.tahapan || []).filter((t: any) => t.status === "done").length,
        tahapanTotal: (p.tahapan || []).length,
        catatan: latestCatatan,
        _raw: p,
      };
    });
  }, [pekerjaan]);

  // Get unique years
  const years = useMemo(() => {
    const yearSet = new Set(statsData.map((item) => item.tahun));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [statsData]);

  // Get job types dynamically from data
  const jobTypes = useMemo(() => {
    const typeSet = new Set(statsData.map((item) => item.jenisProyek));
    return Array.from(typeSet).sort();
  }, [statsData]);

  // Filter data based on selection
  const filteredData = useMemo(() => {
    let filtered = [...statsData];

    if (filterType === "year" && selectedYear !== "all") {
      filtered = filtered.filter((item) => item.tahun === parseInt(selectedYear));
    }

    if (filterType === "jobType" && selectedJobType !== "all") {
      filtered = filtered.filter((item) => item.jenisProyek === selectedJobType);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (selectedStatus === "selesai") return item.status === "selesai" || item.status === "serah_terima";
        return item.status === selectedStatus;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.namaProyek?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setCurrentPage(1);

    // Apply sort
    if (sortField && sortField !== "_raw") {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal instanceof Date && bVal instanceof Date) {
          return sortDir === "asc" ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [statsData, filterType, selectedYear, selectedJobType, selectedStatus, searchQuery, sortField, sortDir]);

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Calculate summary
  const summary = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.nilaiKontrak, 0);
    const totalProjects = filteredData.length;
    const byJobType = {
      amdal: filteredData.filter((item) => item.jenisProyek === "AMDAL").length,
      ppkh: filteredData.filter((item) => item.jenisProyek === "PPKH").length,
    };
    return { totalValue, totalProjects, byJobType };
  }, [filteredData]);

  // Export to Excel
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "KSC NextJS App";
    workbook.created = new Date();

    // 1. Ringkasan Sheet
    const wsSummary = workbook.addWorksheet("Ringkasan");
    wsSummary.columns = [
      { header: "Keterangan", key: "keterangan", width: 25 },
      { header: "Nilai", key: "nilai", width: 30 },
    ];
    wsSummary.addRow({ keterangan: "Total Proyek", nilai: summary.totalProjects });
    wsSummary.addRow({ keterangan: "Total Nilai Kontrak", nilai: formatCurrency(summary.totalValue) });
    Object.entries(summary.byJobType).forEach(([type, count]) => {
      wsSummary.addRow({ keterangan: `Proyek ${type}`, nilai: count });
    });
    wsSummary.getRow(1).font = { bold: true };

    // 2. Data Pekerjaan Sheet
    const wsData = workbook.addWorksheet("Data Pekerjaan");
    wsData.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Proyek", key: "namaProyek", width: 50 },
      { header: "Klien", key: "klien", width: 30 },
      { header: "Jenis Proyek", key: "jenisProyek", width: 15 },
      { header: "Nilai Kontrak", key: "nilaiKontrak", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Tahun", key: "tahun", width: 8 },
      { header: "Tanggal Selesai", key: "tanggalSelesai", width: 15 },
      { header: "Catatan Terbaru", key: "catatan", width: 40 },
    ];

    filteredData.forEach((item, index) => {
      wsData.addRow({
        no: index + 1,
        namaProyek: item.namaProyek,
        klien: item.klien,
        jenisProyek: item.jenisProyek,
        nilaiKontrak: item.nilaiKontrak,
        status: item.status,
        tahun: item.tahun,
        tanggalSelesai: item.tanggalSelesai.toLocaleDateString("id-ID"),
        catatan: item.catatan,
      });
    });
    wsData.getRow(1).font = { bold: true };

    const filename =
      filterType === "year" && selectedYear !== "all"
        ? `Statistik_Pekerjaan_Tahun_${selectedYear}.xlsx`
        : filterType === "jobType" && selectedJobType !== "all"
          ? `Statistik_Pekerjaan_${selectedJobType}.xlsx`
          : "Statistik_Pekerjaan_Semua.xlsx";

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, filename);
  };

  const SortIcon = ({ field }: { field: keyof StatItem }) =>
    sortField === field
      ? sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
      : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;

  return (
    <>
      <Card>
        {!hideTitle && (
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg">Statistik Status Pekerjaan</CardTitle>
            </div>
          </CardHeader>
        )}
        <CardContent className={hideTitle ? "pt-6" : ""}>
          <div className="space-y-6">

            {/* Summary Cards */}
            {!hideCards && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{statsData.length}</div>
                    <p className="text-xs text-muted-foreground">Total Proyek</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-lg font-bold">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(summary.totalValue).replace('Rp', 'Rp ')}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Nilai Kontrak</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{summary.totalProjects}</div>
                    <p className="text-xs text-muted-foreground">
                      {selectedJobType === 'all' ? 'Proyek Sesuai Filter' : `Proyek ${selectedJobType}`}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative w-full md:w-auto md:max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari proyek..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!hideFilterControls && (
                  <>
                    <span className="text-sm font-medium mr-1">Filter:</span>
                    <Select value={filterType} onValueChange={(value: "year" | "jobType") => setFilterType(value)}>
                      <SelectTrigger className="w-full sm:w-[150px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="year">Tahun</SelectItem>
                        <SelectItem value="jobType">Jenis Pekerjaan</SelectItem>
                      </SelectContent>
                    </Select>

                    {filterType === "year" && (
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-full sm:w-[130px] h-9">
                          <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Tahun</SelectItem>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {filterType === "jobType" && (
                      <Select value={selectedJobType} onValueChange={(value: string) => setSelectedJobType(value)}>
                        <SelectTrigger className="w-full sm:w-[150px] h-9">
                          <SelectValue placeholder="Pilih Jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Jenis</SelectItem>
                          {jobTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-full sm:w-[150px] h-9">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="berjalan">Berjalan</SelectItem>
                        <SelectItem value="persiapan">Persiapan</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}

                <Button onClick={exportToExcel} size="sm" variant="outline" className="gap-2 h-9 w-full sm:w-auto mt-2 sm:mt-0">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export Excel</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">No</TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("namaProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Nama Proyek <SortIcon field="namaProyek" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("klien")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Klien <SortIcon field="klien" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("jenisProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Jenis <SortIcon field="jenisProyek" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("nilaiKontrak")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Nilai Kontrak <SortIcon field="nilaiKontrak" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("status")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Status <SortIcon field="status" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("progress")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Progress <SortIcon field="progress" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("progressKeuangan")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Progress Keuangan <SortIcon field="progressKeuangan" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("tahun")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Tahun <SortIcon field="tahun" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <button onClick={() => handleSort("tanggalSelesai")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                        Target Selesai<SortIcon field="tanggalSelesai" />
                      </button>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center gap-1 mx-auto justify-center font-semibold">
                        <StickyNote className="h-3.5 w-3.5" />
                        Catatan
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium">{item.namaProyek}</TableCell>
                        <TableCell>{item.klien}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal border-amber-200 bg-amber-50 text-amber-800">
                            {item.jenisProyek}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(item.nilaiKontrak)}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 font-medium ${item.status === 'selesai' || item.status === 'serah_terima'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                            : item.status === 'berjalan'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-700/10'
                              : 'bg-yellow-50 text-yellow-800 ring-1 ring-yellow-600/20'
                            }`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 w-[90px]">
                              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className={`h-full rounded-full transition-all ${item.progress >= 100 ? 'bg-green-500' :
                                    item.progress > 0 ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                                  style={{ width: `${Math.min(item.progress, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                                {item.progress}%
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-600">
                              {item.tahapanDone} dari {item.tahapanTotal} tahapan
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 w-[90px]">
                              <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className={`h-full rounded-full transition-all ${item.progressKeuangan >= 100 ? 'bg-green-500' :
                                    item.progressKeuangan > 0 ? 'bg-blue-500' : 'bg-gray-200'
                                    }`}
                                  style={{ width: `${Math.min(item.progressKeuangan, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                                {item.progressKeuangan.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.tahun}</TableCell>
                        <TableCell className="text-center text-sm">
                          {item.tanggalSelesai.toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeskripsiPopup(item._raw);
                              }}
                            >
                              <StickyNote className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  Menampilkan {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} dari {filteredData.length}
                </p>
                <div className="flex items-center space-x-2 order-1 sm:order-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center">
                    {currentPage} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                (a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
              );
              if (logs.length === 0) {
                return (
                  <div className="text-center py-10 text-muted-foreground">
                    <StickyNote className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Belum ada catatan untuk proyek ini</p>
                  </div>
                );
              }
              return logs.map((log: any, idx: number) => (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 ring-2 ring-primary/20" />
                    {idx < logs.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-[24px]" />}
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
    </>
  );
}
