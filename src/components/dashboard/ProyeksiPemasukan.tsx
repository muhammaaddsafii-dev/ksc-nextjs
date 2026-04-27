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
        total: number; totalCount: number;
        lunas: number; lunasCount: number;
        pending: number; pendingCount: number;
        overdue: number; overdueCount: number;
        belumTagih: number; belumTagihCount: number;
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
        if (!sortField) return allData;
        return [...allData].sort((a, b) => {
            let aVal: any;
            let bVal: any;
            if (sortField === "namaProyek") { aVal = a.namaProyek; bVal = b.namaProyek; }
            else if (sortField === "jenisPekerjaan") { aVal = a.jenisPekerjaan; bVal = b.jenisPekerjaan; }
            else if (sortField === "tahunProyek") { 
                const aYear = a.tanggalMulaiProyek || a.tanggalSelesaiProyek; 
                const bYear = b.tanggalMulaiProyek || b.tanggalSelesaiProyek; 
                aVal = aYear ? new Date(aYear).getFullYear() : 0;
                bVal = bYear ? new Date(bYear).getFullYear() : 0;
            }
            else if (sortField === "nama") { aVal = a.nama; bVal = b.nama; }
            else if (sortField === "tanggal") {
                aVal = new Date(a.perkiraanInvoiceMasuk || a.tanggalInvoice || 0).getTime();
                bVal = new Date(b.perkiraanInvoiceMasuk || b.tanggalInvoice || 0).getTime();
            }
            else if (sortField === "statusPembayaran") { aVal = a.statusPembayaran || "Menunggu Bayar"; bVal = b.statusPembayaran || "Menunggu Bayar"; }
            else if (sortField === "nilaiKontrak") { aVal = a.nilaiKontrak || 0; bVal = b.nilaiKontrak || 0; }
            else if (sortField === "lunas") { aVal = a.statusPembayaran === 'lunas' ? (a.jumlahTagihanInvoice || 0) : 0; bVal = b.statusPembayaran === 'lunas' ? (b.jumlahTagihanInvoice || 0) : 0; }
            else if (sortField === "sisaTagihan") { aVal = a.statusPembayaran !== 'lunas' ? (a.jumlahTagihanInvoice || 0) : 0; bVal = b.statusPembayaran !== 'lunas' ? (b.jumlahTagihanInvoice || 0) : 0; }
            else if (sortField === "progress") { aVal = a.progressProyek ?? 0; bVal = b.progressProyek ?? 0; }
            if (typeof aVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
            return sortDir === "asc"
                ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
                : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        });
    }, [allData, sortField, sortDir]);

    // Group sorted data by namaProyek
    const allGroupedTableData = useMemo(() => {
        const groups = new Map<string, { jenisPekerjaan: string; items: any[] }>();
        for (const item of sortedTableData) {
            if (!groups.has(item.namaProyek)) {
                groups.set(item.namaProyek, { jenisPekerjaan: item.jenisPekerjaan, items: [] });
            }
            groups.get(item.namaProyek)!.items.push(item);
        }
        return Array.from(groups.entries()).map(([namaProyek, val]) => ({ namaProyek, ...val }));
    }, [sortedTableData]);

    const itemsPerPage = 10;
    const internalTotalPages = Math.max(1, Math.ceil(allGroupedTableData.length / itemsPerPage));

    const groupedTableData = useMemo(() => {
        return allGroupedTableData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    }, [allGroupedTableData, page]);

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

        const lunasData = items.filter(i => i.statusPembayaran === 'lunas');
        const overdueData = items.filter(i => i.statusPembayaran === 'Terlambat Bayar');
        const belumTagihData = items.filter(i => i.statusPembayaran === 'Belum Tagih');
        const pendingData = items.filter(i => i.statusPembayaran === 'Menunggu Bayar' || (!i.statusPembayaran));

        const total = items.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const lunas = lunasData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const pending = pendingData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const overdue = overdueData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
        const belumTagih = belumTagihData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);

        return {
            monthName: selectedMonth,
            items,
            stats: { 
                total, totalCount: items.length,
                lunas, lunasCount: lunasData.length,
                pending, pendingCount: pendingData.length,
                overdue, overdueCount: overdueData.length,
                belumTagih, belumTagihCount: belumTagihData.length
            }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex justify-between">
                            Total Proyeksi {year}
                            <Badge variant="secondary" className="font-normal text-xs">{stats.totalCount} invoice</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 flex justify-between">
                            Belum Tagih
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 font-normal text-xs">{stats.belumTagihCount} invoice</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700">{formatCurrency(stats.belumTagih)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-600 flex justify-between">
                            Menunggu Bayar
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-normal text-xs">{stats.pendingCount} invoice</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.pending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600 flex justify-between">
                            Terbayar (Lunas)
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-normal text-xs">{stats.lunasCount} invoice</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.lunas)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-600 flex justify-between">
                            Terlambat Bayar
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal text-xs">{stats.overdueCount} invoice</Badge>
                        </CardTitle>
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
                                    name="Menunggu Bayar"
                                    onClick={(data: any) => setSelectedMonth(data.name)}
                                    cursor="pointer"
                                />
                                <Bar
                                    dataKey="belumTagih"
                                    stackId="a"
                                    fill="#9CA3AF"
                                    name="Belum Tagih"
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
                                        <TableHead className="min-w-[100px] text-center">
                                            <button onClick={() => handleSort("tahunProyek")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Tahun <SortIcon field="tahunProyek" />
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
                                        <TableHead className="min-w-[120px] text-center">
                                            <button onClick={() => handleSort("nilaiKontrak")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Nilai Kontrak <SortIcon field="nilaiKontrak" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="min-w-[120px] text-center">
                                            <button onClick={() => handleSort("lunas")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Lunas <SortIcon field="lunas" />
                                            </button>
                                        </TableHead>
                                        <TableHead className="min-w-[150px] text-center">
                                            <button onClick={() => handleSort("sisaTagihan")} className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors font-semibold">
                                                Sisa Tagihan <SortIcon field="sisaTagihan" />
                                            </button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedTableData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                Tidak ada data proyeksi untuk tahun {year}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        groupedTableData.map((group) => {
                                            const nilaiKontrak = group.items[0]?.nilaiKontrak || 0;
                                            const groupLunas = group.items.filter((i: any) => i.statusPembayaran === 'lunas').reduce((sum: number, i: any) => sum + (i.jumlahTagihanInvoice || 0), 0);
                                            const groupSisaTagihan = group.items.filter((i: any) => ['Menunggu Bayar', 'Terlambat Bayar', 'Belum Tagih'].includes(i.statusPembayaran || 'Menunggu Bayar')).reduce((sum: number, i: any) => sum + (i.jumlahTagihanInvoice || 0), 0);
                                            
                                            
                                            const progressProyek: number = group.items[0]?.progressProyek ?? 0;
                                            const progressKeuangan: string = group.items[0]?.progressKeuangan ?? "0.0";
                                            const rawYearDate = group.items[0]?.tanggalMulaiProyek || group.items[0]?.tanggalSelesaiProyek;
                                            const projectYear = rawYearDate ? new Date(rawYearDate).getFullYear() : '-';
                                            return (
                                                <>
                                                    {/* Project group header */}
                                                    <TableRow key={`group-${group.namaProyek}`} className="bg-muted/40 hover:bg-muted/60">
                                                        <TableCell className="text-center">
                                                            <span className="text-xs font-semibold text-muted-foreground">{group.jenisPekerjaan}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-xs font-semibold text-muted-foreground">{projectYear}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-semibold text-sm text-foreground">{group.namaProyek}</span>
                                                            <span className="ml-2 text-xs text-muted-foreground">({group.items.length} invoice)</span>
                                                        </TableCell>
                                                        {/* Progress bar */}
                                                        <TableCell className="w-[180px] px-4 py-2">
                                                            <div>
                                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                                    <span>Keuangan</span>
                                                                    <span className="font-medium text-gray-700">{progressKeuangan}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-[#3B82F6] rounded-full transition-all"
                                                                        style={{ width: `${progressKeuangan}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell colSpan={2} />
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-foreground">{formatCurrency(nilaiKontrak)}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-emerald-700">{formatCurrency(groupLunas)}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-bold text-yellow-700">{formatCurrency(groupSisaTagihan)}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Tahapan sub-rows */}
                                                    {group.items.map((item: any, idx: number) => (
                                                        <TableRow key={`${group.namaProyek}-${idx}`} className="hover:bg-gray-50/50">
                                                            <TableCell />
                                                            <TableCell />
                                                            <TableCell className="pl-6 text-sm text-gray-700">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                                                    <div className="flex flex-col">
                                                                        <span>{item.nama} <span className="text-muted-foreground ml-1 font-normal">({item.bobot || 0}%)</span></span>
                                                                        {item.invoiceNomor && (
                                                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                                                {item.invoiceNomor}
                                                                            </span>
                                                                        )}
                                                                    </div>
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
                                                            <TableCell className="text-center text-sm text-muted-foreground">
                                                                -
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm font-medium text-emerald-600">
                                                                {item.statusPembayaran === 'lunas' ? formatCurrency(item.jumlahTagihanInvoice || 0) : '-'}
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm font-medium text-yellow-600">
                                                                {item.statusPembayaran !== 'lunas' ? formatCurrency(item.jumlahTagihanInvoice || 0) : '-'}
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

                        {internalTotalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                                    Menampilkan {(page - 1) * itemsPerPage + 1}-{Math.min((page - 1) * itemsPerPage + itemsPerPage, allGroupedTableData.length)} dari {allGroupedTableData.length} proyek
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
                                        {page} / {internalTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((prev) => Math.min(prev + 1, internalTotalPages))}
                                        disabled={page === internalTotalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(internalTotalPages)}
                                        disabled={page === internalTotalPages}
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
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                                <div className="bg-muted/50 p-3 rounded-lg relative">
                                    <div className="text-[10px] sm:text-xs text-muted-foreground">Total Tagihan</div>
                                    <div className="absolute top-3 right-3 text-[10px] text-muted-foreground bg-white px-1.5 py-0.5 rounded border">{selectedMonthData.stats.totalCount} inv</div>
                                    <div className="text-base sm:text-lg font-bold">{formatCompactCurrency(selectedMonthData.stats.total)}</div>
                                </div>
                                <div className="bg-gray-100 p-3 rounded-lg relative">
                                    <div className="text-[10px] sm:text-xs text-gray-600">Belum Tagih</div>
                                    <div className="absolute top-3 right-3 text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">{selectedMonthData.stats.belumTagihCount} inv</div>
                                    <div className="text-base sm:text-lg font-bold text-gray-700">{formatCompactCurrency(selectedMonthData.stats.belumTagih)}</div>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg relative">
                                    <div className="text-[10px] sm:text-xs text-yellow-700">Menunggu Bayar</div>
                                    <div className="absolute top-3 right-3 text-[10px] text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded border border-yellow-200">{selectedMonthData.stats.pendingCount} inv</div>
                                    <div className="text-base sm:text-lg font-bold text-yellow-700">{formatCompactCurrency(selectedMonthData.stats.pending)}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg relative">
                                    <div className="text-[10px] sm:text-xs text-green-700">Lunas</div>
                                    <div className="absolute top-3 right-3 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded border border-green-200">{selectedMonthData.stats.lunasCount} inv</div>
                                    <div className="text-base sm:text-lg font-bold text-green-700">{formatCompactCurrency(selectedMonthData.stats.lunas)}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg relative">
                                    <div className="text-[10px] sm:text-xs text-red-700">Terlambat Bayar</div>
                                    <div className="absolute top-3 right-3 text-[10px] text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">{selectedMonthData.stats.overdueCount} inv</div>
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
