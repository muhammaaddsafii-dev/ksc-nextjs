// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp,
    TrendingDown,
    Briefcase,
    Clock,
    CheckCircle2,
    Hourglass,
    Banknote,
    FileText,
    AlertTriangle,
    ArrowUpRight,
    AlertCircle,
    Eye,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Sector,
} from "recharts";
import { JobStatistics } from "@/components/JobStatistics";
import { PekerjaanViewModal } from "@/components/PekerjaanViewModal";
import { formatDate, isExpiringSoon } from "@/lib/helpers";
import { calculateWeightedProgress } from "@/app/pekerjaan/utils/calculations";

const COLORS = [
    "#3B82F6", // blue - berjalan
    "#F59E0B", // amber - persiapan
    "#10B981", // green - selesai
];

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeClass: string }> = {
    berjalan: { label: "Berjalan", color: "bg-blue-500", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
    persiapan: { label: "Persiapan", color: "bg-amber-500", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
    selesai: { label: "Selesai", color: "bg-green-500", badgeClass: "bg-green-50 text-green-700 border-green-200" },
    serah_terima: { label: "Serah Terima", color: "bg-emerald-500", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function formatCurrency(value: number) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)} Jt`;
    return `Rp ${value.toLocaleString("id-ID")}`;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0];
        return (
            <div className="bg-white shadow-lg rounded-lg px-4 py-3 border border-gray-100 text-sm">
                <div className="font-semibold text-gray-800">{d.name}</div>
                <div className="text-gray-500 mt-0.5">{d.value} proyek</div>
            </div>
        );
    }
    return null;
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill={fill} className="text-lg font-bold" fontSize={22} fontWeight={700}>
                {payload.value}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fill="#6B7280" fontSize={12}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 34} textAnchor="middle" fill="#9CA3AF" fontSize={11}>
                {(percent * 100).toFixed(0)}%
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        </g>
    );
};

interface OverallStatsProps {
    legalitas: any[];
    pekerjaan: any[];
    pekerjaanSelesai: any[];
    handleExportProyeksi: () => void;
}

export function OverallStats({
    legalitas,
    pekerjaan,
    pekerjaanSelesai,
    handleExportProyeksi
}: OverallStatsProps) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [dialogStatus, setDialogStatus] = useState<string | null>(null); // untuk dialog detail proyek
    const [viewItem, setViewItem] = useState<any | null>(null);

    const currentYear = new Date().getFullYear().toString();

    // Shared global filter state — independen, bisa dikombo
    const [selectedYear, setSelectedYear] = useState<string>(currentYear);
    const [selectedJobType, setSelectedJobType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const docsExpiring = legalitas.filter((l) => l.tanggalBerlaku && isExpiringSoon(l.tanggalBerlaku)).length;

    const allPekerjaan = useMemo(() => [...pekerjaan, ...pekerjaanSelesai], [pekerjaan, pekerjaanSelesai]);

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        allPekerjaan.forEach(p => {
            if (p.tanggalMulai) years.add(new Date(p.tanggalMulai).getFullYear().toString());
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [allPekerjaan]);

    const availableJobTypes = useMemo(() => {
        const types = new Set<string>();
        allPekerjaan.forEach(p => { if (p.jenisPekerjaan) types.add(p.jenisPekerjaan); });
        return Array.from(types).sort();
    }, [allPekerjaan]);

    const globalFilteredPekerjaan = useMemo(() => {
        let filtered = allPekerjaan;
        if (selectedYear !== "all") {
            filtered = filtered.filter(p => {
                if (!p.tanggalMulai) return false;
                return new Date(p.tanggalMulai).getFullYear().toString() === selectedYear;
            });
        }
        if (selectedJobType !== "all") {
            filtered = filtered.filter(p => p.jenisPekerjaan === selectedJobType);
        }
        if (filterStatus !== "all") {
            filtered = filtered.filter(p => p.status === filterStatus);
        }
        return filtered;
    }, [allPekerjaan, selectedYear, selectedJobType, filterStatus]);

    // Derived counts dari filtered pekerjaan aktif
    const proyekBerjalan = globalFilteredPekerjaan.filter(p => p.status === "berjalan");
    const proyekPersiapan = globalFilteredPekerjaan.filter(p => p.status === "persiapan");

    const filteredSelesai = globalFilteredPekerjaan.filter(p => p.status === "selesai");


    // All invoices — filter tahun berdasarkan tanggal mulai proyek (sama seperti ProyeksiPemasukan)
    const allInvoices = useMemo(() => {
        let basePekerjaan = allPekerjaan;
        if (selectedYear !== "all") {
            basePekerjaan = basePekerjaan.filter(p => {
                const date = p.tanggalMulai || p.tanggalSelesai;
                return date && new Date(date).getFullYear().toString() === selectedYear;
            });
        }
        if (filterStatus !== "all") basePekerjaan = basePekerjaan.filter(p => p.status === filterStatus);
        if (selectedJobType !== "all") basePekerjaan = basePekerjaan.filter(p => p.jenisPekerjaan === selectedJobType);

        const result: any[] = [];
        basePekerjaan.forEach(p => {
            (p.tahapan || []).forEach((t: any) => {
                if (t.invoices && t.invoices.length > 0) {
                    t.invoices.forEach((inv: any) => {
                        result.push({
                            ...t,
                            namaProyek: p.namaProyek,
                            klien: p.klien,
                            pekerjaanId: p.id,
                            perkiraanInvoiceMasuk: inv.jatuhTempo,
                            jumlahTagihanInvoice: inv.nilaiInvoice,
                            statusPembayaran: inv.status || "Menunggu Bayar",
                        });
                    });
                } else if (t.jumlahTagihanInvoice) {
                    result.push({ ...t, namaProyek: p.namaProyek, klien: p.klien, pekerjaanId: p.id });
                }
            });
        });
        return result;
    }, [allPekerjaan, selectedYear, selectedJobType, filterStatus]);

    const totalTagihan = allInvoices.reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihLunas = allInvoices.filter(t => t.statusPembayaran === "lunas").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihBelumTagih = allInvoices.filter(t => t.statusPembayaran === "Belum Tagih").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihMenunggu = allInvoices.filter(t => !t.statusPembayaran || t.statusPembayaran === "Menunggu Bayar").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihOverdue = allInvoices.filter(t => t.statusPembayaran === "Terlambat Bayar").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);

    const statusProyek = [
        { name: "Berjalan", value: proyekBerjalan.length, statusFilter: "berjalan" },
        { name: "Persiapan", value: proyekPersiapan.length, statusFilter: "persiapan" },
        { name: "Selesai", value: filteredSelesai.length, statusFilter: "selesai" },
    ];

    const nonZeroSegments = statusProyek.filter(s => s.value > 0).length;

    const yearLabel = selectedYear === "all" ? "Semua Tahun" : selectedYear;

    const selectedProjects = useMemo(() => {
        if (!dialogStatus) return [];
        const pool = dialogStatus === "selesai" ? filteredSelesai : globalFilteredPekerjaan.filter((p: any) => p.status === dialogStatus);
        return [...pool].sort((a: any, b: any) => {
            const dateA = a.tanggalSelesai ? new Date(a.tanggalSelesai).getTime() : Infinity;
            const dateB = b.tanggalSelesai ? new Date(b.tanggalSelesai).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [dialogStatus, globalFilteredPekerjaan, filteredSelesai]);

    // Helper: hitung progress per proyek
    const getProgress = (p: any) =>
        p.tahapan && p.tahapan.length > 0 ? calculateWeightedProgress(p.tahapan) : (p.progress || 0);

    const summaryCards = [
        {
            title: "Total Proyeksi",
            value: formatCurrency(totalTagihan),
            sub: `${allInvoices.length} invoice`,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Belum Tagih",
            value: formatCurrency(tagihBelumTagih),
            sub: `${allInvoices.filter(t => t.statusPembayaran === "Belum Tagih").length} invoice`,
            icon: Clock,
            color: "text-gray-600",
            bg: "bg-gray-50",
        },
        {
            title: "Menunggu Bayar",
            value: formatCurrency(tagihMenunggu),
            sub: `${allInvoices.filter(t => !t.statusPembayaran || t.statusPembayaran === "Menunggu Bayar").length} invoice`,
            icon: Hourglass,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            title: "Terlambat Bayar",
            value: formatCurrency(tagihOverdue),
            sub: `${allInvoices.filter(t => t.statusPembayaran === "Terlambat Bayar").length} invoice`,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
        },
    ];

    const lunasCount = allInvoices.filter(t => t.statusPembayaran === "lunas").length;

    return (
        <div className="space-y-6">
            {/* Global Filter Bar */}
            <Card>
                <CardContent className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 mr-1">Filter:</span>

                        {/* Year selector — mandiri */}
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue placeholder="Semua Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun</SelectItem>
                                {availableYears.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Job type selector — mandiri */}
                        <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue placeholder="Semua Jenis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Jenis Pekerjaan</SelectItem>
                                {availableJobTypes.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status selector */}
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="berjalan">Berjalan</SelectItem>
                                <SelectItem value="persiapan">Persiapan</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Reset filter */}
                        {(selectedYear !== currentYear || selectedJobType !== "all" || filterStatus !== "all") && (
                            <button
                                onClick={() => { setSelectedYear(currentYear); setSelectedJobType("all"); setFilterStatus("all"); }}
                                className="ml-1 text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                            >
                                Reset filter
                            </button>
                        )}

                        <span className="ml-auto text-xs text-gray-400">
                            {globalFilteredPekerjaan.length} proyek
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row — 2 kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Proyek Pie Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Status Proyek {yearLabel}</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">Klik slice atau item untuk melihat daftar proyek</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Pie */}
                            <div className="w-full sm:w-1/2 flex-shrink-0">
                                {nonZeroSegments <= 1 ? (() => {
                                    const singleIdx = statusProyek.findIndex(s => s.value > 0);
                                    const single = singleIdx >= 0 ? statusProyek[singleIdx] : null;
                                    const singleColor = single ? COLORS[singleIdx] : "#E5E7EB";
                                    return (
                                        <div className="w-full flex items-center justify-center" style={{ height: 240 }}>
                                            <button
                                                onClick={() => single && setDialogStatus(single.statusFilter)}
                                                className="rounded-full flex items-center justify-center transition-opacity hover:opacity-90 focus:outline-none"
                                                style={{ width: 190, height: 190, backgroundColor: singleColor, cursor: single ? "pointer" : "default" }}
                                            >
                                                <div className="rounded-full bg-white flex flex-col items-center justify-center" style={{ width: 130, height: 130 }}>
                                                    {single ? (
                                                        <>
                                                            <span style={{ fontSize: 22, fontWeight: 700, color: singleColor }}>{single.value}</span>
                                                            <span style={{ fontSize: 12, color: "#6B7280" }}>{single.name}</span>
                                                            <span style={{ fontSize: 11, color: "#9CA3AF" }}>100%</span>
                                                        </>
                                                    ) : (
                                                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>Tidak ada data</span>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })() : (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie
                                                activeIndex={activeIndex}
                                                activeShape={renderActiveShape}
                                                data={statusProyek}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={0}
                                                dataKey="value"
                                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                                onClick={(data) => {
                                                    setDialogStatus(data.statusFilter);
                                                }}
                                                style={{ cursor: "pointer" }}
                                            >
                                                {statusProyek.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            {/* Legend */}
                            <div className="w-full sm:w-1/2 flex flex-col gap-2">
                                {statusProyek.map((s, idx) => (
                                    <button
                                        key={s.name}
                                        onClick={() => setDialogStatus(s.statusFilter)}
                                        className="flex items-center justify-between text-sm px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-gray-700 font-medium">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold" style={{ color: COLORS[idx % COLORS.length] }}>{s.value}</span>
                                            <span className="text-xs text-gray-400">proyek</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ringkasan Keuangan {yearLabel}</CardTitle>
                        <p className="text-xs text-gray-500">Overview nilai kontrak dan tagihan</p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {summaryCards.map((card, idx) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                                    >
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${card.bg}`}>
                                            <Icon className={`h-4 w-4 ${card.color}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-base font-bold leading-tight ${card.color}`}>
                                                {card.value}
                                            </div>
                                            <div className="text-xs font-medium text-gray-700 mt-0.5 leading-tight">{card.title}</div>
                                            <div className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{card.sub}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Terbayar (Lunas) — full width */}
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                            <div className="p-2 rounded-lg flex-shrink-0 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-base font-bold leading-tight text-green-600">
                                    {formatCurrency(tagihLunas)}
                                </div>
                                <div className="text-xs font-medium text-gray-700 mt-0.5 leading-tight">Terbayar (Lunas)</div>
                                <div className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{lunasCount} invoice lunas</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Statistics Section */}
            <JobStatistics pekerjaan={globalFilteredPekerjaan} hideCards hideFilterControls hideTitle />

            {/* View Detail Modal */}
            <PekerjaanViewModal
                item={viewItem}
                open={!!viewItem}
                onClose={() => setViewItem(null)}
            />

            {/* Detail Proyek Modal */}
            <Dialog open={!!dialogStatus} onOpenChange={() => setDialogStatus(null)}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: dialogStatus === "berjalan" ? COLORS[0] : dialogStatus === "persiapan" ? COLORS[1] : COLORS[2]
                                }}
                            />
                            Proyek {dialogStatus === "berjalan" ? "Berjalan" : dialogStatus === "persiapan" ? "Persiapan" : "Selesai"}
                            <span className="text-sm font-normal text-gray-500">
                                ({selectedProjects.length} proyek)
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        {selectedProjects.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">Tidak ada proyek</div>
                        ) : (
                            selectedProjects.map((p: any) => {
                                const progress = p.tahapan && p.tahapan.length > 0
                                    ? calculateWeightedProgress(p.tahapan)
                                    : (p.progress || 0);
                                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG["berjalan"];
                                const totalInvoice = (p.tahapan || []).flatMap((t: any) => t.invoices?.length ? t.invoices : [t]).filter((i: any) => (i.status || i.statusPembayaran) === 'lunas').reduce((sum: number, i: any) => sum + (i.nilaiInvoice || i.jumlahTagihanInvoice || 0), 0);

                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const projectDeadline = p.tanggalSelesai ? new Date(p.tanggalSelesai) : null;
                                if (projectDeadline) projectDeadline.setHours(0, 0, 0, 0);
                                const isProjectOverdue = projectDeadline && projectDeadline < today && p.status !== 'selesai';
                                const daysOverdue = isProjectOverdue ? Math.ceil((today.getTime() - projectDeadline!.getTime()) / (1000 * 60 * 60 * 24)) : 0;

                                return (
                                    <div key={p.id} className={`border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow ${isProjectOverdue ? 'border-red-300 bg-red-50/30' : ''}`}>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{p.namaProyek}</h4>
                                                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusCfg.badgeClass}`}>
                                                        {statusCfg.label}
                                                    </Badge>
                                                    {isProjectOverdue && (
                                                        <Badge className="text-[10px] flex-shrink-0 bg-red-100 text-red-700 border-red-300 hover:bg-red-100">
                                                            <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                                            Terlambat {daysOverdue}h
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{p.klien} · {p.nomorKontrak}</div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <div className="text-sm font-bold text-emerald-700">{formatCurrency(p.nilaiKontrak)}</div>
                                                <div className="text-[11px] text-gray-400">Nilai Kontrak</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Progress</span>
                                                <span className="font-medium text-gray-700">{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-900 mb-0.5">Tahapan</div>
                                                <div className="font-semibold text-gray-600">
                                                    {(p.tahapan || []).filter((t: any) => t.status === "done").length} / {(p.tahapan || []).length}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-400 mb-0.5">Invoice Terbayar</div>
                                                <div className="font-semibold text-green-600">{formatCurrency(totalInvoice)}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-400 mb-0.5">Deadline</div>
                                                <div className="font-semibold text-gray-700">{formatDate(p.tanggalSelesai)}</div>
                                            </div>
                                        </div>

                                        {/* View Button */}
                                        <div className="mt-3 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    setDialogStatus(null);
                                                    setViewItem(p);
                                                }}
                                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Lihat Detail
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
