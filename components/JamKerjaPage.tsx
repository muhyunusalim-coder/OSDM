import React, { useState, useEffect, useMemo } from 'react';
import { DeferredView } from './DeferredView';
import { 
  Search, Clock, User, AlertTriangle, Calendar, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  X, Filter, Loader2, Download, CheckCircle, HelpCircle, 
  Briefcase, Activity, CalendarDays, BarChart3, ArrowUpDown, ChevronDown, Award,
  FileSpreadsheet, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { 
  fetchJamKerjaData, JamKerjaRecord, DailyAttendance, 
  formatMinutesFriendly, getDayNameIndonesian,
  getDayOfWeekForMonth, isWeekendForMonth, getIndonesianHolidayName
} from '../utils/jamKerjaHelpers';

function getQuarterFromMonth(monthName: string): { key: string; label: string } {
  const m = monthName.toLowerCase();
  if (m.includes("januari") || m.includes("februari") || m.includes("maret") || m.includes("jan") || m.includes("feb") || m.includes("mar")) {
    return { key: "Q1", label: "Triwulan I" };
  }
  if (m.includes("april") || m.includes("mei") || m.includes("juni") || m.includes("apr") || m.includes("may") || m.includes("jun")) {
    return { key: "Q2", label: "Triwulan II" };
  }
  if (m.includes("juli") || m.includes("agustus") || m.includes("september") || m.includes("jul") || m.includes("aug") || m.includes("sep")) {
    return { key: "Q3", label: "Triwulan III" };
  }
  if (m.includes("oktober") || m.includes("november") || m.includes("desember") || m.includes("oct") || m.includes("nov") || m.includes("dec")) {
    return { key: "Q4", label: "Triwulan IV" };
  }
  return { key: "Lainnya", label: "Lainnya" };
}

export function translateMonthName(monthStr: string, lang: string) {
  if (lang !== 'en') return monthStr;
  const monthMap: Record<string, string> = {
    'Januari': 'January',
    'Februari': 'February',
    'Maret': 'March',
    'April': 'April',
    'Mei': 'May',
    'Juni': 'June',
    'Juli': 'July',
    'Agustus': 'August',
    'September': 'September',
    'Oktober': 'October',
    'November': 'November',
    'Desember': 'December',
    'Semua': 'All'
  };
  return monthMap[monthStr] || monthStr;
}

interface JamKerjaPageProps {
  language?: 'id' | 'en';
}

const LOCAL_TRANSLATIONS = {
  id: {
    title: "Analisis Kekurangan Jam Kerja ASN",
    subtitle: "Sistem ini menghitung secara akurat akumulasi jam kerja dan kekurangan waktu kerja (deficiency) Pegawai ASN BSKJI berdasarkan Peraturan Jam Kerja.",
    rules_title: "Aturan Jam Kerja ASN BSKJI",
    mon_thu: "Senin s.d Kamis",
    fri: "Jumat",
    break: "Istirahat",
    max_checkout: "Pulang Maks",
    rule_note_1: "Jam Flexi Masuk s.d 08:30. Keterlambatan check-in di atas 08:30 atau kepulangan melebihi batas maksimal dihitung sebagai kekurangan jam kerja (Target: 7.5 jam/hari).",
    rule_note_2: "Kode Absensi Khusus: CT (Cuti Tahunan), C (Cuti Sakit/Lainnya), D/DL (Dinas/Dinas Luar), T (Tugas Belajar), DK, dan TL dibebaskan dari target jam kerja harian & tidak dihitung sebagai kekurangan waktu kerja.",
    total_employees: "Total Pegawai",
    total_employees_sub: "Pegawai dimonitor",
    avg_deficiency: "Rata-rata Kekurangan",
    avg_deficiency_sub: "Akumulasi per pegawai / bulan",
    presence_rate: "Tingkat Kehadiran",
    presence_rate_sub: "Dari total hari wajib kerja",
    exemplary_employee: "Pegawai Teladan",
    work_time: "Kerja",
    def_time: "Kurang",
    leave_time: "Cuti",
    quarter_recap: "Rekapitulasi Triwulan & Akumulasi Jam Kerja",
    quarter_recap_sub: "Analisis akumulasi kekurangan jam kerja secara triwulanan dan komparasi kumulatif individu",
    quarter_1: "Triwulan I",
    quarter_1_sub: "Januari - Maret 2026",
    quarter_1_desc: "Mencakup bulan: Februari, Maret (Ramadan aktif tgl 19 Feb s.d 17 Mar)",
    quarter_2: "Triwulan II",
    quarter_2_sub: "April - Juni 2026",
    quarter_2_desc: "Mencakup bulan: Mei, Juni (Jam kerja normal berlaku penuh)",
    total_accumulated: "Total Akumulasi",
    until_now: "Hingga Saat Ini (Feb - Jun)",
    total_accumulated_desc: "Akumulasi total kekurangan jam dari seluruh bulan data yang terdata.",
    accumulation_list: "Daftar Akumulasi Kekurangan per Pegawai",
    accumulation_list_sub: "Total komulatif kekurangan jam kerja untuk setiap pegawai secara rinci",
    export_accumulation: "Ekspor Excel Akumulasi",
    search_placeholder: "Cari Nama atau NIP...",
    all_units: "Semua Unit Kerja",
    all_months: "Semua Bulan",
    all_statuses: "Semua Status Akumulasi",
    very_good: "Sangat Baik",
    good: "Baik",
    cukup: "Cukup",
    kurang: "Kurang",
    lisan_warning: "Teguran Lisan",
    need_guidance: "Perlu Pembinaan",
    heavy_action: "Tindakan Berat",
    visual_analysis: "Visualisasi & Analisis Jam Kerja",
    visual_analysis_sub: "Grafik analisis performa waktu kerja pegawai ASN BSKJI",
    presence_perf: "Performa Kehadiran",
    daily_trend: "Tren Harian",
    highest_def: "Kekurangan Terbanyak",
    status_dist: "Distribusi Status",
    attendance_list: "Daftar Kehadiran Pegawai ASN",
    attendance_list_sub: "Klik baris pegawai untuk melihat detail absensi kalender harian",
    day_date: "Hari & Tanggal",
    check_in: "Jam Masuk",
    check_out: "Jam Pulang",
    work_duration: "Waktu Kerja",
    deficiency: "Kekurangan",
    daily_log: "Log Harian Absensi",
    daily_log_sub: "Rincian absen, jam masuk-pulang, dan kekurangan kerja per hari",
    only_deficiencies: "Hanya Hari dengan Kekurangan",
    fulfilled: "Terpenuhi",
    alfa: "Alfa / Mangkir",
    weekend: "Akhir Pekan / Hari Libur",
    done: "Selesai",
    print: "Cetak",
    not_found: "Tidak ada data pegawai yang sesuai pencarian.",
    tab_ringkasan: "Ringkasan",
    tab_bulanan: "Data Bulanan",
    tab_triwulan: "Rekap Triwulan",
    average_monthly_deficiency_desc: "Analisis performa rata-rata kehadiran (%) & rata-rata kekurangan (jam) per bulan",
    compare_monthly_deficiency_desc: "Perbandingan performa rata-rata kehadiran (%) & rata-rata kekurangan (jam) antar unit kerja bulan",
    attendance_rate_axis: "Tingkat Kehadiran (%)",
    deficiency_axis: "Rata-rata Kekurangan (Jam)",
    total_deficiency_axis: "Total Kekurangan (Jam)",
    total_deficiency_label: "Total Kekurangan (Jam)",
    attendance_rate_label: "Tingkat Kehadiran (%)",
    days: "Hari",
    hours: "Jam",
    employee: "Pegawai",
    unit_work: "Unit Kerja",
    action: "Aksi",
    download_excel: "Unduh Excel",
    status_discipline: "Status Kedisiplinan",
    no_data: "Tidak ada data pegawai.",
    showing: "Menampilkan",
    to: "hingga",
    of: "dari",
    remaining_lisan_warning: "Sisa {remaining} s.d Teguran Lisan (3 Hari / 22.5j)",
    reached_lisan_warning: "Sudah s.d batas Teguran Lisan",
    error_title: "Terjadi Kesalahan",
    error_retry: "Coba Lagi",
    loader_message: "Memproses & menghitung database jam kerja...",
    print_title: "LAPORAN MONITORING KEHADIRAN & KEKURANGAN JAM KERJA ASN",
    print_title_detail: "LAPORAN RINCIAN KEHADIRAN & KEKURANGAN JAM KERJA INDIVIDU"
  },
  en: {
    title: "ASN Working Hours Deficiency Analysis",
    subtitle: "This system accurately computes the accumulated working hours and working time deficiency (deficit) for BSKJI ASN employees based on Working Hours Regulations.",
    rules_title: "BSKJI ASN Work Hours Rules",
    mon_thu: "Monday to Thursday",
    fri: "Friday",
    break: "Break Time",
    max_checkout: "Max Checkout",
    rule_note_1: "Flexi hours enter up to 08:30. Check-ins after 08:30 or checkouts before the maximum time are computed as working hour deficits (Target: 7.5 hours/day).",
    rule_note_2: "Special Attendance Codes: CT (Annual Leave), C (Sick/Other Leave), D/DL (On-Duty/External Duty), T (Study Duty), DK, and TL are exempt from daily hour targets & do not count as working hour deficits.",
    total_employees: "Total Employees",
    total_employees_sub: "Monitored employees",
    avg_deficiency: "Average Deficiency",
    avg_deficiency_sub: "Accumulated per employee / month",
    presence_rate: "Attendance Rate",
    presence_rate_sub: "Of total required working days",
    exemplary_employee: "Exemplary Employee",
    work_time: "Work",
    def_time: "Deficit",
    leave_time: "Leave",
    quarter_recap: "Quarterly Summary & Working Hour Accumulation",
    quarter_recap_sub: "Quarterly deficiency accumulation analysis and cumulative individual comparison",
    quarter_1: "Quarter I",
    quarter_1_sub: "January - March 2026",
    quarter_1_desc: "Includes months: February, March (Ramadan active Feb 19 - Mar 17)",
    quarter_2: "Quarter II",
    quarter_2_sub: "April - June 2026",
    quarter_2_desc: "Includes months: May, June (Full normal working hours apply)",
    total_accumulated: "Total Accumulation",
    until_now: "Until Now (Feb - Jun)",
    total_accumulated_desc: "Total accumulated working hours deficit across all compiled data.",
    accumulation_list: "Employee Accumulated Deficiency List",
    accumulation_list_sub: "Detailed cumulative deficit of working hours for each employee",
    export_accumulation: "Export Accumulated Excel",
    search_placeholder: "Search Name or NIP...",
    all_units: "All Working Units",
    all_months: "All Months",
    all_statuses: "All Accumulation Statuses",
    very_good: "Excellent",
    good: "Good",
    cukup: "Sufficient",
    kurang: "Insufficient",
    lisan_warning: "Verbal Warning",
    need_guidance: "Needs Counseling",
    heavy_action: "Disciplinary Action",
    visual_analysis: "Working Hours Visualization & Analysis",
    visual_analysis_sub: "Statistical performance charts of BSKJI ASN working hours",
    presence_perf: "Attendance Performance",
    daily_trend: "Daily Trend",
    highest_def: "Highest Deficiencies",
    status_dist: "Status Distribution",
    attendance_list: "ASN Employee Attendance List",
    attendance_list_sub: "Click on any employee row to open their detailed daily attendance calendar",
    day_date: "Day & Date",
    check_in: "Check In",
    check_out: "Check Out",
    work_duration: "Work Hours",
    deficiency: "Deficiency",
    daily_log: "Daily Attendance Log",
    daily_log_sub: "Daily breakdown of clock-in/out, work duration, and deficits",
    only_deficiencies: "Show Deficiencies Only",
    fulfilled: "Fulfilled",
    alfa: "Absent / Unexcused",
    weekend: "Weekend / Public Holiday",
    done: "Done",
    print: "Print",
    not_found: "No employee records matched your search criteria.",
    tab_ringkasan: "Summary",
    tab_bulanan: "Monthly Data",
    tab_triwulan: "Quarterly Recap",
    average_monthly_deficiency_desc: "Analysis of average attendance (%) & average deficiency (hours) per month",
    compare_monthly_deficiency_desc: "Comparison of average attendance (%) & average deficiency (hours) per working unit in",
    attendance_rate_axis: "Attendance Rate (%)",
    deficiency_axis: "Average Deficiency (Hours)",
    total_deficiency_axis: "Total Deficiency (Hours)",
    total_deficiency_label: "Total Deficiency (Hours)",
    attendance_rate_label: "Attendance Rate (%)",
    days: "Days",
    hours: "Hours",
    employee: "Employee",
    unit_work: "Working Unit",
    action: "Action",
    download_excel: "Download Excel",
    status_discipline: "Discipline Status",
    no_data: "No employee data available.",
    showing: "Showing",
    to: "to",
    of: "of",
    remaining_lisan_warning: "{remaining} left until Verbal Warning (3 Days / 22.5h)",
    reached_lisan_warning: "Already reached the Verbal Warning limit",
    error_title: "An Error Occurred",
    error_retry: "Try Again",
    loader_message: "Processing and calculating work hours database...",
    print_title: "ASN ATTENDANCE & WORKING HOURS DEFICIENCY MONITORING REPORT",
    print_title_detail: "INDIVIDUAL ATTENDANCE & WORKING HOURS DEFICIENCY DETAIL REPORT"
  }
};

const JamKerjaPage = React.memo(({ language = 'id' }: JamKerjaPageProps) => {
  const t = (key: string) => {
    return LOCAL_TRANSLATIONS[language]?.[key] || LOCAL_TRANSLATIONS['id']?.[key] || key;
  };

  const [data, setData] = useState<JamKerjaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedUnitKerja, setSelectedUnitKerja] = useState<string>('Semua');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'totalDeficiency', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<JamKerjaRecord | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'daily-trend' | 'top-deficiency' | 'distribution' | 'performance-summary'>('performance-summary');
  const [isExporting, setIsExporting] = useState(false);
  const [mainTab, setMainTab] = useState<'ringkasan' | 'bulanan' | 'triwulan'>('ringkasan');

  // States for Quarterly & Accumulated Table filtering & pagination
  const [quarterSearch, setQuarterSearch] = useState('');
  const [quarterStatusFilter, setQuarterStatusFilter] = useState('Semua');
  const [quarterMinDeficiency, setQuarterMinDeficiency] = useState('Semua');
  const [quarterCurrentPage, setQuarterCurrentPage] = useState(1);
  const [quarterItemsPerPage, setQuarterItemsPerPage] = useState(10);
  const [isExportingQuarterly, setIsExportingQuarterly] = useState(false);
  const [exportingNip, setExportingNip] = useState<string | null>(null);
  const [drawerFilterDeficiencyOnly, setDrawerFilterDeficiencyOnly] = useState(false);

  // Load data with Stale-While-Revalidate caching strategy
  useEffect(() => {
    const loadData = async () => {
      let cachedData: JamKerjaRecord[] = [];
      try {
        const cached = localStorage.getItem('jam_kerja_data_cache');
        if (cached) {
          cachedData = JSON.parse(cached);
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            setData(cachedData);
            setLoading(false); // Display cached data immediately!
          }
        }
      } catch (cacheErr) {
        console.warn("Failed to load cached jam kerja data:", cacheErr);
      }

      if (cachedData.length === 0) {
        setLoading(true);
      }
      setError(null);
      try {
        const jamKerja = await fetchJamKerjaData();
        setData(jamKerja);
        try {
          localStorage.setItem('jam_kerja_data_cache', JSON.stringify(jamKerja));
        } catch (saveErr) {
          console.warn("Failed to cache jam kerja data:", saveErr);
        }
      } catch (err: any) {
        console.error(err);
        if (cachedData.length === 0) {
          setError("Gagal memuat data jam kerja dari Google Sheets. Silakan coba beberapa saat lagi.");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Unique months available in data
  const uniqueMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    data.forEach(record => {
      if (record.bulan) {
        monthsSet.add(record.bulan);
      }
    });
    return Array.from(monthsSet).sort();
  }, [data]);

  // Unique unit kerja available in data
  const uniqueUnitKerjas = useMemo(() => {
    const unitsSet = new Set<string>();
    data.forEach(record => {
      if (record.unitKerja) {
        unitsSet.add(record.unitKerja.trim());
      }
    });
    return Array.from(unitsSet).sort();
  }, [data]);

  // Filter data by selected month and unit kerja
  const monthFilteredData = useMemo(() => {
    let filtered = data;
    if (selectedMonth !== 'Semua') {
      filtered = filtered.filter(record => record.bulan === selectedMonth);
    }
    if (selectedUnitKerja && selectedUnitKerja !== 'Semua') {
      filtered = filtered.filter(record => record.unitKerja && record.unitKerja.toLowerCase().includes(selectedUnitKerja.toLowerCase()));
    }
    return filtered;
  }, [data, selectedMonth, selectedUnitKerja]);

  // Filter & Search
  const filteredRecords = useMemo(() => {
    return monthFilteredData.filter(record => {
      const matchSearch = 
        record.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
        record.nip.includes(searchTerm);
      return matchSearch;
    });
  }, [monthFilteredData, searchTerm]);

  // Sorting logic
  const sortedRecords = useMemo(() => {
    let sortableItems = [...filteredRecords];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (typeof valA === 'string') {
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === 'asc' 
            ? valA - valB 
            : valB - valA;
        }
      });
    }
    return sortableItems;
  }, [filteredRecords, sortConfig]);

  // Pagination
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedRecords, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // High-level statistics
  const metrics = useMemo(() => {
    if (monthFilteredData.length === 0) return {
      totalEmployees: 0,
      avgDeficiency: 0,
      overallPresence: 0,
      totalWorkingHours: 0,
      totalLeaveDays: 0,
      disciplineLeader: '-',
      disciplineLeaderDeficiency: 0,
      disciplineLeaderActualWorked: 0,
      disciplineLeaderLeave: 0
    };

    const uniqueEmployees = new Set(monthFilteredData.map(record => record.nip || record.nama));
    const totalEmployees = uniqueEmployees.size;
    let sumDeficiency = 0;
    let sumWorkingHours = 0;
    let sumHadir = 0;
    let sumLeave = 0;
    let requiredDaysTotal = 0;

    let bestEmployee: JamKerjaRecord | null = null;

    monthFilteredData.forEach(record => {
      sumDeficiency += record.totalDeficiency;
      sumWorkingHours += record.totalActualWorked;
      sumHadir += record.totalHadir;
      sumLeave += record.totalLeave;
      
      const employeeRequiredDays = Object.values(record.attendance).filter((a: any) => (a as DailyAttendance).isRequiredDay).length;
      requiredDaysTotal += employeeRequiredDays;

      if (!bestEmployee) {
        bestEmployee = record;
      } else {
        // Compare record with bestEmployee:
        // 1. Memenuhi jam kerja: kekurangan jam kerja paling sedikit (totalDeficiency terkecil)
        if (record.totalDeficiency !== bestEmployee.totalDeficiency) {
          if (record.totalDeficiency < bestEmployee.totalDeficiency) {
            bestEmployee = record;
          }
        } else {
          // 2. Jam kerja paling banyak: total jam kerja aktual paling besar (totalActualWorked terbesar)
          if (record.totalActualWorked !== bestEmployee.totalActualWorked) {
            if (record.totalActualWorked > bestEmployee.totalActualWorked) {
              bestEmployee = record;
            }
          } else {
            // 3. Izin dan cuti paling sedikit: total leave paling kecil (totalLeave terkecil)
            if (record.totalLeave < bestEmployee.totalLeave) {
              bestEmployee = record;
            }
          }
        }
      }
    });

    const avgDeficiency = Math.round(sumDeficiency / totalEmployees);
    const overallPresence = requiredDaysTotal > 0 ? (sumHadir / requiredDaysTotal) * 100 : 0;

    return {
      totalEmployees,
      avgDeficiency,
      overallPresence,
      totalWorkingHours: sumWorkingHours / 60, // in hours
      totalLeaveDays: sumLeave,
      disciplineLeader: bestEmployee ? (bestEmployee as JamKerjaRecord).nama : '-',
      disciplineLeaderDeficiency: bestEmployee ? (bestEmployee as JamKerjaRecord).totalDeficiency : 0,
      disciplineLeaderActualWorked: bestEmployee ? (bestEmployee as JamKerjaRecord).totalActualWorked : 0,
      disciplineLeaderLeave: bestEmployee ? (bestEmployee as JamKerjaRecord).totalLeave : 0
    };
  }, [monthFilteredData]);

  // Quarterly and Accumulated statistics across ALL data
  const quarterlyMetrics = useMemo(() => {
    const employeeSummaryMap: {
      [nip: string]: {
        nip: string;
        nama: string;
        unitKerja: string;
        gol: string;
        q1Deficiency: number;
        q2Deficiency: number;
        q3Deficiency: number;
        q4Deficiency: number;
        totalDeficiency: number;
        totalHadir: number;
        totalLeave: number;
        monthsCount: number;
      }
    } = {};

    let officeQ1Deficiency = 0;
    let officeQ2Deficiency = 0;
    let officeQ3Deficiency = 0;
    let officeQ4Deficiency = 0;
    let officeTotalAccumulatedDeficiency = 0;

    data.forEach(record => {
      const { key: qKey } = getQuarterFromMonth(record.bulan);
      const def = record.totalDeficiency;

      officeTotalAccumulatedDeficiency += def;
      if (qKey === "Q1") officeQ1Deficiency += def;
      else if (qKey === "Q2") officeQ2Deficiency += def;
      else if (qKey === "Q3") officeQ3Deficiency += def;
      else if (qKey === "Q4") officeQ4Deficiency += def;

      if (!employeeSummaryMap[record.nip]) {
        employeeSummaryMap[record.nip] = {
          nip: record.nip,
          nama: record.nama,
          unitKerja: record.unitKerja,
          gol: record.gol,
          q1Deficiency: 0,
          q2Deficiency: 0,
          q3Deficiency: 0,
          q4Deficiency: 0,
          totalDeficiency: 0,
          totalHadir: 0,
          totalLeave: 0,
          monthsCount: 0
        };
      }

      const emp = employeeSummaryMap[record.nip];
      emp.totalDeficiency += def;
      emp.totalHadir += record.totalHadir;
      emp.totalLeave += record.totalLeave;
      emp.monthsCount += 1;

      if (qKey === "Q1") emp.q1Deficiency += def;
      else if (qKey === "Q2") emp.q2Deficiency += def;
      else if (qKey === "Q3") emp.q3Deficiency += def;
      else if (qKey === "Q4") emp.q4Deficiency += def;
    });

    const employeesSummaryList = Object.values(employeeSummaryMap).sort((a, b) => b.totalDeficiency - a.totalDeficiency);

    return {
      officeQ1Deficiency,
      officeQ2Deficiency,
      officeQ3Deficiency,
      officeQ4Deficiency,
      officeTotalAccumulatedDeficiency,
      employeesSummaryList
    };
  }, [data]);

  // Filtered employees for the quarterly table
  const filteredQuarterlyEmployees = useMemo(() => {
    return quarterlyMetrics.employeesSummaryList.filter(emp => {
      // 1. Search text filter
      const matchSearch = 
        emp.nama.toLowerCase().includes(quarterSearch.toLowerCase()) || 
        emp.nip.includes(quarterSearch);
      if (!matchSearch) return false;

      // 2. Status category filter
      const totalDeficiencyHours = emp.totalDeficiency / 60;
      let statusLabel = "Sangat Baik";
      if (totalDeficiencyHours > 60) {
        statusLabel = "Tindakan Berat";
      } else if (totalDeficiencyHours > 30) {
        statusLabel = "Perlu Pembinaan";
      } else if (totalDeficiencyHours >= 22.5) {
        statusLabel = "Teguran Lisan";
      } else if (totalDeficiencyHours > 0) {
        statusLabel = "Baik";
      }

      if (quarterStatusFilter !== 'Semua') {
        if (quarterStatusFilter === 'Sangat Baik' && statusLabel !== 'Sangat Baik') return false;
        if (quarterStatusFilter === 'Baik' && statusLabel !== 'Baik') return false;
        if (quarterStatusFilter === 'Teguran Lisan' && statusLabel !== 'Teguran Lisan') return false;
        if (quarterStatusFilter === 'Perlu Pembinaan' && statusLabel !== 'Perlu Pembinaan') return false;
        if (quarterStatusFilter === 'Tindakan Berat' && statusLabel !== 'Tindakan Berat') return false;
      }

      // 3. Min deficiency filter
      if (quarterMinDeficiency !== 'Semua') {
        if (quarterMinDeficiency === 'has_deficiency' && emp.totalDeficiency === 0) return false;
        if (quarterMinDeficiency === 'gt_22_5h' && totalDeficiencyHours < 22.5) return false;
        if (quarterMinDeficiency === 'gt_30h' && totalDeficiencyHours <= 30) return false;
        if (quarterMinDeficiency === 'gt_60h' && totalDeficiencyHours <= 60) return false;
      }

      // 4. Unit Kerja filter
      if (selectedUnitKerja && selectedUnitKerja !== 'Semua') {
        if (!emp.unitKerja || !emp.unitKerja.toLowerCase().includes(selectedUnitKerja.toLowerCase())) return false;
      }

      return true;
    });
  }, [quarterlyMetrics.employeesSummaryList, quarterSearch, quarterStatusFilter, quarterMinDeficiency, selectedUnitKerja]);

  // Quarterly table pagination
  const quarterTotalPages = Math.ceil(filteredQuarterlyEmployees.length / quarterItemsPerPage);
  const paginatedQuarterlyEmployees = useMemo(() => {
    const start = (quarterCurrentPage - 1) * quarterItemsPerPage;
    return filteredQuarterlyEmployees.slice(start, start + quarterItemsPerPage);
  }, [filteredQuarterlyEmployees, quarterCurrentPage, quarterItemsPerPage]);

  // Reset quarterly page when filters change
  useEffect(() => {
    setQuarterCurrentPage(1);
  }, [quarterSearch, quarterStatusFilter, quarterMinDeficiency, selectedUnitKerja, quarterItemsPerPage]);

  // Reset monthly page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedUnitKerja, itemsPerPage]);

  // Chart 1: Department Daily Deficiency Trend
  const dailyTrendData = useMemo(() => {
    if (monthFilteredData.length === 0) return [];
    
    // Get month name dynamically
    const monthName = selectedMonth !== "Semua" ? selectedMonth : (monthFilteredData[0]?.bulan || "Juni");
    
    // Determine number of days in this month
    const m = monthName.toLowerCase();
    const daysCount = m.includes("mei") || m.includes("may") || m.includes("maret") || m.includes("march") ? 31 : (m.includes("februari") || m.includes("february") ? 28 : 30);
    
    const dailyStats: { [day: number]: { day: number; label: string; deficiency: number; presenceCount: number } } = {};

    // Initialize days
    for (let d = 1; d <= daysCount; d++) {
      const isWeekend = isWeekendForMonth(monthName, d);
      const isHoliday = getIndonesianHolidayName(monthName, d) !== null;
      let label = `${d}`;
      if (isWeekend) label += " (W)";
      else if (isHoliday) label += " (L)";

      dailyStats[d] = {
        day: d,
        label,
        deficiency: 0,
        presenceCount: 0
      };
    }

    // Accumulate
    monthFilteredData.forEach(record => {
      Object.entries(record.attendance).forEach(([dayStr, attVal]) => {
        const att = attVal as DailyAttendance;
        const d = parseInt(dayStr, 10);
        if (dailyStats[d]) {
          dailyStats[d].deficiency += att.deficiency;
          if (att.note === 'Hadir') {
            dailyStats[d].presenceCount++;
          }
        }
      });
    });

    return Object.values(dailyStats).map(s => ({
      ...s,
      deficiencyHours: Math.round((s.deficiency / 60) * 10) / 10,
      presencePercentage: Math.round((s.presenceCount / monthFilteredData.length) * 100)
    }));
  }, [monthFilteredData, selectedMonth]);

  // Chart 2: Top 10 Employees with Highest Deficiency
  const topDeficiencyData = useMemo(() => {
    return [...monthFilteredData]
      .sort((a, b) => b.totalDeficiency - a.totalDeficiency)
      .slice(0, 10)
      .map(record => ({
        name: record.nama.split(',')[0],
        deficiencyHours: Math.round((record.totalDeficiency / 60) * 10) / 10,
        hadir: record.totalHadir,
        absen: record.totalAbsen
      }));
  }, [monthFilteredData]);

  // Chart 3: Distribution of Deficiency
  const distributionData = useMemo(() => {
    let rangeA = 0; // 0 mins (Sangat Baik)
    let rangeB = 0; // >0 to 10 hours (Baik)
    let rangeC = 0; // 10 to 30 hours (Cukup)
    let rangeD = 0; // >30 hours (Kurang)

    monthFilteredData.forEach(record => {
      const hours = record.totalDeficiency / 60;
      if (hours === 0) rangeA++;
      else if (hours <= 10) rangeB++;
      else if (hours <= 30) rangeC++;
      else rangeD++;
    });

    return [
      { name: 'Sangat Baik (0 jam)', value: rangeA, color: '#10b981' },
      { name: 'Baik (<10 jam)', value: rangeB, color: '#3b82f6' },
      { name: 'Cukup (10-30 jam)', value: rangeC, color: '#f59e0b' },
      { name: 'Perlu Perhatian (>30 jam)', value: rangeD, color: '#ef4444' }
    ];
  }, [monthFilteredData]);

  // Chart 4: Monthly or Department Attendance Performance Summary (Recharts)
  const monthlyPerformanceData = useMemo(() => {
    if (data.length === 0) return [];

    // If 'Semua' is selected for month, we group by Month.
    // If a specific month is selected, we group by Unit Kerja to show divisional performance!
    if (selectedMonth === 'Semua') {
      const monthGroups: { [month: string]: { totalHadir: number; requiredDays: number; totalDeficiencyMins: number; employeeCount: number } } = {};
      
      data.forEach(record => {
        const month = record.bulan || 'Unknown';
        const requiredDays = Object.values(record.attendance || {}).filter((a: any) => (a as DailyAttendance).isRequiredDay).length;
        
        if (!monthGroups[month]) {
          monthGroups[month] = { totalHadir: 0, requiredDays: 0, totalDeficiencyMins: 0, employeeCount: 0 };
        }
        
        monthGroups[month].totalHadir += record.totalHadir || 0;
        monthGroups[month].requiredDays += requiredDays || 0;
        monthGroups[month].totalDeficiencyMins += record.totalDeficiency || 0;
        monthGroups[month].employeeCount += 1;
      });

      return Object.entries(monthGroups).map(([month, stats]) => {
        const avgPresence = stats.requiredDays > 0 ? (stats.totalHadir / stats.requiredDays) * 100 : 0;
        const avgDeficiencyHours = stats.employeeCount > 0 ? (stats.totalDeficiencyMins / stats.employeeCount) / 60 : 0;
        return {
          category: month,
          presenceRate: Math.round(avgPresence * 10) / 10,
          deficiencyHours: Math.round(avgDeficiencyHours * 10) / 10,
        };
      });
    } else {
      // Group by Unit Kerja
      const unitGroups: { [unit: string]: { totalHadir: number; requiredDays: number; totalDeficiencyMins: number; employeeCount: number } } = {};
      
      // Use data filtered by selectedMonth, but without unit filter so they can compare all units!
      const monthData = data.filter(record => record.bulan === selectedMonth);
      
      monthData.forEach(record => {
        const unit = (record.unitKerja || 'Lainnya').trim();
        const requiredDays = Object.values(record.attendance || {}).filter((a: any) => (a as DailyAttendance).isRequiredDay).length;
        
        if (!unitGroups[unit]) {
          unitGroups[unit] = { totalHadir: 0, requiredDays: 0, totalDeficiencyMins: 0, employeeCount: 0 };
        }
        
        unitGroups[unit].totalHadir += record.totalHadir || 0;
        unitGroups[unit].requiredDays += requiredDays || 0;
        unitGroups[unit].totalDeficiencyMins += record.totalDeficiency || 0;
        unitGroups[unit].employeeCount += 1;
      });

      return Object.entries(unitGroups).map(([unit, stats]) => {
        const avgPresence = stats.requiredDays > 0 ? (stats.totalHadir / stats.requiredDays) * 100 : 0;
        const avgDeficiencyHours = stats.employeeCount > 0 ? (stats.totalDeficiencyMins / stats.employeeCount) / 60 : 0;
        return {
          category: unit.length > 20 ? unit.substring(0, 18) + '...' : unit,
          fullCategory: unit,
          presenceRate: Math.round(avgPresence * 10) / 10,
          deficiencyHours: Math.round(avgDeficiencyHours * 10) / 10,
        };
      }).sort((a, b) => b.presenceRate - a.presenceRate); // Sort by highest presence rate
    }
  }, [data, selectedMonth]);

  const getDisciplineStatus = (totalDeficiencyMins: number) => {
    const hours = totalDeficiencyMins / 60;
    if (hours === 0) return { label: t('very_good'), bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
    if (hours <= 10) return { label: t('good'), bg: 'bg-emerald-50 border-emerald-100 text-emerald-700' };
    if (hours <= 30) return { label: t('cukup'), bg: 'bg-amber-50 border-amber-100 text-amber-700' };
    return { label: t('kurang'), bg: 'bg-rose-50 border-rose-100 text-rose-700' };
  };

  const handleExportExcel = async () => {
    if (sortedRecords.length === 0) return;
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      
      // ==========================================
      // SHEET 1: REKAP JAM KERJA PEGAWAI
      // ==========================================
      const selectedMonthUpper = selectedMonth === 'Semua' ? 'SEMUA BULAN' : selectedMonth.toUpperCase();
      const title = [`LAPORAN REKAPITULASI KEKURANGAN JAM KERJA - ${selectedMonthUpper} 2026`];
      const subtitle = ["BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)"];
      const blankRow: any[] = [];
      const headers = [
        "No", 
        "NIP", 
        "Nama Pegawai", 
        "Bulan", 
        "Unit Kerja", 
        "Kehadiran (Hari)", 
        "Cuti/Izin (Hari)", 
        "Mangkir/Absen (Hari)", 
        "Tanggal Mangkir/Alpa",
        "Total Jam Kerja (Jam)", 
        "Kekurangan (Jam)", 
        "Tanggal Kekurangan Jam Kerja",
        "Visualisasi Kekurangan (Chart)", 
        "Status Kedisiplinan"
      ];

      const exportData = sortedRecords.map((r, idx) => {
        const hoursWorked = Math.round((r.totalActualWorked / 60) * 100) / 100;
        const hoursDeficiency = Math.round((r.totalDeficiency / 60) * 100) / 100;
        const status = getDisciplineStatus(r.totalDeficiency).label;
        
        // Compute specific dates for unexcused absence and working hour deficiency
        const alpaDays: string[] = [];
        const deficiencyDays: string[] = [];

        if (r.attendance) {
          Object.entries(r.attendance).forEach(([dayStr, attVal]) => {
            const att = attVal as DailyAttendance;
            const dayNum = parseInt(dayStr, 10);
            const isAlpa = att.note && (
              att.note.toLowerCase().includes('tidak hadir') || 
              att.note.toLowerCase().includes('alfa') || 
              att.note.toLowerCase().includes('mangkir') || 
              att.raw === 'A'
            );
            
            if (isAlpa) {
              alpaDays.push(`Tgl ${dayNum}`);
            } else if (att.deficiency > 0 && att.isRequiredDay) {
              const mins = att.deficiency;
              const hours = Math.floor(mins / 60);
              const minsLeft = mins % 60;
              const timeStr = hours > 0 ? `-${hours}j ${minsLeft}m` : `-${minsLeft}m`;
              deficiencyDays.push(`Tgl ${dayNum} (${timeStr})`);
            }
          });
        }

        const alpaDaysStr = alpaDays.length > 0 ? alpaDays.join(", ") : "-";
        const deficiencyDaysStr = deficiencyDays.length > 0 ? deficiencyDays.join(", ") : "-";

        // Generate dynamic in-cell block visualizer chart
        let progressBar = "";
        if (hoursDeficiency === 0) {
          progressBar = "Sangat Disiplin (0 jam)";
        } else {
          const numBlocks = Math.min(10, Math.ceil(hoursDeficiency / 4));
          progressBar = "█".repeat(numBlocks) + "░".repeat(10 - numBlocks) + ` (${hoursDeficiency.toFixed(1)} jam)`;
        }

        return [
          idx + 1,
          r.nip,
          r.nama,
          r.bulan,
          r.unitKerja,
          r.totalHadir,
          r.totalLeave,
          r.totalAbsen,
          alpaDaysStr,
          hoursWorked,
          hoursDeficiency,
          deficiencyDaysStr,
          progressBar,
          status
        ];
      });

      const wsData = [
        title,
        subtitle,
        blankRow,
        headers,
        ...exportData
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Merge Title Block for sheet 1
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } });
      ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 13 } });

      // Column widths for sheet 1
      const wscols = [
        { wch: 5 },   // No
        { wch: 25 },  // NIP
        { wch: 35 },  // Nama Pegawai
        { wch: 15 },  // Bulan
        { wch: 28 },  // Unit Kerja
        { wch: 18 },  // Kehadiran (Hari)
        { wch: 18 },  // Cuti (Hari)
        { wch: 22 },  // Absen (Hari)
        { wch: 28 },  // Tanggal Mangkir/Alpa
        { wch: 22 },  // Total Jam Kerja
        { wch: 18 },  // Kekurangan
        { wch: 38 },  // Tanggal Kekurangan Jam Kerja
        { wch: 35 },  // Visualisasi
        { wch: 18 }   // Status
      ];
      ws['!cols'] = wscols;

      // ==========================================
      // SHEET 2: DASHBOARD & STATISTIK REKAP
      // ==========================================
      // Compute distribution counts
      let countA = 0; // Sangat Baik
      let countB = 0; // Baik
      let countC = 0; // Cukup
      let countD = 0; // Kurang

      monthFilteredData.forEach(record => {
        const hours = record.totalDeficiency / 60;
        if (hours === 0) countA++;
        else if (hours <= 10) countB++;
        else if (hours <= 30) countC++;
        else countD++;
      });

      const total = monthFilteredData.length || 1;
      const pctA = (countA / total) * 100;
      const pctB = (countB / total) * 100;
      const pctC = (countC / total) * 100;
      const pctD = (countD / total) * 100;

      // Beautiful horizontal blocks visualizer for distribution statistics
      const drawDistributionBar = (pct: number) => {
        const numBlocks = Math.round(pct / 4); // max 25 blocks
        return "■".repeat(numBlocks) + "░".repeat(25 - numBlocks) + ` ${pct.toFixed(1)}%`;
      };

      // Hitung pegawai dengan kekurangan jam kerja terbanyak (Rekomendasi Tindakan Disiplin / Punishment)
      const sortedByDeficiency = [...monthFilteredData]
        .filter(r => r.totalDeficiency > 0)
        .sort((a, b) => b.totalDeficiency - a.totalDeficiency);
      
      let punishmentRecommendation = "Tidak ada";
      if (sortedByDeficiency.length > 0) {
        const criticalDeficiencyList = sortedByDeficiency.filter(r => (r.totalDeficiency / 60) > 30);
        const targetList = criticalDeficiencyList.length > 0 ? criticalDeficiencyList : sortedByDeficiency.slice(0, 3);
        punishmentRecommendation = targetList
          .map(r => `${r.nama.split(',')[0]} (NIP. ${r.nip}: -${Math.round((r.totalDeficiency / 60) * 10) / 10} Jam)`)
          .join("; ");
      }

      const q1DeficiencyMins = data
        .filter(r => getQuarterFromMonth(r.bulan).key === "Q1")
        .reduce((sum, r) => sum + r.totalDeficiency, 0);

      const q2DeficiencyMins = data
        .filter(r => getQuarterFromMonth(r.bulan).key === "Q2")
        .reduce((sum, r) => sum + r.totalDeficiency, 0);

      const totalAccumulatedDeficiencyMins = data
        .reduce((sum, r) => sum + r.totalDeficiency, 0);

      const statsTitle = [`DASHBOARD STATISTIK KEDISIPLINAN PEGAWAI - ${selectedMonthUpper} 2026`];
      const statsSubtitle = ["RINGKASAN METRIK & DISTRIBUSI KEKURANGAN JAM KERJA"];

      const statsHeaders = ["METRIK UTAMA", "NILAI", "SATUAN", "KETERANGAN"];
      const statRows = [
        ["Total Pegawai Terdata", metrics.totalEmployees, "Orang", "Total seluruh pegawai dalam analisis"],
        ["Rata-rata Kekurangan Jam Kerja", Math.round((metrics.avgDeficiency / 60) * 100) / 100, "Jam / Orang", "Rata-rata kekurangan jam kerja individu"],
        ["Persentase Kehadiran Kolektif", Math.round(metrics.overallPresence * 10) / 10, "%", "Rasio total kehadiran terhadap hari kerja wajib"],
        ["Total Akumulasi Jam Kerja Efektif", Math.round(metrics.totalWorkingHours * 10) / 10, "Jam Kerja", "Total kontribusi jam kerja nyata seluruh pegawai"],
        ["Total Hari Cuti / Izin Bersama", metrics.totalLeaveDays, "Hari Kerja", "Total hari akumulasi cuti resmi atau izin khusus"],
        ["Pegawai Teladan Terbaik", metrics.disciplineLeader, "-", "Pegawai teladan dengan jam kerja paling banyak, memenuhi jam kerja, serta izin & cuti paling sedikit"],
        ["Rekomendasi Tindakan Disiplin / Punishment", punishmentRecommendation, "Pegawai", "Daftar pegawai dengan akumulasi kekurangan waktu tertinggi (diutamakan >30 jam/bulan) untuk pembinaan/pemotongan tunjangan"],
        ["Kekurangan Jam Kerja Triwulan I", Math.round((q1DeficiencyMins / 60) * 10) / 10, "Jam Kolektif", "Total kekurangan jam kerja di Triwulan I (Februari, Maret)"],
        ["Kekurangan Jam Kerja Triwulan II", Math.round((q2DeficiencyMins / 60) * 10) / 10, "Jam Kolektif", "Total kekurangan jam kerja di Triwulan II (Mei, Juni)"],
        ["Total Akumulasi Kekurangan Jam Kerja", Math.round((totalAccumulatedDeficiencyMins / 60) * 10) / 10, "Jam Kolektif", "Total kekurangan jam kerja terakumulasi dari seluruh data terunggah"]
      ];

      const distHeaders = ["KATEGORI KEDISIPLINAN", "JUMLAH PEGAWAI", "PERSENTASE", "GRAFIK DISTRIBUSI KATEGORI (CHART)"];
      const distRows = [
        ["Sangat Baik (0 Jam Kekurangan)", countA, `${pctA.toFixed(1)}%`, drawDistributionBar(pctA)],
        ["Baik (<10 Jam Kekurangan)", countB, `${pctB.toFixed(1)}%`, drawDistributionBar(pctB)],
        ["Cukup (10 - 30 Jam Kekurangan)", countC, `${pctC.toFixed(1)}%`, drawDistributionBar(pctC)],
        ["Kurang / Perlu Perhatian (>30 Jam)", countD, `${pctD.toFixed(1)}%`, drawDistributionBar(pctD)]
      ];

      const wsStatsData = [
        statsTitle,
        statsSubtitle,
        blankRow,
        statsHeaders,
        ...statRows,
        blankRow,
        blankRow,
        distHeaders,
        ...distRows
      ];

      const wsStats = XLSX.utils.aoa_to_sheet(wsStatsData);

      // Merge Title Block for sheet 2
      wsStats['!merges'] = [];
      wsStats['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
      wsStats['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } });

      // Column widths for sheet 2
      const wsStatsCols = [
        { wch: 38 }, // Metrik
        { wch: 22 }, // Nilai
        { wch: 15 }, // Satuan
        { wch: 48 }  // Keterangan / Grafik Chart
      ];
      wsStats['!cols'] = wsStatsCols;

      // ==========================================
      // CREATE WORKBOOK & APPEND SHEETS
      // ==========================================
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Jam Kerja");
      XLSX.utils.book_append_sheet(wb, wsStats, "Dashboard & Statistik");

      // Save file
      XLSX.writeFile(wb, `Laporan_Kekurangan_Jam_Kerja_${selectedMonth}_2026.xlsx`);
    } catch (err) {
      console.error("Gagal mengekspor data ke format Excel:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportQuarterlyExcel = async () => {
    if (filteredQuarterlyEmployees.length === 0) return;
    setIsExportingQuarterly(true);
    try {
      const XLSX = await import('xlsx');
      
      const title = ["LAPORAN AKUMULASI & DETAIL KEKURANGAN JAM KERJA PEGAWAI"];
      const subtitle = ["BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)"];
      const filterDesc = [
        `Kriteria Ekspor: Pencarian: "${quarterSearch || '-'}", Status: "${quarterStatusFilter}", Batas: "${quarterMinDeficiency}"`
      ];
      const blankRow: any[] = [];

      // ==========================================
      // SHEET 1: RINGKASAN AKUMULASI
      // ==========================================
      const summaryHeaders = [
        "No", 
        "NIP", 
        "Nama Pegawai", 
        "Golongan", 
        "Unit Kerja", 
        "Bulan",
        "Kekurangan Bulan Ini (Jam)",
        "Kekurangan Bulan Ini (Format Ramah)",
        "Rincian Tanggal Kekurangan",
        "Kekurangan Q1 (Jam)", 
        "Kekurangan Q2 (Jam)", 
        "Total Akumulasi Kekurangan (Jam)",
        "Total Akumulasi Kekurangan (Format Ramah)",
        "Total Kehadiran (Hari)", 
        "Total Cuti/Izin (Hari)", 
        "Status Akumulasi Pegawai"
      ];

      const summaryRows: any[] = [];
      let rowIdx = 1;

      filteredQuarterlyEmployees.forEach((emp) => {
        const totalDefHours = emp.totalDeficiency / 60;
        
        let statusLabel = "Sangat Baik";
        if (totalDefHours > 60) {
          statusLabel = "Tindakan Berat (>60j)";
        } else if (totalDefHours > 30) {
          statusLabel = "Perlu Pembinaan (>30j)";
        } else if (totalDefHours >= 22.5) {
          statusLabel = "Teguran Lisan (>=22.5j)";
        } else if (totalDefHours > 0) {
          statusLabel = "Baik (<22.5j)";
        }

        // Gather monthly records for this employee
        const empRecords = data.filter(r => r.nip === emp.nip);

        empRecords.forEach((record) => {
          const dayDetails: string[] = [];
          let monthlyDeficiencyMins = 0;

          if (record.attendance) {
            const sortedDays = Object.entries(record.attendance)
              .map(([dayStr, attVal]) => ({ dayNum: parseInt(dayStr, 10), att: attVal as DailyAttendance }))
              .sort((a, b) => a.dayNum - b.dayNum);

            sortedDays.forEach(({ dayNum, att }) => {
              if (att.deficiency > 0 && att.isRequiredDay) {
                monthlyDeficiencyMins += att.deficiency;
                const mins = att.deficiency;
                const hours = Math.floor(mins / 60);
                const minsLeft = mins % 60;
                
                let durationStr = "";
                if (hours > 0 && minsLeft > 0) {
                  durationStr = `${hours}j ${minsLeft}m`;
                } else if (hours > 0) {
                  durationStr = `${hours}j`;
                } else {
                  durationStr = `${minsLeft}m`;
                }
                dayDetails.push(`Tgl ${dayNum} (-${durationStr})`);
              }
            });
          }

          const rincianTanggalStr = dayDetails.length > 0 
            ? dayDetails.join(", ") 
            : "Sempurna (0m)";

          summaryRows.push([
            rowIdx++,
            emp.nip,
            emp.nama,
            emp.gol,
            emp.unitKerja,
            record.bulan,
            Math.round((monthlyDeficiencyMins / 60) * 100) / 100,
            formatMinutesFriendly(monthlyDeficiencyMins),
            rincianTanggalStr,
            Math.round((emp.q1Deficiency / 60) * 100) / 100,
            Math.round((emp.q2Deficiency / 60) * 100) / 100,
            Math.round((emp.totalDeficiency / 60) * 100) / 100,
            formatMinutesFriendly(emp.totalDeficiency),
            emp.totalHadir,
            emp.totalLeave,
            statusLabel
          ]);
        });
      });

      const wsSummaryData = [
        title,
        subtitle,
        filterDesc,
        blankRow,
        summaryHeaders,
        ...summaryRows
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);

      // Merge titles
      if (!wsSummary['!merges']) wsSummary['!merges'] = [];
      wsSummary['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } });
      wsSummary['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 15 } });
      wsSummary['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 15 } });

      const wsSummaryCols = [
        { wch: 5 },   // No
        { wch: 25 },  // NIP
        { wch: 30 },  // Nama
        { wch: 10 },  // Golongan
        { wch: 25 },  // Unit Kerja
        { wch: 15 },  // Bulan
        { wch: 25 },  // Kekurangan Bulan Ini (Jam)
        { wch: 30 },  // Kekurangan Bulan Ini (Format Ramah)
        { wch: 50 },  // Rincian Tanggal Kekurangan
        { wch: 20 },  // Q1
        { wch: 20 },  // Q2
        { wch: 30 },  // Total Mins
        { wch: 35 },  // Total Friendly
        { wch: 18 },  // Hadir
        { wch: 18 },  // Cuti
        { wch: 25 }   // Status
      ];
      wsSummary['!cols'] = wsSummaryCols;

      // ==========================================
      // SHEET 2: JURNAL RINCI KEKURANGAN
      // ==========================================
      const detailHeaders = [
        "No",
        "NIP",
        "Nama Pegawai",
        "Golongan",
        "Unit Kerja",
        "Bulan",
        "Tanggal",
        "Hari",
        "Jam Masuk",
        "Jam Keluar",
        "Kekurangan (Menit)",
        "Kekurangan (Format Jam:Menit)",
        "Keterangan Kehadiran/Catatan"
      ];

      const detailRows: any[] = [];
      let detailIdx = 1;

      filteredQuarterlyEmployees.forEach(emp => {
        const empRecords = data.filter(r => r.nip === emp.nip);
        empRecords.forEach(record => {
          if (record.attendance) {
            Object.entries(record.attendance).forEach(([dayStr, attVal]) => {
              const att = attVal as DailyAttendance;
              const dayNum = parseInt(dayStr, 10);
              if (att.deficiency > 0 && att.isRequiredDay) {
                const dayName = getDayNameIndonesian(getDayOfWeekForMonth(record.bulan, dayNum));
                detailRows.push([
                  detailIdx++,
                  emp.nip,
                  emp.nama,
                  emp.gol,
                  emp.unitKerja,
                  record.bulan,
                  dayNum,
                  dayName,
                  att.checkIn || "-",
                  att.checkOut || "-",
                  att.deficiency,
                  formatMinutesFriendly(att.deficiency),
                  att.note || "Kekurangan Jam Kerja"
                ]);
              }
            });
          }
        });
      });

      const detailTitle = ["JURNAL RINCIAN TANGGAL KEKURANGAN JAM KERJA PEGAWAI"];
      const detailSubtitle = ["DAFTAR SELURUH TANGGAL YANG MEMILIKI KEKURANGAN UNTUK PEGAWAI TERFILTER"];
      
      const wsDetailData = [
        detailTitle,
        detailSubtitle,
        blankRow,
        detailHeaders,
        ...detailRows
      ];

      const wsDetail = XLSX.utils.aoa_to_sheet(wsDetailData);

      // Merge titles for sheet 2
      if (!wsDetail['!merges']) wsDetail['!merges'] = [];
      wsDetail['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } });
      wsDetail['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 12 } });

      const wsDetailCols = [
        { wch: 5 },   // No
        { wch: 25 },  // NIP
        { wch: 30 },  // Nama
        { wch: 10 },  // Golongan
        { wch: 25 },  // Unit Kerja
        { wch: 15 },  // Bulan
        { wch: 10 },  // Tanggal
        { wch: 12 },  // Hari
        { wch: 12 },  // Jam Masuk
        { wch: 12 },  // Jam Keluar
        { wch: 18 },  // Kekurangan Menit
        { wch: 22 },  // Kekurangan Format
        { wch: 30 }   // Keterangan
      ];
      wsDetail['!cols'] = wsDetailCols;

      // ==========================================
      // CREATE WORKBOOK & SAVE
      // ==========================================
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Akumulasi");
      XLSX.utils.book_append_sheet(wb, wsDetail, "Jurnal Rincian Tanggal");

      XLSX.writeFile(wb, `Ekspor_Akumulasi_Kekurangan_Jam_Kerja_2026.xlsx`);
    } catch (err) {
      console.error("Gagal mengekspor data akumulasi ke format Excel:", err);
    } finally {
      setIsExportingQuarterly(false);
    }
  };

  const handleExportSingleEmployeeExcel = async (emp: any) => {
    setExportingNip(emp.nip);
    try {
      const XLSX = await import('xlsx');
      
      const title = [`LAPORAN DETAIL KEKURANGAN JAM KERJA PEGAWAI`];
      const subtitle = [`BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)`];
      const empInfo = [`Pegawai: ${emp.nama} (NIP. ${emp.nip}) - Golongan ${emp.gol}`];
      const unitInfo = [`Unit Kerja: ${emp.unitKerja}`];
      const blankRow: any[] = [];

      // ==========================================
      // SHEET 1: RINGKASAN PEGAWAI
      // ==========================================
      const summaryHeaders = [
        "Parameter",
        "Nilai / Keterangan"
      ];

      const totalDefHours = emp.totalDeficiency / 60;
      let statusLabel = "Sangat Baik";
      if (totalDefHours > 60) {
        statusLabel = "Tindakan Berat (>60j)";
      } else if (totalDefHours > 30) {
        statusLabel = "Perlu Pembinaan (>30j)";
      } else if (totalDefHours >= 22.5) {
        statusLabel = "Teguran Lisan (>=22.5j)";
      } else if (totalDefHours > 0) {
        statusLabel = "Baik (<22.5j)";
      }

      const summaryRows = [
        ["Nama Pegawai", emp.nama],
        ["NIP", emp.nip],
        ["Golongan", emp.gol],
        ["Unit Kerja", emp.unitKerja],
        ["Total Kekurangan Triwulan I (Jan-Mar)", `${Math.round((emp.q1Deficiency / 60) * 100) / 100} Jam (${formatMinutesFriendly(emp.q1Deficiency)})`],
        ["Total Kekurangan Triwulan II (Apr-Jun)", `${Math.round((emp.q2Deficiency / 60) * 100) / 100} Jam (${formatMinutesFriendly(emp.q2Deficiency)})`],
        ["Total Akumulasi Kekurangan", `${Math.round((emp.totalDeficiency / 60) * 100) / 100} Jam (${formatMinutesFriendly(emp.totalDeficiency)})`],
        ["Total Hari Kehadiran", `${emp.totalHadir} Hari`],
        ["Total Hari Cuti/Izin", `${emp.totalLeave} Hari`],
        ["Status Akumulasi Pegawai", statusLabel],
      ];

      const wsSummaryData = [
        title,
        subtitle,
        empInfo,
        unitInfo,
        blankRow,
        summaryHeaders,
        ...summaryRows
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(wsSummaryData);
      
      if (!wsSummary['!merges']) wsSummary['!merges'] = [];
      wsSummary['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
      wsSummary['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 1 } });
      wsSummary['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 1 } });
      wsSummary['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 1 } });

      wsSummary['!cols'] = [{ wch: 35 }, { wch: 55 }];

      // ==========================================
      // SHEET 2: JURNAL DETIL KEKURANGAN
      // ==========================================
      const detailHeaders = [
        "No",
        "Bulan",
        "Tanggal",
        "Hari",
        "Jam Masuk",
        "Jam Keluar",
        "Kekurangan (Menit)",
        "Kekurangan (Format Jam:Menit)",
        "Keterangan/Catatan"
      ];

      const detailRows: any[] = [];
      let detailIdx = 1;

      const empRecords = data.filter(r => r.nip === emp.nip);
      empRecords.forEach(record => {
        if (record.attendance) {
          const sortedDays = Object.entries(record.attendance)
            .map(([dayStr, attVal]) => ({ dayNum: parseInt(dayStr, 10), att: attVal as DailyAttendance }))
            .sort((a, b) => a.dayNum - b.dayNum);

          sortedDays.forEach(({ dayNum, att }) => {
            if (att.deficiency > 0 && att.isRequiredDay) {
              const dayName = getDayNameIndonesian(getDayOfWeekForMonth(record.bulan, dayNum));
              detailRows.push([
                detailIdx++,
                record.bulan,
                dayNum,
                dayName,
                att.checkIn || "-",
                att.checkOut || "-",
                att.deficiency,
                formatMinutesFriendly(att.deficiency),
                att.note || "Kekurangan Jam Kerja"
              ]);
            }
          });
        }
      });

      const detailTitle = [`JURNAL DETAIL KEKURANGAN - ${emp.nama.split(',')[0].toUpperCase()}`];
      const detailSubtitle = ["DAFTAR SELURUH TANGGAL YANG MEMILIKI KEKURANGAN JAM KERJA"];

      const wsDetailData = [
        detailTitle,
        detailSubtitle,
        blankRow,
        detailHeaders,
        ...detailRows
      ];

      const wsDetail = XLSX.utils.aoa_to_sheet(wsDetailData);

      if (!wsDetail['!merges']) wsDetail['!merges'] = [];
      wsDetail['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
      wsDetail['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } });

      wsDetail['!cols'] = [
        { wch: 5 },   // No
        { wch: 15 },  // Bulan
        { wch: 10 },  // Tanggal
        { wch: 12 },  // Hari
        { wch: 12 },  // Jam Masuk
        { wch: 12 },  // Jam Keluar
        { wch: 18 },  // Kekurangan Menit
        { wch: 22 },  // Kekurangan Format
        { wch: 40 }   // Keterangan
      ];

      // Workbook creation
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Pegawai");
      XLSX.utils.book_append_sheet(wb, wsDetail, "Jurnal Rincian Tanggal");

      const safeName = emp.nama.split(',')[0].replace(/[^a-zA-Z0-9]/g, "_");
      XLSX.writeFile(wb, `Kekurangan_JamKerja_${safeName}_2026.xlsx`);
    } catch (err) {
      console.error("Gagal mengekspor data pegawai:", err);
    } finally {
      setExportingNip(null);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
        <AlertTriangle size={48} className="text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('error_title')}</h2>
        <p className="text-slate-500 dark:text-slate-500 text-sm max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {t('error_retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 w-full px-1 md:px-2 ${selectedRecord ? 'print:hidden' : ''}`}>
      {/* Header Laporan Resmi untuk Cetak (Hanya Muncul Saat Print Halaman Utama) */}
      <div className="hidden print:block border-b-4 border-double border-slate-900 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-800 shrink-0">
            KGB
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold tracking-widest text-slate-800 dark:text-slate-100 uppercase leading-none mb-1">KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA</p>
            <h1 className="text-xl font-display font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">BADAN STANDARISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold tracking-wide mt-1.5">{t('print_title')}</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-3">
          {language === 'en' ? 'Printed on: ' : 'Dicetak pada: '} {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Hero Banner / Rules Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-emerald-500/10 print:hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase border border-emerald-500/30">
              <Clock size={12} /> {t('presence_perf')} & {t('deficiency')}
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight leading-tight">
              {t('title')}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-normal leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* Quick Rules Sheet */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-4 md:p-5 max-w-md space-y-3.5 shrink-0 text-slate-200 shadow-lg">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider pb-1.5 border-b border-white/10">
              <HelpCircle size={14} className="text-emerald-400" /> {t('rules_title')}
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-[11px]">
              <div className="space-y-1">
                <span className="block font-bold text-white text-xs">{t('mon_thu')}</span>
                <span className="block text-emerald-300 font-medium">07:30 – 16:00</span>
                <span className="block text-slate-300 font-medium">{t('break')}: 60 m</span>
                <span className="block text-slate-300 font-medium">{t('max_checkout')}: 17:00</span>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-white text-xs">{t('fri')}</span>
                <span className="block text-emerald-300 font-medium">07:30 – 16:30</span>
                <span className="block text-slate-300 font-medium">{t('break')}: 90 m</span>
                <span className="block text-slate-300 font-medium">{t('max_checkout')}: 17:30</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-300 font-medium pt-1.5 border-t border-white/10 space-y-1.5">
              <div>* {t('rule_note_1')}</div>
              <div className="text-emerald-300 font-semibold">* {t('rule_note_2')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="text-emerald-600 animate-spin" />
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 animate-pulse">{t('loader_message')}</span>
        </div>
      ) : (
        <>
          {/* Main Navigation Tabs */}
          <div className="flex bg-white dark:bg-slate-900/50  p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar gap-1.5 mb-6 shadow-sm border border-slate-200 dark:border-slate-700 print:hidden relative z-20">
            <button
              onClick={() => setMainTab('ringkasan')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === 'ringkasan' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <BarChart3 size={18} /> {t('tab_ringkasan')}
            </button>
            <button
              onClick={() => setMainTab('triwulan')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === 'triwulan' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <CalendarDays size={18} /> {t('tab_triwulan')}
            </button>
            <button
              onClick={() => setMainTab('bulanan')}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mainTab === 'bulanan' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <FileSpreadsheet size={18} /> {t('tab_bulanan')}
            </button>
          </div>

          {mainTab === 'ringkasan' && (
            <div className="space-y-6">
              {/* Dashboard Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Briefcase size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block truncate">{t('total_employees')}</span>
                <span className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 font-display block mt-0.5 truncate">{metrics.totalEmployees}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium block mt-0.5 truncate">{t('total_employees_sub')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block truncate">{t('avg_deficiency')}</span>
                <span className="text-xl sm:text-2xl font-bold text-rose-600 font-display block mt-0.5 truncate" title={formatMinutesFriendly(metrics.avgDeficiency)}>
                  {formatMinutesFriendly(metrics.avgDeficiency)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium block mt-0.5 truncate" title={t('avg_deficiency_sub')}>{t('avg_deficiency_sub')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider block truncate">{t('presence_rate')}</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-display block mt-0.5 truncate">
                  {metrics.overallPresence.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-medium block mt-0.5 truncate">{t('presence_rate_sub')}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-amber-200 transition-all">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                <Award size={22} className="text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider block bg-amber-100/65 px-2 py-0.5 rounded-md w-max">{t('exemplary_employee')}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block mt-1.5 max-w-[170px]" title={metrics.disciplineLeader}>
                  {metrics.disciplineLeader.split(',')[0]}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 font-semibold block mt-1.5 leading-relaxed">
                  {t('work_time')}: <span className="text-emerald-600 font-bold">{formatMinutesFriendly(metrics.disciplineLeaderActualWorked)}</span><br />
                  {t('def_time')}: <span className="text-rose-600 font-bold">{formatMinutesFriendly(metrics.disciplineLeaderDeficiency)}</span> | {t('leave_time')}: <span className="text-emerald-600">{metrics.disciplineLeaderLeave} {language === 'en' ? t('days') : 'hari'}</span>
                </span>
              </div>
            </div>
          </div>

            </div>
          )}

          {mainTab === 'triwulan' && (
            <div className="space-y-6">
              {/* SECTION: REKAPITULASI TRIWULAN & AKUMULASI */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-500" /> {t('quarter_recap')}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{t('quarter_recap_sub')}</p>
            </div>

            {/* Office Quarterly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card Q1 */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none"></div>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block mb-1">{t('quarter_1')}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">{t('quarter_1_sub')}</span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-600 font-display">
                    {formatMinutesFriendly(quarterlyMetrics.officeQ1Deficiency)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{language === 'en' ? 'Collective' : 'Kolektif'}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 font-medium">{t('quarter_1_desc')}</p>
              </div>

              {/* Card Q2 */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none"></div>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block mb-1">{t('quarter_2')}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">{t('quarter_2_sub')}</span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-rose-600 font-display">
                    {formatMinutesFriendly(quarterlyMetrics.officeQ2Deficiency)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{language === 'en' ? 'Collective' : 'Kolektif'}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 font-medium">{t('quarter_2_desc')}</p>
              </div>

              {/* Card Cumulative */}
              <div className="bg-emerald-950 text-white p-5 rounded-2xl border border-emerald-900/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] pointer-events-none"></div>
                <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest block mb-1">{t('total_accumulated')}</span>
                <span className="text-[11px] text-slate-300 font-medium block">{t('until_now')}</span>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-400 font-display">
                    {formatMinutesFriendly(quarterlyMetrics.officeTotalAccumulatedDeficiency)}
                  </span>
                  <span className="text-[10px] text-emerald-200 font-bold">{language === 'en' ? 'Office Collective' : 'Kolektif Kantor'}</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-2 font-medium">{t('total_accumulated_desc')}</p>
              </div>
            </div>

            {/* Collapsible / Interactive Table of Employee Accumulations */}
            <div className="bg-slate-50/30 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('accumulation_list')}</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">{t('accumulation_list_sub')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">
                      {language === 'en' ? 'Total: ' : 'Total: '} {quarterlyMetrics.employeesSummaryList.length} {language === 'en' ? t('employee') : 'Pegawai'}
                    </span>
                    {filteredQuarterlyEmployees.length !== quarterlyMetrics.employeesSummaryList.length && (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">
                        {language === 'en' ? 'Filtered: ' : 'Terfilter: '} {filteredQuarterlyEmployees.length} {language === 'en' ? t('employee') : 'Pegawai'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleExportQuarterlyExcel}
                    disabled={isExportingQuarterly || filteredQuarterlyEmployees.length === 0}
                    id="btn-ekspor-excel-akumulasi"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:bg-slate-700 text-white disabled:text-slate-400 dark:text-slate-500 rounded-xl text-[11px] font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:cursor-not-allowed border border-emerald-500/10"
                    title={t('export_accumulation')}
                  >
                    {isExportingQuarterly ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-white" />
                        {language === 'en' ? 'Exporting...' : 'Mengekspor...'}
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={13} className="text-white" />
                        {t('export_accumulation')}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Filters Area */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                {/* Search Name/NIP */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={quarterSearch}
                    onChange={(e) => setQuarterSearch(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                  />
                  {quarterSearch && (
                    <button
                      onClick={() => setQuarterSearch('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-500"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Unit Kerja */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Briefcase size={14} />
                  </span>
                  <input
                    type="text"
                    list="unit-kerja-list-quarter"
                    value={selectedUnitKerja === 'Semua' ? '' : selectedUnitKerja}
                    onChange={(e) => { setSelectedUnitKerja(e.target.value || 'Semua'); setCurrentPage(1); }}
                    placeholder={t('all_units')}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200"
                  />
                  <datalist id="unit-kerja-list-quarter">
                    {uniqueUnitKerjas.map(unit => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                  {selectedUnitKerja !== 'Semua' && (
                    <button
                      onClick={() => setSelectedUnitKerja('Semua')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-500"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Status */}
                <div className="relative">
                  <select
                    value={quarterStatusFilter}
                    onChange={(e) => setQuarterStatusFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="Semua">{t('all_statuses')}</option>
                    <option value="Sangat Baik">{t('very_good')} (0 {language === 'en' ? 'h' : 'jam'})</option>
                    <option value="Baik">{t('good')} (&lt; 22.5 {language === 'en' ? 'h' : 'jam'})</option>
                    <option value="Teguran Lisan">{t('lisan_warning')} (&ge; 22.5 {language === 'en' ? 'h' : 'jam'} / 3 {language === 'en' ? 'Days' : 'Hari'})</option>
                    <option value="Perlu Pembinaan">{t('need_guidance')} (&gt; 30 {language === 'en' ? 'h' : 'jam'})</option>
                    <option value="Tidakan Berat">{t('heavy_action')} (&gt; 60 {language === 'en' ? 'h' : 'jam'})</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronDown size={14} />
                  </span>
                </div>

                {/* Filter Deficiency Threshold */}
                <div className="relative">
                  <select
                    value={quarterMinDeficiency}
                    onChange={(e) => setQuarterMinDeficiency(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                  >
                    <option value="Semua">{language === 'en' ? 'All Deficit Levels' : 'Semua Tingkat Kekurangan'}</option>
                    <option value="has_deficiency">{language === 'en' ? 'Only those with deficiencies' : 'Hanya yang memiliki kekurangan'}</option>
                    <option value="gt_22_5h">{language === 'en' ? 'Deficiency \u2265 22.5 Hours (3 Work Days)' : 'Kekurangan \u2265 22.5 Jam (3 Hari Kerja)'}</option>
                    <option value="gt_30h">{language === 'en' ? 'Deficiency > 30 Hours' : 'Kekurangan > 30 Jam'}</option>
                    <option value="gt_60h">{language === 'en' ? 'Deficiency > 60 Hours' : 'Kekurangan > 60 Jam'}</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronDown size={14} />
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-4 py-3">{language === 'en' ? 'Employee Name / NIP' : 'Nama Pegawai / NIP'}</th>
                      <th className="px-4 py-3 text-center">{t('quarter_1')} (Jan-Mar)</th>
                      <th className="px-4 py-3 text-center">{t('quarter_2')} (Apr-Jun)</th>
                      <th className="px-4 py-3 text-center bg-emerald-50/30 text-emerald-900">{t('total_accumulated')}</th>
                      <th className="px-4 py-3 text-center">{language === 'en' ? 'Information' : 'Keterangan'}</th>
                      <th className="px-4 py-3 text-center">{language === 'en' ? 'Accumulation Status' : 'Status Akumulasi'}</th>
                      <th className="px-4 py-3 text-center">{language === 'en' ? 'Download Details' : 'Unduh Rincian'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuarterlyEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                          <AlertTriangle className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                          {t('not_found')}
                        </td>
                      </tr>
                    ) : (
                      paginatedQuarterlyEmployees.map((emp) => {
                        const totalDeficiencyHours = emp.totalDeficiency / 60;
                        const teguranThresholdMins = 22.5 * 60; // 1350 minutes (3 days * 7.5 hours/day)
                        const remainingToTeguran = teguranThresholdMins - emp.totalDeficiency;
                        
                        let statusLabel = t('very_good');
                        let statusBg = "bg-emerald-50 text-emerald-700";
                        if (totalDeficiencyHours > 60) {
                          statusLabel = `${t('heavy_action')} (>60h)`;
                          statusBg = "bg-rose-100 text-rose-700 font-bold animate-pulse";
                        } else if (totalDeficiencyHours > 30) {
                          statusLabel = `${t('need_guidance')} (>30h)`;
                          statusBg = "bg-rose-50 text-rose-700 font-bold";
                        } else if (totalDeficiencyHours >= 22.5) {
                          statusLabel = `${t('lisan_warning')} (>=22.5h)`;
                          statusBg = "bg-amber-100 text-amber-800 font-bold border border-amber-200";
                        } else if (totalDeficiencyHours > 0) {
                          statusLabel = `${t('good')} (<22.5h)`;
                          statusBg = "bg-sky-50 text-sky-700";
                        }

                        return (
                          <tr key={emp.nip} className="border-l-4 border-l-transparent hover:border-l-emerald-400 dark:hover:border-l-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-all duration-150 group">
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-800 dark:text-slate-100">{emp.nama.split(',')[0]}</div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">NIP. {emp.nip} • {emp.gol}</div>
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-600 dark:text-slate-500">
                              {emp.q1Deficiency > 0 ? (
                                <span className="text-rose-600">{formatMinutesFriendly(emp.q1Deficiency)}</span>
                              ) : (
                                <span className="text-emerald-600">0m</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-600 dark:text-slate-500">
                              {emp.q2Deficiency > 0 ? (
                                <span className="text-rose-600">{formatMinutesFriendly(emp.q2Deficiency)}</span>
                              ) : (
                                <span className="text-emerald-600">0m</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-bold bg-emerald-50/10 text-emerald-950">
                              {emp.totalDeficiency > 0 ? (
                                <span className="text-rose-700 font-black">{formatMinutesFriendly(emp.totalDeficiency)}</span>
                              ) : (
                                <span className="text-emerald-700">0m ({language === 'en' ? 'Perfect' : 'Sempurna'})</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center font-medium text-slate-500 dark:text-slate-500">
                              {emp.totalHadir} {language === 'en' ? 'days present' : 'hari hadir'}<br />
                              <span className="text-[10px] text-emerald-600">({emp.totalLeave} {language === 'en' ? 'days leave' : 'hari cuti/izin'})</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex flex-col items-center justify-center gap-1.5">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBg}`}>
                                  {statusLabel}
                                </span>
                                {emp.totalDeficiency < teguranThresholdMins ? (
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block leading-tight">
                                    {t('remaining_lisan_warning').replace('{remaining}', formatMinutesFriendly(remainingToTeguran))}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-rose-500 font-semibold block leading-tight">
                                    {t('reached_lisan_warning')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => handleExportSingleEmployeeExcel(emp)}
                                disabled={exportingNip !== null}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-50 dark:bg-slate-800/50 text-emerald-700 disabled:text-slate-400 dark:text-slate-500 rounded-lg text-[10px] font-bold transition-all border border-emerald-200/50 hover:border-emerald-300 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                                title={`Unduh rincian kekurangan jam kerja untuk ${emp.nama}`}
                              >
                                {exportingNip === emp.nip ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin text-emerald-700" />
                                    <span>{language === 'en' ? 'Downloading...' : 'Mengunduh...'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={12} className="text-emerald-600" />
                                    <span>{t('download_excel')}</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Quarterly Pagination Footer */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Menampilkan {Math.min(filteredQuarterlyEmployees.length, (quarterCurrentPage - 1) * quarterItemsPerPage + 1)}-{Math.min(filteredQuarterlyEmployees.length, quarterCurrentPage * quarterItemsPerPage)} dari {filteredQuarterlyEmployees.length} pegawai
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tampilkan:</span>
                    <select
                      value={quarterItemsPerPage}
                      onChange={(e) => setQuarterItemsPerPage(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-300"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {quarterTotalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuarterCurrentPage(1)}
                      disabled={quarterCurrentPage === 1}
                      className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                      title="Halaman Pertama"
                    >
                      <ChevronsLeft size={14} />
                    </button>
                    <button
                      onClick={() => setQuarterCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={quarterCurrentPage === 1}
                      className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1 px-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Hal</span>
                      <input
                        type="number"
                        min={1}
                        max={quarterTotalPages}
                        value={quarterCurrentPage}
                        onChange={(e) => setQuarterCurrentPage(Math.max(1, Math.min(Number(e.target.value), quarterTotalPages)))}
                        className="w-10 text-center py-0.5 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">/ {quarterTotalPages}</span>
                    </div>

                    <button
                      onClick={() => setQuarterCurrentPage(prev => Math.min(prev + 1, quarterTotalPages))}
                      disabled={quarterCurrentPage === quarterTotalPages}
                      className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight size={14} />
                    </button>
                    <button
                      onClick={() => setQuarterCurrentPage(quarterTotalPages)}
                      disabled={quarterCurrentPage === quarterTotalPages}
                      className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-all cursor-pointer"
                      title="Halaman Terakhir"
                    >
                      <ChevronsRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-500" /> {t('visual_analysis')}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{t('visual_analysis_sub')}</p>
              </div>

              {/* Chart Tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar gap-1">
                <button
                  onClick={() => setActiveChartTab('performance-summary')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeChartTab === 'performance-summary' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t('presence_perf')}
                </button>
                <button
                  onClick={() => setActiveChartTab('daily-trend')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeChartTab === 'daily-trend' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t('daily_trend')}
                </button>
                <button
                  onClick={() => setActiveChartTab('top-deficiency')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeChartTab === 'top-deficiency' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t('highest_def')}
                </button>
                <button
                  onClick={() => setActiveChartTab('distribution')}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    activeChartTab === 'distribution' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {t('status_dist')}
                </button>
              </div>
            </div>

            <div className="h-[360px] w-full">
              {activeChartTab === 'performance-summary' && (
                <div className="space-y-2 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
                      {selectedMonth === 'Semua' 
                        ? t('performance_summary_all_desc')
                        : `${t('performance_summary_month_desc')} ${selectedMonth}`}
                    </span>
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyPerformanceData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="category" 
                          stroke="#94a3b8" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          yAxisId="left" 
                          stroke="#f43f5e" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          label={{ value: t('deficiency_axis'), angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, offset: 10 }} 
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#6366f1" 
                          fontSize={11} 
                          tickLine={false} 
                          axisLine={false} 
                          domain={[0, 100]}
                          label={{ value: t('attendance_rate_axis'), angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10, offset: 10 }} 
                        />
                        <Tooltip 
                          contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                          formatter={(value, name) => {
                            if (name === 'presenceRate') return [`${value}%`, t('presence_rate')];
                            if (name === 'deficiencyHours') return [`${value} ${language === 'en' ? t('hours') : 'Jam'}`, t('deficiency')];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar yAxisId="right" dataKey="presenceRate" name={t('presence_rate')} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                        <Bar yAxisId="left" dataKey="deficiencyHours" name={t('deficiency')} fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
</DeferredView>
                  </div>
                </div>
              )}

              {activeChartTab === 'daily-trend' && (
                <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDef" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPres" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#ef4444" fontSize={11} tickLine={false} axisLine={false} label={{ value: t('total_deficiency_label'), angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} label={{ value: t('attendance_rate_label'), angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                      labelFormatter={(label) => {
                        const monthName = selectedMonth === 'Semua' ? (language === 'en' ? 'June' : 'Juni') : selectedMonth;
                        return `${language === 'en' ? 'Date' : 'Tanggal'} ${label} ${monthName} 2026`;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area yAxisId="left" type="monotone" dataKey="deficiencyHours" name={t('total_deficiency_label')} stroke="#ef4444" fillOpacity={1} fill="url(#colorDef)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="presencePercentage" name={t('attendance_rate_label')} stroke="#6366f1" fillOpacity={1} fill="url(#colorPres)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
</DeferredView>
              )}

              {activeChartTab === 'top-deficiency' && (
                <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDeficiencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                    <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="deficiencyHours" name={`${t('deficiency')} (${language === 'en' ? 'Hours' : 'Jam'})`} fill="#ef4444" radius={[0, 8, 8, 0]}>
                      {topDeficiencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#f87171'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
</DeferredView>
              )}

              {activeChartTab === 'distribution' && (
                <div className="flex flex-col md:flex-row items-center justify-around h-full">
                  <div className="w-[240px] h-[240px] shrink-0">
                    <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
</DeferredView>
                  </div>
                  <div className="space-y-3.5 grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0 mt-4 md:mt-0">
                    {distributionData.map((item, index) => {
                      const translatedName = item.name === 'Sangat Baik' ? t('very_good') : 
                                             item.name === 'Baik' ? t('good') : 
                                             item.name === 'Teguran Lisan' ? t('lisan_warning') : 
                                             item.name === 'Perlu Pembinaan' ? t('need_guidance') : 
                                             item.name === 'Tindakan Berat' ? t('heavy_action') : item.name;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: item.color }}></div>
                          <div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{translatedName}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">{item.value} {language === 'en' ? t('employee') : 'Pegawai'} ({Math.round((item.value / data.length) * 100)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
          )}

          {mainTab === 'bulanan' && (
            <div className="space-y-6">
          {/* Main Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Table Header Filter controls */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">{t('attendance_list')}</h2>
                <p className="text-slate-500 dark:text-slate-500 text-xs mt-0.5">{t('attendance_list_sub')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center print:hidden">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                  />
                </div>

                {/* Filter Bulan */}
                <div className="relative w-full sm:w-40 flex items-center shrink-0">
                  <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
                  <select
                    value={selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-semibold text-slate-600 dark:text-slate-500 cursor-pointer appearance-none"
                  >
                    <option value="Semua">{t('all_months')}</option>
                    {uniqueMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
                </div>

                {/* Filter Unit Kerja */}
                <div className="relative w-full sm:w-56 flex items-center shrink-0">
                  <Briefcase className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" size={14} />
                  <input
                    type="text"
                    list="unit-kerja-list-month"
                    value={selectedUnitKerja === 'Semua' ? '' : selectedUnitKerja}
                    onChange={(e) => { setSelectedUnitKerja(e.target.value || 'Semua'); setCurrentPage(1); }}
                    placeholder={t('all_units')}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                  />
                  <datalist id="unit-kerja-list-month">
                    {uniqueUnitKerjas.map(unit => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                  {selectedUnitKerja !== 'Semua' && (
                    <button
                      onClick={() => setSelectedUnitKerja('Semua')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 dark:text-slate-500 hover:text-emerald-700 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-emerald-600" />
                      {language === 'en' ? 'Exporting...' : 'Mengekspor...'}
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      {t('export_excel')}
                    </>
                  )}
                </button>

                {/* Cetak Laporan Button */}
                <button
                  onClick={() => window.print()}
                  id="btn-cetak-laporan-utama"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                  title={t('print_report')}
                >
                  <Printer size={14} />
                  {t('print_report')}
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5">No</th>
                    <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('nama')}>
                      {language === 'en' ? 'Employee' : 'Pegawai'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('bulan')}>
                      {language === 'en' ? 'Month' : 'Bulan'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('unitKerja')}>
                      {language === 'en' ? 'Unit / Dept' : 'Unit Kerja'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('totalHadir')}>
                      {language === 'en' ? 'Present' : 'Hadir'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('totalLeave')}>
                      {language === 'en' ? 'Leave' : 'Cuti'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('totalActualWorked')}>
                      {language === 'en' ? 'Worked Time' : 'Waktu Kerja'} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-slate-100 dark:bg-slate-800 transition-colors" onClick={() => requestSort('totalDeficiency')}>
                      {t('deficiency')} <ArrowUpDown size={11} className="inline ml-1 text-slate-400 dark:text-slate-500" />
                    </th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:hidden">
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map((r, index) => {
                      const recordNumber = (currentPage - 1) * itemsPerPage + index + 1;
                      const status = getDisciplineStatus(r.totalDeficiency);
                      
                      return (
                        <tr 
                          key={`${r.nip}-${r.bulan}`}
                          onClick={() => setSelectedRecord(r)}
                          className="border-l-4 border-l-transparent hover:border-l-emerald-400 dark:hover:border-l-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-all duration-150 cursor-pointer group"
                        >
                          <td className="px-5 py-4 font-mono text-xs text-slate-400 dark:text-slate-500">{recordNumber}</td>
                          <td className="px-5 py-4">
                            <div>
                              <div className="font-display font-bold text-slate-800 dark:text-slate-100 text-xs md:text-sm group-hover:text-emerald-600 transition-colors">{r.nama}</div>
                              <div className="text-slate-400 dark:text-slate-500 text-[10px] font-mono mt-0.5">NIP. {r.nip} • Gol. {r.gol}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-500 text-xs font-semibold">{r.bulan}</td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-500 text-xs font-semibold">{r.unitKerja}</td>
                          <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{r.totalHadir} hr</td>
                          <td className="px-5 py-4 text-center font-mono text-xs text-slate-500 dark:text-slate-500">{r.totalLeave} hr</td>
                          <td className="px-5 py-4 text-center font-mono text-xs font-bold text-emerald-600">
                            {Math.round(r.totalActualWorked / 60)}j
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-xs font-black text-rose-600">
                            {formatMinutesFriendly(r.totalDeficiency)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg border uppercase tracking-wider ${status.bg}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                        {t('no_matching_search')}
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Print-only tbody showing ALL sorted/filtered records without pagination */}
                <tbody className="divide-y divide-slate-200 hidden print:table-row-group">
                  {sortedRecords.length > 0 ? (
                    sortedRecords.map((r, index) => {
                      const recordNumber = index + 1;
                      const status = getDisciplineStatus(r.totalDeficiency);
                      
                      return (
                        <tr 
                          key={`print-${r.nip}-${r.bulan}`}
                          className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">{recordNumber}</td>
                          <td className="px-4 py-3 border border-slate-200 dark:border-slate-700">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{r.nama}</div>
                              <div className="text-slate-500 dark:text-slate-500 text-[10px] font-mono mt-0.5">NIP. {r.nip} • {r.gol}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100 text-xs font-medium border border-slate-200 dark:border-slate-700">{r.bulan}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-100 text-xs border border-slate-200 dark:border-slate-700">{r.unitKerja}</td>
                          <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">{r.totalHadir} hr</td>
                          <td className="px-4 py-3 text-center font-mono text-xs text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700">{r.totalLeave} hr</td>
                          <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                            {Math.round(r.totalActualWorked / 60)}j
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-xs font-black text-rose-700 border border-slate-200 dark:border-slate-700">
                            {formatMinutesFriendly(r.totalDeficiency)}
                          </td>
                          <td className="px-4 py-3 text-center border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 uppercase">
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500">
                        {t('no_data')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {language === 'en' 
                    ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, sortedRecords.length)} of ${sortedRecords.length} employees`
                    : `Menampilkan ${(currentPage - 1) * itemsPerPage + 1} hingga ${Math.min(currentPage * itemsPerPage, sortedRecords.length)} dari ${sortedRecords.length} pegawai`}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Tampilkan:</span>
                  <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-300"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isNear = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                    
                    if (!isNear) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return <span key={pageNum} className="text-slate-300 dark:text-slate-600 px-1 text-xs font-bold">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum 
                            ? 'bg-emerald-600 text-white shadow-sm' 
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800/50 disabled:opacity-50 disabled:pointer-events-none text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
          )}
        </>
      )}

      {/* Employee Detail Sidebar Drawer */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 overflow-hidden print:absolute print:inset-0 print:bg-white dark:bg-slate-900 print:text-black print:overflow-visible">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-slate-950/40  print:hidden"
            />

            {/* Content Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-4xl w-full flex pl-10 print:static print:w-full print:max-w-none print:p-0">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full bg-white dark:bg-slate-900 h-screen shadow-2xl flex flex-col print:h-auto print:shadow-none print:static"
              >
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex items-start justify-between print:hidden">
                  <div>
                    <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest leading-none block mb-1.5">
                      {language === 'en' ? 'ATTENDANCE DETAIL CALENDAR' : 'KALENDER DETAIL KEHADIRAN'}
                    </span>
                    <h3 className="text-lg font-display font-black leading-tight">{selectedRecord.nama}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">
                      NIP. {selectedRecord.nip} • Gol. {selectedRecord.gol} • {selectedRecord.unitKerja}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Cetak Rincian Button */}
                    <button 
                      onClick={() => window.print()}
                      className="p-2 bg-white/10 hover:bg-white/20 text-emerald-400 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3 py-2 print:hidden"
                      title={language === 'en' ? 'Print daily details of this employee' : 'Cetak rincian harian pegawai ini'}
                    >
                      <Printer size={15} />
                      <span>{t('print')}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedRecord(null)}
                      className="p-2 bg-white/10 hover:bg-white/20 text-slate-400 dark:text-slate-500 hover:text-white rounded-xl transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:overflow-visible print:p-0 print:space-y-4">
                  {/* Header Laporan Resmi untuk Cetak (Drawer) */}
                  <div className="hidden print:block border-b-4 border-double border-slate-900 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-800 shrink-0">
                        KGB
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold tracking-widest text-slate-800 dark:text-slate-100 uppercase leading-none mb-1">
                          {language === 'en' ? 'MINISTRY OF INDUSTRY OF THE REPUBLIC OF INDONESIA' : 'KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA'}
                        </p>
                        <h1 className="text-xl font-display font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                          {language === 'en' ? 'AGENCY FOR INDUSTRIAL STANDARDIZATION AND SERVICES POLICY (BSKJI)' : 'BADAN STANDARISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)'}
                        </h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold tracking-wide mt-1.5">
                          {t('print_title_detail')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end text-xs text-slate-700 dark:text-slate-200">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{selectedRecord.nama}</p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">NIP: {selectedRecord.nip} | Gol: {selectedRecord.gol}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">{language === 'en' ? 'Working Unit' : 'Unit Kerja'}: {selectedRecord.unitKerja}</p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                        {language === 'en' ? 'Month' : 'Bulan'}: {selectedRecord.bulan} 2026 <br />
                        {language === 'en' ? 'Printed on' : 'Dicetak pada'}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  {/* Monthly Summary Statistics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">{t('work_time')}</span>
                      <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono block mt-1">
                        {selectedRecord.totalHadir} {language === 'en' ? t('days') : 'Hari'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">{t('leave_time')}</span>
                      <span className="text-xl font-bold text-emerald-600 font-mono block mt-1">
                        {selectedRecord.totalLeave} {language === 'en' ? t('days') : 'Hari'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">{t('work_duration')}</span>
                      <span className="text-xl font-bold text-emerald-600 font-mono block mt-1">
                        {Math.round(selectedRecord.totalActualWorked / 60)} {language === 'en' ? t('hours') : 'Jam'}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block uppercase tracking-wider">{t('deficiency')}</span>
                      <span className="text-xl font-bold text-rose-600 font-mono block mt-1">{formatMinutesFriendly(selectedRecord.totalDeficiency)}</span>
                    </div>
                  </div>

                  {/* Day-by-Day Calendar logs */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-emerald-500" /> {t('daily_log')} ({selectedRecord.bulan} 2026)
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{t('daily_log_sub')}</p>
                      </div>

                      {/* Toggle Filter Deficiency */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-500 hover:text-emerald-700 transition-all shadow-sm print:hidden">
                        <input 
                          type="checkbox"
                          checked={drawerFilterDeficiencyOnly}
                          onChange={(e) => setDrawerFilterDeficiencyOnly(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer accent-emerald-600"
                        />
                        <span>{t('only_deficiencies')}</span>
                      </label>
                    </div>

                    {/* Legend bar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-[10px] text-slate-500 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 print:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-200 rounded inline-block shrink-0"></span>
                        <span>{t('fulfilled')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-rose-50 border border-rose-200 rounded inline-block shrink-0"></span>
                        <span>{language === 'en' ? 'Has Deficit / Absent' : 'Ada Kekurangan / Alfa'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-200 rounded inline-block shrink-0"></span>
                        <span>{language === 'en' ? 'Leave / Business Trip (CT, C, D, DL, TL, T, DK)' : 'Cuti / Dinas Luar (CT, C, D, DL, TL, T, DK)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded inline-block shrink-0"></span>
                        <span>{t('weekend')}</span>
                      </div>
                    </div>

                    <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/30">
                      <div className="grid grid-cols-1 divide-y divide-slate-100">
                        {/* Day Header */}
                        <div className="grid grid-cols-6 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/70 text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                          <div className="col-span-2">{t('day_date')}</div>
                          <div className="text-center">{t('check_in')}</div>
                          <div className="text-center">{t('check_out')}</div>
                          <div className="text-center">{t('work_duration')}</div>
                          <div className="text-center">{t('deficiency')}</div>
                        </div>

                        {/* Log Row Items */}
                        {(() => {
                          const attendanceEntries = Object.entries(selectedRecord.attendance)
                            .map(([dayStr, attVal]) => ({ dayStr, att: attVal as DailyAttendance, day: parseInt(dayStr, 10) }))
                            .sort((a, b) => a.day - b.day);

                          const filteredEntries = drawerFilterDeficiencyOnly 
                            ? attendanceEntries.filter(entry => entry.att.deficiency > 0 && entry.att.isRequiredDay)
                            : attendanceEntries;

                          if (filteredEntries.length === 0) {
                            return (
                              <div className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-2">
                                <CheckCircle className="text-emerald-500 animate-pulse" size={24} />
                                <span>
                                  {language === 'en' 
                                    ? 'No working hour deficiency in this month. Perfect!' 
                                    : 'Tidak ada hari yang memiliki kekurangan jam kerja di bulan ini. Sempurna!'}
                                </span>
                              </div>
                            );
                          }

                          return filteredEntries.map(({ dayStr, att, day }) => {
                            const isWeekend = att.dayOfWeek === 0 || att.dayOfWeek === 6;
                            const hasDeficiency = att.deficiency > 0;
                            
                            let rowBg = "bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:bg-slate-800/80";
                            let defTextClass = "text-rose-600 font-black";
                            let noteBadge = null;

                            if (isWeekend) {
                              rowBg = "bg-slate-50/50 text-slate-400 dark:text-slate-500";
                              defTextClass = "text-slate-400 dark:text-slate-500";
                            } else if (att.note.includes("Hari Libur")) {
                              rowBg = "bg-amber-50/20 text-slate-500 dark:text-slate-500";
                              defTextClass = "text-slate-400 dark:text-slate-500";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded">
                                  {language === 'en' ? 'Holiday' : 'Libur'}
                                </span>
                              );
                            } else if (att.note === "Tidak Hadir") {
                              rowBg = "bg-rose-50/15";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded">
                                  {language === 'en' ? 'Absent' : 'Alfa'}
                                </span>
                              );
                            } else if (att.note !== "Hadir") {
                              // Leave code (C, CT, DL, S)
                              rowBg = "bg-emerald-50/10 text-slate-600 dark:text-slate-500";
                              defTextClass = "text-slate-400 dark:text-slate-500";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                  {att.note}
                                </span>
                              );
                            } else if (!hasDeficiency) {
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded">
                                  {t('fulfilled')}
                                </span>
                              );
                            }

                            return (
                              <div 
                                key={day} 
                                className={`grid grid-cols-6 px-4 py-3 items-center text-xs transition-colors ${rowBg}`}
                              >
                                <div className="col-span-2 flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 w-5">{day.toString().padStart(2, '0')}</span>
                                  <div className="min-w-0">
                                    <span className="block font-bold text-slate-800 dark:text-slate-100 text-[11px] leading-tight">
                                      {language === 'en' 
                                        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][att.dayOfWeek] 
                                        : getDayNameIndonesian(att.dayOfWeek)}
                                    </span>
                                    <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wide">
                                      {day} {translateMonthName(selectedRecord.bulan, language)} 2026
                                    </span>
                                  </div>
                                  {noteBadge}
                                </div>

                                <div className="text-center font-mono font-semibold text-slate-600 dark:text-slate-500">
                                  {att.checkIn || "-"}
                                </div>

                                <div className="text-center font-mono font-semibold text-slate-600 dark:text-slate-500">
                                  {att.checkOut || "-"}
                                </div>

                                <div className="text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                                  {att.actualWorked > 0 ? formatMinutesFriendly(att.actualWorked) : "-"}
                                </div>

                                <div className={`text-center font-mono ${defTextClass}`}>
                                  {att.deficiency > 0 ? formatMinutesFriendly(att.deficiency) : (isWeekend || att.note !== "Hadir") ? "-" : "0m"}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-5 py-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {t('done')}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default JamKerjaPage;
