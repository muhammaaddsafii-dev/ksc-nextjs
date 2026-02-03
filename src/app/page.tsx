"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { JobStatistics } from "@/components/JobStatistics";
import {
  formatCurrency,
  formatDate,
  isExpiringSoon,
  formatCurrencyShort,
} from "@/lib/helpers";
import {
  Briefcase,
  FileText,
  TrendingUp,
  Users,
  Wrench,
  AlertTriangle,
} from "lucide-react";
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
  LineChart,
  Line,
} from "recharts";
import { usePraKontrakStore } from "@/stores/praKontrakStore";
import { useLelangStore } from "@/stores/lelangStore";
import { usePekerjaanStore } from "@/stores/pekerjaanStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useAlatStore } from "@/stores/alatStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { useArsipStore } from "@/stores/arsipStore";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(173, 58%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
];

export default function Dashboard() {
  const { items: praKontrak, fetchItems: fetchPraKontrak } =
    usePraKontrakStore();
  const { items: lelang, fetchItems: fetchLelang } = useLelangStore();
  const { items: pekerjaan, fetchItems: fetchPekerjaan } = usePekerjaanStore();
  const { items: tenagaAhli, fetchItems: fetchTenagaAhli } =
    useTenagaAhliStore();
  const { items: alat, fetchItems: fetchAlat } = useAlatStore();
  const { items: legalitas, fetchItems: fetchLegalitas } = useLegalitasStore();
  const { items: arsipPekerjaan, fetchItems: fetchArsip } = useArsipStore();

  useEffect(() => {
    fetchPraKontrak();
    fetchLelang();
    fetchPekerjaan();
    fetchTenagaAhli();
    fetchAlat();
    fetchLegalitas();
    fetchArsip();
  }, []);

  // Calculate stats
  const totalNilaiKontrak = pekerjaan.reduce(
    (sum, p) => sum + p.nilaiKontrak,
    0
  );
  const proyekBerjalan = pekerjaan.filter(
    (p) => p.status === "berjalan"
  ).length;
  const tenagaAhliTersedia = tenagaAhli.filter(
    (t) => t.status === "tersedia"
  ).length;
  const alatTersedia = alat.filter((a) => a.status === "Tersedia").length;
  const lelangMenang = lelang.filter((l) => l.status === "menang").length;
  const docsExpiring = legalitas.filter(
    (l) => l.reminder && isExpiringSoon(l.tanggalBerlaku)
  ).length;

  // Chart data
  const kontrakByMonth = [
    { name: "Jan", nilai: 2500 },
    { name: "Feb", nilai: 4500 },
    { name: "Mar", nilai: 3200 },
    { name: "Apr", nilai: 6800 },
    { name: "Mei", nilai: 5400 },
    { name: "Jun", nilai: 7200 },
  ];

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

  const progressData = [
    { name: "Minggu 1", progress: 20 },
    { name: "Minggu 2", progress: 35 },
    { name: "Minggu 3", progress: 48 },
    { name: "Minggu 4", progress: 65 },
  ];

  return (
    <MainLayout title="Dashboard">
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
                <BarChart data={kontrakByMonth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="nilai"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Proyek</CardTitle>
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
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Job Statistics Section - Using Arsip */}
        <JobStatistics arsipPekerjaan={arsipPekerjaan} />
      </div>
    </MainLayout>
  );
}
