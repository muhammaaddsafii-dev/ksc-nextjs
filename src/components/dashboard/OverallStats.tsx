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
    arsipPekerjaan: any[];
    handleExportProyeksi: () => void;
}

export function OverallStats({
    legalitas,
    pekerjaan,
    arsipPekerjaan,
    handleExportProyeksi
}: OverallStatsProps) {

    const [activeIndex, setActiveIndex] = useState(0);
    const [dialogStatus, setDialogStatus] = useState<string | null>(null); // untuk dialog detail proyek

    // Shared global filter state — independen, bisa dikombo
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [selectedJobType, setSelectedJobType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const docsExpiring = legalitas.filter((l) => l.reminder && isExpiringSoon(l.tanggalBerlaku)).length;

    // Available years dari semua data
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        [...pekerjaan, ...arsipPekerjaan].forEach(p => {
            if (p.tanggalMulai) years.add(new Date(p.tanggalMulai).getFullYear().toString());
            else if (p.createdAt) years.add(new Date(p.createdAt).getFullYear().toString());
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [pekerjaan, arsipPekerjaan]);

    // Available job types dari pekerjaan + arsip
    const availableJobTypes = useMemo(() => {
        const types = new Set<string>();
        [...pekerjaan, ...arsipPekerjaan].forEach(p => { if (p.jenisPekerjaan) types.add(p.jenisPekerjaan); });
        return Array.from(types).sort();
    }, [pekerjaan, arsipPekerjaan]);

    // Global filtered pekerjaan — hanya proyek aktif (berjalan/persiapan)
    // Pekerjaan selesai sudah pindah ke arsip, jadi status filter tidak perlu opsi selesai
    const globalFilteredPekerjaan = useMemo(() => {
        let filtered = pekerjaan;
        if (selectedYear !== "all") {
            filtered = filtered.filter(p => {
                const y = p.tanggalMulai ? new Date(p.tanggalMulai).getFullYear().toString()
                    : p.createdAt ? new Date(p.createdAt).getFullYear().toString() : null;
                return y === selectedYear;
            });
        }
        if (selectedJobType !== "all") {
            filtered = filtered.filter(p => p.jenisPekerjaan === selectedJobType);
        }
        if (filterStatus !== "all") {
            filtered = filtered.filter(p => p.status === filterStatus);
        }
        return filtered;
    }, [pekerjaan, selectedYear, selectedJobType, filterStatus]);

    // Global filtered arsip — proyek selesai/serah terima
    const globalFilteredArsip = useMemo(() => {
        let filtered = arsipPekerjaan;
        if (selectedYear !== "all") {
            filtered = filtered.filter(p => {
                const y = p.tanggalMulai ? new Date(p.tanggalMulai).getFullYear().toString()
                    : p.tanggalSelesai ? new Date(p.tanggalSelesai).getFullYear().toString()
                        : p.createdAt ? new Date(p.createdAt).getFullYear().toString() : null;
                return y === selectedYear;
            });
        }
        if (selectedJobType !== "all") {
            filtered = filtered.filter(p => p.jenisPekerjaan === selectedJobType);
        }
        // Arsip tidak perlu filter status karena semuanya selesai
        return filtered;
    }, [arsipPekerjaan, selectedYear, selectedJobType]);

    // Derived counts dari filtered pekerjaan aktif
    const proyekBerjalan = globalFilteredPekerjaan.filter(p => p.status === "berjalan");
    const proyekPersiapan = globalFilteredPekerjaan.filter(p => p.status === "persiapan");

    // Pie chart: berjalan/persiapan dari pekerjaan, selesai dari arsip
    const proyekBerjalanPie = proyekBerjalan;
    const proyekPersiapanPie = proyekPersiapan;

    const totalNilaiKontrak = globalFilteredPekerjaan.reduce((sum, p) => sum + (p.nilaiKontrak || 0), 0);

    // All invoices dari filtered pekerjaan
    const allInvoices = useMemo(() => {
        let result: any[] = [];
        globalFilteredPekerjaan.forEach(p => {
            (p.tahapan || []).forEach((t: any) => {
                if (t.jumlahTagihanInvoice) {
                    result.push({ ...t, namaProyek: p.namaProyek, klien: p.klien, pekerjaanId: p.id });
                }
            });
        });
        return result;
    }, [globalFilteredPekerjaan]);

    const totalTagihan = allInvoices.reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihLunas = allInvoices.filter(t => t.statusPembayaran === "lunas").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihPending = allInvoices.filter(t => t.statusPembayaran !== "lunas").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);

    const statusProyek = [
        { name: "Berjalan", value: proyekBerjalanPie.length, statusFilter: "berjalan" },
        { name: "Persiapan", value: proyekPersiapanPie.length, statusFilter: "persiapan" },
        // Selesai/Serah Terima hanya dari arsip pekerjaan
        { name: "Selesai / Serah Terima", value: globalFilteredArsip.length, statusFilter: "selesai" },
    ];

    const selectedProjects = useMemo(() => {
        if (!dialogStatus) return [];

        if (dialogStatus === "selesai") {
            // Selesai/Serah Terima: hanya dari arsip
            return globalFilteredArsip
                .map((a: any) => ({ ...a, status: a.status || "selesai" }))
                .sort((a: any, b: any) => {
                    const dateA = a.tanggalSelesai ? new Date(a.tanggalSelesai).getTime() : Infinity;
                    const dateB = b.tanggalSelesai ? new Date(b.tanggalSelesai).getTime() : Infinity;
                    return dateA - dateB;
                });
        }

        return globalFilteredPekerjaan
            .filter((p: any) => p.status === dialogStatus)
            .sort((a: any, b: any) => {
                const dateA = a.tanggalSelesai ? new Date(a.tanggalSelesai).getTime() : Infinity;
                const dateB = b.tanggalSelesai ? new Date(b.tanggalSelesai).getTime() : Infinity;
                return dateA - dateB;
            });
    }, [dialogStatus, globalFilteredPekerjaan, globalFilteredArsip]);

    // Helper: hitung progress per proyek
    const getProgress = (p: any) =>
        p.tahapan && p.tahapan.length > 0 ? calculateWeightedProgress(p.tahapan) : (p.progress || 0);

    const summaryCards = [
        {
            title: "Seluruh Proyek",
            value: globalFilteredPekerjaan.length.toString(),
            sub: `${proyekBerjalan.length} berjalan · ${proyekPersiapan.length} persiapan`,
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Total Nilai Kontrak",
            value: formatCurrency(totalNilaiKontrak),
            sub: `${globalFilteredPekerjaan.length} proyek`,
            icon: Banknote,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Total Rencana Tagihan",
            value: formatCurrency(totalTagihan),
            sub: `Lunas: ${formatCurrency(tagihLunas)}`,
            icon: FileText,
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
        {
            title: "Total Belum Terbayar",
            value: formatCurrency(tagihPending),
            sub: `${allInvoices.filter(t => t.statusPembayaran !== "lunas").length} invoice pending`,
            icon: Hourglass,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            title: "Total Terbayar",
            value: formatCurrency(tagihLunas),
            sub: `${allInvoices.filter(t => t.statusPembayaran === "lunas").length} invoice lunas`,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
        },
    ];

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
                                <SelectItem value="all">Semua Jenis</SelectItem>
                                {availableJobTypes.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status selector — hanya untuk proyek aktif (berjalan/persiapan) */}
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="berjalan">Berjalan</SelectItem>
                                <SelectItem value="persiapan">Persiapan</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Reset filter */}
                        {(selectedYear !== "all" || selectedJobType !== "all" || filterStatus !== "all") && (
                            <button
                                onClick={() => { setSelectedYear("all"); setSelectedJobType("all"); setFilterStatus("all"); }}
                                className="ml-1 text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                            >
                                Reset filter
                            </button>
                        )}

                        <span className="ml-auto text-xs text-gray-400">
                            {globalFilteredPekerjaan.length} aktif · {globalFilteredArsip.length} arsip
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row — 2 kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Proyek Pie Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Status Proyek</CardTitle>
                        <p className="text-xs text-gray-500 mt-1">Klik slice atau item untuk melihat daftar proyek</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Pie */}
                            <div className="w-full sm:w-1/2 flex-shrink-0">
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
                                            paddingAngle={4}
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
                        <CardTitle className="text-base">Ringkasan Keuangan & Proyek</CardTitle>
                        <p className="text-xs text-gray-500">Overview nilai kontrak dan tagihan</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    </CardContent>
                </Card>
            </div>

            {/* Job Statistics Section */}
            <JobStatistics pekerjaan={globalFilteredPekerjaan} hideCards hideFilterControls hideTitle />

            {/* Detail Proyek Modal */}
            <Dialog open={!!dialogStatus} onOpenChange={() => setDialogStatus(null)}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: dialogStatus === "berjalan" ? COLORS[0] :
                                        dialogStatus === "persiapan" ? COLORS[1] : COLORS[2]
                                }}
                            />
                            Proyek {dialogStatus === "selesai" ? "Selesai / Serah Terima" :
                                dialogStatus === "berjalan" ? "Berjalan" : "Persiapan"}
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
                                const totalInvoice = (p.tahapan || []).reduce((sum: number, t: any) => sum + (t.jumlahTagihanInvoice || 0), 0);

                                return (
                                    <div key={p.id} className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">{p.namaProyek}</h4>
                                                    <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusCfg.badgeClass}`}>
                                                        {statusCfg.label}
                                                    </Badge>
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
                                                <div className="text-gray-400 mb-0.5">Total Invoice</div>
                                                <div className="font-semibold text-blue-600">{formatCurrency(totalInvoice)}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-400 mb-0.5">Deadline</div>
                                                <div className="font-semibold text-gray-700">{formatDate(p.tanggalSelesai)}</div>
                                            </div>
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
