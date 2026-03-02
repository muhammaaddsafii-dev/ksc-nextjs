"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
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
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Tagihan {year}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalTagihan)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Terbayar (Lunas)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(data.totalLunas)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{formatCurrency(data.totalPending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatCurrency(data.totalOverdue)}</div>
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
                                        <TableHead>Proyek</TableHead>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data tagihan tahun {year}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentData.map((item, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium max-w-[250px] truncate" title={item.namaProyek}>{item.namaProyek}</TableCell>
                                                <TableCell>{item.nama}</TableCell>
                                                <TableCell>
                                                    {formatDate(item.tanggalInvoice || item.perkiraanInvoiceMasuk || new Date())}
                                                    {!item.tanggalInvoice && <span className="text-xs text-muted-foreground ml-1">(Est)</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`
                          ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                'bg-yellow-100 text-yellow-700 border-yellow-200'}
                        `}>
                                                        {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.jumlahTagihanInvoice || 0)}</TableCell>
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
