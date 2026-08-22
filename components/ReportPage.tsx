import { getTmtDate, months } from "../utils/employeeUtils";
import React, { useState, useMemo, useEffect } from 'react';
import { DeferredView } from './DeferredView';
import { 
  FileText, Printer, Filter, Calendar, 
  Search, FileSpreadsheet, FileDown,
  History, ListFilter, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, Award, Layers, Clock, AlertCircle, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Employee } from '../types';
import { Language } from '../utils/translationHelper';
import { useDebounce } from '../hooks/useDebounce';

interface Props {
  employees: Employee[];
  currentUser: Employee | null;
  isKP?: boolean;
  language?: Language;
}

const ADMIN_NIP = '199601192025061007';

const ReportPage: React.FC<Props> = React.memo(({ employees, currentUser, isKP = false }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'history'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Filter Logic
  const filteredData = useMemo(() => {
    // 1. Filter dasar (pencarian nama/NIP)
    let data = employees.filter(emp => 
      emp.nama.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || emp.nip.includes(debouncedSearchTerm)
    );

    if (viewMode === 'monthly') {
      data = data.filter(emp => {
        const tmtDate = getTmtDate(emp.tmt);
        if (!tmtDate) return false;
        const empYear = tmtDate.getFullYear();
        const empMonthIdx = tmtDate.getMonth();

        // Filter Tahun
        if (empYear !== selectedYear) return false;

        // Filter Bulan
        if (selectedMonth !== 'All') {
          const selectedMonthIdx = months.indexOf(selectedMonth);
          if (empMonthIdx !== selectedMonthIdx) return false;
        }
        return true;
      });
    } else {
      // Mode History: Tampilkan proses yang sudah terbit SK (Processed) atau yang TMT-nya sudah berjalan/di masa lalu
      data = data.filter(emp => {
        if (emp.status === 'Processed') return true;
        const tmtDate = getTmtDate(emp.tmt);
        if (!tmtDate) return false;
        const now = new Date();
        // True if TMT is in the past or current time
        return tmtDate.getTime() <= now.getTime();
      });
        
      // Sort descending by TMT (Terbaru ke Terlama)
      data.sort((a, b) => {
        const dateA = getTmtDate(a.tmt)?.getTime() || 0;
        const dateB = getTmtDate(b.tmt)?.getTime() || 0;
        return dateB - dateA;
      });
    }
    return data;
  }, [employees, viewMode, selectedYear, selectedMonth, debouncedSearchTerm, isKP]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedYear, selectedMonth, debouncedSearchTerm, itemsPerPage]);

  
const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Kenaikan Pangkat Stats & Chart Data (Only if isKP)
  const kpStats = useMemo(() => {
    if (!isKP) return null;
    const total = filteredData.length;
    const processed = filteredData.filter(e => e.status === 'Processed').length;
    const pending = filteredData.filter(e => e.status === 'Pending').length;
    const upcoming = filteredData.filter(e => e.status === 'Upcoming').length;
    
    // Group by Golongan Baru (Pangkat Baru or Pangkat)
    const golCounts: { [gol: string]: number } = {};
    filteredData.forEach(e => {
      const gol = e.pangkatBaru || e.pangkat || '-';
      golCounts[gol] = (golCounts[gol] || 0) + 1;
    });
    const golChartData = Object.entries(golCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name)); // sort by rank name alphabetically
      
    // Group by Unit Kerja (top 5)
    const unitCounts: { [unit: string]: number } = {};
    filteredData.forEach(e => {
      unitCounts[e.unitKerja] = (unitCounts[e.unitKerja] || 0) + 1;
    });
    const unitChartData = Object.entries(unitCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { total, processed, pending, upcoming, golChartData, unitChartData };
  }, [filteredData, isKP]);

  // Kenaikan Pangkat Tahun Ini Stats & Chart Data (Only if isKP)
  const kpThisYearStats = useMemo(() => {
    if (!isKP) return null;
    const currentYear = new Date().getFullYear();
    
    // Filter employees who will get promoted this year
    const thisYearEmployees = employees.filter(emp => {
      const tmtDate = getTmtDate(emp.tmt);
      return tmtDate && tmtDate.getFullYear() === currentYear;
    });
    const golCounts: { [gol: string]: number } = {};
    thisYearEmployees.forEach(e => {
      const gol = e.pangkatBaru || e.pangkat || '-';
      golCounts[gol] = (golCounts[gol] || 0) + 1;
    });
    const golChartData = Object.entries(golCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const maxVal = golChartData.length > 0 ? Math.max(...golChartData.map(d => d.value)) : 0;
    return { year: currentYear, total: thisYearEmployees.length, golChartData, maxVal };
  }, [employees, isKP]);

  // Export Excel with Dynamic Import (Optimization)
  const handleExportExcel = async () => {
    if (filteredData.length === 0) return;
    setIsExporting(true);
    try {
      // Dynamically import XLSX only when needed to save bundle size
      const XLSX = await import('xlsx');
      const dataForExcel = filteredData.map((emp, index) => {
        // Logic akses: Pemilik data ATAU Admin Khusus
        const hasAccess = currentUser?.nip === emp.nip || currentUser?.nip === ADMIN_NIP;
        if (isKP) {
          return {
            "No": index + 1,
            "Nama Pegawai": emp.nama,
            "NIP": emp.nip,
            "Unit Kerja": emp.unitKerja,
            "Pangkat Lama": emp.pangkatLama || '-',
            "Pangkat Baru": emp.pangkatBaru || emp.pangkat,
            "Status": emp.statusKepegawaian,
            "TMT Kenaikan Pangkat": emp.tmt
          };
        }
        return {
          "No": index + 1,
          "Nama Pegawai": emp.nama,
          "NIP": emp.nip,
          "Golongan": emp.pangkat,
          "Jabatan": emp.jabatan,
          "Unit Kerja": emp.unitKerja,
          "Gaji Lama": hasAccess ? emp.gajiLama : "******",
          "Gaji Baru": hasAccess ? emp.gajiBaru : "******",
          "Masa Kerja": emp.masaKerja,
          "TMT Kenaikan Gaji Berkala": emp.tmt
        };
      });
      const ws = XLSX.utils.json_to_sheet(dataForExcel);
        
      // Auto width simple calculation
      const wscols = isKP 
        ? [ { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 } ]
        : [ { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 } ];
      ws['!cols'] = wscols;
      const wb = XLSX.utils.book_new();
      const sheetName = viewMode === 'monthly' 
        ? `Laporan_${selectedMonth}_${selectedYear}` 
        : `Riwayat_Proses_Kenaikan`;
            
      XLSX.utils.book_append_sheet(wb, ws, isKP ? "Data Kenaikan Pangkat" : "Data Kenaikan Gaji");
      XLSX.writeFile(wb, `${sheetName}.xlsx`);
    } catch (error) {
      console.error("Failed to load export module", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF Handler
  const handleExportPdf = async () => {
    if (filteredData.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFontSize(16);
      doc.text(isKP ? "DAFTAR NOMINATIF KENAIKAN PANGKAT" : "DAFTAR NOMINATIF KENAIKAN GAJI BERKALA", 148.5, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(viewMode === 'monthly' ? `Periode: ${selectedMonth === 'All' ? 'Semua Bulan' : selectedMonth} ${selectedYear}` : 'Riwayat Proses (TMT Descending)', 148.5, 22, { align: 'center' });
      const tableColumn = isKP 
        ? ["No", "Nama Pegawai", "NIP", "Unit Kerja", "Pangkat Lama", "Pangkat Baru", "Status", "TMT"]
        : ["No", "Nama Pegawai", "NIP", "Golongan", "Jabatan", "Unit Kerja", "Gaji Lama", "Gaji Baru", "Masa Kerja", "TMT"];
      const tableRows = filteredData.map((emp, index) => {
        const hasAccess = currentUser?.nip === emp.nip || currentUser?.nip === ADMIN_NIP;
        if (isKP) {
          return [
            index + 1, emp.nama, emp.nip, emp.unitKerja, emp.pangkatLama || '-', emp.pangkatBaru || emp.pangkat, emp.statusKepegawaian, emp.tmt
          ];
        }
        return [
          index + 1, emp.nama, emp.nip, emp.pangkat, emp.jabatan, emp.unitKerja, hasAccess ? formatRupiah(emp.gajiLama) : '******', hasAccess ? formatRupiah(emp.gajiBaru) : '******', emp.masaKerja, emp.tmt
        ];
      });
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] }
      });
      const fileName = viewMode === 'monthly' 
        ? `Laporan_${selectedMonth}_${selectedYear}.pdf` 
        : `Riwayat_Proses_Kenaikan.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Failed to load PDF module", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4 print:p-0 print:space-y-0 print:bg-white dark:bg-gray-900 print:w-full">
      {/* Header Section (Hidden on Print) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm relative overflow-hidden text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 print:hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none transform trangray-z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase r mb-3">
                    <FileText size={16} />
                    Pusat Laporan
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    {isKP ? 'Rekapitulasi Kenaikan Pangkat' : 'Rekapitulasi Kenaikan Gaji Berkala'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    {isKP ? 'Unduh dan cetak laporan nominatif kenaikan pangkat.' : 'Unduh dan cetak laporan nominatif kenaikan gaji berkala.'}
                </p>
            </div>
            
            <div className="flex gap-3">
                <button onClick={handleExportExcel} disabled={filteredData.length === 0 || isExporting} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                    {isExporting ? 'Memproses...' : 'Ekspor Excel'}
                </button>
                <button onClick={handleExportPdf} disabled={filteredData.length === 0 || isExportingPdf} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                    {isExportingPdf ? 'Memproses...' : 'Unduh PDF'}
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold text-sm transition-all shadow-sm border border-gray-200 dark:border-gray-600">
                    <Printer size={18} />
                    Cetak
                </button>
            </div>
        </div>
      </div>

      {/* Control Bar (Hidden on Print) */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 print:hidden">
          {/* View Toggles */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit mb-6">
              <button onClick={() => setViewMode('monthly')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                  <ListFilter size={16} />
                  Laporan Bulanan
              </button>
              <button onClick={() => setViewMode('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                  <History size={16} />
                  Riwayat Proses
              </button>
          </div>

          {/* Filters - Conditional based on View Mode */}
          {viewMode === 'monthly' ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-500 dark:text-gray-400" size={16} />
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="relative group">
                    <Filter className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-500 dark:text-gray-400" size={16} />
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                        <option value="All">Semua Bulan</option>
                        {months.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input type="text" placeholder="Cari Nama / NIP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -trangray-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                    <input type="text" placeholder="Cari Riwayat Nama / NIP..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
            </div>
          )}
      </div>

      {/* Visualisasi Rekapitulasi Kenaikan Pangkat (Hanya jika isKP) */}
      {isKP && kpStats && (
        <div className="space-y-6 print:hidden animate-in fade-in slide-in-from-top-4 duration-500">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Usulan */}
            <div className="from-primary-50 to-white dark:from-gray-900 dark:to-gray-900/80 border border-primary-100 dark:border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/30 dark:bg-primary-900/20 rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase st block">Total Usul KP</span>
                  <h3 className="text-3xl font-normal text-gray-800 dark:text-gray-100 ">{kpStats.total}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Usulan kenaikan pangkat aktif.</p>
                </div>
                <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-md shadow-primary-600/10 group-hover:scale-110 transition-transform duration-300">
                  <Layers size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-primary-100/40 dark:border-gray-800">
                <span className="text-[10px] text-primary-700 dark:text-primary-400 font-bold flex items-center gap-1">
                  <TrendingUp size={12} /> Sinkronisasi SIASN BKN Aktif
                </span>
              </div>
            </div>

            {/* Selesai / Terbit SK */}
            <div className="from-primary-50 to-white dark:from-gray-900 dark:to-gray-900/80 border border-primary-100 dark:border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/30 dark:bg-primary-900/20 rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase st block">Selesai (Terbit SK)</span>
                  <h3 className="text-3xl font-normal text-gray-800 dark:text-gray-100 ">{kpStats.processed}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">SK KP sudah terbit & disetujui.</p>
                </div>
                <div className="p-3 bg-primary-500 text-white rounded-2xl shadow-md shadow-primary-500/10 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-primary-100/40 dark:border-gray-800">
                <span className="text-[10px] text-primary-700 dark:text-primary-400 font-bold flex items-center gap-1">
                  Persentase Selesai: {kpStats.total > 0 ? ((kpStats.processed / kpStats.total) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>

            {/* Sedang Dipproses */}
            <div className="from-amber-50 to-white dark:from-gray-900 dark:to-gray-900/80 border border-amber-100 dark:border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 dark:bg-amber-900/20 rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase st block">Sedang Diproses</span>
                  <h3 className="text-3xl font-normal text-gray-800 dark:text-gray-100 ">{kpStats.pending}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Berkas sedang diverifikasi.</p>
                </div>
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/10 group-hover:scale-110 transition-transform duration-300">
                  <Clock size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-100/40 dark:border-gray-800">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                  Verifikasi Berkas & Persyaratan
                </span>
              </div>
            </div>

            {/* Akan Datang (Upcoming) */}
            <div className="from-primary-50 to-white dark:from-gray-900 dark:to-gray-900/80 border border-primary-100 dark:border-gray-800 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-100/30 dark:bg-primary-900/20 rounded-full pointer-events-none"></div>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase st block">Akan Datang (Upcoming)</span>
                  <h3 className="text-3xl font-normal text-gray-800 dark:text-gray-100 ">{kpStats.upcoming}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Pegawai periode berikutnya.</p>
                </div>
                <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-md shadow-primary-600/10 group-hover:scale-110 transition-transform duration-300">
                  <Award size={20} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-primary-100/40 dark:border-gray-800">
                <span className="text-[10px] text-primary-700 dark:text-primary-400 font-bold">
                  Proyeksi Kebutuhan Kenaikan
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Distribution per Golongan */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-6 flex flex-col justify-between min-h-[350px] hover:shadow-md transition-all duration-300">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 ">Distribusi Usulan Kenaikan Pangkat per Golongan Ruang</h3>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-1">Grafik sebaran target golongan pangkat baru pegawai pada periode terpilih.</p>
              </div>
              
              <div className="h-[220px] w-full mt-4">
                {kpStats.golChartData.length > 0 ? (
                  <DeferredView>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpStats.golChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="kpGolGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.85}/>
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#f8fafc', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} />
                        <Bar dataKey="value" name="Jumlah Usulan" fill="url(#kpGolGradient)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </DeferredView>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xs">
                    Tidak ada data sebaran golongan
                  </div>
                )}
              </div>
            </div>

            {/* Chart: Status Pie Chart */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-6 flex flex-col justify-between min-h-[350px] hover:shadow-md transition-all duration-300">
              <div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 ">Status Proses Usulan</h3>
                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-1">Persentase tahapan penyelesaian kenaikan pangkat.</p>
              </div>
              
              <div className="h-[180px] w-full mt-2 flex items-center justify-center relative">
                {kpStats.total > 0 ? (
                  <DeferredView>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                            { name: 'Selesai (Terbit SK)', value: kpStats.processed, color: '#10b981' },
                            { name: 'Sedang Diproses', value: kpStats.pending, color: '#f59e0b' },
                            { name: 'Akan Datang', value: kpStats.upcoming, color: '#3b82f6' }
                          ].filter(item => item.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                          {[
                            { name: 'Selesai (Terbit SK)', value: kpStats.processed, color: '#10b981' },
                            { name: 'Sedang Diproses', value: kpStats.pending, color: '#f59e0b' },
                            { name: 'Akan Datang', value: kpStats.upcoming, color: '#3b82f6' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#f8fafc', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </DeferredView>
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 font-bold text-xs">Tidak ada data</div>
                )}
              </div>

              {/* Legends list */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-500 font-semibold">Selesai (Terbit SK)</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100 font-mono">{kpStats.processed} ({kpStats.total > 0 ? ((kpStats.processed / kpStats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-500 font-semibold">Sedang Diproses</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100 font-mono">{kpStats.pending} ({kpStats.total > 0 ? ((kpStats.pending / kpStats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0"></span>
                    <span className="text-gray-600 dark:text-gray-500 font-semibold">Akan Datang</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-100 font-mono">{kpStats.upcoming} ({kpStats.total > 0 ? ((kpStats.upcoming / kpStats.total) * 100).toFixed(0) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* New Section: Bar Chart for Current Year Promotion Grade Distribution */}
          {kpThisYearStats && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TrendingUp size={18} className="text-cyan-600 " />
                    Distribusi Golongan Pegawai Naik Pangkat Tahun Ini ({kpThisYearStats.year})
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-1">
                    Visualisasi akumulasi usulan kenaikan pangkat PNS & PPPK di lingkungan BSKJI sepanjang tahun {kpThisYearStats.year} (Total: {kpThisYearStats.total} pegawai). <span className="text-amber-600 font-bold">Batang berwarna emas</span> menunjukkan golongan dengan usulan terbanyak.
                  </p>
                </div>
                <span className="px-3 py-1 bg-cyan-50 border border-cyan-100 text-cyan-700 rounded-full text-xs font-extrabold font-mono shrink-0">
                  Kumulatif {kpThisYearStats.year}
                </span>
              </div>
              
              <div className="h-[260px] w-full">
                {kpThisYearStats.golChartData.length > 0 ? (
                  <DeferredView>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpThisYearStats.golChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="kpGolThisYearGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.85}/>
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3}/>
                          </linearGradient>
                          <linearGradient id="kpGolGoldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" stopOpacity={0.95}/>
                            <stop offset="100%" stopColor="#ca8a04" stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '16px', border: 'none', color: '#f8fafc', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }} />
                        <Bar dataKey="value" name="Jumlah Pegawai" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {kpThisYearStats.golChartData.map((entry, index) => { 
                            const isMax = entry.value === kpThisYearStats.maxVal && kpThisYearStats.maxVal > 0; 
                            return (
                              <Cell key={`cell-${index}`} fill={isMax ? "url(#kpGolGoldGradient)" : "url(#kpGolThisYearGradient)"} stroke={isMax ? "#d97706" : "#0891b2"} strokeWidth={isMax ? 1 : 0} />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </DeferredView>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xs">
                    Tidak ada data sebaran golongan untuk tahun {kpThisYearStats.year}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Summary & Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-none print:rounded-none print:overflow-visible">
          
          {/* Header Print View Only - Formal Style */}
          <div className="hidden print:block mb-8 text-center text-black">
             <div className="flex flex-col items-center mb-3">
                <h1 className="text-sm font-bold uppercase r text-black">KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA</h1>
                <h2 className="text-base font-extrabold uppercase text-black">BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI</h2>
                <p className="text-[10px] font-medium text-black">Gedung Kementerian Perindustrian, Jl. Jend. Gatot Subroto Kav. 52-53, Jakarta Selatan</p>
             </div>
             <div className="border-b-4 border-black w-full mb-1"></div>
             <div className="border-b border-black w-full mb-6"></div>

              <h2 className="text-lg font-bold uppercase r mb-1">
                 {isKP ? 'DAFTAR NOMINATIF KENAIKAN PANGKAT' : 'DAFTAR NOMINATIF KENAIKAN GAJI BERKALA'}
              </h2>
              <h3 className="text-md font-bold uppercase mb-2">
                 PEGAWAI NEGERI SIPIL & PPPK
              </h3>
              <p className="text-sm font-medium">
                 {viewMode === 'monthly' ? `Periode: ${selectedMonth === 'All' ? 'Semua Bulan' : selectedMonth} ${selectedYear}` : 'Riwayat Proses (TMT Descending)'}
              </p>
          </div>

          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 print:hidden">
              <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                      {viewMode === 'monthly' ? 'Data Nominatif' : 'Riwayat Proses'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">
                      {viewMode === 'monthly' ? 'Menampilkan data berdasarkan filter periode.' : `Menampilkan daftar kenaikan ${isKP ? 'pangkat' : 'gaji berkala'} yang telah selesai.`}
                  </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button onClick={handleExportExcel} disabled={filteredData.length === 0 || isExporting} className="flex items-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                      {isExporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                      <span>{isExporting ? 'Memproses...' : 'Ekspor Excel'}</span>
                  </button>
                  <button onClick={handleExportPdf} disabled={filteredData.length === 0 || isExportingPdf} className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                      {isExportingPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                      <span>{isExportingPdf ? 'Memproses...' : 'Unduh PDF'}</span>
                  </button>
                  <div className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-extrabold whitespace-nowrap">
                      Total: {filteredData.length} Pegawai
                  </div>
              </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar print:overflow-visible">
              <table className="w-full text-left border-collapse print:border print:border-black print:text-xs">
                  <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 text-xs uppercase font-bold r border-b border-gray-200 dark:border-gray-700 print:bg-gray-100 print:text-black print:border-black print:border-b-2">
                          <th className="px-6 py-4 w-12 text-center border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">No</th>
                          <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Pegawai</th>
                          <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Unit Kerja</th>
                          {!isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Gaji Lama</th>}
                          {!isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Gaji Baru</th>}
                          {isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Pangkat Lama</th>}
                          {isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Pangkat Baru</th>}
                          {!isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Masa Kerja</th>}
                          {isKP && <th className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">Status</th>}
                          <th className="px-6 py-4 text-center print:border print:border-black print:px-2 print:py-2">TMT</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">
                      {filteredData.length > 0 ? ( 
                        paginatedData.map((emp, index) => {
                              // Logic akses: Pemilik data ATAU Admin Khusus
                              const hasAccess = currentUser?.nip === emp.nip || currentUser?.nip === ADMIN_NIP; 
                              return (
                              <tr key={emp.id} className="even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 transition-all duration-150 print:hover:bg-transparent">
                                  <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {(currentPage - 1) * itemsPerPage + index + 1}
                                  </td>
                                  <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">
                                      <div className="font-bold text-gray-800 dark:text-gray-100 text-xs md:text-sm print:text-black">{emp.nama}</div>
                                      <div className="text-primary-700 dark:text-primary-400 text-xs font-mono font-medium mt-0.5 print:text-black">{emp.nip}</div>
                                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 print:hidden">{emp.pangkat}</div>
                                      <div className="hidden print:block text-xs mt-0.5">{emp.pangkat}</div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.unitKerja}
                                  </td>
                                  {!isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {hasAccess ? formatRupiah(emp.gajiLama) : 'Rp ******'}
                                  </td>}
                                  {!isKP && <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:font-normal print:px-2 print:py-2">
                                      {hasAccess ? formatRupiah(emp.gajiBaru) : 'Rp ******'}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.pangkatLama || '-'}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:font-normal print:px-2 print:py-2">
                                      {emp.pangkatBaru || emp.pangkat}
                                  </td>}
                                  {!isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.masaKerja}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      <div className="flex flex-col gap-1 items-start">
                                          {/* Status Proses Badge */}
                                          {emp.status === 'Processed' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Selesai (SK Terbit)
                                              </span>
                                          )}
                                          {emp.status === 'Pending' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Diproses (Biro OSDM)
                                              </span>
                                          )}
                                          {emp.status === 'Upcoming' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Akan Datang
                                              </span>
                                          )}

                                          {/* Kepegawaian & SIASN Info */}
                                          <div className="flex flex-wrap gap-1 items-center">
                                              <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded text-[9px] font-bold uppercase r print:border print:border-black print:text-black print:bg-transparent">
                                                  {emp.statusKepegawaian}
                                              </span>
                                              {emp.statusSiasn && emp.statusSiasn !== '-' && (
                                                  <span className="px-1 py-0.5 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded text-[9px] font-bold print:hidden border border-violet-100 dark:border-violet-800/60">
                                                      SIASN: {emp.statusSiasn}
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  </td>}
                                  <td className="px-6 py-4 whitespace-nowrap text-center print:border print:border-black print:text-black print:px-2 print:py-2">
                                      <div className={`font-mono font-medium px-2 py-1 rounded border inline-block print:bg-transparent print:border-none print:p-0 ${ viewMode === 'history' && (getTmtDate(emp.tmt)?.getFullYear() || 0) >= 2026 
                                          ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800/60' 
                                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                                      }`}>
                                          {emp.tmt}
                                      </div>
                                  </td>
                              </tr>
                          );
                        })
                      ) : (
                          <tr>
                              <td colSpan={7} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400 print:border print:border-black print:text-black print:py-8">
                                  <div className="flex flex-col items-center justify-center gap-2">
                                      <Search size={32} className="opacity-20 print:hidden" />
                                      <p className="font-medium">Tidak ada data ditemukan untuk periode ini.</p>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
<tbody className="divide-y divide-gray-200 hidden print:table-row-group print:text-[10px] print:text-black">
                      {filteredData.length > 0 ? ( 
                        filteredData.map((emp, index) => {
                              // Logic akses: Pemilik data ATAU Admin Khusus
                              const hasAccess = currentUser?.nip === emp.nip || currentUser?.nip === ADMIN_NIP; 
                              return (
                              <tr key={emp.id} className="even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 transition-all duration-150 print:hover:bg-transparent">
                                  <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {(currentPage - 1) * itemsPerPage + index + 1}
                                  </td>
                                  <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:px-2 print:py-2">
                                      <div className="font-bold text-gray-800 dark:text-gray-100 text-xs md:text-sm print:text-black">{emp.nama}</div>
                                      <div className="text-primary-700 dark:text-primary-400 text-xs font-mono font-medium mt-0.5 print:text-black">{emp.nip}</div>
                                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 print:hidden">{emp.pangkat}</div>
                                      <div className="hidden print:block text-xs mt-0.5">{emp.pangkat}</div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.unitKerja}
                                  </td>
                                  {!isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {hasAccess ? formatRupiah(emp.gajiLama) : 'Rp ******'}
                                  </td>}
                                  {!isKP && <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:font-normal print:px-2 print:py-2">
                                      {hasAccess ? formatRupiah(emp.gajiBaru) : 'Rp ******'}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.pangkatLama || '-'}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 font-bold text-primary-600 dark:text-primary-400 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:font-normal print:px-2 print:py-2">
                                      {emp.pangkatBaru || emp.pangkat}
                                  </td>}
                                  {!isKP && <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      {emp.masaKerja}
                                  </td>}
                                  {isKP && <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-800 print:border print:border-black print:text-black print:px-2 print:py-2">
                                      <div className="flex flex-col gap-1 items-start">
                                          {/* Status Proses Badge */}
                                          {emp.status === 'Processed' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Selesai (SK Terbit)
                                              </span>
                                          )}
                                          {emp.status === 'Pending' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Diproses (Biro OSDM)
                                              </span>
                                          )}
                                          {emp.status === 'Upcoming' && (
                                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60 inline-flex items-center gap-1 print:bg-transparent print:border-none print:text-black print:p-0">
                                                  Akan Datang
                                              </span>
                                          )}

                                          {/* Kepegawaian & SIASN Info */}
                                          <div className="flex flex-wrap gap-1 items-center">
                                              <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded text-[9px] font-bold uppercase r print:border print:border-black print:text-black print:bg-transparent">
                                                  {emp.statusKepegawaian}
                                              </span>
                                              {emp.statusSiasn && emp.statusSiasn !== '-' && (
                                                  <span className="px-1 py-0.5 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 rounded text-[9px] font-bold print:hidden border border-violet-100 dark:border-violet-800/60">
                                                      SIASN: {emp.statusSiasn}
                                                  </span>
                                              )}
                                          </div>
                                      </div>
                                  </td>}
                                  <td className="px-6 py-4 whitespace-nowrap text-center print:border print:border-black print:text-black print:px-2 print:py-2">
                                      <div className={`font-mono font-medium px-2 py-1 rounded border inline-block print:bg-transparent print:border-none print:p-0 ${ viewMode === 'history' && (getTmtDate(emp.tmt)?.getFullYear() || 0) >= 2026 
                                          ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800/60' 
                                          : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                                      }`}>
                                          {emp.tmt}
                                      </div>
                                  </td>
                              </tr>
                          );
                        })
                      ) : (
                          <tr>
                              <td colSpan={7} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400 print:border print:border-black print:text-black print:py-8">
                                  <div className="flex flex-col items-center justify-center gap-2">
                                      <Search size={32} className="opacity-20 print:hidden" />
                                      <p className="font-medium">Tidak ada data ditemukan untuk periode ini.</p>
                                  </div>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination Controls (hidden when printing) */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between px-6 gap-4 print:hidden">
              <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase r">
                      Total: {filteredData.length} Pegawai
                  </span>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase">Tampilkan:</span>
                      <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-300">
                          <option value={10}>10</option>
                          <option value={20}>20</option>
<option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                      </select>
                  </div>
              </div>

              {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                      <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all" title="Halaman Pertama">
                          <ChevronsLeft size={14} />
                      </button>
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all" title="Halaman Sebelumnya">
                          <ChevronLeft size={14} />
                      </button>
                      
                      <div className="flex items-center gap-1 px-2">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Hal</span>
                          <input type="number" min={1} max={totalPages} value={currentPage} onChange={(e) => handlePageChange(Number(e.target.value))} className="w-10 text-center py-0.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">/ {totalPages}</span>
                      </div>

                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all" title="Halaman Berikutnya">
                          <ChevronRight size={14} />
                      </button>
                      <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all" title="Halaman Terakhir">
                          <ChevronsRight size={14} />
                      </button>
                  </div>
              )}
          </div>
      </div>
      
      {/* Print Signature Area (Visible only on print) */}
      <div className="hidden print:flex flex-col items-end mt-16 pr-8 page-break-inside-avoid text-black">
          <div className="text-left w-64">
              <p className="mb-1">Ditetapkan di: Jakarta</p>
              <p className="mb-6">Tanggal: ...........................</p>
          </div>
          <div className="text-center w-64">
              <p className="mb-20 font-bold">Mengetahui,<br/>{isKP ? 'Kepala Bagian Kepegawaian dan Umum' : 'Kepala Subbagian Kepegawaian'}</p>
              <p className="font-bold underline">......................................................</p>
              <p className="font-medium mt-1">NIP. ...........................................</p>
          </div>
      </div>
    </div>
  );
});

export default ReportPage;
