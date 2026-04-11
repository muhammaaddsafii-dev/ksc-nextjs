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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
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
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedProgressRange, setSelectedProgressRange] = useState<{ label: string; projects: any[] } | null>(null);
    const [pieChartYear, setPieChartYear] = useState<string>("all");

    const docsExpiring = legalitas.filter((l) => l.reminder && isExpiringSoon(l.tanggalBerlaku)).length;
    const proyekBerjalan = pekerjaan.filter((p) => p.status === "berjalan");
    const proyekPersiapan = pekerjaan.filter((p) => p.status === "persiapan");
    const proyekSelesai = pekerjaan.filter((p) => p.status === "selesai" || p.status === "serah_terima");

    const totalNilaiKontrak = pekerjaan.reduce((sum, p) => sum + (p.nilaiKontrak || 0), 0);
    const totalNilaiBerjalan = proyekBerjalan.reduce((sum, p) => sum + (p.nilaiKontrak || 0), 0);
    const totalArsip = arsipPekerjaan.length;

    // Computed available years for Pie Chart Filter
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        [...pekerjaan, ...arsipPekerjaan].forEach(p => {
            if (p.tanggalMulai) {
                years.add(new Date(p.tanggalMulai).getFullYear().toString());
            } else if (p.createdAt) {
                years.add(new Date(p.createdAt).getFullYear().toString());
            }
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [pekerjaan, arsipPekerjaan]);

    const filteredPekerjaanForPie = useMemo(() => {
        if (pieChartYear === "all") return pekerjaan;
        return pekerjaan.filter(p => {
            const yMulai = p.tanggalMulai ? new Date(p.tanggalMulai).getFullYear().toString() : (p.createdAt ? new Date(p.createdAt).getFullYear().toString() : null);
            return yMulai === pieChartYear;
        });
    }, [pekerjaan, pieChartYear]);

    const filteredArsipForPie = useMemo(() => {
        if (pieChartYear === "all") return arsipPekerjaan;
        return arsipPekerjaan.filter(p => {
            const yMulai = p.tanggalMulai ? new Date(p.tanggalMulai).getFullYear().toString() : (p.createdAt ? new Date(p.createdAt).getFullYear().toString() : null);
            return yMulai === pieChartYear;
        });
    }, [arsipPekerjaan, pieChartYear]);

    const proyekBerjalanPie = filteredPekerjaanForPie.filter((p) => p.status === "berjalan");
    const proyekPersiapanPie = filteredPekerjaanForPie.filter((p) => p.status === "persiapan");
    const proyekSelesaiPie = filteredPekerjaanForPie.filter((p) => p.status === "selesai" || p.status === "serah_terima");

    // All invoices across pekerjaan
    const allInvoices = useMemo(() => {
        let result: any[] = [];
        pekerjaan.forEach(p => {
            (p.tahapan || []).forEach((t: any) => {
                if (t.jumlahTagihanInvoice) {
                    result.push({ ...t, namaProyek: p.namaProyek, klien: p.klien, pekerjaanId: p.id });
                }
            });
        });
        return result;
    }, [pekerjaan]);

    const totalTagihan = allInvoices.reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihLunas = allInvoices.filter(t => t.statusPembayaran === "lunas").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);
    const tagihPending = allInvoices.filter(t => t.statusPembayaran !== "lunas").reduce((sum, t) => sum + (t.jumlahTagihanInvoice || 0), 0);

    const statusProyek = [
        { name: "Berjalan", value: proyekBerjalanPie.length, statusFilter: "berjalan" },
        { name: "Persiapan", value: proyekPersiapanPie.length, statusFilter: "persiapan" },
        { name: "Selesai/Serah Terima", value: proyekSelesaiPie.length + filteredArsipForPie.length, statusFilter: "selesai" },
    ];

    const selectedProjects = useMemo(() => {
        if (!selectedStatus) return [];

        let sourceData = filteredPekerjaanForPie;
        if (selectedStatus === "selesai") {
            const mappedArsip = filteredArsipForPie.map((a: any) => ({ ...a, status: a.status || "selesai" }));
            sourceData = [...filteredPekerjaanForPie, ...mappedArsip];
        }

        return sourceData
            .filter((p: any) => {
                if (selectedStatus === "selesai") return p.status === "selesai" || p.status === "serah_terima";
                return p.status === selectedStatus;
            })
            .sort((a: any, b: any) => {
                const dateA = a.tanggalSelesai ? new Date(a.tanggalSelesai).getTime() : Infinity;
                const dateB = b.tanggalSelesai ? new Date(b.tanggalSelesai).getTime() : Infinity;
                return dateA - dateB;
            });
    }, [selectedStatus, filteredPekerjaanForPie, filteredArsipForPie]);

    // Distribusi progress per range 10%
    const progressDistribution = useMemo(() => {
        const ranges = [
            { label: '0-10', min: 0, max: 10 },
            { label: '10-20', min: 10, max: 20 },
            { label: '20-30', min: 20, max: 30 },
            { label: '30-40', min: 30, max: 40 },
            { label: '40-50', min: 40, max: 50 },
            { label: '50-60', min: 50, max: 60 },
            { label: '60-70', min: 60, max: 70 },
            { label: '70-80', min: 70, max: 80 },
            { label: '80-90', min: 80, max: 90 },
            { label: '90-100', min: 90, max: 100 },
        ];
        return ranges.map(r => ({
            label: r.label,
            jumlah: pekerjaan.filter(p => {
                const prog = p.tahapan && p.tahapan.length > 0
                    ? calculateWeightedProgress(p.tahapan)
                    : (p.progress || 0);
                return prog >= r.min && (r.max === 100 ? prog <= 100 : prog < r.max);
            }).length,
        }));
    }, [pekerjaan]);

    // Helper: hitung progress per proyek
    const getProgress = (p: any) =>
        p.tahapan && p.tahapan.length > 0 ? calculateWeightedProgress(p.tahapan) : (p.progress || 0);

    // Klik bar chart → tampilkan proyek di range tersebut
    const handleBarClick = (data: any) => {
        if (!data) return;
        // data langsung berisi { label, jumlah } dari entry bar yang diklik
        const [min, max] = data.label.split('-').map(Number);
        const filtered = pekerjaan.filter(p => {
            const prog = getProgress(p);
            return prog >= min && (max === 100 ? prog <= 100 : prog < max);
        }).sort((a, b) => getProgress(b) - getProgress(a));
        setSelectedProgressRange({ label: data.label, projects: filtered });
    };

    const summaryCards = [
        {
            title: "Seluruh Proyek Berjalan",
            value: pekerjaan.length.toString(),
            sub: `${proyekBerjalan.length} berjalan · ${proyekPersiapan.length} persiapan`,
            icon: Briefcase,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Total Nilai Kontrak Berjalan",
            value: formatCurrency(totalNilaiKontrak),
            // sub: `${formatCurrency(totalNilaiBerjalan)} sedang berjalan`,
            sub: `${formatCurrency(totalNilaiKontrak)} sedang berjalan`,
            icon: Banknote,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            title: "Total Tagihan",
            value: formatCurrency(totalTagihan),
            sub: `Lunas: ${formatCurrency(tagihLunas)}`,
            icon: FileText,
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
        {
            title: "Tagihan Belum Cair",
            value: formatCurrency(tagihPending),
            sub: `${allInvoices.filter(t => t.statusPembayaran !== "lunas").length} invoice pending`,
            icon: Hourglass,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            title: "Total Terbayar",
            value: formatCurrency(tagihLunas),
            sub: `Lunas: ${formatCurrency(tagihLunas)}`,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {summaryCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <Card key={idx} className="hover:shadow-md transition-shadow">
                            <CardContent className="pt-4 pb-4 px-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-1.5 rounded-lg ${card.bg}`}>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </div>
                                <div className={`text-lg font-bold leading-tight ${card.color}`}>
                                    {card.value}
                                </div>
                                <div className="text-xs font-medium text-gray-700 mt-1">{card.title}</div>
                                <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">{card.sub}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Row — 2 kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Status Proyek Pie Chart */}
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base">Status Proyek</CardTitle>
                            <p className="text-xs text-gray-500 mt-1">Klik slice atau item untuk melihat daftar proyek</p>
                        </div>
                        <Select value={pieChartYear} onValueChange={setPieChartYear}>
                            <SelectTrigger className="w-[120px] h-8 text-xs bg-white">
                                <SelectValue placeholder="Semua Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun</SelectItem>
                                {availableYears.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                                setSelectedStatus(data.statusFilter);
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
                                        onClick={() => setSelectedStatus(s.statusFilter)}
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

                {/* Distribusi Progress Bar Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Distribusi Progress Proyek</CardTitle>
                        <p className="text-xs text-gray-500">Jumlah proyek per range persentase progress</p>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={progressDistribution}
                                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #f0f0f0',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                    }}
                                    formatter={(value: any) => [`${value} proyek`, 'Jumlah']}
                                    labelFormatter={(label) => `Progress ${label}%`}
                                />
                                <Bar
                                    dataKey="jumlah"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                    onClick={handleBarClick}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {progressDistribution.map((entry, index) => (
                                        <Cell
                                            key={`bar-${index}`}
                                            fill={
                                                entry.label === '90-100' ? '#10B981' :
                                                    entry.label === '80-90' ? '#34D399' :
                                                        entry.label === '70-80' ? '#6EE7B7' :
                                                            entry.label === '0-10' || entry.label === '10-20' ? '#F59E0B' :
                                                                '#3B82F6'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        {/* Legend warna */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />0–20% (persiapan)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />20–70% (berjalan)</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />70–100% (mendekati selesai)</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Statistics Section */}
            <JobStatistics pekerjaan={pekerjaan} />

            {/* Detail Proyek Modal */}
            <Dialog open={!!selectedStatus} onOpenChange={() => setSelectedStatus(null)}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: selectedStatus === "berjalan" ? COLORS[0] :
                                        selectedStatus === "persiapan" ? COLORS[1] : COLORS[2]
                                }}
                            />
                            Proyek {selectedStatus === "selesai" ? "Selesai / Serah Terima" :
                                selectedStatus === "berjalan" ? "Berjalan" : "Persiapan"}
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

            {/* Dialog popup — klik bar chart distribusi progress */}
            <Dialog open={!!selectedProgressRange} onOpenChange={() => setSelectedProgressRange(null)}>
                <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
                            Proyek dengan Progress {selectedProgressRange?.label}%
                            <span className="text-sm font-normal text-gray-500">
                                ({selectedProgressRange?.projects.length ?? 0} proyek)
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        {selectedProgressRange?.projects.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">Tidak ada proyek di range ini</div>
                        ) : (
                            selectedProgressRange?.projects.map((p: any) => {
                                const prog = getProgress(p);
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
                                                <span className="font-medium text-gray-700">{prog}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                                                    style={{ width: `${prog}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Info Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-400 mb-0.5">Tahapan</div>
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
