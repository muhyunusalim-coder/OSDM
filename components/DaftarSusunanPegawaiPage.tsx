import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Award,
  Briefcase,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  X,
  Eye,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Layers,
  Table as TableIcon,
  Grid,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  User,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { Employee } from '../types';
import { getBirthDateFromNIP, getRetirementAge, calculateTmtPensiun } from '../utils/pensionHelpers';

interface Props {
  employees: Employee[];
  currentUser: Employee | null;
}

type ViewMode = 'table' | 'education' | 'golongan' | 'jabatan';

export const DaftarSusunanPegawaiPage: React.FC<Props> = ({ employees, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PNS' | 'PPPK'>('All');
  const [golonganFilter, setGolonganFilter] = useState('All');
  const [educationFilter, setEducationFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [jabatanFilter, setJabatanFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'no-asc' | 'name-asc' | 'name-desc' | 'age-desc' | 'age-asc' | 'mk-desc' | 'nip-asc'>('no-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Pagination for table view
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Top Jabatans list
  const topJabatans = useMemo(() => {
    const counts: { [key: string]: number } = {};
    employees.forEach(e => {
      if (e.jabatan && e.jabatan !== '-') {
        counts[e.jabatan] = (counts[e.jabatan] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([jabatan, count]) => ({ jabatan, count }));
  }, [employees]);

  // Overall Statistics Calculation for 2.593 Pegawai BSKJI
  const stats = useMemo(() => {
    const total = employees.length;
    let pnsCount = 0;
    let pppkCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    let s3Count = 0;
    let s2Count = 0;
    let s1Count = 0;
    let d3Count = 0;
    let smaCount = 0;

    let golIV = 0;
    let golIII = 0;
    let golII = 0;
    let golI = 0;
    let golPPPK = 0;

    employees.forEach(emp => {
      // Status Kepegawaian
      if (emp.statusKepegawaian === 'PPPK') {
        pppkCount++;
      } else {
        pnsCount++;
      }

      // Gender
      const g = (emp.jenisKelamin || '').toLowerCase();
      if (g.includes('laki') || g.includes('pria')) {
        maleCount++;
      } else if (g.includes('perempuan') || g.includes('wanita')) {
        femaleCount++;
      }

      // Education
      const pend = (emp.pendidikan || emp.jenjangPendidikan || '').toUpperCase();
      if (pend.includes('S3') || pend.includes('S-3') || pend.includes('DOKTOR')) s3Count++;
      else if (pend.includes('S2') || pend.includes('S-2') || pend.includes('MAGISTER')) s2Count++;
      else if (pend.includes('S1') || pend.includes('S-1') || pend.includes('SARJANA') || pend.includes('D4') || pend.includes('D-IV')) s1Count++;
      else if (pend.includes('D3') || pend.includes('D-III') || pend.includes('DIPLOMA')) d3Count++;
      else if (pend.includes('SMA') || pend.includes('SMK') || pend.includes('SLTA') || pend.includes('STM')) smaCount++;

      // Golongan
      const p = (emp.pangkat || emp.golonganRaw || '').toUpperCase();
      if (p.includes('IV') || p.startsWith('4')) golIV++;
      else if (p.includes('III') || p.startsWith('3')) golIII++;
      else if (p.includes('II') || p.startsWith('2')) golII++;
      else if (p.includes('I/') || p.startsWith('1')) golI++;
      else if (p.includes('PPPK') || ['5', '7', '9', 'V', 'VII', 'IX'].includes(emp.golonganRaw || '')) golPPPK++;
    });

    return {
      total,
      pnsCount,
      pppkCount,
      pnsPercent: total > 0 ? ((pnsCount / total) * 100).toFixed(1) : '0',
      pppkPercent: total > 0 ? ((pppkCount / total) * 100).toFixed(1) : '0',
      maleCount,
      femaleCount,
      malePercent: total > 0 ? ((maleCount / total) * 100).toFixed(1) : '0',
      femalePercent: total > 0 ? ((femaleCount / total) * 100).toFixed(1) : '0',
      education: { s3Count, s2Count, s1Count, d3Count, smaCount },
      golongan: { golIV, golIII, golII, golI, golPPPK }
    };
  }, [employees]);

  // Filter and Sort employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch = !search ||
        (emp.nama && emp.nama.toLowerCase().includes(search)) ||
        (emp.nip && emp.nip.toLowerCase().includes(search)) ||
        (emp.jabatan && emp.jabatan.toLowerCase().includes(search)) ||
        (emp.pangkat && emp.pangkat.toLowerCase().includes(search)) ||
        (emp.pendidikan && emp.pendidikan.toLowerCase().includes(search)) ||
        (emp.diklatStruktural && emp.diklatStruktural.toLowerCase().includes(search)) ||
        (emp.no && emp.no.toString().includes(search));

      // Status Filter
      const matchStatus = statusFilter === 'All' || emp.statusKepegawaian === statusFilter;

      // Golongan Filter
      let matchGol = true;
      if (golonganFilter !== 'All') {
        const p = (emp.pangkat || emp.golonganRaw || '').toUpperCase();
        if (golonganFilter === 'IV') matchGol = p.includes('IV') || p.startsWith('4');
        else if (golonganFilter === 'III') matchGol = p.includes('III') || p.startsWith('3');
        else if (golonganFilter === 'II') matchGol = p.includes('II') || p.startsWith('2');
        else if (golonganFilter === 'I') matchGol = p.includes('I/') || p.startsWith('1');
        else if (golonganFilter === 'PPPK') matchGol = emp.statusKepegawaian === 'PPPK';
      }

      // Education Filter
      let matchEdu = true;
      if (educationFilter !== 'All') {
        const pend = (emp.pendidikan || emp.jenjangPendidikan || '').toUpperCase();
        if (educationFilter === 'S3') matchEdu = pend.includes('S3') || pend.includes('S-3') || pend.includes('DOKTOR');
        else if (educationFilter === 'S2') matchEdu = pend.includes('S2') || pend.includes('S-2') || pend.includes('MAGISTER');
        else if (educationFilter === 'S1') matchEdu = pend.includes('S1') || pend.includes('S-1') || pend.includes('SARJANA') || pend.includes('D4') || pend.includes('D-IV');
        else if (educationFilter === 'D3') matchEdu = pend.includes('D3') || pend.includes('D-III') || pend.includes('DIPLOMA');
        else if (educationFilter === 'SMA') matchEdu = pend.includes('SMA') || pend.includes('SMK') || pend.includes('SLTA') || pend.includes('STM');
      }

      // Gender Filter
      let matchGender = true;
      if (genderFilter !== 'All') {
        const g = (emp.jenisKelamin || '').toLowerCase();
        if (genderFilter === 'Laki-laki') matchGender = g.includes('laki') || g.includes('pria');
        else if (genderFilter === 'Perempuan') matchGender = g.includes('perempuan') || g.includes('wanita');
      }

      // Jabatan Filter
      const matchJabatan = jabatanFilter === 'All' || emp.jabatan === jabatanFilter;

      return matchSearch && matchStatus && matchGol && matchEdu && matchGender && matchJabatan;
    }).sort((a, b) => {
      if (sortBy === 'no-asc') {
        const numA = parseInt(a.no || '0', 10) || 0;
        const numB = parseInt(b.no || '0', 10) || 0;
        return numA - numB;
      }
      if (sortBy === 'name-asc') return (a.nama || '').localeCompare(b.nama || '', 'id');
      if (sortBy === 'name-desc') return (b.nama || '').localeCompare(a.nama || '', 'id');
      if (sortBy === 'age-desc') {
        const ageA = typeof a.usia === 'number' ? a.usia : parseInt(String(a.usia || '0'), 10) || 0;
        const ageB = typeof b.usia === 'number' ? b.usia : parseInt(String(b.usia || '0'), 10) || 0;
        return ageB - ageA;
      }
      if (sortBy === 'age-asc') {
        const ageA = typeof a.usia === 'number' ? a.usia : parseInt(String(a.usia || '0'), 10) || 0;
        const ageB = typeof b.usia === 'number' ? b.usia : parseInt(String(b.usia || '0'), 10) || 0;
        return ageA - ageB;
      }
      if (sortBy === 'nip-asc') return (a.nip || '').localeCompare(b.nip || '');
      if (sortBy === 'mk-desc') {
        const parseMk = (mk: string) => {
          const m = mk.match(/(\d+)\s*th/);
          return m ? parseInt(m[1], 10) : 0;
        };
        return parseMk(b.masaKerja || '') - parseMk(a.masaKerja || '');
      }
      return 0;
    });
  }, [employees, searchTerm, statusFilter, golonganFilter, educationFilter, genderFilter, jabatanFilter, sortBy]);

  // Paginated records for table view
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  const handleCopyNip = (nip: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nip);
    setCopiedField(nip);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export Full CSV with UTF-8 BOM for flawless Excel compatibility
  const handleExportCSV = () => {
    const headers = [
      'No',
      'Nama Lengkap',
      'NIP',
      'Jenis Kelamin',
      'Usia',
      'Status Kepegawaian',
      'Pangkat / Golongan',
      'Jabatan',
      'TMT',
      'Masa Kerja',
      'Pendidikan Terakhir',
      'Riwayat Pendidikan Lengkap',
      'Diklat Struktural'
    ];

    const csvRows = filteredEmployees.map((emp, index) => [
      emp.no || (index + 1).toString(),
      `"${(emp.nama || '').replace(/"/g, '""')}"`,
      `'${emp.nip || ''}`,
      `"${emp.jenisKelamin || '-'}"`,
      `"${emp.usia || '-'}"`,
      `"${emp.statusKepegawaian || '-'}"`,
      `"${(emp.pangkat || '').replace(/"/g, '""')}"`,
      `"${(emp.jabatan || '').replace(/"/g, '""')}"`,
      `"${emp.tmt || '-'}"`,
      `"${emp.masaKerja || '-'}"`,
      `"${(emp.pendidikanTerakhir || '').replace(/"/g, '""')}"`,
      `"${(emp.pendidikan || '').replace(/"/g, '""')}"`,
      `"${(emp.diklatStruktural || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Susunan_Pegawai_BSKJI_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Official DSP document
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-800 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Daftar Susunan Pegawai (DSP)
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
                  Data Master BSKJI
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Database Master Kepegawaian Badan Standardisasi dan Kebijakan Jasa Industri (Kementerian Perindustrian)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/50 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Ekspor Seluruh Data ke Excel / CSV"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Cetak Dokumen Resmi DSP"
          >
            <Printer size={15} />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* 2. Top Statistic KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Master Pegawai */}
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl relative overflow-hidden shadow-xs group hover:border-primary-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Total Personil BSKJI</span>
            <div className="p-1.5 bg-primary-500/10 text-primary-400 rounded-lg">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.total.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] font-semibold text-primary-400">Pegawai Aktif</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Sheet "Data Pegawai BSKJI"</span>
          </div>
        </div>

        {/* PNS Active */}
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl relative overflow-hidden shadow-xs hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Pegawai Negeri Sipil</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {stats.pnsPercent}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400">
              {stats.pnsCount.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-gray-400">PNS</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Golongan IV, III, II, dan I
          </div>
        </div>

        {/* PPPK Active */}
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl relative overflow-hidden shadow-xs hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Pegawai PPPK</span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {stats.pppkPercent}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">
              {stats.pppkCount.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-gray-400">PPPK</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400">
            Golongan V, VII, dan IX
          </div>
        </div>

        {/* Gender Demographics */}
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl relative overflow-hidden shadow-xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Rasio Jenis Kelamin</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <User size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-base sm:text-lg font-bold text-white">{stats.maleCount.toLocaleString('id-ID')}</span>
              <p className="text-[10px] text-cyan-400">Laki-laki ({stats.malePercent}%)</p>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold text-white">{stats.femaleCount.toLocaleString('id-ID')}</span>
              <p className="text-[10px] text-pink-400">Perempuan ({stats.femalePercent}%)</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden flex">
            <div style={{ width: `${stats.malePercent}%` }} className="bg-cyan-500 h-full" />
            <div style={{ width: `${stats.femalePercent}%` }} className="bg-pink-500 h-full" />
          </div>
        </div>

        {/* Education Highlight */}
        <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-xl relative overflow-hidden shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Tingkat Pendidikan</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {((stats.education.s3Count + stats.education.s2Count + stats.education.s1Count) / (stats.total || 1) * 100).toFixed(0)}%
            </span>
            <span className="text-[11px] text-gray-400">Sarjana & Pascasarjana</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-400 truncate">
            S3: {stats.education.s3Count} | S2: {stats.education.s2Count} | S1: {stats.education.s1Count}
          </div>
        </div>
      </div>

      {/* 3. Navigation View Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-gray-900 border border-gray-800 rounded-xl">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <TableIcon size={14} />
            <span>Tabel Lengkap DSP ({stats.total})</span>
          </button>

          <button
            onClick={() => setViewMode('education')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'education'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <GraduationCap size={14} />
            <span>Tingkat Pendidikan</span>
          </button>

          <button
            onClick={() => setViewMode('golongan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'golongan'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Award size={14} />
            <span>Pangkat / Golongan</span>
          </button>

          <button
            onClick={() => setViewMode('jabatan')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'jabatan'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <Briefcase size={14} />
            <span>Rumpun Jabatan</span>
          </button>
        </div>

        {/* Counter Info */}
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>Menampilkan <strong className="text-white">{filteredEmployees.length.toLocaleString('id-ID')}</strong> dari <strong className="text-white">{employees.length.toLocaleString('id-ID')}</strong> pegawai</span>
        </div>
      </div>

      {/* 4. Multi-Filter & Search Bar Panel */}
      <div className="p-4 bg-gray-900/70 border border-gray-800 rounded-xl space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Cari Nama, NIP, Jabatan, Pendidikan, Diklat..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Status ASN */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="All">Status ASN: Semua</option>
              <option value="PNS">PNS ({stats.pnsCount})</option>
              <option value="PPPK">PPPK ({stats.pppkCount})</option>
            </select>
          </div>

          {/* Filter Golongan */}
          <div className="md:col-span-2">
            <select
              value={golonganFilter}
              onChange={(e) => {
                setGolonganFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="All">Golongan: Semua</option>
              <option value="IV">Golongan IV (Pembina)</option>
              <option value="III">Golongan III (Penata)</option>
              <option value="II">Golongan II (Pengatur)</option>
              <option value="I">Golongan I (Juru)</option>
              <option value="PPPK">Golongan PPPK (IX, VII, V)</option>
            </select>
          </div>

          {/* Filter Pendidikan */}
          <div className="md:col-span-2">
            <select
              value={educationFilter}
              onChange={(e) => {
                setEducationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="All">Pendidikan: Semua</option>
              <option value="S3">S3 / Doktor ({stats.education.s3Count})</option>
              <option value="S2">S2 / Magister ({stats.education.s2Count})</option>
              <option value="S1">S1 / D4 Sarjana ({stats.education.s1Count})</option>
              <option value="D3">D3 / Diploma ({stats.education.d3Count})</option>
              <option value="SMA">SMA / SMK ({stats.education.smaCount})</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="no-asc">Urutan: No. Urut (1 - 2593)</option>
              <option value="name-asc">Nama: A → Z</option>
              <option value="name-desc">Nama: Z → A</option>
              <option value="age-desc">Usia: Tertua ke Termuda</option>
              <option value="age-asc">Usia: Termuda ke Tertua</option>
              <option value="mk-desc">Masa Kerja: Terlama</option>
              <option value="nip-asc">NIP: Terurut</option>
            </select>
          </div>
        </div>

        {/* Secondary Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1">
            <Filter size={12} /> Filter Cepat:
          </span>

          {/* Gender filter chips */}
          <button
            onClick={() => { setGenderFilter(genderFilter === 'Laki-laki' ? 'All' : 'Laki-laki'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              genderFilter === 'Laki-laki'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            Laki-laki ({stats.maleCount})
          </button>

          <button
            onClick={() => { setGenderFilter(genderFilter === 'Perempuan' ? 'All' : 'Perempuan'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              genderFilter === 'Perempuan'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
            }`}
          >
            Perempuan ({stats.femaleCount})
          </button>

          {/* Top Jabatan shortcut selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-gray-400 text-[11px]">Rumpun Jabatan:</span>
            <select
              value={jabatanFilter}
              onChange={(e) => {
                setJabatanFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2 text-[11px] bg-gray-800 text-gray-300 border border-gray-700 rounded-md focus:outline-none focus:border-primary-500 max-w-[200px] truncate"
            >
              <option value="All">Semua Jabatan ({topJabatans.length})</option>
              {topJabatans.slice(0, 15).map(j => (
                <option key={j.jabatan} value={j.jabatan}>
                  {j.jabatan} ({j.count})
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || statusFilter !== 'All' || golonganFilter !== 'All' || educationFilter !== 'All' || genderFilter !== 'All' || jabatanFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setGolonganFilter('All');
                setEducationFilter('All');
                setGenderFilter('All');
                setJabatanFilter('All');
                setCurrentPage(1);
              }}
              className="px-2 py-1 text-[11px] text-red-400 hover:text-red-300 bg-red-950/30 border border-red-800/40 rounded-md transition-colors ml-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* 5. VIEW MODES */}

      {/* VIEW MODE 1: TABEL LENGKAP DSP (2.593 PEGAWAI) */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-800/90 text-gray-300 border-b border-gray-700/80 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3.5 px-3 text-center w-12">No.</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Nama Pegawai & NIP</th>
                    <th className="py-3.5 px-3 min-w-[110px]">Gender / Usia</th>
                    <th className="py-3.5 px-3 min-w-[130px]">Pangkat / Gol.</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Jabatan</th>
                    <th className="py-3.5 px-3 min-w-[95px]">TMT</th>
                    <th className="py-3.5 px-3 min-w-[100px]">Masa Kerja</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Pendidikan Terakhir</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Diklat Struktural</th>
                    <th className="py-3.5 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-500">
                        <Users size={36} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">Tidak ada data pegawai yang sesuai dengan filter.</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('All');
                            setGolonganFilter('All');
                            setEducationFilter('All');
                            setGenderFilter('All');
                            setJabatanFilter('All');
                          }}
                          className="mt-3 text-xs text-primary-400 hover:underline"
                        >
                          Reset Semua Filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp, index) => {
                      const isCurrentUser = currentUser?.nip === emp.nip;
                      const isPPPK = emp.statusKepegawaian === 'PPPK';
                      const isFemale = (emp.jenisKelamin || '').toLowerCase().includes('perempuan');

                      return (
                        <tr
                          key={emp.id || `${emp.nip}-${index}`}
                          onClick={() => setSelectedEmployee(emp)}
                          className={`hover:bg-gray-800/50 transition-colors cursor-pointer group ${
                            isCurrentUser ? 'bg-primary-950/20 border-l-2 border-l-primary-500' : ''
                          }`}
                        >
                          {/* No */}
                          <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                            {emp.no || ((currentPage - 1) * itemsPerPage + index + 1)}
                          </td>

                          {/* Nama & NIP */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isPPPK
                                  ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                                  : isFemale
                                    ? 'bg-pink-900/60 text-pink-300 border border-pink-700/50'
                                    : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                              }`}>
                                {(emp.nama || 'A').slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate max-w-[200px]">
                                  {emp.nama}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                                  <span>{emp.nip}</span>
                                  <button
                                    onClick={(e) => handleCopyNip(emp.nip, e)}
                                    className="text-gray-500 hover:text-primary-400 transition-colors p-0.5"
                                    title="Salin NIP"
                                  >
                                    {copiedField === emp.nip ? (
                                      <Check size={11} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-primary-500/20 text-primary-300">
                                      Anda
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Gender & Usia */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                isFemale
                                  ? 'bg-pink-950/40 text-pink-300 border border-pink-800/40'
                                  : 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40'
                              }`}>
                                {emp.jenisKelamin || '-'}
                              </span>
                              <div className="text-[11px] text-gray-400">
                                {emp.usia ? `${emp.usia} th` : '-'}
                              </div>
                            </div>
                          </td>

                          {/* Pangkat / Golongan */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                isPPPK
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : (emp.pangkat || '').includes('IV')
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : (emp.pangkat || '').includes('III')
                                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {emp.pangkat || '-'}
                              </span>
                              <div className="text-[10px] text-gray-400 font-medium">
                                {isPPPK ? 'PPPK' : 'PNS'}
                              </div>
                            </div>
                          </td>

                          {/* Jabatan */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-200 line-clamp-2" title={emp.jabatan}>
                              {emp.jabatan || '-'}
                            </div>
                          </td>

                          {/* TMT */}
                          <td className="py-3 px-3 text-gray-300 font-mono text-[11px]">
                            {emp.tmt || '-'}
                          </td>

                          {/* Masa Kerja */}
                          <td className="py-3 px-3 text-gray-300 text-[11px]">
                            {emp.masaKerja || '-'}
                          </td>

                          {/* Pendidikan Terakhir */}
                          <td className="py-3 px-4">
                            <div className="text-gray-300 line-clamp-2 text-[11px]" title={emp.pendidikan}>
                              {emp.pendidikanTerakhir || emp.pendidikan || '-'}
                            </div>
                            {emp.jenjangPendidikan && emp.jenjangPendidikan !== '-' && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
                                {emp.jenjangPendidikan}
                              </span>
                            )}
                          </td>

                          {/* Diklat Struktural */}
                          <td className="py-3 px-4">
                            <div className="text-gray-400 line-clamp-2 text-[11px]" title={emp.diklatStruktural}>
                              {emp.diklatStruktural || '-'}
                            </div>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmployee(emp);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                              title="Lihat Profil Lengkap"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-800/60 border-t border-gray-800 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 bg-gray-800 border border-gray-700 text-white rounded focus:outline-none focus:border-primary-500"
                >
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
                <span className="ml-2 text-gray-400">
                  Halaman <strong className="text-white">{currentPage}</strong> dari <strong className="text-white">{totalPages}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Pertama
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Jump buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Terakhir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: TINGKAT PENDIDIKAN */}
      {viewMode === 'education' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* S3 Doktor */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">Doktor (S3)</span>
                <GraduationCap size={16} className="text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.education.s3Count}</div>
              <p className="text-[11px] text-gray-400">
                {((stats.education.s3Count / (stats.total || 1)) * 100).toFixed(1)}% dari total personil
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.education.s3Count / stats.total) * 100}%` }} className="bg-purple-500 h-full" />
              </div>
            </div>

            {/* S2 Magister */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">Magister (S2)</span>
                <GraduationCap size={16} className="text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.education.s2Count}</div>
              <p className="text-[11px] text-gray-400">
                {((stats.education.s2Count / (stats.total || 1)) * 100).toFixed(1)}% dari total personil
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.education.s2Count / stats.total) * 100}%` }} className="bg-blue-500 h-full" />
              </div>
            </div>

            {/* S1 Sarjana */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Sarjana (S1 / D4)</span>
                <GraduationCap size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.education.s1Count}</div>
              <p className="text-[11px] text-gray-400">
                {((stats.education.s1Count / (stats.total || 1)) * 100).toFixed(1)}% dari total personil
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.education.s1Count / stats.total) * 100}%` }} className="bg-emerald-500 h-full" />
              </div>
            </div>

            {/* D3 Diploma */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Diploma (D3)</span>
                <GraduationCap size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.education.d3Count}</div>
              <p className="text-[11px] text-gray-400">
                {((stats.education.d3Count / (stats.total || 1)) * 100).toFixed(1)}% dari total personil
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.education.d3Count / stats.total) * 100}%` }} className="bg-amber-500 h-full" />
              </div>
            </div>

            {/* SMA / SMK */}
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">SMA / SMK</span>
                <GraduationCap size={16} className="text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.education.smaCount}</div>
              <p className="text-[11px] text-gray-400">
                {((stats.education.smaCount / (stats.total || 1)) * 100).toFixed(1)}% dari total personil
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.education.smaCount / stats.total) * 100}%` }} className="bg-rose-500 h-full" />
              </div>
            </div>
          </div>

          {/* Breakdown List Pegawai dengan Pendidikan Tertentu */}
          <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-primary-400" />
              Daftar Pegawai Berpendidikan S3 (Doktor) & S2 (Magister) di Lingkungan BSKJI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees
                .filter(e => {
                  const p = (e.pendidikan || '').toUpperCase();
                  return p.includes('S3') || p.includes('S-3') || p.includes('DOKTOR') || p.includes('S2') || p.includes('S-2');
                })
                .slice(0, 30)
                .map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="p-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 rounded-xl transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-xs truncate max-w-[180px]">{emp.nama}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        (emp.pendidikan || '').toUpperCase().includes('S3') ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {(emp.pendidikan || '').toUpperCase().includes('S3') ? 'S3 Doktor' : 'S2 Magister'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{emp.jabatan}</div>
                    <div className="text-[10px] text-gray-500 line-clamp-1">{emp.pendidikanTerakhir || emp.pendidikan}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: BEZETTING GOLONGAN */}
      {viewMode === 'golongan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Golongan IV */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">Golongan IV (Pembina)</span>
                <Award size={18} className="text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.golongan.golIV}</div>
              <p className="text-xs text-gray-400">IV/e, IV/d, IV/c, IV/b, IV/a</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.golongan.golIV / stats.total) * 100}%` }} className="bg-amber-500 h-full" />
              </div>
            </div>

            {/* Golongan III */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">Golongan III (Penata)</span>
                <Award size={18} className="text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.golongan.golIII}</div>
              <p className="text-xs text-gray-400">III/d, III/c, III/b, III/a</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.golongan.golIII / stats.total) * 100}%` }} className="bg-blue-500 h-full" />
              </div>
            </div>

            {/* Golongan II */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Golongan II (Pengatur)</span>
                <Award size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.golongan.golII}</div>
              <p className="text-xs text-gray-400">II/d, II/c, II/b, II/a</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.golongan.golII / stats.total) * 100}%` }} className="bg-emerald-500 h-full" />
              </div>
            </div>

            {/* Golongan I */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">Golongan I (Juru)</span>
                <Award size={18} className="text-gray-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.golongan.golI}</div>
              <p className="text-xs text-gray-400">I/d, I/c, I/b, I/a</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.golongan.golI / stats.total) * 100}%` }} className="bg-gray-500 h-full" />
              </div>
            </div>

            {/* Golongan PPPK */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">PPPK (Gol. V, VII, IX)</span>
                <Award size={18} className="text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{stats.golongan.golPPPK}</div>
              <p className="text-xs text-gray-400">Golongan IX, VII, V</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div style={{ width: `${(stats.golongan.golPPPK / stats.total) * 100}%` }} className="bg-purple-500 h-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: RUMPUN JABATAN */}
      {viewMode === 'jabatan' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topJabatans.map((item, idx) => (
              <div
                key={item.jabatan}
                onClick={() => {
                  setJabatanFilter(item.jabatan);
                  setViewMode('table');
                  setCurrentPage(1);
                }}
                className="p-4 bg-gray-900 border border-gray-800 hover:border-primary-500/50 rounded-xl transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-white text-xs group-hover:text-primary-300 transition-colors">
                    {item.jabatan}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-primary-500/20 text-primary-300 border border-primary-500/30 shrink-0">
                    {item.count} orang
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(item.count / stats.total) * 100}%` }}
                    className="bg-primary-500 h-full"
                  />
                </div>
                <div className="text-[10px] text-gray-500 flex justify-between">
                  <span>Porsi: {((item.count / stats.total) * 100).toFixed(1)}%</span>
                  <span className="text-primary-400 group-hover:underline">Klik untuk filter →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL PEGAWAI (COMPREHENSIVE PROFILE DRAWER) */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedEmployee(null)}
        >
          <div
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                  selectedEmployee.statusKepegawaian === 'PPPK'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                    : 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                }`}>
                  {(selectedEmployee.nama || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedEmployee.nama}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="font-mono">{selectedEmployee.nip}</span>
                    <button
                      onClick={(e) => handleCopyNip(selectedEmployee.nip, e)}
                      className="text-primary-400 hover:text-primary-300"
                    >
                      {copiedField === selectedEmployee.nip ? 'Tersalin!' : 'Salin NIP'}
                    </button>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-500/20 text-primary-300">
                      {selectedEmployee.statusKepegawaian}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Jabatan */}
              <div className="p-3 bg-gray-800/50 border border-gray-800 rounded-xl space-y-1">
                <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
                  <Briefcase size={13} className="text-primary-400" /> Jabatan
                </span>
                <div className="font-semibold text-white">{selectedEmployee.jabatan || '-'}</div>
              </div>

              {/* Pangkat & Golongan */}
              <div className="p-3 bg-gray-800/50 border border-gray-800 rounded-xl space-y-1">
                <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
                  <Award size={13} className="text-amber-400" /> Pangkat / Golongan Ruang
                </span>
                <div className="font-semibold text-white">{selectedEmployee.pangkat || '-'}</div>
              </div>

              {/* Gender & Usia */}
              <div className="p-3 bg-gray-800/50 border border-gray-800 rounded-xl space-y-1">
                <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
                  <User size={13} className="text-cyan-400" /> Gender & Usia
                </span>
                <div className="font-semibold text-white">
                  {selectedEmployee.jenisKelamin || '-'} {selectedEmployee.usia ? `(${selectedEmployee.usia} tahun)` : ''}
                </div>
              </div>

              {/* TMT & Masa Kerja */}
              <div className="p-3 bg-gray-800/50 border border-gray-800 rounded-xl space-y-1">
                <span className="text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
                  <Clock size={13} className="text-emerald-400" /> TMT & Masa Kerja
                </span>
                <div className="font-semibold text-white">
                  TMT: {selectedEmployee.tmt || '-'} | MK: {selectedEmployee.masaKerja || '-'}
                </div>
              </div>
            </div>

            {/* Riwayat Pendidikan Lengkap */}
            <div className="p-4 bg-gray-800/40 border border-gray-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <GraduationCap size={15} className="text-emerald-400" /> Riwayat Pendidikan
              </span>
              <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed font-mono">
                {selectedEmployee.pendidikan || 'Tidak ada riwayat pendidikan tercatat.'}
              </div>
            </div>

            {/* Diklat Struktural */}
            <div className="p-4 bg-gray-800/40 border border-gray-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen size={15} className="text-blue-400" /> Riwayat Diklat Struktural & Kepemimpinan
              </span>
              <div className="text-xs text-gray-300 whitespace-pre-line leading-relaxed">
                {selectedEmployee.diklatStruktural || 'Belum ada diklat struktural yang tercatat.'}
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="flex items-center justify-between border-t border-gray-800 pt-3 text-xs">
              <span className="text-gray-500">Nomor Urut DSP: #{selectedEmployee.no}</span>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DaftarSusunanPegawaiPage;
