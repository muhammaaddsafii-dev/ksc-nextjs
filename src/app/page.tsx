"use client";

import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  formatDate,
} from "@/lib/helpers";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { usePraKontrakStore } from "@/stores/praKontrakStore";
import { useLelangStore } from "@/stores/lelangStore";
import { usePekerjaanStore } from "@/stores/pekerjaanStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useAlatStore } from "@/stores/alatStore";
import { useLegalitasStore } from "@/stores/legalitasStore";
import { useArsipStore } from "@/stores/arsipStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OverallStats } from "@/components/dashboard/OverallStats";
import { ProyeksiPemasukan } from "@/components/dashboard/ProyeksiPemasukan";
import { RekapTagihan } from "@/components/dashboard/RekapTagihan";
import { TrackingInvoice } from "@/components/dashboard/TrackingInvoice";

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
  const [rekapPage, setRekapPage] = useState(1);

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

  useEffect(() => {
    setRekapPage(1);
  }, [rekapYear, rekapMonth, rekapJenis]);

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

  const totalRekapPages = Math.ceil(rekapTagihanData.details.length / itemsPerPage);
  const currentRekapData = rekapTagihanData.details.slice(
    (rekapPage - 1) * itemsPerPage,
    rekapPage * itemsPerPage
  );

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

  // Proyeksi Summary Stats
  const proyeksiStats = useMemo(() => {
    const total = proyeksiPemasukanData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const lunas = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'lunas').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const pending = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'pending').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    const overdue = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'overdue').reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0);
    return { total, lunas, pending, overdue };
  }, [proyeksiPemasukanData]);

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

  return (
    <MainLayout title="Dashboard">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full">
          <TabsList className="h-auto w-full flex flex-wrap justify-start gap-2 bg-muted/50 p-1.5 rounded-lg">
            <TabsTrigger value="overall" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Overall Stats
            </TabsTrigger>
            <TabsTrigger value="proyeksi" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Proyeksi Pemasukan
            </TabsTrigger>
            <TabsTrigger value="rekap" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Rekap Tagihan
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              Tracking Invoice
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overall */}
        <TabsContent value="overall" className="space-y-6">
          <OverallStats
            legalitas={legalitas}
            pekerjaan={pekerjaan}
            arsipPekerjaan={arsipPekerjaan}
            handleExportProyeksi={handleExportProyeksi}
          />
        </TabsContent>

        {/* Tab 2: Proyeksi Pemasukan */}
        <TabsContent value="proyeksi" className="space-y-4">
          <ProyeksiPemasukan
            year={proyeksiYear}
            setYear={setProyeksiYear}
            jenis={proyeksiJenis}
            setJenis={setProyeksiJenis}
            status={proyeksiStatus}
            setStatus={setProyeksiStatus}
            stats={proyeksiStats}
            chartData={proyeksiChartData}
            tableData={currentTableData}
            allData={proyeksiPemasukanData}
            handleExport={handleExportProyeksi}
            page={currentPage}
            setPage={setCurrentPage}
            totalPages={totalPages}
            jenisOptions={JENIS_PEKERJAAN_OPTIONS}
          />
        </TabsContent>

        {/* Tab 3: Rekap Tagihan */}
        <TabsContent value="rekap" className="space-y-4">
          <RekapTagihan
            year={rekapYear}
            setYear={setRekapYear}
            month={rekapMonth}
            setMonth={setRekapMonth}
            jenis={rekapJenis}
            setJenis={setRekapJenis}
            data={rekapTagihanData}
            currentData={currentRekapData}
            handleExport={handleExportRekap}
            jenisOptions={JENIS_PEKERJAAN_OPTIONS}
            page={rekapPage}
            setPage={setRekapPage}
            totalPages={totalRekapPages}
            totalItems={rekapTagihanData.details.length}
          />
        </TabsContent>

        {/* Tab 4: Tracking Invoice */}
        <TabsContent value="tracking" className="space-y-4">
          <TrackingInvoice
            year={trackingYear}
            setYear={setTrackingYear}
            month={trackingMonth}
            setMonth={setTrackingMonth}
            jenis={filterJenis}
            setJenis={setFilterJenis}
            status={filterStatus}
            setStatus={setFilterStatus}
            stats={trackingStats}
            data={currentTrackingData}
            handleExport={handleExportTracking}
            page={trackingPage}
            setPage={setTrackingPage}
            totalPages={totalTrackingPages}
            jenisOptions={JENIS_PEKERJAAN_OPTIONS}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
