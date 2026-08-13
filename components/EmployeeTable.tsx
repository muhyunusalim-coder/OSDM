
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Briefcase, Clock, CheckCircle2, BadgeCheck, User, X, TrendingUp, Calendar, AlertCircle, ChevronRight, CalendarRange, ChevronLeft, ChevronsLeft, ChevronsRight, Download, FileDown, ArrowUpDown, Sparkles, FileText, Cpu, Copy, Check, SlidersHorizontal } from 'lucide-react';
import { Employee } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { analyzeEmployeeKGB } from '../services/geminiService';

interface Props {
  employees: Employee[];
  onStatusToggle: (id: string) => void;
  onDeleteEmployee?: (id: string) => void;
  currentUser: Employee | null;
}

const ADMIN_NIP = '199601192025061007';

const EmployeeTable = React.memo(({ employees, onStatusToggle, onDeleteEmployee, currentUser }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('All'); // Changed from statusFilter to monthFilter
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [unitFilter, setUnitFilter] = useState<string>('All');
  const [golFilter, setGolFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [masaKerjaFilter, setMasaKerjaFilter] = useState<string>('All');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusChangeEmployee, setStatusChangeEmployee] = useState<Employee | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee | 'tmtDate'; direction: 'asc' | 'desc' } | null>({ key: 'tmtDate', direction: 'asc' });
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Sync selectedEmployee with updated employee data in props
  useEffect(() => {
    if (selectedEmployee) {
      const updated = employees.find(e => e.id === selectedEmployee.id);
      if (updated && (updated.status !== selectedEmployee.status || updated.salaryHistory?.length !== selectedEmployee.salaryHistory?.length)) {
        setSelectedEmployee(updated);
      }
    }
  }, [employees, selectedEmployee]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const requestSort = (key: keyof Employee | 'tmtDate') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getTmtDate = (tmt: string) => {
    // Handle YYYY-MM-DD
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(tmt);
    } 
    // Handle DD-MM-YYYY or DD/MM/YYYY
    else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(0);
  };

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const years = useMemo(() => {
    const years = new Set(employees.map(e => {
        const d = getTmtDate(e.tmt);
        return d.getFullYear().toString();
    }).filter(y => y !== '1970'));
    return Array.from(years).sort().reverse();
  }, [employees]);
   const currentYear = new Date().getFullYear();

  const getDaysRemaining = (tmt: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let tmtDate: Date | null = null;
    
    // Handle YYYY-MM-DD
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        tmtDate = new Date(tmt);
    } 
    // Handle DD-MM-YYYY or DD/MM/YYYY
    else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        tmtDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    if (!tmtDate || isNaN(tmtDate.getTime())) return null;

    const diffTime = tmtDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusLabel = (tmt: string): { label: string; class: string } => {
      const days = getDaysRemaining(tmt);
      if (days === null) return { label: '-', class: 'text-slate-300 dark:text-slate-600' };
      if (days <= 0) return { label: 'Sudah Waktunya', class: 'bg-rose-100 text-rose-700 border-rose-200' };
      if (days <= 30) return { label: 'Mendekati', class: 'bg-amber-100 text-amber-700 border-amber-200' };
      return { label: 'Aman', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  // Helper untuk menghitung siklus 2 tahunan
  const calculateCycleDates = (tmt: string) => {
    let tmtDate: Date | null = null;
    
    // Parsing logic matches existing getDaysRemaining
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        tmtDate = new Date(tmt);
    } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        tmtDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }

    if (!tmtDate || isNaN(tmtDate.getTime())) return { prev: '-', next: '-' };

    // Previous (-2 years)
    const prevDate = new Date(tmtDate);
    prevDate.setFullYear(tmtDate.getFullYear() - 2);

    // Next (+2 years)
    const nextDate = new Date(tmtDate);
    nextDate.setFullYear(tmtDate.getFullYear() + 2);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    return {
        prev: prevDate.toLocaleDateString('id-ID', options),
        next: nextDate.toLocaleDateString('id-ID', options)
    };
  };

  // Helper untuk format rupiah
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const uniqueUnits = useMemo(() => {
    const units = new Set(employees.map(e => e.unitKerja).filter(Boolean));
    return Array.from(units).sort();
  }, [employees]);

  const uniquePangkat = useMemo(() => {
    const pangkat = new Set(employees.map(e => e.pangkat).filter(Boolean));
    return Array.from(pangkat).sort();
  }, [employees]);

  const filtered = useMemo(() => {
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
                            emp.jabatan.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                            emp.unitKerja.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesUnit = unitFilter === 'All' || emp.unitKerja === unitFilter;
      const matchesGol = golFilter === 'All' || emp.pangkat === golFilter;
      const matchesType = typeFilter === 'All' || emp.statusKepegawaian === typeFilter;
      
      const tmtDate = getTmtDate(emp.tmt);
      
      // Filter Tahun
      const matchesYear = yearFilter === 'All' || tmtDate.getFullYear().toString() === yearFilter;
      
      // Filter Bulan
      let matchesMonth = true;
      if (monthFilter !== 'All') {
          const tmtMonthIndex = tmtDate.getMonth();
          const selectedMonthIndex = months.indexOf(monthFilter);
          matchesMonth = tmtMonthIndex === selectedMonthIndex;
      }

      // Filter Masa Kerja
      let matchesMasaKerja = true;
      if (masaKerjaFilter !== 'All') {
        const years = getMasaKerjaYears(emp.masaKerja);
        if (masaKerjaFilter === '0-5') matchesMasaKerja = years >= 0 && years <= 5;
        else if (masaKerjaFilter === '6-10') matchesMasaKerja = years >= 6 && years <= 10;
        else if (masaKerjaFilter === '11-15') matchesMasaKerja = years >= 11 && years <= 15;
        else if (masaKerjaFilter === '16-20') matchesMasaKerja = years >= 16 && years <= 20;
        else if (masaKerjaFilter === '21+') matchesMasaKerja = years >= 21;
      }

      return matchesSearch && matchesUnit && matchesGol && matchesType && matchesMonth && matchesYear && matchesMasaKerja;
    });
  }, [employees, debouncedSearchTerm, unitFilter, golFilter, typeFilter, monthFilter, yearFilter, masaKerjaFilter, months]);

  const sortedFiltered = useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = sortConfig.key === 'tmtDate' ? getTmtDate(a.tmt) : a[sortConfig.key];
        let bVal: any = sortConfig.key === 'tmtDate' ? getTmtDate(b.tmt) : b[sortConfig.key];

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, monthFilter, unitFilter, golFilter, typeFilter, yearFilter, masaKerjaFilter]);

  // Paginated Data
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFiltered, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (filtered.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.text("DAFTAR NOMINATIF PEGAWAI (KENAIKAN GAJI BERKALA)", 148.5, 15, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Periode Bulan: ${monthFilter !== 'All' ? monthFilter : 'Semua'} | Tahun: ${yearFilter !== 'All' ? yearFilter : 'Semua'}`, 148.5, 21, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 148.5, 26, { align: 'center' });

      const tableColumn = ["No", "Nama Pegawai", "NIP", "Golongan", "Jabatan", "Unit Kerja", "Masa Kerja", "TMT KGB", "Gaji Lama", "Gaji Baru"];
      const tableRows = filtered.map((emp, i) => [
        i + 1,
        emp.nama,
        emp.nip,
        emp.pangkat,
        emp.jabatan,
        emp.unitKerja,
        emp.masaKerja,
        emp.tmt,
        formatRupiah(emp.gajiLama),
        formatRupiah(emp.gajiBaru)
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 32,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          2: { halign: 'center', cellWidth: 35 },
          3: { halign: 'center', cellWidth: 20 },
          6: { halign: 'center', cellWidth: 18 },
          7: { halign: 'center', cellWidth: 22 },
          8: { halign: 'right', cellWidth: 25 },
          9: { halign: 'right', cellWidth: 25 },
        }
      });

      doc.save(`Data_KGB_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("Failed to export PDF", e);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
      if (filtered.length === 0) return;
      setIsExporting(true);

      try {
          const XLSX = await import('xlsx');
          
          const headers = [
              "No", "Nama Pegawai", "NIP", "Pangkat / Gol. Ruang",
              "Jabatan", "Unit Kerja", "Masa Kerja", "TMT KGB", "Gaji Lama", "Gaji Baru"
          ];
          
          const exportData = filtered.map((emp, index) => [
              index + 1,
              emp.nama,
              emp.nip,
              emp.pangkat,
              emp.jabatan,
              emp.unitKerja,
              emp.masaKerja,
              emp.tmt,
              emp.gajiLama,
              emp.gajiBaru
          ]);
          
          const title = ["DATA NOMINATIF PEGAWAI (KENAIKAN GAJI BERKALA)"];
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
          ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
          ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });
          
          // Column Widths
          const wscols = [
              {wch: 5},  // No
              {wch: 35}, // Nama
              {wch: 25}, // NIP
              {wch: 20}, // Pangkat
              {wch: 35}, // Jabatan
              {wch: 30}, // Unit Kerja
              {wch: 15}, // Masa Kerja
              {wch: 15}, // TMT
              {wch: 15}, // Gaji Lama
              {wch: 15}  // Gaji Baru
          ];
          ws['!cols'] = wscols;
          
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Data Pegawai");
          XLSX.writeFile(wb, `Data_Pegawai_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } catch (error) {
          console.error("Failed to export Excel", error);
      } finally {
          setIsExporting(false);
      }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 relative z-10">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight">Daftar Pegawai</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-0.5">Manajemen data kenaikan gaji berkala.</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2.5 flex-wrap">
            <button 
              onClick={handleExportExcel}
              disabled={isExporting || filtered.length === 0}
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
              disabled={isExportingPdf || filtered.length === 0}
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
              {(unitFilter !== 'All' || golFilter !== 'All' || masaKerjaFilter !== 'All') && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${isAdvancedFilterOpen ? 'bg-white dark:bg-slate-900 text-emerald-600' : 'bg-emerald-600 text-white'}`}>
                  {(unitFilter !== 'All' ? 1 : 0) + (golFilter !== 'All' ? 1 : 0) + (masaKerjaFilter !== 'All' ? 1 : 0)}
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
                {/* Status Kepegawaian Filter */}
                <div className={`relative flex-shrink-0 transition-all ${typeFilter !== 'All' ? 'ring-1 ring-emerald-400 rounded-lg' : ''}`}>
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${typeFilter !== 'All' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} size={14} />
                  <select 
                    className={`pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${typeFilter !== 'All' ? 'focus:ring-emerald-100 border-emerald-300' : 'focus:ring-emerald-500/10'} focus:border-emerald-500 text-xs appearance-none ${typeFilter !== 'All' ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold cursor-pointer w-full md:w-auto transition-all`}
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="All">Jenis</option>
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                  </select>
                </div>
                
                {/* Tahun Filter */}
                <div className={`relative flex-shrink-0 transition-all ${yearFilter !== 'All' ? 'ring-1 ring-emerald-400 rounded-lg' : ''}`}>
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${yearFilter !== 'All' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} size={14} />
                  <select 
                    className={`pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${yearFilter !== 'All' ? 'focus:ring-emerald-100 border-emerald-300' : 'focus:ring-emerald-500/10'} focus:border-emerald-500 text-xs appearance-none ${yearFilter !== 'All' ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold cursor-pointer w-full md:w-auto transition-all`}
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                  >
                    <option value="All">Semua Tahun</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Periode Filter (Bulan) */}
                <div className={`relative flex-shrink-0 transition-all ${monthFilter !== 'All' ? 'ring-1 ring-emerald-400 rounded-lg' : ''}`}>
                  <CalendarRange className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${monthFilter !== 'All' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}`} size={14} />
                  <select 
                    className={`pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 ${monthFilter !== 'All' ? 'focus:ring-emerald-100 border-emerald-300' : 'focus:ring-emerald-500/10'} focus:border-emerald-500 text-xs appearance-none ${monthFilter !== 'All' ? 'bg-emerald-50' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold cursor-pointer w-full md:w-auto transition-all`}
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                  >
                    <option value="All">Semua Periode</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
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
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
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
                value={golFilter}
                onChange={(e) => setGolFilter(e.target.value)}
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
                {(unitFilter !== 'All' || golFilter !== 'All' || masaKerjaFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setUnitFilter('All');
                      setGolFilter('All');
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
                <th className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Pangkat/Gol</th>
                <th className={`hidden lg:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Detail</th>
                <th className={`hidden xl:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Status</th>
                <th className={`whitespace-nowrap hidden xl:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Masa Kerja</th>
                <th 
                    className={`hidden md:table-cell cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`} 
                    onClick={() => requestSort('tmtDate')}
                >
                    <div className="flex items-center gap-1">
                        TMT
                        <ArrowUpDown size={12} className={sortConfig?.key === 'tmtDate' ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'} />
                    </div>
                </th>
                <th className={`text-center ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Hitungan Mundur KGB</th>
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
                              <div className={`text-emerald-700 dark:text-emerald-400 font-mono font-medium truncate ${isCompact ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs'}`}>{emp.nip}</div>
                          </div>
                      </div>
                    </td>
                    <td className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                        <div className={`inline-flex items-center rounded-xl font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-sm tracking-tight ${isCompact ? 'px-1.5 py-0.2 md:px-2 md:py-0.5 text-[9px] md:text-[10px]' : 'px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs'}`}>
                          {emp.pangkat}
                        </div>
                    </td>
                    <td className={`text-slate-600 dark:text-slate-500 hidden lg:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                      <div className={`font-semibold text-slate-700 dark:text-slate-200 mb-0.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{emp.jabatan}</div>
                      <div className={`text-slate-500 dark:text-slate-500 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{emp.unitKerja}</div>
                    </td>
                    
                    <td className={`hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                      {emp.statusKepegawaian === 'PNS' && (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                              PNS
                          </span>
                      )}
                      {emp.statusKepegawaian === 'PPPK' && (
                          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                              PPPK
                          </span>
                      )}
                    </td>

                    <td className={`text-slate-600 dark:text-slate-500 hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                      <span className={`bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 whitespace-nowrap ${isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                          {emp.masaKerja}
                      </span>
                    </td>
                    <td className={`hidden md:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                        <div className={`font-mono text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg inline-block shadow-sm ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
                            {emp.tmt}
                        </div>
                    </td>
                    <td className={`text-center whitespace-nowrap ${isCompact ? 'px-2 py-1 md:py-1.5' : 'px-2 py-2 md:px-4 md:py-2.5'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {currentUser?.nip === ADMIN_NIP ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusChangeEmployee(emp);
                            }}
                            className="transition-all active:scale-95 hover:scale-105 cursor-pointer focus:outline-none"
                            title={emp.status === 'Processed' ? "Klik untuk ubah status ke Belum Diproses" : "Klik untuk tandai Selesai"}
                          >
                            {emp.status === 'Processed' ? (
                              <div className={`inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm transition-all ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
                                <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0 text-emerald-600" />
                                <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                              </div>
                            ) : (
                              (() => {
                                const days = getDaysRemaining(emp.tmt);
                                const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                                const className = days === null ? 'text-slate-300 dark:text-slate-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800';
                                
                                return (
                                  <div className={`inline-flex items-center gap-1 rounded-lg border shadow-sm transition-all ${className} ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
                                    <Clock size={isCompact ? 10 : 12} className="flex-shrink-0" />
                                    <span className="text-[10px] font-bold hidden sm:inline">{label}</span>
                                  </div>
                                );
                              })()
                            )}
                          </button>
                        ) : (
                          emp.status === 'Processed' ? (
                            <div className={`inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title="Selesai">
                              <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0" />
                              <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                            </div>
                          ) : (
                            (() => {
                                const days = getDaysRemaining(emp.tmt);
                                const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                                const className = days === null ? 'text-slate-300 dark:text-slate-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
                                
                                return (
                                  <div className={`inline-flex items-center gap-1 rounded-lg border shadow-sm ${className} ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title={label}>
                                    <Clock size={isCompact ? 10 : 12} className="flex-shrink-0" />
                                    <span className="text-[10px] font-bold hidden sm:inline">{label}</span>
                                  </div>
                                );
                            })()
                          )
                        )}
                      </div>
                    </td>
                    <td className={`text-center ${isCompact ? 'px-1 py-1 md:px-2 md:py-1.5' : 'px-2 py-2 md:px-3 md:py-2.5'}`}>
                        <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 inline-block" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-20 text-center">
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
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between px-6 md:px-8 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">Total Data: {filtered.length}</span>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Sebelumnya"
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
                title="Halaman Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}

          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium hidden md:block">
            Menampilkan {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}
          </span>
        </div>
      </div>

      {/* Employee Detail Modal */}
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
                            <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-500/30 font-mono">
                                <BadgeCheck size={14} className="text-emerald-400" /> {selectedEmployee.nip}
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

            {/* Modal Body */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
              
              {/* Section 1: Salary Hero Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 sm:p-6 relative overflow-hidden shadow-sm">
                 <div className="flex flex-wrap gap-4 items-center justify-between relative z-10">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Gaji Lama</p>
                        <p className="text-sm sm:text-lg font-bold text-slate-500 dark:text-slate-500 font-mono line-through decoration-slate-300">
                           {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) ? formatRupiah(selectedEmployee.gajiLama) : 'Rp *******'}
                        </p>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                    <div className="flex-1 text-right">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Gaji Baru</p>
                        <p className="text-lg sm:text-2xl font-bold text-emerald-700 font-mono">
                           {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) ? formatRupiah(selectedEmployee.gajiBaru) : 'Rp *******'}
                        </p>
                    </div>
                    
                    {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) && (
                         <div className="w-full sm:w-auto text-right mt-2 sm:mt-0">
                             <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                +{formatRupiah(selectedEmployee.gajiBaru - selectedEmployee.gajiLama)}
                             </span>
                         </div>
                    )}
                 </div>
              </div>

              {/* Section 2: Split Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                 {/* Left Column: Employment Info */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-50 pb-3">
                        <Briefcase size={14} className="text-emerald-500" /> Informasi Kepegawaian
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
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Pangkat / Golongan</p>
                            <span className="inline-block bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-1 rounded-md border border-emerald-100">{selectedEmployee.pangkat}</span>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Masa Kerja Golongan</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedEmployee.masaKerja}</p>
                        </div>
                    </div>
                 </div>

                 {/* Right Column: Status & Timeline */}
                 <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm flex flex-col">
                    <h3 className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold mb-4 text-xs uppercase tracking-wider border-b border-slate-50 pb-3">
                        <TrendingUp size={14} className="text-emerald-500" /> Status & Jadwal
                    </h3>

                    <div className="mb-4 sm:mb-6">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Hitungan Mundur KGB</p>
                        {(() => {
                            const days = getDaysRemaining(selectedEmployee.tmt);
                            const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
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

                    {/* Action to Toggle Status inside Detail Modal */}
                    {currentUser?.nip === ADMIN_NIP && (
                       <div className="mb-4 sm:mb-6">
                         <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Aksi KGB</p>
                         <button
                           onClick={() => setStatusChangeEmployee(selectedEmployee)}
                           className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 border cursor-pointer ${
                             selectedEmployee.status === 'Processed'
                               ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                               : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                           }`}
                         >
                           {selectedEmployee.status === 'Processed' ? (
                             <>
                               <Clock size={14} />
                               Tandai Belum Selesai
                             </>
                           ) : (
                             <>
                               <CheckCircle2 size={14} />
                               Tandai Selesai KGB
                             </>
                           )}
                         </button>
                       </div>
                    )}

                    <div className="flex-1 pl-1">
                         {(() => {
                            const { prev, next } = calculateCycleDates(selectedEmployee.tmt);
                            return (
                                <div className="space-y-0 border-l border-slate-200 dark:border-slate-700 ml-2 relative">
                                    {/* Item 1 */}
                                    <div className="relative pl-5 pb-5">
                                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white"></div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Periode Sebelumnya</p>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-500">{prev}</p>
                                    </div>
                                    
                                    {/* Item 2 (Active) */}
                                    <div className="relative pl-5 pb-5">
                                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide mb-0.5">TMT Saat Ini</p>
                                        <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{selectedEmployee.tmt}</p>
                                    </div>

                                    {/* Item 3 */}
                                    <div className="relative pl-5">
                                        <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white"></div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">Jadwal Berikutnya</p>
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{next}</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                 </div>
              </div>

{/* Section 3: AI Assistant Hub removed */}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end rounded-b-[2.5rem] flex-shrink-0">
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

      {/* Status Change Confirmation Modal */}
      {statusChangeEmployee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40  transition-opacity duration-200"
            onClick={() => setStatusChangeEmployee(null)}
          ></div>
          
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 w-full max-w-md shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 z-10">
            <div className="flex flex-col items-center text-center">
              {statusChangeEmployee.status === 'Processed' ? (
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-5 shadow-inner">
                  <AlertCircle size={28} className="animate-pulse" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 size={28} />
                </div>
              )}
              
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display mb-2">
                Konfirmasi Perubahan Status
              </h3>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 w-full mb-5 text-left border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Pegawai:</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{statusChangeEmployee.nama}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">NIP:</span>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-500 font-mono">{statusChangeEmployee.nip}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Aksi:</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Mengubah status KGB ke{' '}
                      <span className={statusChangeEmployee.status === 'Processed' ? 'text-amber-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                        {statusChangeEmployee.status === 'Processed' ? 'Belum Selesai' : 'Selesai'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed mb-6">
                {statusChangeEmployee.status === 'Processed'
                  ? 'Apakah Anda yakin ingin membatalkan status Selesai untuk pegawai ini? Catatan riwayat gaji terkait akan tetap tersimpan tetapi status akan dikembalikan.'
                  : 'Apakah Anda yakin ingin menandai proses Kenaikan Gaji Berkala (KGB) untuk pegawai ini sebagai Selesai? Tindakan ini akan menambahkan catatan kenaikan gaji baru ke riwayat gaji pegawai.'}
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStatusChangeEmployee(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-500 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusToggle(statusChangeEmployee.id);
                    setStatusChangeEmployee(null);
                  }}
                  className={`flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 ${
                    statusChangeEmployee.status === 'Processed'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                  }`}
                >
                  Ya, Ubah Status
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

export default EmployeeTable;
