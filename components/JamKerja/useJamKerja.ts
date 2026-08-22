import React, { useState, useEffect, useMemo } from 'react';
import { LOCAL_TRANSLATIONS } from './translations';
import { getQuarterFromMonth, translateMonthName } from './utils';
import { fetchJamKerjaData, JamKerjaRecord, DailyAttendance, isWeekendForMonth, getIndonesianHolidayName, formatMinutesFriendly, getDayNameIndonesian, getDayOfWeekForMonth } from '../../utils/jamKerjaHelpers';
import * as XLSX from 'xlsx';

export function useJamKerja(language: 'id' | 'en' = 'id') {
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
      const matchSearch = record.nama.toLowerCase().includes(searchTerm.toLowerCase()) || record.nip.includes(searchTerm);
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
      const matchSearch = emp.nama.toLowerCase().includes(quarterSearch.toLowerCase()) || emp.nip.includes(quarterSearch);
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
        day: d, label, deficiency: 0, presenceCount: 0
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
    if (hours === 0) return { label: t('very_good'), bg: 'bg-primary-50 border-primary-100 text-primary-700' };
    if (hours <= 10) return { label: t('good'), bg: 'bg-primary-50 border-primary-100 text-primary-700' };
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
          idx + 1, r.nip, r.nama, r.bulan, r.unitKerja, r.totalHadir, r.totalLeave, r.totalAbsen, alpaDaysStr, hoursWorked, hoursDeficiency, deficiencyDaysStr, progressBar, status
        ];
      });

      const wsData = [
        title, subtitle, blankRow, headers,
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
        statsTitle, statsSubtitle, blankRow, statsHeaders,
        ...statRows, blankRow, blankRow, distHeaders,
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
            rowIdx++, emp.nip, emp.nama, emp.gol, emp.unitKerja, record.bulan,
            Math.round((monthlyDeficiencyMins / 60) * 100) / 100, formatMinutesFriendly(monthlyDeficiencyMins), rincianTanggalStr,
            Math.round((emp.q1Deficiency / 60) * 100) / 100,
            Math.round((emp.q2Deficiency / 60) * 100) / 100,
            Math.round((emp.totalDeficiency / 60) * 100) / 100, formatMinutesFriendly(emp.totalDeficiency), emp.totalHadir, emp.totalLeave, statusLabel
          ]);
        });
      });

      const wsSummaryData = [
        title, subtitle, filterDesc, blankRow, summaryHeaders,
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
                  detailIdx++, emp.nip, emp.nama, emp.gol, emp.unitKerja, record.bulan, dayNum, dayName, att.checkIn || "-", att.checkOut || "-", att.deficiency, formatMinutesFriendly(att.deficiency), att.note || "Kekurangan Jam Kerja"
                ]);
              }
            });
          }
        });
      });

      const detailTitle = ["JURNAL RINCIAN TANGGAL KEKURANGAN JAM KERJA PEGAWAI"];
      const detailSubtitle = ["DAFTAR SELURUH TANGGAL YANG MEMILIKI KEKURANGAN UNTUK PEGAWAI TERFILTER"];
      const wsDetailData = [
        detailTitle, detailSubtitle, blankRow, detailHeaders,
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
        title, subtitle, empInfo, unitInfo, blankRow, summaryHeaders,
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
                detailIdx++, record.bulan, dayNum, dayName, att.checkIn || "-", att.checkOut || "-", att.deficiency, formatMinutesFriendly(att.deficiency), att.note || "Kekurangan Jam Kerja"
              ]);
            }
          });
        }
      });

      const detailTitle = [`JURNAL DETAIL KEKURANGAN - ${emp.nama.split(',')[0].toUpperCase()}`];
      const detailSubtitle = ["DAFTAR SELURUH TANGGAL YANG MEMILIKI KEKURANGAN JAM KERJA"];
      const wsDetailData = [
        detailTitle, detailSubtitle, blankRow, detailHeaders,
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

  return {
    t, data, setData, loading, setLoading, error, setError,
    searchTerm, setSearchTerm, selectedMonth, setSelectedMonth,
    selectedUnitKerja, setSelectedUnitKerja, sortConfig, setSortConfig,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    selectedRecord, setSelectedRecord, activeChartTab, setActiveChartTab,
    isExporting, setIsExporting, mainTab, setMainTab,
    quarterSearch, setQuarterSearch, quarterStatusFilter, setQuarterStatusFilter,
    quarterMinDeficiency, setQuarterMinDeficiency, quarterCurrentPage, setQuarterCurrentPage,
    quarterItemsPerPage, setQuarterItemsPerPage, isExportingQuarterly, setIsExportingQuarterly,
    exportingNip, setExportingNip, drawerFilterDeficiencyOnly, setDrawerFilterDeficiencyOnly,
    uniqueMonths, uniqueUnitKerjas, monthFilteredData, filteredRecords,
    sortedRecords, paginatedRecords, totalPages, requestSort,
    metrics, quarterlyMetrics, filteredQuarterlyEmployees, quarterTotalPages,
    paginatedQuarterlyEmployees, dailyTrendData, topDeficiencyData,
    distributionData, monthlyPerformanceData, getDisciplineStatus,
    handleExportExcel, handleExportQuarterlyExcel, handleExportSingleEmployeeExcel
  };
}
