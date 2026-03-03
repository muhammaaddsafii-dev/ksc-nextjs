"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/helpers";

interface RekapTagihanProps {
    year: string;
    setYear: (val: string) => void;
    month: string;
    setMonth: (val: string) => void;
    jenis: string;
    setJenis: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    data: {
        totalTagihan: number;
        totalLunas: number;
        totalPending: number;
        totalOverdue: number;
        details: any[];
    };
    currentData: any[];
    handleExport: () => void;
    jenisOptions: string[];
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
    totalPages: number;
    totalItems: number;
}

export function RekapTagihan({
    year,
    setYear,
    month,
    setMonth,
    jenis,
    setJenis,
    status,
    setStatus,
    searchQuery,
    setSearchQuery,
    data,
    currentData,
    handleExport,
    jenisOptions,
    page,
    setPage,
    totalPages,
    totalItems,
}: RekapTagihanProps) {
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
        return sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
    };

    const sortedCurrentData = useMemo(() => {
        if (!sortField) return currentData;
        return [...currentData].sort((a, b) => {
            let aVal: any;
            let bVal: any;
            if (sortField === "namaProyek") { aVal = a.namaProyek; bVal = b.namaProyek; }
            else if (sortField === "nama") { aVal = a.nama; bVal = b.nama; }
            else if (sortField === "tanggal") {
                aVal = new Date(a.tanggalInvoice || a.perkiraanInvoiceMasuk || 0).getTime();
                bVal = new Date(b.tanggalInvoice || b.perkiraanInvoiceMasuk || 0).getTime();
            }
            else if (sortField === "statusPembayaran") { aVal = a.statusPembayaran || "pending"; bVal = b.statusPembayaran || "pending"; }
            else if (sortField === "jumlah") { aVal = a.jumlahTagihanInvoice || 0; bVal = b.jumlahTagihanInvoice || 0; }
            else if (sortField === "progress") { aVal = a.progressProyek ?? 0; bVal = b.progressProyek ?? 0; }
            if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            return sortDir === "asc"
                ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
                : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        });
    }, [currentData, sortField, sortDir]);

    // Group by namaProyek, preserving sort order of first occurrence
    const groupedCurrentData = useMemo(() => {
        const groups = new Map<string, { items: any[] }>();
        for (const item of sortedCurrentData) {
            if (!groups.has(item.namaProyek)) {
                groups.set(item.namaProyek, { items: [] });
            }
            groups.get(item.namaProyek)!.items.push(item);
        }
        return Array.from(groups.entries()).map(([namaProyek, val]) => ({ namaProyek, ...val }));
    }, [sortedCurrentData]);

    return (
        <div className="space-y-4">
            {/* Stat Cards — 4 kolom penuh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tagihan {year === 'all' ? '' : year}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalTagihan)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{data.details.length} invoice</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{formatCurrency(data.totalPending)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.details.filter((d: any) => d.statusPembayaran === 'pending').length} invoice
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatCurrency(data.totalOverdue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.details.filter((d: any) => d.statusPembayaran === 'overdue').length} invoice
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <CardTitle className="text-base whitespace-nowrap">Rincian Tagihan {year === 'all' ? '' : year}</CardTitle>

                        <div className="flex flex-wrap flex-1 justify-start xl:justify-end items-center gap-2 w-full">
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-full sm:w-[130px] h-9">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tahun</SelectItem>
                                    <SelectItem value="2025">Tahun 2025</SelectItem>
                                    <SelectItem value="2026">Tahun 2026</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-full sm:w-[130px] h-9">
                                    <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, idx) => (
                                        <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={jenis} onValueChange={setJenis}>
                                <SelectTrigger className="w-full sm:w-[150px] h-9">
                                    <SelectValue placeholder="Jenis..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    {jenisOptions.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full sm:w-[150px] h-9">
                                    <SelectValue placeholder="Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="lunas">Lunas</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button size="sm" variant="outline" className="gap-2 h-9 w-full sm:w-auto mt-2 sm:mt-0" onClick={handleExport}>
                                <Download className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Export Excel</span>
                                <span className="sm:hidden">Export</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari proyek..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center w-[35%]">
                                            <button onClick={() => handleSort("namaProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Proyek / Invoice <SortIcon field="namaProyek" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-center w-[180px]">
                                            <button onClick={() => handleSort("progress")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Progress <SortIcon field="progress" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <button onClick={() => handleSort("tanggal")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Tanggal <SortIcon field="tanggal" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <button onClick={() => handleSort("statusPembayaran")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Status <SortIcon field="statusPembayaran" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <button onClick={() => handleSort("jumlah")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Jumlah <SortIcon field="jumlah" />
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedCurrentData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data tagihan tahun {year}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedCurrentData.map((group) => {
                                            const groupTotal = group.items.reduce((sum: number, i: any) => sum + (i.jumlahTagihanInvoice || 0), 0);
                                            const progressProyek: number = group.items[0]?.progressProyek ?? 0;
                                            return (
                                                <>
                                                    {/* Project group header */}
                                                    <TableRow key={`group-${group.namaProyek}`} className="bg-muted/40 hover:bg-muted/60">
                                                        <TableCell>
                                                            <span className="font-semibold text-sm text-foreground">{group.namaProyek}</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">({group.items.length} invoice)</span>
                                                        </TableCell>
                                                        {/* Progress bar — identik dengan OverallStats */}
                                                        <TableCell className="min-w-[160px] px-4">
                                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                <span>Progress</span>
                                                                <span className="font-medium text-gray-700">{progressProyek}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-blue-500 rounded-full transition-all"
                                                                    style={{ width: `${progressProyek}%` }}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell colSpan={2} />
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-emerald-700">{formatCurrency(groupTotal)}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Invoice sub-rows */}
                                                    {group.items.map((item: any, idx: number) => (
                                                        <TableRow key={`${group.namaProyek}-${idx}`} className="hover:bg-gray-50/50">
                                                            <TableCell className="pl-6 text-sm text-gray-700">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                                                    {item.nama}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell />{/* kolom progress dikosongkan di sub-row */}
                                                            <TableCell className="text-center text-sm">
                                                                {formatDate(item.tanggalInvoice || item.perkiraanInvoiceMasuk || new Date())}
                                                                {!item.tanggalInvoice && <span className="text-xs text-muted-foreground ml-1">(Est)</span>}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className={`text-xs ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                    item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                    {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm font-medium">
                                                                {formatCurrency(item.jumlahTagihanInvoice || 0)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                                    Menampilkan {(page - 1) * 10 + 1}-{Math.min((page - 1) * 10 + 10, totalItems)} dari {totalItems}
                                </p>
                                <div className="flex items-center space-x-2 order-1 sm:order-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm min-w-[3rem] text-center">
                                        {page} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
