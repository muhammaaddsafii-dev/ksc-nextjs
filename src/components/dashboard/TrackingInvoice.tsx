"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
    stats,
    data,
    handleExport,
    page,
    setPage,
    totalPages,
    jenisOptions,
}: TrackingInvoiceProps) {
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
                <CardHeader className="flex flex-col gap-4 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Tracking Invoice</CardTitle>
                        <Button size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={jenis} onValueChange={setJenis}>
                            <SelectTrigger className="w-[140px]">
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
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="lunas">Lunas</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Proyek</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data invoice
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium max-w-[200px] truncate" title={item.namaProyek}>
                                                {item.namaProyek}
                                                <div className="text-xs text-muted-foreground truncate">{item.klien}</div>
                                            </TableCell>
                                            <TableCell>{item.jenisPekerjaan}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{item.effectiveDate ? formatDate(item.effectiveDate) : '-'}</TableCell>
                                            <TableCell>{formatCurrency(item.jumlahTagihanInvoice || 0)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                          ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'}
                        `}>
                                                    {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                </Badge>
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
                </CardContent>
            </Card>
        </div>
    );
}
