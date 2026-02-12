"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ArsipPekerjaan } from "@/types";
import { formatCurrency } from "@/lib/helpers";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface JobStatisticsProps {
  arsipPekerjaan: ArsipPekerjaan[];
}

type JobType = "AMDAL" | "PPKH";

const detectJobType = (projectName: string): JobType | null => {
  const name = projectName.toLowerCase();
  if (name.includes("amdal")) return "AMDAL";
  if (name.includes("ppkh")) return "PPKH";
  return null;
};

interface StatItem {
  namaProyek: string;
  klien: string;
  nilaiKontrak: number;
  tahun: number;
  jenisProyek: JobType;
  tanggalSelesai: Date;
}

export function JobStatistics({ arsipPekerjaan }: JobStatisticsProps) {
  const [filterType, setFilterType] = useState<"year" | "jobType">("year");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedJobType, setSelectedJobType] = useState<JobType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Prepare statistics data - filter only AMDAL and PPKH from arsip
  const statsData: StatItem[] = useMemo(() => {
    return arsipPekerjaan
      .filter((p) => {
        const type = detectJobType(p.namaProyek);
        return type === "AMDAL" || type === "PPKH";
      })
      .map((p) => ({
        namaProyek: p.namaProyek,
        klien: p.klien,
        nilaiKontrak: p.nilaiKontrak,
        tahun: p.tanggalSelesai.getFullYear(),
        jenisProyek: detectJobType(p.namaProyek)!,
        tanggalSelesai: p.tanggalSelesai,
      }));
  }, [arsipPekerjaan]);

  // Get unique years
  const years = useMemo(() => {
    const yearSet = new Set(statsData.map((item) => item.tahun));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [statsData]);

  // Only AMDAL and PPKH
  const jobTypes: JobType[] = ["AMDAL", "PPKH"];

  // Filter data based on selection
  const filteredData = useMemo(() => {
    let filtered = [...statsData];

    if (filterType === "year" && selectedYear !== "all") {
      filtered = filtered.filter((item) => item.tahun === parseInt(selectedYear));
    }

    if (filterType === "jobType" && selectedJobType !== "all") {
      filtered = filtered.filter((item) => item.jenisProyek === selectedJobType);
    }

    // Reset to page 1 when filter changes
    setCurrentPage(1);

    return filtered;
  }, [statsData, filterType, selectedYear, selectedJobType]);

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Calculate summary
  const summary = useMemo(() => {
    const totalValue = filteredData.reduce((sum, item) => sum + item.nilaiKontrak, 0);
    const totalProjects = filteredData.length;

    // Group by job type
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
    wsSummary.addRow({ keterangan: "Proyek AMDAL", nilai: summary.byJobType.amdal });
    wsSummary.addRow({ keterangan: "Proyek PPKH", nilai: summary.byJobType.ppkh });

    // Style header row
    wsSummary.getRow(1).font = { bold: true };

    // 2. Data Pekerjaan Sheet
    const wsData = workbook.addWorksheet("Data Pekerjaan");

    wsData.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Proyek", key: "namaProyek", width: 50 },
      { header: "Klien", key: "klien", width: 30 },
      { header: "Jenis Proyek", key: "jenisProyek", width: 15 },
      { header: "Nilai Kontrak", key: "nilaiKontrak", width: 18 },
      { header: "Tahun", key: "tahun", width: 8 },
      { header: "Tanggal Selesai", key: "tanggalSelesai", width: 15 },
    ];

    filteredData.forEach((item, index) => {
      wsData.addRow({
        no: index + 1,
        namaProyek: item.namaProyek,
        klien: item.klien,
        jenisProyek: item.jenisProyek,
        nilaiKontrak: item.nilaiKontrak,
        tahun: item.tahun,
        tanggalSelesai: item.tanggalSelesai.toLocaleDateString("id-ID"),
      });
    });

    // Style header row
    wsData.getRow(1).font = { bold: true };

    // Generate filename
    const filename =
      filterType === "year" && selectedYear !== "all"
        ? `Statistik_Pekerjaan_Tahun_${selectedYear}.xlsx`
        : filterType === "jobType" && selectedJobType !== "all"
          ? `Statistik_Pekerjaan_${selectedJobType}.xlsx`
          : "Statistik_Pekerjaan_Semua.xlsx";

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, filename);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Statistik Pekerjaan Selesai</CardTitle>
          <Button onClick={exportToExcel} size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter berdasarkan:</label>
              <Select
                value={filterType}
                onValueChange={(value: "year" | "jobType") => setFilterType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Tahun</SelectItem>
                  <SelectItem value="jobType">Jenis Pekerjaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "year" && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterType === "jobType" && (
              <Select
                value={selectedJobType}
                onValueChange={(value: JobType | "all") => setSelectedJobType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Summary Cards */}
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
                  {selectedJobType === 'all'
                    ? 'Proyek Sesuai Filter'
                    : `Proyek ${selectedJobType}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Proyek</TableHead>
                  <TableHead>Klien</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead className="text-right">Nilai Kontrak</TableHead>
                  <TableHead className="text-center">Tahun</TableHead>
                  <TableHead className="text-center">Tanggal Selesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${item.jenisProyek === "AMDAL"
                          ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10"
                          : "bg-green-50 text-green-700 ring-1 ring-inset ring-green-700/10"
                          }`}>
                          {item.jenisProyek}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(item.nilaiKontrak)}
                      </TableCell>
                      <TableCell className="text-center">{item.tahun}</TableCell>
                      <TableCell className="text-center text-sm">
                        {item.tanggalSelesai.toLocaleDateString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} dari {filteredData.length}
              </p>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[3rem] text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
