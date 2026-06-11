"use client";

import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  formatDate,
} from "@/lib/helpers";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useNonTenderStore } from "@/stores/praKontrakStore";
import { useTenderStore } from "@/stores/lelangStore";
import { usePekerjaanStore } from "@/stores/pekerjaanStore";
import { useTenagaAhliStore } from "@/stores/tenagaAhliStore";
import { useAlatStore } from "@/stores/alatStore";
import { useDokumenStore } from "@/stores/dokumenStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { OverallStats } from "@/components/dashboard/OverallStats";
import { ProyeksiPemasukan } from "@/components/dashboard/ProyeksiPemasukan";
import { HandCoins, HardHat } from 'lucide-react';
import { jenisPekerjaanService, mapJenisPekerjaan } from "@/services/jenisPekerjaan.service";
import { JenisPekerjaan } from "@/types";

export default function Dashboard() {
  const { fetchItems: fetchNonTender } = useNonTenderStore();
  const { fetchItems: fetchTender } = useTenderStore();
  const { items: pekerjaan, fetchItems: fetchPekerjaan } = usePekerjaanStore();
  const { items: tenagaAhli, fetchItems: fetchTenagaAhli } = useTenagaAhliStore();
  const { items: alat, fetchItems: fetchAlat } = useAlatStore();
  const { items: legalitas, fetchItems: fetchLegalitas } = useDokumenStore();

  const pekerjaanAktif = useMemo(() => pekerjaan.filter(p => p.status !== 'selesai'), [pekerjaan]);

  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<JenisPekerjaan[]>([]);

  const availableProyeksiYears = useMemo(() => {
    const years = new Set<string>();
    pekerjaan.forEach(p => {
      const date = (p as any).tanggalMulai || (p as any).tanggalSelesai;
      if (date) years.add(new Date(date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [pekerjaan]);

  const [activeTab, setActiveTab] = useState("overall");

  // Sorting & Filtering States

  const [filterJenis, setFilterJenis] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [trackingYear, setTrackingYear] = useState("all");
  const [trackingMonth, setTrackingMonth] = useState("all");

  const [proyeksiYear, setProyeksiYear] = useState("2026");
  const [proyeksiJenis, setProyeksiJenis] = useState("all");
  const [proyeksiStatus, setProyeksiStatus] = useState("all");
  const [proyeksiStatusPekerjaan, setProyeksiStatusPekerjaan] = useState("all");
  const [proyeksiPicPerusahaan, setProyeksiPicPerusahaan] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const availablePicPerusahaan = useMemo(() => {
    const pics = new Set<string>();
    pekerjaan.forEach(p => { if (p.namaPerusahaan) pics.add(p.namaPerusahaan); });
    return Array.from(pics).sort();
  }, [pekerjaan]);

  const [rekapYear, setRekapYear] = useState("2026");
  const [rekapMonth, setRekapMonth] = useState("all");
  const [rekapJenis, setRekapJenis] = useState("all");
  const [rekapStatus, setRekapStatus] = useState("all");
  const [rekapPage, setRekapPage] = useState(1);

  const [trackingPage, setTrackingPage] = useState(1);

  const [proyeksiSearch, setProyeksiSearch] = useState("");
  const [rekapSearch, setRekapSearch] = useState("");
  const [trackingSearch, setTrackingSearch] = useState("");

  useEffect(() => {
    fetchNonTender();
    fetchTender();
    fetchPekerjaan();
    fetchTenagaAhli();
    fetchAlat();
    fetchLegalitas();
    jenisPekerjaanService.getAll().then(r => setJenisPekerjaanList(r.map(mapJenisPekerjaan))).catch(() => {});
  }, []);


  const proyeksiPemasukanData = useMemo(() => {
    let data = pekerjaan.flatMap(p =>
      (p.tahapan || []).flatMap(t => {
        const progressProyek = p.tahapan && p.tahapan.length > 0
          ? p.tahapan.reduce((sum, t) => sum + (t.progress || 0), 0)
          : (p.progress || 0);

        const nilaiKontrak = p.nilaiKontrak || 0;
        const allInvoices = (p.tahapan || []).flatMap(th => th.invoices || []);
        const invLunas = allInvoices.filter(i => i.status === 'lunas').reduce((s, i) => s + (i.nilaiInvoice || 0), 0);
        const legacyLunas = (p.tahapan || []).filter(th => !th.invoices?.length && th.statusPembayaran === 'lunas').reduce((s, th) => s + (th.jumlahTagihanInvoice || 0), 0);
        const totalLunas = invLunas + legacyLunas;
        const progressKeuangan = nilaiKontrak > 0 ? Math.min((totalLunas / nilaiKontrak) * 100, 100).toFixed(1) : "0.0";

        // New model: flatten each invoice entry into its own row
        if (t.invoices && t.invoices.length > 0) {
          return t.invoices.map(inv => ({
            ...t,
            idProyek: p.id,
            namaProyek: p.namaProyek,
            jenisPekerjaan: p.jenisPekerjaan,
            klien: p.klien,
            namaPerusahaan: p.namaPerusahaan,
            tanggalMulaiProyek: p.tanggalMulai,
            tanggalSelesaiProyek: p.tanggalSelesai,
            nomorKontrak: p.nomorKontrak,
            statusPekerjaan: p.status,
            // Map new invoice fields → legacy field names used by the component
            perkiraanInvoiceMasuk: inv.jatuhTempo,
            jumlahTagihanInvoice: inv.nilaiInvoice,
            statusPembayaran: inv.status || 'Menunggu Bayar',
            invoiceNomor: inv.nomorInvoice,
            invoiceTanggalTerbit: inv.tanggalTerbit,
            progressProyek,
            progressKeuangan,
            bobot: t.bobot || 0,
            nilaiKontrak,
          }));
        }

        // Legacy model: use per-tahapan fields
        if (t.perkiraanInvoiceMasuk || t.tanggalInvoice) {
          return [{
            ...t,
            idProyek: p.id,
            namaProyek: p.namaProyek,
            jenisPekerjaan: p.jenisPekerjaan,
            klien: p.klien,
            namaPerusahaan: p.namaPerusahaan,
            tanggalMulaiProyek: p.tanggalMulai,
            tanggalSelesaiProyek: p.tanggalSelesai,
            nomorKontrak: p.nomorKontrak,
            statusPekerjaan: p.status,
            statusPembayaran: t.statusPembayaran || 'Menunggu Bayar',
            progressProyek,
            progressKeuangan,
            bobot: t.bobot || 0,
            nilaiKontrak,
          }];
        }

        return [];
      })
    );

    // Filter by Year
    data = data.filter(item => {
      if (proyeksiYear === 'all') return true;
      const projectDate = item.tanggalMulaiProyek || item.tanggalSelesaiProyek;
      const date = projectDate ? new Date(projectDate) : null;
      return date != null && date.getFullYear().toString() === proyeksiYear;
    });

    // Filter by Jenis Pekerjaan
    if (proyeksiJenis !== 'all') {
      data = data.filter(item => item.jenisPekerjaan === proyeksiJenis);
    }

    // Filter by Status Pekerjaan
    if (proyeksiStatusPekerjaan !== 'all') {
      data = data.filter(item => item.statusPekerjaan === proyeksiStatusPekerjaan);
    }

    // Filter by Status Pembayaran
    if (proyeksiStatus !== 'all') {
      data = data.filter(item => item.statusPembayaran === proyeksiStatus);
    }

    // Filter by PIC Perusahaan
    if (proyeksiPicPerusahaan !== 'all') {
      data = data.filter(item => item.namaPerusahaan === proyeksiPicPerusahaan);
    }

    // Filter by Search Query
    if (proyeksiSearch) {
      const q = proyeksiSearch.toLowerCase();
      data = data.filter(item =>
        item.namaProyek?.toLowerCase().includes(q) ||
        item.namaPerusahaan?.toLowerCase().includes(q) ||
        item.klien?.toLowerCase().includes(q)
      );
    }

    // Sorting - Always by Date ASC
    data.sort((a, b) => {
      const dateA = a.perkiraanInvoiceMasuk || a.tanggalInvoice || 0;
      const dateB = b.perkiraanInvoiceMasuk || b.tanggalInvoice || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    return data;
  }, [pekerjaan, proyeksiYear, proyeksiJenis, proyeksiStatus, proyeksiStatusPekerjaan, proyeksiPicPerusahaan, proyeksiSearch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [proyeksiYear, proyeksiJenis, proyeksiStatus, proyeksiStatusPekerjaan, proyeksiPicPerusahaan, proyeksiSearch]);

  useEffect(() => {
    setTrackingPage(1);
  }, [trackingYear, trackingMonth, filterJenis, filterStatus, trackingSearch]);

  useEffect(() => {
    setRekapPage(1);
  }, [rekapYear, rekapMonth, rekapJenis, rekapStatus, rekapSearch]);

  const totalPages = Math.ceil(proyeksiPemasukanData.length / itemsPerPage);

  const currentTableData = proyeksiPemasukanData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Aggregate Proyeksi per Month for Chart
  const proyeksiChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, lunas: 0, pending: 0, overdue: 0, belumTagih: 0 }));

    proyeksiPemasukanData.forEach(item => {
      const date = item.perkiraanInvoiceMasuk || item.tanggalInvoice;
      if (date) {
        const monthIdx = new Date(date).getMonth();
        const amount = item.jumlahTagihanInvoice || 0;
        const status = item.statusPembayaran || 'Menunggu Bayar';

        if (status === 'lunas') data[monthIdx].lunas += amount;
        else if (status === 'Terlambat Bayar') data[monthIdx].overdue += amount;
        else if (status === 'Belum Tagih') data[monthIdx].belumTagih += amount;
        else data[monthIdx].pending += amount;
      }
    });

    return data;
  }, [proyeksiPemasukanData]);

  // Proyeksi Summary Stats
  const proyeksiStats = useMemo(() => {
    const lunasData = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'lunas');
    const overdueData = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'Terlambat Bayar');
    const belumTagihData = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'Belum Tagih');
    const pendingData = proyeksiPemasukanData.filter(i => i.statusPembayaran === 'Menunggu Bayar' || (!i.statusPembayaran));

    return { 
      total: proyeksiPemasukanData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0), 
      totalCount: proyeksiPemasukanData.length,
      lunas: lunasData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0), 
      lunasCount: lunasData.length,
      pending: pendingData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0), 
      pendingCount: pendingData.length,
      overdue: overdueData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0),
      overdueCount: overdueData.length,
      belumTagih: belumTagihData.reduce((sum, item) => sum + (item.jumlahTagihanInvoice || 0), 0),
      belumTagihCount: belumTagihData.length
    };
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

  const handleExportProyeksi = () => {
    const dataToExport = proyeksiPemasukanData.map((item, index) => ({
      no: index + 1,
      proyek: item.namaProyek,
      klien: item.klien,
      jenis: item.jenisPekerjaan,
      invoice: item.nama,
      tanggal: item.perkiraanInvoiceMasuk ? formatDate(item.perkiraanInvoiceMasuk) : '-',
      status: item.statusPembayaran ? item.statusPembayaran : 'Menunggu Bayar',
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

  return (
    <MainLayout title="Dashboard">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full">
          <TabsList className="h-auto w-full flex flex-wrap justify-start gap-2 bg-muted/50 p-1.5 rounded-lg">
            <TabsTrigger value="overall" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <HardHat className="h-4 w-4 mr-2" />
              Pekerjaan
            </TabsTrigger>
            <TabsTrigger value="proyeksi" className="flex-1 sm:flex-none min-w-[140px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <HandCoins className="h-4 w-4 mr-2" />
              Keuangan
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Overall */}
        <TabsContent value="overall" className="space-y-6">
          <OverallStats
            legalitas={legalitas}
            pekerjaan={pekerjaanAktif}
            pekerjaanSelesai={pekerjaan.filter((p: any) => p.status === 'selesai')}
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
            statusPekerjaan={proyeksiStatusPekerjaan}
            setStatusPekerjaan={setProyeksiStatusPekerjaan}
            picPerusahaan={proyeksiPicPerusahaan}
            setPicPerusahaan={setProyeksiPicPerusahaan}
            picPerusahaanOptions={availablePicPerusahaan}
            searchQuery={proyeksiSearch}
            setSearchQuery={setProyeksiSearch}
            stats={proyeksiStats}
            chartData={proyeksiChartData}
            tableData={currentTableData}
            allData={proyeksiPemasukanData}
            handleExport={handleExportProyeksi}
            page={currentPage}
            setPage={setCurrentPage}
            totalPages={totalPages}
            jenisOptions={jenisPekerjaanList.map(j => j.kode)}
            yearOptions={availableProyeksiYears}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
