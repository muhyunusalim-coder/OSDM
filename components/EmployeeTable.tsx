import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  BadgeCheck,
  User,
  X,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  CalendarRange,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileDown,
  ArrowUpDown,
  Sparkles,
  FileText,
  Cpu,
  Copy,
  Check,
  SlidersHorizontal
} from 'lucide-react';
import { Employee } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { analyzeEmployeeKGB } from '../services/geminiService';
import {
  getTmtDate,
  getDaysRemaining,
  getStatusLabel,
  calculateCycleDates,
  calculateKPCycleDates,
  formatRupiah,
  getMasaKerjaYears,
  months
} from '../utils/employeeUtils';

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

  const years = useMemo(() => {
    const years = new Set(
      employees
        .map(e => {
          const d = getTmtDate(e.tmt);
          return d.getFullYear().toString();
        })
        .filter(y => y !== '1970')
    );
    return Array.from(years).sort().reverse();
  }, [employees]);

  const currentYear = new Date().getFullYear();

  const uniqueUnits = useMemo(() => {
    const units = new Set(employees.map(e => e.unitKerja).filter(Boolean));
    return Array.from(units).sort();
  }, [employees]);

  const uniquePangkat = useMemo(() => {
    const pangkat = new Set(employees.map(e => e.pangkat).filter(Boolean));
    return Array.from(pangkat).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.nama.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
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
        i + 1, emp.nama, emp.nip, emp.pangkat, emp.jabatan, emp.unitKerja, emp.masaKerja, emp.tmt, formatRupiah(emp.gajiLama), formatRupiah(emp.gajiBaru)
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
        index + 1, emp.nama, emp.nip, emp.pangkat, emp.jabatan, emp.unitKerja, emp.masaKerja, emp.tmt, emp.gajiLama, emp.gajiBaru
      ]);
      const title = ["DATA NOMINATIF PEGAWAI (KENAIKAN GAJI BERKALA)"];
      const subtitle = [`Bulan: ${monthFilter !== 'All' ? monthFilter : 'Semua'} | Tahun: ${yearFilter !== 'All' ? yearFilter : 'Semua'}`];
      const blankRow: string[] = [];
      const wsData = [
        title, subtitle, blankRow, headers,
        ...exportData
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge Title Cells
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });

      // Column Widths
      const wscols = [
        { wch: 5 },  // No
        { wch: 35 }, // Nama
        { wch: 25 }, // NIP
        { wch: 20 }, // Pangkat
        { wch: 35 }, // Jabatan
        { wch: 30 }, // Unit Kerja
        { wch: 15 }, // Masa Kerja
        { wch: 15 }, // TMT
        { wch: 15 }, // Gaji Lama
        { wch: 15 }  // Gaji Baru
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
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden print:shadow-none print:border-none">
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-900 relative z-10 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 ">Daftar Pegawai</h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs font-medium mt-0.5">Manajemen data kenaikan gaji berkala.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-2.5 flex-wrap items-center">
            {/* Search */}
            <div className={`relative flex-grow md:flex-grow-0 group w-full md:w-auto transition-all ${searchTerm !== '' ? 'ring-1 ring-primary-500 rounded-lg' : ''}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${searchTerm !== '' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'} group-focus-within:text-primary-500`} size={15} />
              <input
                type="text"
                placeholder="Cari Nama, NIP..."
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 text-xs w-full md:w-56 bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {/* Status Kepegawaian Filter */}
              <div className={`relative w-full sm:w-auto flex-shrink-0 transition-all ${typeFilter !== 'All' ? 'ring-1 ring-primary-400 rounded-lg' : ''}`}>
                <User className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none ${typeFilter !== 'All' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`} size={14} />
                <select
                  className={`pl-7 sm:pl-9 pr-2 sm:pr-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 text-xs appearance-none ${typeFilter !== 'All' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200'} hover:bg-white dark:hover:bg-gray-900 font-bold cursor-pointer w-full md:w-auto truncate`}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">Jenis</option>
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                </select>
              </div>

              {/* Tahun Filter */}
              <div className={`relative w-full sm:w-auto flex-shrink-0 transition-all ${yearFilter !== 'All' ? 'ring-1 ring-primary-400 rounded-lg' : ''}`}>
                <Calendar className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none ${yearFilter !== 'All' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`} size={14} />
                <select
                  className={`pl-7 sm:pl-9 pr-2 sm:pr-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 text-xs appearance-none ${yearFilter !== 'All' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200'} hover:bg-white dark:hover:bg-gray-900 font-bold cursor-pointer w-full md:w-auto truncate`}
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                >
                  <option value="All">Tahun</option>
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Periode Filter (Bulan) */}
              <div className={`relative w-full sm:w-auto flex-shrink-0 transition-all ${monthFilter !== 'All' ? 'ring-1 ring-primary-400 rounded-lg' : ''}`}>
                <CalendarRange className={`absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 pointer-events-none ${monthFilter !== 'All' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`} size={14} />
                <select
                  className={`pl-7 sm:pl-9 pr-2 sm:pr-6 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 text-xs appearance-none ${monthFilter !== 'All' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200'} hover:bg-white dark:hover:bg-gray-900 font-bold cursor-pointer w-full md:w-auto truncate`}
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="All">Periode</option>
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
          <div className="px-5 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 ">
            {/* Unit Kerja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <Briefcase size={12} className="text-primary-500" />
                <span>Unit Kerja</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
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
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <BadgeCheck size={12} className="text-primary-500" />
                <span>Golongan / Pangkat</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
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
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <Clock size={12} className="text-primary-500" />
                <span>Masa Kerja</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
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
                    className="px-2.5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 hover:text-gray-800 dark:text-gray-100 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
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
          <div className="h-[600px] print:h-auto print:overflow-visible  shadow-inner bg-white dark:bg-gray-900 rounded-b-2xl border border-gray-200 dark:border-gray-800">
            
          <table className="w-full text-left border-collapse min-w-[1000px]">
            
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[9px] md:text-[10px] uppercase font-bold st border-b border-gray-200 dark:border-gray-700">
                  <th className={`w-10 text-center hidden md:table-cell ${isCompact ? 'px-2 py-1.5 md:py-2' : 'px-2 py-2.5 md:px-4 md:py-3'}`}>#</th>
                  <th className={`cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`} onClick={() => requestSort('nama')}>
                    <div className="flex items-center gap-1">
                      Nama
                      <ArrowUpDown size={10} className={sortConfig?.key === 'nama' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                  </th>
                  <th className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Pangkat/Gol</th>
                  <th className={`hidden lg:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Detail</th>
                  <th className={`hidden xl:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Status</th>
                  <th className={`whitespace-nowrap hidden xl:table-cell ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Masa Kerja</th>
                  <th className={`hidden md:table-cell cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`} onClick={() => requestSort('tmtDate')}>
                    <div className="flex items-center gap-1">
                      TMT
                      <ArrowUpDown size={10} className={sortConfig?.key === 'tmtDate' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                  </th>
                  <th className={`text-center ${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}`}>Hitungan Mundur KGB</th>
                  <th className={`text-center print:hidden ${isCompact ? 'px-1 py-1.5 md:px-2 md:py-2' : 'px-2 py-2.5 md:px-3 md:py-3'}`}></th>
                </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 ${
                      selectedEmployee?.id === emp.id
                        ? '!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm'
                        : 'border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500'
                    }`}
                  >
                    <td className={`text-center text-gray-400 dark:text-gray-500 font-medium text-[10px] md:text-xs hidden md:table-cell ${isCompact ? 'px-2 py-1 md:py-1.5' : 'px-2 py-2 md:px-4 md:py-2.5'}`}>
                    {index + 1}
                  </td>
                  <td className={isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className={`font-bold text-gray-800 dark:text-gray-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate pr-1 md:pr-2 ${isCompact ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'}`}>{emp.nama}</div>
                        <div className={`text-gray-500 dark:text-gray-400 font-mono font-medium truncate ${isCompact ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs'}`}>{emp.nip}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`inline-flex items-center rounded-xl font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm  ${isCompact ? 'px-1.5 py-0.2 md:px-2 md:py-0.5 text-[9px] md:text-[10px]' : 'px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs'}`}>
                      {emp.pangkat}
                    </div>
                  </td>
                  <td className={`text-gray-600 dark:text-gray-500 hidden lg:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`font-semibold text-gray-700 dark:text-gray-200 mb-0.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{emp.jabatan}</div>
                    <div className={`text-gray-500 dark:text-gray-500 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{emp.unitKerja}</div>
                  </td>

                  <td className={`hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    {emp.statusKepegawaian === 'PNS' && (
                      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-primary-100/80 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300 border border-primary-200 dark:border-primary-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                        PNS
                      </span>
                    )}
                    {emp.statusKepegawaian === 'PPPK' && (
                      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                        PPPK
                      </span>
                    )}
                  </td>

                  <td className={`text-gray-600 dark:text-gray-500 hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <span className={`bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-700 whitespace-nowrap ${isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                      {emp.masaKerja}
                    </span>
                  </td>
                  <td className={`hidden md:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`font-mono text-gray-800 dark:text-gray-200 font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg inline-block shadow-sm ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
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
                            <div className={`inline-flex items-center gap-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 shadow-sm transition-all ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
                              <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0 text-primary-600" />
                              <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                            </div>
                          ) : (
                            (() => {
                              const days = getDaysRemaining(emp.tmt);
                              const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                              const className = days === null ? 'text-gray-300 dark:text-gray-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-800';
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
                          <div className={`inline-flex items-center gap-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 shadow-sm ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title="Selesai">
                            <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0" />
                            <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                          </div>
                        ) : (
                          (() => {
                            const days = getDaysRemaining(emp.tmt);
                            const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                            const className = days === null ? 'text-gray-300 dark:text-gray-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
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
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 inline-block" />
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                      <td colSpan={9} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-4">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800">
                            <Search size={32} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 dark:text-gray-500 text-lg">Tidak ada data ditemukan</p>
                            <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  
              )}
            </tbody>
<tbody className="divide-y divide-gray-200 hidden print:table-row-group print:text-black">
              {sortedFiltered.length > 0 ? (
                sortedFiltered.map((emp, index) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 ${
                      selectedEmployee?.id === emp.id
                        ? '!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm'
                        : 'border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500'
                    }`}
                  >
                    <td className={`text-center text-gray-400 dark:text-gray-500 font-medium text-[10px] md:text-xs hidden md:table-cell ${isCompact ? 'px-2 py-1 md:py-1.5' : 'px-2 py-2 md:px-4 md:py-2.5'}`}>
                    {index + 1}
                  </td>
                  <td className={isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <div className={`font-bold text-gray-800 dark:text-gray-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate pr-1 md:pr-2 ${isCompact ? 'text-[11px] md:text-xs' : 'text-xs md:text-sm'}`}>{emp.nama}</div>
                        <div className={`text-gray-500 dark:text-gray-400 font-mono font-medium truncate ${isCompact ? 'text-[9px] md:text-[10px]' : 'text-[10px] md:text-xs'}`}>{emp.nip}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`hidden sm:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`inline-flex items-center rounded-xl font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700 text-gray-800 dark:text-gray-200 shadow-sm  ${isCompact ? 'px-1.5 py-0.2 md:px-2 md:py-0.5 text-[9px] md:text-[10px]' : 'px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs'}`}>
                      {emp.pangkat}
                    </div>
                  </td>
                  <td className={`text-gray-600 dark:text-gray-500 hidden lg:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`font-semibold text-gray-700 dark:text-gray-200 mb-0.5 ${isCompact ? 'text-[11px]' : 'text-xs'}`}>{emp.jabatan}</div>
                    <div className={`text-gray-500 dark:text-gray-500 ${isCompact ? 'text-[9px]' : 'text-[10px]'}`}>{emp.unitKerja}</div>
                  </td>

                  <td className={`hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    {emp.statusKepegawaian === 'PNS' && (
                      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-primary-100/80 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300 border border-primary-200 dark:border-primary-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                        PNS
                      </span>
                    )}
                    {emp.statusKepegawaian === 'PPPK' && (
                      <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-100/80 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700/60 ${isCompact ? 'px-1.5 py-0.2 text-[8px]' : 'px-2 py-0.5 text-[9px]'}`}>
                        PPPK
                      </span>
                    )}
                  </td>

                  <td className={`text-gray-600 dark:text-gray-500 hidden xl:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <span className={`bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-700 whitespace-nowrap ${isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]'}`}>
                      {emp.masaKerja}
                    </span>
                  </td>
                  <td className={`hidden md:table-cell ${isCompact ? 'px-2 py-1 md:px-3 md:py-1.5' : 'px-3 py-2 md:px-4 md:py-2.5'}`}>
                    <div className={`font-mono text-gray-800 dark:text-gray-200 font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg inline-block shadow-sm ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}>
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
                            <div className={`inline-flex items-center gap-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 shadow-sm transition-all ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
                              <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0 text-primary-600" />
                              <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                            </div>
                          ) : (
                            (() => {
                              const days = getDaysRemaining(emp.tmt);
                              const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                              const className = days === null ? 'text-gray-300 dark:text-gray-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-800';
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
                          <div className={`inline-flex items-center gap-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 shadow-sm ${isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`} title="Selesai">
                            <CheckCircle2 size={isCompact ? 10 : 12} className="flex-shrink-0" />
                            <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                          </div>
                        ) : (
                          (() => {
                            const days = getDaysRemaining(emp.tmt);
                            const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                            const className = days === null ? 'text-gray-300 dark:text-gray-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
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
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 inline-block" />
                  </td>
                  </tr>
                ))
              ) : (
                <tr>
                      <td colSpan={9} className="p-20 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-4">
                          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800">
                            <Search size={32} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-500 dark:text-gray-500 text-lg">Tidak ada data ditemukan</p>
                            <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between px-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase r">
              Total: {filtered.length} Pegawai
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase">
                Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
<option value={25}>25</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
      {/* Employee Detail Modal */}
      {selectedEmployee && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={() => setSelectedEmployee(null)}></div>

          <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] duration-200 flex flex-col overflow-hidden z-10 border border-gray-200/60">
            {/* Modal Header */}
            <div className="bg-gray-900 p-6 md:p-8 relative overflow-hidden text-white flex-shrink-0 border-b border-gray-800">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 relative z-10 text-center sm:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gray-800 border-2 border-primary-500 text-white font-bold text-lg sm:text-xl shadow-lg shadow-primary-500/20 flex-shrink-0">
                  {selectedEmployee.nama.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white leading-tight">{selectedEmployee.nama}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-medium">
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 font-mono">
                      <BadgeCheck size={14} className="text-gray-500" /> {selectedEmployee.nip}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                        selectedEmployee.statusKepegawaian === 'PNS'
                          ? 'bg-primary-500/20 text-primary-300 border-primary-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <User size={14} /> {selectedEmployee.statusKepegawaian}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">
              {/* Section 1: Salary Hero Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-4 sm:p-6 relative overflow-hidden shadow-sm">
                <div className="flex flex-wrap gap-4 items-center justify-between relative z-10">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase r mb-0.5">Gaji Lama</p>
                    <p className="text-sm sm:text-lg font-bold text-gray-500 dark:text-gray-500 font-mono line-through decoration-gray-300">
                      {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) ? formatRupiah(selectedEmployee.gajiLama) : 'Rp *******'}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                  <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold text-primary-500 uppercase r mb-0.5">Gaji Baru</p>
                    <p className="text-lg sm:text-2xl font-bold text-primary-700 font-mono">
                      {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) ? formatRupiah(selectedEmployee.gajiBaru) : 'Rp *******'}
                    </p>
                  </div>

                  {(currentUser?.nip === selectedEmployee.nip || currentUser?.nip === ADMIN_NIP) && (
                    <div className="w-full sm:w-auto text-right mt-2 sm:mt-0">
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                        +{formatRupiah(selectedEmployee.gajiBaru - selectedEmployee.gajiLama)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Split Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column: Employment Info */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm">
                  <h3 className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold mb-4 text-xs uppercase r border-b border-gray-50 pb-3">
                    <Briefcase size={14} className="text-primary-500" /> Informasi Kepegawaian
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Unit Kerja</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{selectedEmployee.unitKerja}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Jabatan</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{selectedEmployee.jabatan}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Pangkat / Golongan</p>
                      <span className="inline-block bg-primary-50 text-primary-700 font-bold text-xs px-2 py-1 rounded-md border border-primary-100">{selectedEmployee.pangkat}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Masa Kerja Golongan</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{selectedEmployee.masaKerja}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Status & Timeline */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-5 sm:p-6 shadow-sm flex flex-col">
                  <h3 className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold mb-4 text-xs uppercase r border-b border-gray-50 pb-3">
                    <TrendingUp size={14} className="text-primary-500" /> Status & Jadwal
                  </h3>

                  <div className="mb-4 sm:mb-6">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Hitungan Mundur KGB</p>
                    {(() => {
                      const days = getDaysRemaining(selectedEmployee.tmt);
                      const label = days === null ? '-' : days <= 0 ? 'Waktunya' : `${days} Hari`;
                      const className = days === null ? 'text-gray-300 dark:text-gray-600' : days <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
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
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Aksi KGB</p>
                      <button
                        onClick={() => setStatusChangeEmployee(selectedEmployee)}
                        className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 border cursor-pointer ${
                          selectedEmployee.status === 'Processed'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
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
                        <div className="space-y-0 border-l border-gray-200 dark:border-gray-700 ml-2 relative">
                          {/* Item 1 */}
                          <div className="relative pl-5 pb-5">
                            <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-gray-300 ring-4 ring-white"></div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ">Periode Sebelumnya</p>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-500">{prev}</p>
                          </div>

                          {/* Item 2 (Active) */}
                          <div className="relative pl-5 pb-5">
                            <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-primary-500 ring-4 ring-primary-50"></div>
                            <p className="text-[10px] text-primary-500 font-bold uppercase mb-0.5">TMT Saat Ini</p>
                            <p className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">{selectedEmployee.tmt}</p>
                          </div>

                          {/* Item 3 */}
                          <div className="relative pl-5">
                            <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 ring-4 ring-white"></div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium ">Jadwal Berikutnya</p>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500">{next}</p>
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
            <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end rounded-b-[2.5rem] flex-shrink-0">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-500 font-bold rounded-xl hover:bg-gray-200 dark:bg-gray-700 transition-colors text-sm"
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
            className="absolute inset-0 bg-gray-900/40 transition-opacity duration-200"
            onClick={() => setStatusChangeEmployee(null)}
          ></div>

          <div className="relative bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 w-full max-w-md shadow-2xl p-6 sm:p-8 duration-200 z-10">
            <div className="flex flex-col items-center text-center">
              {statusChangeEmployee.status === 'Processed' ? (
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-5 shadow-inner">
                  <AlertCircle size={28} className="" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center mb-5 shadow-inner">
                  <CheckCircle2 size={28} />
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Konfirmasi Perubahan Status
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 w-full mb-5 text-left border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col gap-1.5">
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Pegawai:</span>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{statusChangeEmployee.nama}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">NIP:</span>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 font-mono">{statusChangeEmployee.nip}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Aksi:</span>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      Mengubah status KGB ke{' '}
                      <span className={statusChangeEmployee.status === 'Processed' ? 'text-amber-600 font-extrabold' : 'text-primary-600 font-extrabold'}>
                        {statusChangeEmployee.status === 'Processed' ? 'Belum Selesai' : 'Selesai'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed mb-6">
                {statusChangeEmployee.status === 'Processed'
                  ? 'Apakah Anda yakin ingin membatalkan status Selesai untuk pegawai ini? Catatan riwayat gaji terkait akan tetap tersimpan tetapi status akan dikembalikan.'
                  : 'Apakah Anda yakin ingin menandai proses Kenaikan Gaji Berkala (KGB) untuk pegawai ini sebagai Selesai? Tindakan ini akan menambahkan catatan kenaikan gaji baru ke riwayat gaji pegawai.'}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStatusChangeEmployee(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-500 rounded-xl font-bold text-xs transition-colors cursor-pointer"
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
                      : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/10'
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
