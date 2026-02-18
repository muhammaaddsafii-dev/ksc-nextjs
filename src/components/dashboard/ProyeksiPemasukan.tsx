"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/helpers";

interface ProyeksiPemasukanProps {
    year: string;
    setYear: (val: string) => void;
    jenis: string;
    setJenis: (val: string) => void;
    status: string;
    setStatus: (val: string) => void;
    stats: {
        total: number;
        lunas: number;
        pending: number;
        overdue: number;
    };
    chartData: any[];
    tableData: any[];
    allData: any[]; // proyeksiPemasukanData
    handleExport: () => void;
    page: number;
    setPage: (p: number | ((prev: number) => number)) => void;
    totalPages: number;
    jenisOptions: string[];
}

export function ProyeksiPemasukan({
    year,
    setYear,
    jenis,
    setJenis,
    status,
    setStatus,
    stats,
    chartData,
    tableData,
    allData,
    handleExport,
    page,
    setPage,
    totalPages,
    jenisOptions,
}: ProyeksiPemasukanProps) {
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const selectedMonthData = useMemo(() => {
        if (!selectedMonth) return null;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIdx = monthNames.findIndex(m => m === selectedMonth);

        if (monthIdx === -1) return null;

        // Items for this month in the selected year
        const items = allData.filter(item => {
            const date = item.perkiraanInvoiceMasuk || item.tanggalInvoice;
            if (!date) return false;
            const d = new Date(date);
            return d.getMonth() === monthIdx;
        });

        const total = items.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const lunas = items.filter(i => i.statusPembayaran === 'lunas').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const pending = items.filter(i => !i.statusPembayaran || i.statusPembayaran === 'pending').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const overdue = items.filter(i => i.statusPembayaran === 'overdue').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);

        return {
            monthName: selectedMonth,
            items,
            stats: { total, lunas, pending, overdue }
        };
    }, [selectedMonth, allData]);

    const formatCompactCurrency = (value: number) => {
        if (value >= 1000000000) {
            return (value / 1000000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'M';
        } else if (value >= 1000000) {
            return (value / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'Jt';
        }
        return formatCurrency(value);
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyeksi {year}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Terbayar (Lunas)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.lunas)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.pending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{formatCurrency(stats.overdue)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg">Grafik Proyeksi Pemasukan {year} {jenis !== 'all' ? `(${jenis})` : ''}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={chartData}
                                className="cursor-pointer"
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis className="text-xs" tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}M`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar
                                    dataKey="lunas"
                                    stackId="a"
                                    fill="#10B981"
                                    name="Lunas"
                                    radius={[0, 0, 4, 4]}
                                    onClick={(data: any) => setSelectedMonth(data.name)}
                                    cursor="pointer"
                                />
                                <Bar
                                    dataKey="pending"
                                    stackId="a"
                                    fill="#F59E0B"
                                    name="Pending"
                                    onClick={(data: any) => setSelectedMonth(data.name)}
                                    cursor="pointer"
                                />
                                <Bar
                                    dataKey="overdue"
                                    stackId="a"
                                    fill="#EF4444"
                                    name="Overdue"
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data: any) => setSelectedMonth(data.name)}
                                    cursor="pointer"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-4 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Detail Proyeksi</CardTitle>
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
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={jenis} onValueChange={setJenis}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Semua Jenis" />
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
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">Proyek</TableHead>
                                    <TableHead className="min-w-[100px]">Jenis</TableHead>
                                    <TableHead className="min-w-[120px] hidden sm:table-cell">Tahapan</TableHead>
                                    <TableHead className="min-w-[120px]">Est. Masuk</TableHead>
                                    <TableHead className="min-w-[100px]">Status</TableHead>
                                    <TableHead className="min-w-[150px]">Potensi Jumlah</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data proyeksi untuk tahun {year}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tableData.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium max-w-[200px] sm:max-w-[250px] truncate" title={item.namaProyek}>
                                                {item.namaProyek}
                                                <div className="text-xs text-muted-foreground truncate block sm:hidden">{item.nama}</div>
                                            </TableCell>
                                            <TableCell>{item.jenisPekerjaan}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{item.nama}</TableCell>
                                            <TableCell>{formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                          ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-yellow-100 text-yellow-700 border-yellow-200'}
                        `}>
                                                    {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatCurrency(item.jumlahTagihanInvoice || 0)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                            <p className="text-sm text-muted-foreground order-2 sm:order-1">
                                Menampilkan {(page - 1) * 10 + 1}-{Math.min((page - 1) * 10 + 10, allData.length)} dari {allData.length}
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

            <Dialog open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
                <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4 sm:p-6 gap-4">
                    <DialogHeader>
                        <DialogTitle>Detail Proyeksi - {selectedMonth} {year}</DialogTitle>
                        <DialogDescription>
                            Detail pemasukan dan invoice untuk bulan {selectedMonth} {year}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedMonthData && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <div className="bg-muted/50 p-3 rounded-lg">
                                    <div className="text-[10px] sm:text-xs text-muted-foreground">Total Tagihan</div>
                                    <div className="text-base sm:text-lg font-bold">{formatCompactCurrency(selectedMonthData.stats.total)}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-[10px] sm:text-xs text-green-700">Lunas</div>
                                    <div className="text-base sm:text-lg font-bold text-green-700">{formatCompactCurrency(selectedMonthData.stats.lunas)}</div>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <div className="text-[10px] sm:text-xs text-yellow-700">Pending</div>
                                    <div className="text-base sm:text-lg font-bold text-yellow-700">{formatCompactCurrency(selectedMonthData.stats.pending)}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <div className="text-[10px] sm:text-xs text-red-700">Overdue</div>
                                    <div className="text-base sm:text-lg font-bold text-red-700">{formatCompactCurrency(selectedMonthData.stats.overdue)}</div>
                                </div>
                            </div>

                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40%] sm:w-auto">Proyek</TableHead>
                                            <TableHead className="hidden sm:table-cell">Tahapan</TableHead>
                                            <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                                            <TableHead className="w-[20%] sm:w-auto">Status</TableHead>
                                            <TableHead className="text-right w-[25%] sm:w-auto">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedMonthData.items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                    Tidak ada data invoice bulan {selectedMonth}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            selectedMonthData.items.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium max-w-[120px] sm:max-w-none">
                                                        <div className="font-semibold truncate text-xs sm:text-sm" title={item.namaProyek}>{item.namaProyek}</div>
                                                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate" title={item.klien}>{item.klien}</div>
                                                        <div className="block sm:hidden text-[10px] text-muted-foreground mt-1">
                                                            <div className="truncate w-full">{item.nama}</div>
                                                            <span className="text-[9px]">{formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell text-sm">{item.nama}</TableCell>
                                                    <TableCell className="hidden sm:table-cell text-sm">{formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`
                                whitespace-nowrap text-[9px] sm:text-xs px-1 sm:px-2.5 h-auto py-0.5
                                ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'}
                              `}>
                                                            {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-xs sm:text-sm">
                                                        {formatCompactCurrency(item.jumlahTagihanInvoice || 0)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
