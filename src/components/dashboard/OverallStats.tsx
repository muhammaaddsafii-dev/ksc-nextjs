"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { JobStatistics } from "@/components/JobStatistics";
import {
    formatDate,
    isExpiringSoon,
} from "@/lib/helpers";

const COLORS = [
    "hsl(221, 83%, 53%)",
    "hsl(173, 58%, 39%)",
    "hsl(38, 92%, 50%)",
    "hsl(142, 76%, 36%)",
    "hsl(0, 84%, 60%)",
];

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

    const docsExpiring = legalitas.filter((l) => l.reminder && isExpiringSoon(l.tanggalBerlaku)).length;
    const proyekBerjalan = pekerjaan.filter((p) => p.status === "berjalan").length;

    const overallChartData = useMemo(() => {
        return [
            { name: "Jan", nilai: 2500 },
            { name: "Feb", nilai: 4500 },
            { name: "Mar", nilai: 3200 },
            { name: "Apr", nilai: 6800 },
            { name: "Mei", nilai: 5400 },
            { name: "Jun", nilai: 7200 },
        ];
    }, []);

    const statusProyek = [
        { name: "Berjalan", value: proyekBerjalan },
        {
            name: "Penawaran",
            value: pekerjaan.filter((p) => p.status === "persiapan").length || 10,
        },
        {
            name: "Selesai",
            value: pekerjaan.filter((p) => p.status === "selesai").length || 50,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {docsExpiring > 0 && (
                <Card className="border-warning">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-warning">
                            <AlertTriangle className="h-5 w-5" />
                            Peringatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {legalitas
                                .filter((l) => l.reminder && isExpiringSoon(l.tanggalBerlaku))
                                .map((l) => (
                                    <div
                                        key={l.id}
                                        className="flex items-center justify-between p-2 rounded bg-warning/10"
                                    >
                                        <span className="text-sm">{l.namaDokumen}</span>
                                        <span className="text-sm text-muted-foreground">
                                            Berakhir: {formatDate(l.tanggalBerlaku)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Nilai Kontrak Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Nilai Kontrak per Bulan (Juta Rupiah)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={overallChartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="name" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey="nilai" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Proyeksi Detail Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg">Detail Proyeksi</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExportProyeksi}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusProyek}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {statusProyek.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Job Statistics Section */}
            <JobStatistics arsipPekerjaan={arsipPekerjaan} />
        </div>
    );
}
