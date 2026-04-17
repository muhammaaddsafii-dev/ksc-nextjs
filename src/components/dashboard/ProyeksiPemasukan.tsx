"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    searchQuery: string;
    setSearchQuery: (val: string) => void;
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
    searchQuery,
    setSearchQuery,
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

    const sortedTableData = useMemo(() => {
        if (!sortField) return tableData;
        return [...tableData].sort((a, b) => {
            let aVal: any;
            let bVal: any;
            if (sortField === "namaProyek") { aVal = a.namaProyek; bVal = b.namaProyek; }
            else if (sortField === "jenisPekerjaan") { aVal = a.jenisPekerjaan; bVal = b.jenisPekerjaan; }
            else if (sortField === "nama") { aVal = a.nama; bVal = b.nama; }
            else if (sortField === "tanggal") {
                aVal = new Date(a.perkiraanInvoiceMasuk || a.tanggalInvoice || 0).getTime();
                bVal = new Date(b.perkiraanInvoiceMasuk || b.tanggalInvoice || 0).getTime();
            }
            else if (sortField === "statusPembayaran") { aVal = a.statusPembayaran || "Menunggu Bayar"; bVal = b.statusPembayaran || "Menunggu Bayar"; }
            else if (sortField === "jumlah") { aVal = a.jumlahTagihanInvoice || 0; bVal = b.jumlahTagihanInvoice || 0; }
            else if (sortField === "progress") { aVal = a.progressProyek ?? 0; bVal = b.progressProyek ?? 0; }
            if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            return sortDir === "asc"
                ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
                : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        });
    }, [tableData, sortField, sortDir]);

    // Group sorted data by namaProyek; group order follows first-occurrence in sortedTableData
    const groupedTableData = useMemo(() => {
        const groups = new Map<string, { jenisPekerjaan: string; items: any[] }>();
        for (const item of sortedTableData) {
            if (!groups.has(item.namaProyek)) {
                groups.set(item.namaProyek, { jenisPekerjaan: item.jenisPekerjaan, items: [] });
            }
            groups.get(item.namaProyek)!.items.push(item);
        }
        return Array.from(groups.entries()).map(([namaProyek, val]) => ({ namaProyek, ...val }));
    }, [sortedTableData]);

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
        const pending = items.filter(i => !i.statusPembayaran || i.statusPembayaran === 'Menunggu Bayar').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const overdue = items.filter(i => i.statusPembayaran === 'Terlambat Bayar').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);

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
                        <CardTitle className="text-sm font-medium text-yellow-600">Menunggu Bayar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.pending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Terlambat Bayar</CardTitle>
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
                <CardHeader>
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <CardTitle className="text-base whitespace-nowrap">Detail Proyeksi</CardTitle>

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

                            <Select value={jenis} onValueChange={setJenis}>
                                <SelectTrigger className="w-full sm:w-[150px] h-9">
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
                                <SelectTrigger className="w-full sm:w-[150px] h-9">
                                    <SelectValue placeholder="Status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="lunas">Lunas</SelectItem>
                                    <SelectItem value="Menunggu Bayar">Menunggu Bayar</SelectItem>
                                    <SelectItem value="Terlambat Bayar">Terlambat Bayar</SelectItem>
                                    <SelectItem value="Belum Tagih">Belum Tagih</SelectItem>
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
                                        <TableHead className="min-w-[100px] text-center">
                                            <button onClick={() => handleSort("jenisPekerjaan")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Jenis <SortIcon field="jenisPekerjaan" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="w-[30%] text-center">
                                            <button onClick={() => handleSort("namaProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Proyek / Tahapan <SortIcon field="namaProyek" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="w-[180px] text-center">
                                            <button onClick={() => handleSort("progress")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Progress <SortIcon field="progress" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="min-w-[120px] text-center">
                                            <button onClick={() => handleSort("tanggal")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Est. Masuk <SortIcon field="tanggal" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            <button onClick={() => handleSort("statusPembayaran")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Status <SortIcon field="statusPembayaran" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="min-w-[150px] text-center">
                                            <button onClick={() => handleSort("jumlah")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Potensi Jumlah <SortIcon field="jumlah" />
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedTableData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data proyeksi untuk tahun {year}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedTableData.map((group) => {
                                            const groupTotal = group.items.reduce((sum: number, i: any) => sum + (i.jumlahTagihanInvoice || 0), 0);
                                            const progressProyek: number = group.items[0]?.progressProyek ?? 0;
                                            return (
                                                <>
                                                    {/* Project group header */}
                                                    <TableRow key={`group-${group.namaProyek}`} className="bg-muted/40 hover:bg-muted/60">
                                                        <TableCell className="text-center">
                                                            <span className="text-xs font-semibold text-muted-foreground">{group.jenisPekerjaan}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-semibold text-sm text-foreground">{group.namaProyek}</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">({group.items.length} tahapan)</span>
                                                        </TableCell>
                                                        {/* Progress bar — identik dengan RekapTagihan */}
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
                                                        <TableCell colSpan={2} />
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-emerald-700">{formatCurrency(groupTotal)}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Tahapan sub-rows */}
                                                    {group.items.map((item: any, idx: number) => (
                                                        <TableRow key={`${group.namaProyek}-${idx}`} className="hover:bg-gray-50/50">
                                                            <TableCell />
                                                            <TableCell className="pl-6 text-sm text-gray-700">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                                                    {item.nama}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell />{/* kolom progress kosong di sub-row */}
                                                            <TableCell className="text-center text-sm">
                                                                {formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className={`text-xs ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                    item.statusPembayaran === 'Terlambat Bayar' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    item.statusPembayaran === 'Belum Tagih' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                    {item.statusPembayaran ?? 'Menunggu Bayar'}
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
                    </div>
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
                                    <div className="text-[10px] sm:text-xs text-yellow-700">Menunggu Bayar</div>
                                    <div className="text-base sm:text-lg font-bold text-yellow-700">{formatCompactCurrency(selectedMonthData.stats.pending)}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <div className="text-[10px] sm:text-xs text-red-700">Terlambat Bayar</div>
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
                                                                item.statusPembayaran === 'Terlambat Bayar' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                item.statusPembayaran === 'Belum Tagih' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'}
                              `}>
                                                            {item.statusPembayaran ?? 'Menunggu Bayar'}
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
