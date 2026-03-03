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

interface TrackingInvoiceProps {
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
    stats: {
        totalCount: number;
        lunasCount: number;
        pendingCount: number;
        overdueCount: number;
    };
    data: any[];
    handleExport: () => void;
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
    totalPages: number;
    jenisOptions: string[];
}

export function TrackingInvoice({
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
    stats,
    data,
    handleExport,
    page,
    setPage,
    totalPages,
    jenisOptions,
}: TrackingInvoiceProps) {
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

    const sortedData = useMemo(() => {
        if (!sortField) return data;
        return [...data].sort((a, b) => {
            let aVal: any;
            let bVal: any;
            if (sortField === "namaProyek") { aVal = a.namaProyek; bVal = b.namaProyek; }
            else if (sortField === "nama") { aVal = a.nama; bVal = b.nama; }
            else if (sortField === "tanggal") {
                aVal = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
                bVal = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
            }
            else if (sortField === "jumlah") { aVal = a.jumlahTagihanInvoice || 0; bVal = b.jumlahTagihanInvoice || 0; }
            else if (sortField === "statusPembayaran") { aVal = a.statusPembayaran || "pending"; bVal = b.statusPembayaran || "pending"; }
            else if (sortField === "progress") { aVal = a.progressProyek ?? 0; bVal = b.progressProyek ?? 0; }
            if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            return sortDir === "asc"
                ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
                : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        });
    }, [data, sortField, sortDir]);

    const groupedData = useMemo(() => {
        const groups = new Map<string, { jenisPekerjaan: string; klien: string; items: any[] }>();
        for (const item of sortedData) {
            if (!groups.has(item.namaProyek)) {
                groups.set(item.namaProyek, { jenisPekerjaan: item.jenisPekerjaan, klien: item.klien, items: [] });
            }
            groups.get(item.namaProyek)!.items.push(item);
        }
        return Array.from(groups.entries()).map(([namaProyek, val]) => ({ namaProyek, ...val }));
    }, [sortedData]);
    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoice</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Lunas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{stats.lunasCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{stats.pendingCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{stats.overdueCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <CardTitle className="text-base whitespace-nowrap">Tracking Invoice</CardTitle>

                        <div className="flex flex-wrap flex-1 justify-start xl:justify-end items-center gap-2 w-full">
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-full sm:w-[130px] h-9">
                                    <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tahun</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-full sm:w-[130px] h-9">
                                    <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Bulan</SelectItem>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
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
                                placeholder="Cari proyek proyek..."
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>


                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[35%] text-center">
                                            <button onClick={() => handleSort("namaProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Proyek / Invoice <SortIcon field="namaProyek" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="w-[180px] text-center">
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
                                            <button onClick={() => handleSort("jumlah")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Jumlah <SortIcon field="jumlah" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <button onClick={() => handleSort("statusPembayaran")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Status <SortIcon field="statusPembayaran" />
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data invoice
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedData.map((group) => {
                                            const groupTotal = group.items.reduce((sum: number, i: any) => sum + (i.jumlahTagihanInvoice || 0), 0);
                                            const progressProyek: number = group.items[0]?.progressProyek ?? 0;
                                            return (
                                                <>
                                                    {/* Project group header */}
                                                    <TableRow key={`group-${group.namaProyek}`} className="bg-muted/40 hover:bg-muted/60">
                                                        <TableCell>
                                                            <div className="font-semibold text-sm text-foreground">{group.namaProyek}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {group.jenisPekerjaan}
                                                                {group.klien ? ` · ${group.klien}` : ''}
                                                                <span className="ml-1">({group.items.length} invoice)</span>
                                                            </div>
                                                        </TableCell>
                                                        {/* Progress bar */}
                                                        <TableCell className="w-[180px] px-4">
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
                                                        <TableCell />
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-emerald-700">{formatCurrency(groupTotal)}</span>
                                                        </TableCell>
                                                        <TableCell />
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
                                                            <TableCell />{/* progress kosong di sub-row */}
                                                            <TableCell className="text-center text-sm">
                                                                {item.effectiveDate ? formatDate(item.effectiveDate) : '-'}
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm font-medium">
                                                                {formatCurrency(item.jumlahTagihanInvoice || 0)}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className={`text-xs ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                    item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                    {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                                </Badge>
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
                                    Menampilkan {(page - 1) * 10 + 1}-{Math.min((page - 1) * 10 + 10, stats.totalCount)} dari {stats.totalCount}
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
