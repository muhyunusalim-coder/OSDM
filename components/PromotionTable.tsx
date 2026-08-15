import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Employee } from '../types';
import { Users, Clock, CheckCircle, AlertCircle, Download, FileDown, Search, Filter, ChevronLeft, ChevronsLeft, ChevronsRight, ChevronRight, ArrowUpDown, BadgeCheck, Briefcase, Calendar, CalendarRange, User, X, TrendingUp, CheckCircle2, ChevronRight as ChevronRightIcon, Sparkles, Copy, FileText, Check, Cpu, ListTodo, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { analyzeEmployeeKP } from '../services/geminiService';

import { Language } from '../utils/translationHelper';

interface Props {
  employees: Employee[];
  language?: Language;
}

const KP_DOC_CHECKLIST = [
  { id: 'sk_terakhir', label: 'SK Pangkat Terakhir' },
  { id: 'sk_jabatan', label: 'SK Jabatan Terakhir (untuk Fungsional)' },
  { id: 'pak', label: 'Penetapan Angka Kredit (PAK) Terbaru' },
  { id: 'skp_2_tahun', label: 'Penilaian Kinerja (SKP) 2 Tahun Terakhir' },
  { id: 'ijazah', label: 'Ijazah & Transkrip Nilai (jika penyesuaian)' },
  { id: 'surat_pengantar', label: 'Surat Pengantar / Usulan Unit Kerja' }
];

const PromotionTable: React.FC<Props> = React.memo(({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [selectedGol, setSelectedGol] = useState('All');
  const [masaKerjaFilter, setMasaKerjaFilter] = useState<string>('All');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee | 'tmtDate'; direction: 'asc' | 'desc' } | null>({ key: 'tmtDate', direction: 'asc' });
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Document checklist state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const toggleDoc = (docId: string) => {
    if (!selectedEmployee) return;
    const key = `${selectedEmployee.id}_${docId}`;
    setCheckedDocs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const requestSort = (key: keyof Employee | 'tmtDate') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const calculateKPCycleDates = (tmt: string) => {
    let tmtDate: Date | null = null;
    
    // Parsing logic matches existing getDaysRemaining
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        tmtDate = new Date(tmt);
    } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        tmtDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    if (!tmtDate || isNaN(tmtDate.getTime())) return { prev: '-', next: '-' };

    // Previous (-4 years for KP)
    const prevDate = new Date(tmtDate);
    prevDate.setFullYear(tmtDate.getFullYear() - 4);
    
    // Next (+4 years for KP)
    const nextDate = new Date(tmtDate);
    nextDate.setFullYear(tmtDate.getFullYear() + 4);

    const formatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    
    return {
        prev: formatter.format(prevDate),
        next: formatter.format(nextDate)
    };
  };

  const getTmtDate = (tmt: string) => {
    if (!tmt) return new Date(0);
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(tmt);
    } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    // TMT format from CSV e.g "1 April 2026"
    const monthsIndo = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
    const tmtLower = tmt.toLowerCase();
    
    // Check if it contains an Indonesian month
    const parts = tmtLower.split(' ');
    if (parts.length >= 2) {
      let day = 1;
      let monthIndex = -1;
      let year = new Date().getFullYear();
      
      for (const part of parts) {
        if (/^\d{1,2}$/.test(part)) {
          day = parseInt(part);
        } else if (/^\d{4}$/.test(part)) {
          year = parseInt(part);
        } else {
          const mIndex = monthsIndo.findIndex(m => part.includes(m));
          if (mIndex !== -1) {
            monthIndex = mIndex;
          }
        }
      }
      
      if (monthIndex !== -1) {
        return new Date(year, monthIndex, day);
      }
    }
    
    return new Date(0);
  };

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const stats = useMemo(() => {
    return {
        total: employees.length,
        pending: employees.filter(e => e.status === 'Pending').length,
        upcoming: employees.filter(e => e.status === 'Upcoming').length,
        processed: employees.filter(e => e.status === 'Processed').length,
    }
  }, [employees]);

  const uniqueUnits = useMemo(() => {
    const units = new Set(employees.map(e => e.unitKerja).filter(Boolean));
    return Array.from(units).sort();
  }, [employees]);

  const uniquePangkat = useMemo(() => {
    const pangkat = new Set(employees.map(e => e.pangkat).filter(Boolean));
    return Array.from(pangkat).sort();
  }, [employees]);

  const years = useMemo(() => {
    const yearsSet = new Set(employees.map(e => {
        const d = getTmtDate(e.tmt);
        return d.getFullYear().toString();
    }).filter(y => y !== '1970'));
    return Array.from(yearsSet).sort().reverse();
  }, [employees]);

  const availableMonths = useMemo(() => {
    const monthIndices = new Set(employees.map(e => {
        const d = getTmtDate(e.tmt);
        return d.getFullYear() !== 1970 ? d.getMonth() : -1;
    }).filter(m => m !== -1));
    return Array.from(monthIndices).sort((a: any, b: any) => (a as number) - (b as number)).map((mIndex: any) => months[mIndex]);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const getMasaKerjaYears = (masaKerjaStr: string) => {
      if (!masaKerjaStr) return 0;
      const match = masaKerjaStr.match(/(\d+)\s*(?:Tahun|th)/i);
      if (match) return parseInt(match[1], 10);
      const num = parseInt(masaKerjaStr, 10);
      return isNaN(num) ? 0 : num;
    };

    return employees.filter(emp => {
      const matchesSearch = emp.nama.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
                            emp.nip.includes(debouncedSearchTerm) ||
                            emp.jabatan.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesUnit = selectedUnit === 'All' || emp.unitKerja === selectedUnit;
      const matchesGol = selectedGol === 'All' || emp.pangkat === selectedGol;
      
      const tmtDate = getTmtDate(emp.tmt);
      const matchesYear = yearFilter === 'All' || tmtDate.getFullYear().toString() === yearFilter;
      
      let matchesMonth = true;
      if (monthFilter !== 'All') {
          const tmtMonthIndex = tmtDate.getMonth();
          const selectedMonthIndex = months.indexOf(monthFilter);
          matchesMonth = tmtMonthIndex === selectedMonthIndex;
      }

      let matchesMasaKerja = true;
      if (masaKerjaFilter !== 'All') {
        const years = getMasaKerjaYears(emp.masaKerja);
        if (masaKerjaFilter === '0-5') matchesMasaKerja = years >= 0 && years <= 5;
        else if (masaKerjaFilter === '6-10') matchesMasaKerja = years >= 6 && years <= 10;
        else if (masaKerjaFilter === '11-15') matchesMasaKerja = years >= 11 && years <= 15;
        else if (masaKerjaFilter === '16-20') matchesMasaKerja = years >= 16 && years <= 20;
        else if (masaKerjaFilter === '21+') matchesMasaKerja = years >= 21;
      }
      
      return matchesSearch && matchesUnit && matchesGol && matchesYear && matchesMonth && matchesMasaKerja;
    });
  }, [employees, debouncedSearchTerm, selectedUnit, selectedGol, yearFilter, monthFilter, masaKerjaFilter, months]);

  const sortedFiltered = useMemo(() => {
    let sortableItems = [...filteredEmployees];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = sortConfig.key === 'tmtDate' ? getTmtDate(a.tmt) : a[sortConfig.key];
        let bVal: any = sortConfig.key === 'tmtDate' ? getTmtDate(b.tmt) : b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEmployees, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, monthFilter, selectedUnit, selectedGol, yearFilter, masaKerjaFilter]);

  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFiltered, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getDaysRemaining = (tmt: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tmtDate = getTmtDate(tmt);
    if (!tmtDate || isNaN(tmtDate.getTime()) || tmtDate.getFullYear() === 1970) return null;
    const diffTime = tmtDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (filteredEmployees.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.text("DAFTAR NOMINATIF PEGAWAI (KENAIKAN PANGKAT)", 148.5, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Periode Bulan: ${monthFilter !== 'All' ? monthFilter : 'Semua'} | Tahun: ${yearFilter !== 'All' ? yearFilter : 'Semua'}`, 148.5, 21, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 148.5, 26, { align: 'center' });

      const tableColumn = ["No", "Nama Pegawai", "NIP", "Gol. Lama", "Gol. Baru", "Unit Kerja", "TMT KP", "Surat Usulan", "Input SIASN", "Status SIASN", "Status"];
      const tableRows = filteredEmployees.map((emp, i) => [
        i + 1,
        emp.nama,
        emp.nip,
        emp.pangkatLama || "-",
        emp.pangkatBaru || emp.pangkat || "-",
        emp.unitKerja,
        emp.tmt,
        emp.suratUsulan || "-",
        emp.inputSiasn || "-",
        emp.statusSiasn || "-",
        emp.status === 'Pending' ? 'Tertunda' : emp.status === 'Processed' ? 'Selesai' : 'Mendatang'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2, font: 'helvetica' },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          2: { halign: 'center', cellWidth: 32 },
          3: { halign: 'center', cellWidth: 15 },
          4: { halign: 'center', cellWidth: 15 },
          6: { halign: 'center', cellWidth: 20 },
          7: { halign: 'center', cellWidth: 22 },
          8: { halign: 'center', cellWidth: 18 },
          9: { halign: 'center', cellWidth: 22 },
          10: { halign: 'center', cellWidth: 18 },
        }
      });

      doc.save(`Data_Kenaikan_Pangkat_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("Failed to export PDF", e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredEmployees.length === 0) return;
    setIsExporting(true);

    try {
        const XLSX = await import('xlsx');
        
        const headers = [
            "No", "Nama Pegawai", "NIP", "Pangkat Lama", "Pangkat Baru",
            "Unit Kerja", "TMT Kenaikan Pangkat", "Surat Usulan", "Input SIASN", "Status SIASN", "Status"
        ];
        
        const exportData = filteredEmployees.map((emp, index) => [
            index + 1,
            emp.nama,
            emp.nip,
            emp.pangkatLama || "-",
            emp.pangkatBaru || emp.pangkat || "-",
            emp.unitKerja,
            emp.tmt,
            emp.suratUsulan || "-",
            emp.inputSiasn || "-",
            emp.statusSiasn || "-",
            emp.status === 'Pending' ? 'Tertunda' : emp.status === 'Processed' ? 'Selesai' : 'Mendatang'
        ]);
        
        const title = ["DATA NOMINATIF PEGAWAI (KENAIKAN PANGKAT)"];
        const subtitle = [`Bulan: ${monthFilter !== 'All' ? monthFilter : 'Semua'} | Tahun: ${yearFilter !== 'All' ? yearFilter : 'Semua'}`];
        const blankRow = [];
        
        const wsData = [
            title,
            subtitle,
            blankRow,
            headers,
            ...exportData
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Merge Title Cells
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } });
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 10 } });
        
        // Column Widths
        const wscols = [
            {wch: 5},  // No
            {wch: 35}, // Nama
            {wch: 25}, // NIP
            {wch: 15}, // Pangkat Lama
            {wch: 15}, // Pangkat Baru
            {wch: 30}, // Unit Kerja
            {wch: 20}, // TMT
            {wch: 20}, // Surat Usulan
            {wch: 15}, // Input SIASN
            {wch: 20}, // Status SIASN
            {wch: 15}  // Status
        ];
        ws['!cols'] = wscols;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Kenaikan Pangkat");
        XLSX.writeFile(wb, `Data_Kenaikan_Pangkat_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
        console.error("Failed to export Excel", error);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
            {[
                { label: 'Total Pegawai', value: stats.total.toString(), icon: Users, color: 'primary' as const, subtext: 'Total Keseluruhan' },
                { label: 'Mendatang', value: stats.upcoming.toString(), icon: Calendar, color: 'warning' as const, subtext: 'KP Bulan Depan' },
                { label: 'Tertunda', value: stats.pending.toString(), icon: Clock, color: 'rose' as const, subtext: 'Berkas Belum Lengkap' },
                { label: 'Selesai', value: stats.processed.toString(), icon: CheckCircle, color: 'success' as const, subtext: 'Dokumen SK Terbit' },
            ].map((stat, i) => {
                const statThemes = {
                    primary: {
                        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
                        dot: 'bg-emerald-500 dark:bg-emerald-400',
                        borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
                        glow: 'group-hover:bg-emerald-500/5',
                    },
                    warning: {
                        iconBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
                        dot: 'bg-amber-500 dark:bg-amber-400',
                        borderHover: 'hover:border-amber-300 dark:hover:border-amber-700/60',
                        glow: 'group-hover:bg-amber-500/5',
                    },
                    rose: {
                        iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-800/40 text-rose-600 dark:text-rose-400',
                        dot: 'bg-rose-500 dark:bg-rose-400',
                        borderHover: 'hover:border-rose-300 dark:hover:border-rose-700/60',
                        glow: 'group-hover:bg-rose-500/5',
                    },
                    success: {
                        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
                        dot: 'bg-emerald-500 dark:bg-emerald-400',
                        borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
                        glow: 'group-hover:bg-emerald-500/5',
                    }
                };
                const theme = statThemes[stat.color];
                return (
                    <div 
                        key={i} 
                        className={`group relative text-left w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm ${theme.borderHover} hover:shadow-md transition-all duration-300 overflow-hidden`}
                    >
                        {/* Subtle corner soft glow on hover */}
                        <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none ${theme.glow} blur-xl`}></div>

                        <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                                    {stat.label}
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-sans font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                                        {stat.value}
                                    </span>
                                </div>
                            </div>

                            <div className={`p-3 rounded-xl border ${theme.iconBg} shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm`}>
                                <stat.icon size={20} strokeWidth={2} />
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2 truncate">
                                <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`}></span>
                                <span className="truncate">{stat.subtext}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 relative z-10">
                <div>
                    <h2 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Kenaikan Pangkat</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Monitoring dan manajemen jadwal Kenaikan Pangkat pegawai.</p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2.5 flex-wrap">
                    <button 
                        onClick={handleExportExcel}
                        disabled={isExporting || filteredEmployees.length === 0}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isExporting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            Ekspor Excel
                          </>
                        )}
                    </button>

                    <button 
                        onClick={handleExportPdf}
                        disabled={isExportingPdf || filteredEmployees.length === 0}
                        className="flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isExportingPdf ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <FileDown size={14} />
                            Cetak PDF
                          </>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => setIsCompact(!isCompact)}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 border rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                            isCompact 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
                        }`}
                        title="Aktifkan Mode Ringkas untuk menampilkan lebih banyak baris"
                    >
                        <SlidersHorizontal size={14} className={isCompact ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} />
                        <span>{isCompact ? 'Mode Normal' : 'Mode Ringkas'}</span>
                    </button>

                    <button 
                        onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                        className={`flex items-center justify-center gap-2 px-3.5 py-2 border rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                            isAdvancedFilterOpen 
                            ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                        <SlidersHorizontal size={14} className={isAdvancedFilterOpen ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                        <span>Filter Lanjutan</span>
                        {(selectedUnit !== 'All' || selectedGol !== 'All' || masaKerjaFilter !== 'All') && (
                            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${isAdvancedFilterOpen ? 'bg-white dark:bg-slate-900 text-emerald-600' : 'bg-emerald-600 text-white'}`}>
                                {(selectedUnit !== 'All' ? 1 : 0) + (selectedGol !== 'All' ? 1 : 0) + (masaKerjaFilter !== 'All' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                    
                    {/* Search */}
                    <div className={`relative flex-grow md:flex-grow-0 group w-full md:w-auto transition-all ${searchTerm !== '' ? 'ring-1 ring-emerald-500 rounded-lg' : ''}`}>
                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${searchTerm !== '' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} group-focus-within:text-emerald-500`} size={16} />
                        <input 
                            type="text" 
                            placeholder="Cari Nama, NIP..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs w-full md:w-56 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                        {/* Tahun */}
                        <div className={`relative flex-shrink-0 transition-all ${yearFilter !== 'All' ? 'ring-1 ring-emerald-400 rounded-lg' : ''}`}>
                            <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${yearFilter !== 'All' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} size={14} />
                            <select 
                                className={`pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-emerald-500 text-xs appearance-none ${yearFilter !== 'All' ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold cursor-pointer w-full md:w-auto`}
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                            >
                                <option value="All">Semua Tahun</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        {/* Bulan */}
                        <div className={`relative flex-shrink-0 transition-all ${monthFilter !== 'All' ? 'ring-1 ring-emerald-400 rounded-lg' : ''}`}>
                            <CalendarRange className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${monthFilter !== 'All' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} size={14} />
                            <select 
                                className={`pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:border-emerald-500 text-xs appearance-none ${monthFilter !== 'All' ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold cursor-pointer w-full md:w-auto`}
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                            >
                                <option value="All">Semua Periode</option>
                                {availableMonths.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {isAdvancedFilterOpen && (
                <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 animate-fade-in">
                    {/* Unit Kerja */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <Briefcase size={12} className="text-emerald-500" />
                            <span>Unit Kerja</span>
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                        >
                            <option value="All">Semua Unit Kerja</option>
                            {uniqueUnits.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>

                    {/* Golongan */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <BadgeCheck size={12} className="text-emerald-500" />
                            <span>Golongan / Pangkat</span>
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                            value={selectedGol}
                            onChange={(e) => setSelectedGol(e.target.value)}
                        >
                            <option value="All">Semua Golongan</option>
                            {uniquePangkat.map(pangkat => (
                                <option key={pangkat} value={pangkat}>{pangkat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Masa Kerja */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-slate-700 dark:text-slate-300 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <Clock size={12} className="text-emerald-500" />
                            <span>Masa Kerja</span>
                        </label>
                        <div className="flex gap-2">
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                                value={masaKerjaFilter}
                                onChange={(e) => setMasaKerjaFilter(e.target.value)}
                            >
                                <option value="All">Semua Masa Kerja</option>
                                <option value="0-5">0 - 5 Tahun</option>
                                <option value="6-10">6 - 10 Tahun</option>
                                <option value="11-15">11 - 15 Tahun</option>
                                <option value="16-20">16 - 20 Tahun</option>
                                <option value="21+">21+ Tahun</option>
                            </select>
                            {(selectedUnit !== 'All' || selectedGol !== 'All' || masaKerjaFilter !== 'All') && (
                                <button
                                    onClick={() => {
                                        setSelectedUnit('All');
                                        setSelectedGol('All');
                                        setMasaKerjaFilter('All');
                                    }}
                                    className="px-2.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 hover:text-slate-800 dark:text-slate-100 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
                                    title="Reset Filter Lanjutan"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto custom-scrollbar touch-pan-x overscroll-x-contain">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-[9px] md:text-[10px] uppercase font-bold tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <th className={`w-10 text-center hidden md:table-cell ${isCompact ? 'px-2 py-1.5 md:py-2' : 'px-2 py-2.5 md:px-4 md:py-3'}`}>#</th>
                            <th 
                                className={`cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}
                            >
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                                    <div className="flex items-center gap-1" onClick={() => requestSort('nama')}>
                                        Nama
                                        <ArrowUpDown size={10} className={sortConfig?.key === 'nama' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} />
                                    </div>
                                    <div className="flex items-center gap-1" onClick={() => requestSort('nip')}>
                                        NIP
                                        <ArrowUpDown size={10} className={sortConfig?.key === 'nip' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} />
                                    </div>
                                </div>
                            </th>
                            <th className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Golongan (Lama ➔ Baru)</th>
                            <th className={`hidden lg:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Unit Kerja & Usulan</th>
                            <th 
                                className={`hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`} 
                                onClick={() => requestSort('tmtDate')}
                            >
                                <div className="flex items-center gap-1">
                                    TMT
                                    <ArrowUpDown size={12} className={sortConfig?.key === 'tmtDate' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} />
                                </div>
                            </th>
                            <th className={`text-center ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Status KP</th>
                            <th className={`text-center ${isCompact ? 'px-1 py-1.5 md:px-2 md:py-2' : 'px-2 py-2.5 md:px-3 md:py-3'}`}></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {paginatedEmployees.length > 0 ? (
                            paginatedEmployees.map((emp, index) => (
                                <tr 
                                    key={emp.id} 
                                    onClick={() => setSelectedEmployee(emp)}
                                    className={`transition-all duration-150 group cursor-pointer border-l-4 ${
                                        selectedEmployee?.id === emp.id 
                                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-emerald-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]' 
                                            : 'border-l-transparent hover:bg-emerald-50/40 dark:hover:bg-slate-800/70 hover:border-l-emerald-400 dark:hover:border-l-emerald-500'
                                    }`}
                                >
                                    <td className={`text-center text-slate-400 dark:text-slate-500 font-medium text-[10px] md:text-xs hidden md:table-cell ${isCompact ? 'px-2 py-1 md:py-1.5' : 'px-2 py-2 md:px-4 md:py-2.5'}`}>
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className={isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}>
                                        <div className="flex items-center gap-2">
                                            <div className="min-w-0">
                                                <div className={`font-bold text-slate-800 dark:text-slate-100 mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-display truncate pr-1 md:pr-2 ${isCompact ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'}`}>{emp.nama}</div>
                                                <div className={`text-slate-500 dark:text-slate-400 font-mono font-medium truncate ${isCompact ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs'}`}>{emp.nip}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>{emp.pangkatLama || '-'}</span>
                                            <ChevronRightIcon size={12} className="text-slate-400 dark:text-slate-500" />
                                            <span className={`font-bold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200 ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>{emp.pangkatBaru || emp.pangkat}</span>
                                        </div>
                                    </td>
                                    <td className={`text-slate-600 dark:text-slate-500 hidden lg:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                                        <div className={`font-semibold text-slate-700 dark:text-slate-200 mb-0.5 truncate max-w-[200px] ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{emp.unitKerja}</div>
                                        {emp.suratUsulan && emp.suratUsulan !== '-' && (
                                            <div className={`text-emerald-500 font-medium truncate max-w-[200px] ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>Surat: {emp.suratUsulan}</div>
                                        )}
                                    </td>
                                    <td className={`hidden md:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                                        <div className={`font-mono text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg inline-block shadow-sm ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
                                            {emp.tmt}
                                        </div>
                                    </td>
                                    <td className={`text-center whitespace-nowrap ${isCompact ? 'px-2 py-1 md:py-1.5' : 'px-2 py-2 md:px-4 md:py-2.5'}`}>
                                        <div className="flex items-center justify-center gap-1">
                                            {emp.status === 'Processed' ? (
                                            <div className={`inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title="Selesai">
                                                <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0" />
                                                <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                                            </div>
                                            ) : emp.status === 'Pending' ? (
                                            <div className={`inline-flex items-center gap-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 shadow-sm ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title="Tertunda">
                                                <AlertCircle size={isCompact ? 10 : 12} className="flex-shrink-0" />
                                                <span className="text-[10px] font-bold hidden sm:inline">Tertunda</span>
                                            </div>
                                            ) : (
                                            (() => {
                                                const days = getDaysRemaining(emp.tmt);
                                                const label = days === null ? '-' : days <= 0 ? 'Waktunya KP' : `${days} Hari`;
                                                const className = days === null ? 'text-slate-300 dark:text-slate-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                                                
                                                return (
                                                <div className={`inline-flex items-center gap-1 rounded-lg border shadow-sm ${className} ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title={label}>
                                                    <Clock size={isCompact ? 10 : 12} className="flex-shrink-0" />
                                                    <span className="text-[10px] font-bold hidden sm:inline">{label}</span>
                                                </div>
                                                );
                                            })()
                                            )}
                                        </div>
                                    </td>
                                    <td className={`text-center ${isCompact ? 'px-1 py-1 md:px-2 md:py-1.5' : 'px-2 py-2 md:px-3 md:py-2.5'}`}>
                                        <ChevronRightIcon size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-400 transition-colors inline-block" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                            <Search size={32} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-500 dark:text-slate-500 text-lg">Tidak ada data ditemukan</p>
                                            <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination & Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between px-6 md:px-8 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">Total Data: {filteredEmployees.length}</span>
                    <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase">Tampilkan:</span>
                    <select 
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-200"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                    <button 
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex items-center gap-1 px-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Halaman</span>
                        <input 
                        type="number" 
                        min={1} 
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => handlePageChange(Number(e.target.value))}
                        className="w-12 text-center py-1 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">dari {totalPages}</span>
                    </div>

                    <button 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <button 
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        <ChevronsRight size={16} />
                    </button>
                    </div>
                )}

                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium hidden md:block">
                    Menampilkan {Math.min(filteredEmployees.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredEmployees.length, currentPage * itemsPerPage)}
                </span>
            </div>
        </div>

        {/* Modal Detail Pegawai KP */}
        {selectedEmployee && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/50  transition-opacity" onClick={() => setSelectedEmployee(null)}></div>
            
            <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] animate-in scale-in-95 duration-200 flex flex-col overflow-hidden z-10 border border-slate-200/60">
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 md:p-8 relative overflow-hidden text-white flex-shrink-0 border-b border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <button 
                    onClick={() => setSelectedEmployee(null)}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 text-center sm:text-left">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-900 border-2 border-emerald-500 text-white font-bold text-lg sm:text-xl shadow-lg shadow-emerald-500/20 flex-shrink-0">
                        {selectedEmployee.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-display font-bold mb-1 text-white leading-tight">{selectedEmployee.nama}</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium">
                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                                <BadgeCheck size={14} className="text-slate-500" /> {selectedEmployee.nip}
                            </span>
                            <span className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                                selectedEmployee.statusKepegawaian === 'PNS' 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                                <User size={14} /> {selectedEmployee.statusKepegawaian}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

                <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
                    {/* Section 1: Promotion Hero Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 sm:p-6 relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pangkat / Golongan Lama</p>
                                <p className="text-sm sm:text-lg font-bold text-slate-500 dark:text-slate-500 line-through decoration-slate-300">
                                    {selectedEmployee.pangkatLama || '-'}
                                </p>
                            </div>

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-4"></div>

                            <div className="flex-1 text-right">
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Pangkat / Golongan Baru</p>
                                <p className="text-lg sm:text-2xl font-bold text-emerald-700">
                                    {selectedEmployee.pangkatBaru || selectedEmployee.pangkat}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Split Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Info Jabatan */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-50 pb-3">
                                    <Briefcase size={14} className="text-emerald-500" /> Unit & Kepegawaian
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Unit Kerja</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.unitKerja}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Jabatan</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.jabatan}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Status Kepegawaian</p>
                                        <span className="inline-block bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-1 rounded-md border border-emerald-100">{selectedEmployee.statusKepegawaian}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Masa Kerja Pegawai</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.masaKerja}</p>
                                    </div>
                                    {(selectedEmployee.suratUsulan && selectedEmployee.suratUsulan !== '-') && (
                                        <div className="pt-2 border-t border-slate-50">
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Surat Usulan</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.suratUsulan}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Kelengkapan Berkas KP */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                                <h3 className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-50 pb-3">
                                    <ListTodo size={14} className="text-emerald-500" /> Kelengkapan Dokumen KP
                                </h3>
                                {(() => {
                                    const docsForEmp = KP_DOC_CHECKLIST.filter(d => checkedDocs[`${selectedEmployee.id}_${d.id}`]).length;
                                    const pct = Math.round((docsForEmp / KP_DOC_CHECKLIST.length) * 100);
                                    return (
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                                                <span className="text-slate-400 dark:text-slate-500">Progres Berkas</span>
                                                <span className="text-emerald-600 font-mono">{pct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-500 h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                <div className="space-y-2.5">
                                    {KP_DOC_CHECKLIST.map(doc => {
                                        const isChecked = !!checkedDocs[`${selectedEmployee.id}_${doc.id}`];
                                        return (
                                            <label 
                                                key={doc.id} 
                                                className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                                    isChecked 
                                                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-700 dark:text-slate-200' 
                                                    : 'bg-slate-50/30 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-500'
                                                }`}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isChecked}
                                                    onChange={() => toggleDoc(doc.id)}
                                                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[11px] font-semibold leading-tight ${isChecked ? 'text-slate-800 dark:text-slate-100 line-through' : 'text-slate-600 dark:text-slate-500'}`}>{doc.label}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Status KP */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm flex flex-col">
                            <h3 className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-50 pb-3">
                                <TrendingUp size={14} className="text-emerald-500" /> Informasi Kenaikan
                            </h3>

                            <div className="mb-4 sm:mb-6">
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Hitungan Mundur KP</p>
                                {(() => {
                                    const days = getDaysRemaining(selectedEmployee.tmt);
                                    const label = days === null ? '-' : days <= 0 ? 'Waktunya KP' : `${days} Hari`;
                                    const className = days === null ? 'text-slate-300 dark:text-slate-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                                    
                                    return (
                                        <div className={`flex items-center gap-3 p-3 border rounded-xl ${className}`}>
                                            <Clock size={16} className="flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-sm">{label}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="space-y-4 flex-1 flex flex-col">
                                <div className="flex-1 pl-1 mb-4">
                                    {(() => {
                                        const { prev, next } = calculateKPCycleDates(selectedEmployee.tmt);
                                        return (
                                            <div className="space-y-0 border-l border-slate-200 dark:border-slate-700 ml-2 relative mt-2">
                                                {/* Item 1 */}
                                                <div className="relative pl-5 pb-5">
                                                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Periode Sebelumnya</p>
                                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{prev}</p>
                                                </div>

                                                {/* Item 2 (Active) */}
                                                <div className="relative pl-5 pb-5">
                                                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-fuchsia-500 ring-4 ring-fuchsia-50"></div>
                                                    <p className="text-[10px] text-fuchsia-600 font-bold uppercase tracking-wide mb-0.5">TMT Kenaikan Pangkat</p>
                                                    <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{selectedEmployee.tmt}</p>
                                                </div>

                                                {/* Item 3 */}
                                                <div className="relative pl-5">
                                                    <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white"></div>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Jadwal KP Berikutnya</p>
                                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{next}</p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {selectedEmployee.inputSiasn && selectedEmployee.inputSiasn !== '-' && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Input SIASN</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.inputSiasn}</p>
                                    </div>
                                )}

                                {selectedEmployee.statusSiasn && selectedEmployee.statusSiasn !== '-' && (
                                    <div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Status SIASN</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.statusSiasn}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Status Saat Ini</p>
                                    {selectedEmployee.status === 'Processed' ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <CheckCircle2 size={16} />
                                            <span className="text-sm font-bold">Selesai</span>
                                        </div>
                                    ) : selectedEmployee.status === 'Pending' ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                                            <AlertCircle size={16} />
                                            <span className="text-sm font-bold">Tertunda</span>
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                            <Clock size={16} />
                                            <span className="text-sm font-bold">Menunggu Jadwal</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                     <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">Data Kenaikan Pangkat ditarik secara sinkron dengan jadwal periode (April/Oktober dll).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: AI Assistant Hub removed */}
                </div>


                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-right flex-shrink-0 rounded-b-[2.5rem]">
                    <button 
                        onClick={() => setSelectedEmployee(null)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 font-bold rounded-xl hover:bg-slate-200 dark:bg-slate-700 transition-colors text-sm"
                    >
                        Tutup
                    </button>
                </div>
            </div>
            </div>,
            document.body
        )}
    </div>
  );
});

export default PromotionTable;

