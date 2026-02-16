"use client";

import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatistics } from "@/components/JobStatistics";
import {
  formatCurrency,
  formatDate,
  isExpiringSoon,
} from "@/lib/helpers";
import {
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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
import { usePraKontrakStore } from "@/stores/praKontrakStore";
import { useLelangStore } from "@/stores/lelangStore";
import { usePekerjaanStore } from "@/stores/pekerjaanStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useAlatStore } from "@/stores/alatStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { useArsipStore } from "@/stores/arsipStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(173, 58%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
];

const JENIS_PEKERJAAN_OPTIONS = ['PEPC', 'ANTAM', 'PHR', 'AMDAL', 'PPKH'];

export default function Dashboard() {
  const { items: praKontrak, fetchItems: fetchPraKontrak } = usePraKontrakStore();
  const { items: lelang, fetchItems: fetchLelang } = useLelangStore();
  const { items: pekerjaan, fetchItems: fetchPekerjaan } = usePekerjaanStore();
  const { items: tenagaAhli, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: alat, fetchItems: fetchAlat } = useAlatStore();
  const { items: legalitas, fetchItems: fetchLegalitas } = useLegalitasStore();
  const { items: arsipPekerjaan, fetchItems: fetchArsip } = useArsipStore();

  const [activeTab, setActiveTab] = useState("overall");

  // Sorting & Filtering States

  const [trackingSortBy, setTrackingSortBy] = useState("tanggal_asc");
  const [filterJenis, setFilterJenis] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [trackingYear, setTrackingYear] = useState("all");
  const [trackingMonth, setTrackingMonth] = useState("all");

  const [proyeksiYear, setProyeksiYear] = useState("2026");
  const [proyeksiJenis, setProyeksiJenis] = useState("all");
  const [proyeksiStatus, setProyeksiStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [rekapYear, setRekapYear] = useState("2026");
  const [rekapMonth, setRekapMonth] = useState("all");
  const [rekapJenis, setRekapJenis] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [trackingPage, setTrackingPage] = useState(1);

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
  const proyekBerjalan = pekerjaan.filter((p) => p.status === "berjalan").length;
  const docsExpiring = legalitas.filter((l) => l.reminder && isExpiringSoon(l.tanggalBerlaku)).length;

  // Chart data
  const kontrakByMonth = useMemo(() => {
    // Aggregate real data if possible, else dummy
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

  // Data Processing for Tabs
  const trackingInvoiceData = useMemo(() => {
    // 1. Base Data: Include both realized (tanggalInvoice) and projected (perkiraanInvoiceMasuk)
    let data = pekerjaan.flatMap(p =>
      (p.tahapan || []).filter(t => t.jumlahTagihanInvoice || t.tanggalInvoice || t.perkiraanInvoiceMasuk).map(t => ({
        ...t,
        idProyek: p.id,
        namaProyek: p.namaProyek,
        jenisPekerjaan: p.jenisPekerjaan,
        klien: p.klien,
        statusPembayaran: t.statusPembayaran || 'pending',
        // Determine effective date for sorting/filtering
        effectiveDate: t.tanggalInvoice || t.perkiraanInvoiceMasuk
      }))
    );

    // 2. Filter by Year
    if (trackingYear !== 'all') {
      data = data.filter(item => {
        if (!item.effectiveDate) return false;
        return new Date(item.effectiveDate).getFullYear().toString() === trackingYear;
      });
    }

    // 3. Filter by Month
    if (trackingMonth !== 'all') {
      data = data.filter(item => {
        if (!item.effectiveDate) return false;
        return new Date(item.effectiveDate).getMonth() === parseInt(trackingMonth);
      });
    }

    // 4. Filter by Jenis
    if (filterJenis !== 'all') {
      data = data.filter(item => item.jenisPekerjaan === filterJenis);
    }

    // 5. Filter by Status
    if (filterStatus !== 'all') {
      data = data.filter(item => item.statusPembayaran === filterStatus);
    }

    // 6. Sorting
    data.sort((a, b) => {
      if (trackingSortBy === 'jenis') {
        return (a.jenisPekerjaan || '').localeCompare(b.jenisPekerjaan || '');
      } else if (trackingSortBy === 'status') {
        return (a.statusPembayaran).localeCompare(b.statusPembayaran);
      } else if (trackingSortBy === 'tanggal_asc') {
        return new Date(a.effectiveDate || 0).getTime() - new Date(b.effectiveDate || 0).getTime();
      }
      return 0;
    });

    return data;
  }, [pekerjaan, trackingSortBy, filterJenis, filterStatus, trackingYear, trackingMonth]);

  const trackingStats = useMemo(() => {
    const totalCount = trackingInvoiceData.length;
    const lunasCount = trackingInvoiceData.filter(i => i.statusPembayaran === 'lunas').length;
    const pendingCount = trackingInvoiceData.filter(i => i.statusPembayaran === 'pending').length;
    const overdueCount = trackingInvoiceData.filter(i => i.statusPembayaran === 'overdue').length;

    return { totalCount, lunasCount, pendingCount, overdueCount };
  }, [trackingInvoiceData]);

  const proyeksiPemasukanData = useMemo(() => {
    let data = pekerjaan.flatMap(p =>
      (p.tahapan || []).filter(t => t.perkiraanInvoiceMasuk || t.tanggalInvoice).map(t => ({
        ...t,
        idProyek: p.id,
        namaProyek: p.namaProyek,
        jenisPekerjaan: p.jenisPekerjaan,
        klien: p.klien,
        statusPembayaran: t.statusPembayaran || 'pending'
      }))
    );

    // Filter by Year
    data = data.filter(item => {
      const dateStr = item.perkiraanInvoiceMasuk || item.tanggalInvoice;
      const date = dateStr ? new Date(dateStr) : null;
      return date && date.getFullYear().toString() === proyeksiYear;
    });

    // Filter by Jenis Pekerjaan
    if (proyeksiJenis !== 'all') {
      data = data.filter(item => item.jenisPekerjaan === proyeksiJenis);
    }

    // Filter by Status
    if (proyeksiStatus !== 'all') {
      data = data.filter(item => item.statusPembayaran === proyeksiStatus);
    }

    // Sorting - Always by Date ASC
    data.sort((a, b) => {
      const dateA = a.perkiraanInvoiceMasuk || a.tanggalInvoice || 0;
      const dateB = b.perkiraanInvoiceMasuk || b.tanggalInvoice || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return data;
  }, [pekerjaan, proyeksiYear, proyeksiJenis, proyeksiStatus]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [proyeksiYear, proyeksiJenis, proyeksiStatus]);

  useEffect(() => {
    setTrackingPage(1);
  }, [trackingYear, trackingMonth, filterJenis, filterStatus]);

  const totalPages = Math.ceil(proyeksiPemasukanData.length / itemsPerPage);

  const totalTrackingPages = Math.ceil(trackingInvoiceData.length / itemsPerPage);
  const currentTrackingData = trackingInvoiceData.slice(
    (trackingPage - 1) * itemsPerPage,
    trackingPage * itemsPerPage
  );
  const currentTableData = proyeksiPemasukanData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const rekapTagihanData = useMemo(() => {
    // Filter data by selected year (based on Invoice Date OR Unpaid Projection)
    let filteredData = pekerjaan.flatMap(p =>
      (p.tahapan || []).filter(t => {
        if (t.statusPembayaran === 'lunas') return false;

        // Use realized invoice date if available, otherwise use projection date
        const dateStr = t.tanggalInvoice || t.perkiraanInvoiceMasuk;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return date.getFullYear().toString() === rekapYear;
      }).map(t => ({
        ...t,
        idProyek: p.id,
        namaProyek: p.namaProyek,
        jenisPekerjaan: p.jenisPekerjaan,
        klien: p.klien,
        statusPembayaran: t.statusPembayaran || 'pending'
      }))
    );

    // Filter by Jenis Pekerjaan
    if (rekapJenis !== 'all') {
      filteredData = filteredData.filter(item => item.jenisPekerjaan === rekapJenis);
    }

    // Filter by Month
    if (rekapMonth !== 'all') {
      filteredData = filteredData.filter(item => {
        const dateStr = item.tanggalInvoice || item.perkiraanInvoiceMasuk;
        if (!dateStr) return false;
        return new Date(dateStr).getMonth() === parseInt(rekapMonth);
      });
    }

    const totalTagihan = filteredData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const totalLunas = filteredData.filter(i => i.statusPembayaran === 'lunas').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const totalPending = filteredData.filter(i => i.statusPembayaran === 'pending').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const totalOverdue = filteredData.filter(i => i.statusPembayaran === 'overdue').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);

    return {
      totalTagihan,
      totalLunas,
      totalPending,
      totalOverdue,
      details: filteredData
    };
  }, [pekerjaan, rekapYear, rekapJenis, rekapMonth]);

  // Aggregate Proyeksi per Month for Chart
  const proyeksiChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, lunas: 0, pending: 0, overdue: 0 }));

    proyeksiPemasukanData.forEach(item => {
      const date = item.perkiraanInvoiceMasuk || item.tanggalInvoice;
      if (date) {
        const monthIdx = new Date(date).getMonth();
        const amount = item.jumlahTagihanInvoice || 0;
        const status = item.statusPembayaran || 'pending';

        if (status === 'lunas') data[monthIdx].lunas += amount;
        else if (status === 'overdue') data[monthIdx].overdue += amount;
        else data[monthIdx].pending += amount;
      }
    });

    return data;
  }, [proyeksiPemasukanData]);

  const selectedMonthData = useMemo(() => {
    if (!selectedMonth) return null;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = monthNames.findIndex(m => m === selectedMonth);

    if (monthIdx === -1) return null;

    // Items for this month in the selected year
    const items = proyeksiPemasukanData.filter(item => {
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
  }, [selectedMonth, proyeksiPemasukanData]);


  // Export Function
  const exportToExcel = async (data: any[], columns: any[], filename: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    worksheet.addRows(data);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  };

  const handleExportTracking = () => {
    const dataToExport = trackingInvoiceData.map((item, index) => ({
      no: index + 1,
      proyek: item.namaProyek,
      klien: item.klien,
      jenis: item.jenisPekerjaan,
      invoice: item.nama,
      tanggal: item.effectiveDate ? formatDate(item.effectiveDate) : '-',
      status: item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING',
      jumlah: item.jumlahTagihanInvoice || 0
    }));

    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Proyek', key: 'proyek', width: 30 },
      { header: 'Klien', key: 'klien', width: 20 },
      { header: 'Jenis', key: 'jenis', width: 15 },
      { header: 'Invoice', key: 'invoice', width: 20 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 20 },
    ];

    exportToExcel(dataToExport, columns, `Tracking_Invoice_${new Date().toLocaleDateString()}`);
  };

  const handleExportProyeksi = () => {
    const dataToExport = proyeksiPemasukanData.map((item, index) => ({
      no: index + 1,
      proyek: item.namaProyek,
      klien: item.klien,
      jenis: item.jenisPekerjaan,
      invoice: item.nama,
      tanggal: item.perkiraanInvoiceMasuk ? formatDate(item.perkiraanInvoiceMasuk) : '-',
      status: item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING',
      jumlah: item.jumlahTagihanInvoice || 0
    }));

    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Proyek', key: 'proyek', width: 30 },
      { header: 'Klien', key: 'klien', width: 20 },
      { header: 'Jenis', key: 'jenis', width: 15 },
      { header: 'Invoice', key: 'invoice', width: 20 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 20 },
    ];

    exportToExcel(dataToExport, columns, `Proyeksi_Pemasukan_${proyeksiYear}`);
  };

  const handleExportRekap = () => {
    const dataToExport = rekapTagihanData.details.map((item: any, index: number) => ({
      no: index + 1,
      proyek: item.namaProyek,
      klien: item.klien,
      jenis: item.jenisPekerjaan,
      invoice: item.nama,
      tanggal: item.tanggalInvoice ? formatDate(item.tanggalInvoice) : (item.perkiraanInvoiceMasuk ? `${formatDate(item.perkiraanInvoiceMasuk)} (Est)` : '-'),
      status: item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING',
      jumlah: item.jumlahTagihanInvoice || 0
    }));

    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Proyek', key: 'proyek', width: 30 },
      { header: 'Klien', key: 'klien', width: 20 },
      { header: 'Jenis', key: 'jenis', width: 15 },
      { header: 'Invoice', key: 'invoice', width: 20 },
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Jumlah', key: 'jumlah', width: 20 },
    ];

    exportToExcel(dataToExport, columns, `Rekap_Tagihan_${rekapYear}`);
  };

  // Use Memo definition correction for overall chart
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

  // Proyeksi Summary Stats
  const proyeksiStats = useMemo(() => {
    const total = proyeksiPemasukanData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const lunas = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'lunas').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const pending = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'pending').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const overdue = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'overdue').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    return { total, lunas, pending, overdue };
  }, [proyeksiPemasukanData]);

  return (
    <>
      <MainLayout title="Dashboard">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="overall">Overall Stats</TabsTrigger>
              <TabsTrigger value="proyeksi">Proyeksi Pemasukan</TabsTrigger>
              <TabsTrigger value="rekap">Rekap Tagihan</TabsTrigger>
              <TabsTrigger value="tracking">Tracking Invoice</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Overall */}
          <TabsContent value="overall" className="space-y-6">
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
          </TabsContent>

          {/* Tab 2: Tracking Invoice */}


          {/* Tab 3: Proyeksi Pemasukan */}
          <TabsContent value="proyeksi" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyeksi {proyeksiYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(proyeksiStats.total)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Terbayar (Lunas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(proyeksiStats.lunas)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">{formatCurrency(proyeksiStats.pending)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(proyeksiStats.overdue)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">Grafik Proyeksi Pemasukan {proyeksiYear} {proyeksiJenis !== 'all' ? `(${proyeksiJenis})` : ''}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={proyeksiChartData}
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
                  <Button variant="outline" size="sm" onClick={handleExportProyeksi}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={proyeksiYear} onValueChange={setProyeksiYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={proyeksiJenis} onValueChange={setProyeksiJenis}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Semua Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      {JENIS_PEKERJAAN_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={proyeksiStatus} onValueChange={setProyeksiStatus}>
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
                      {currentTableData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada data proyeksi untuk tahun {proyeksiYear}
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentTableData.map((item, idx) => (
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Halaman {currentPage} dari {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="hidden h-8 w-8 p-0 lg:flex"
                      >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="hidden h-8 w-8 p-0 lg:flex"
                      >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Rekap Tagihan */}
          <TabsContent value="rekap" className="space-y-4">


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tagihan {rekapYear}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(rekapTagihanData.totalTagihan)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Terbayar (Lunas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{formatCurrency(rekapTagihanData.totalLunas)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">{formatCurrency(rekapTagihanData.totalPending)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{formatCurrency(rekapTagihanData.totalOverdue)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Rincian Tagihan {rekapYear}</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportRekap}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={rekapYear} onValueChange={setRekapYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">Tahun 2025</SelectItem>
                      <SelectItem value="2026">Tahun 2026</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={rekapMonth} onValueChange={setRekapMonth}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={rekapJenis} onValueChange={setRekapJenis}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      {JENIS_PEKERJAAN_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
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
                        <TableHead>Invoice</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rekapTagihanData.details.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Tidak ada data tagihan tahun {rekapYear}
                          </TableCell>
                        </TableRow>
                      ) : (
                        rekapTagihanData.details.map((item, idx) => (
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Tracking Invoice (Moved to end) */}
          <TabsContent value="tracking" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trackingStats.totalCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Lunas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">{trackingStats.lunasCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-700">{trackingStats.pendingCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-600">Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{trackingStats.overdueCount}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-col gap-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Tracking Invoice</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportTracking}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={trackingYear} onValueChange={setTrackingYear}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={trackingMonth} onValueChange={setTrackingMonth}>
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

                  <Select value={filterJenis} onValueChange={setFilterJenis}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Jenis..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      {JENIS_PEKERJAAN_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
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
                      {currentTrackingData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Tidak ada data invoice
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentTrackingData.map((item, idx) => (
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
                {totalTrackingPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Halaman {trackingPage} dari {totalTrackingPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTrackingPage(1)}
                        disabled={trackingPage === 1}
                        className="hidden h-8 w-8 p-0 lg:flex"
                      >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTrackingPage((prev) => Math.max(prev - 1, 1))}
                        disabled={trackingPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTrackingPage((prev) => Math.min(prev + 1, totalTrackingPages))}
                        disabled={trackingPage === totalTrackingPages}
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTrackingPage(totalTrackingPages)}
                        disabled={trackingPage === totalTrackingPages}
                        className="hidden h-8 w-8 p-0 lg:flex"
                      >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </MainLayout>

      <Dialog open={!!selectedMonth} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Detail Proyeksi - {selectedMonth} {proyeksiYear}</DialogTitle>
            <DialogDescription>
              Detail pemasukan dan invoice untuk bulan {selectedMonth} {proyeksiYear}
            </DialogDescription>
          </DialogHeader>

          {selectedMonthData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Total Tagihan</div>
                  <div className="text-lg font-bold">{formatCurrency(selectedMonthData.stats.total)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-700">Lunas</div>
                  <div className="text-lg font-bold text-green-700">{formatCurrency(selectedMonthData.stats.lunas)}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-xs text-yellow-700">Pending</div>
                  <div className="text-lg font-bold text-yellow-700">{formatCurrency(selectedMonthData.stats.pending)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-xs text-red-700">Overdue</div>
                  <div className="text-lg font-bold text-red-700">{formatCurrency(selectedMonthData.stats.overdue)}</div>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyek</TableHead>
                      <TableHead className="hidden sm:table-cell">Tahapan</TableHead>
                      <TableHead className="hidden sm:table-cell">Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
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
                          <TableCell className="font-medium max-w-[140px] sm:max-w-none">
                            <div className="font-semibold truncate" title={item.namaProyek}>{item.namaProyek}</div>
                            <div className="text-xs text-muted-foreground truncate" title={item.klien}>{item.klien}</div>
                            <div className="block sm:hidden text-xs text-muted-foreground mt-1">
                              {item.nama}
                              <br />
                              <span className="text-[10px]">{formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{item.nama}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatDate(item.perkiraanInvoiceMasuk || item.tanggalInvoice || new Date())}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`
                                whitespace-nowrap text-[10px] sm:text-xs px-1 sm:px-2.5
                                ${item.statusPembayaran === 'lunas' ? 'bg-green-100 text-green-700 border-green-200' :
                                item.statusPembayaran === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'}
                              `}>
                              {item.statusPembayaran ? item.statusPembayaran.toUpperCase() : 'PENDING'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs sm:text-sm">
                            {formatCurrency(item.jumlahTagihanInvoice || 0)}
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
    </>
  );
}
