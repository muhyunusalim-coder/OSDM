import React, { useState, useMemo } from 'react';
import { DeferredView } from './DeferredView';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Users, Award, MapPin, Search } from 'lucide-react';
import { Employee } from '../types';
import { getBirthDateFromNIP, getRetirementAge, calculateTmtPensiun } from '../utils/pensionHelpers';
import { Language, TRANSLATIONS } from '../utils/translationHelper';

import { useMediaQuery } from '../hooks/useMediaQuery';

interface Props {
  employees: Employee[];
  language: Language;
}

const PensionProjectionDashboardChart: React.FC<Props> = React.memo(({ employees, language }) => {
  const currentYear = new Date().getFullYear();
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // States
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState('');

  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  // Generate 5 Years range (current year + 4 years)
  const projectionYears = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear + i);
  }, [currentYear]);

  // Aggregate pension details
  const pensionDataMap = useMemo<Record<number, { year: number; count: number; list: Employee[] }>>(() => {
    // Initialize empty records for each year
    const data: Record<number, { year: number; count: number; list: Employee[] }> = {};
    projectionYears.forEach(year => {
      data[year] = { year, count: 0, list: [] };
    });

    employees.forEach(emp => {
      const birthDate = getBirthDateFromNIP(emp.nip);
      if (birthDate) {
        const bup = getRetirementAge(emp.jabatan);
        const tmt = calculateTmtPensiun(birthDate, bup);
        const y = tmt.getFullYear();
        if (data[y]) {
          data[y].count++;
          data[y].list.push(emp);
        }
      }
    });

    return data;
  }, [employees, projectionYears]);

  // Transform data map to recharts friendly format
  const chartData = useMemo(() => {
    return projectionYears.map(year => {
      const item = pensionDataMap[year] || { year, count: 0, list: [] };
      return {
        year: item.year.toString(),
        Pegawai: item.count,
      };
    });
  }, [pensionDataMap, projectionYears]);

  // Calculate high-level summary stats
  const stats = useMemo(() => {
    let total = 0;
    const unitCounts: Record<string, number> = {};
    let peakCount = -1;
    let peakYear = currentYear;

    projectionYears.forEach(year => {
      const item = pensionDataMap[year];
      if (item) {
        total += item.count;
        if (item.count > peakCount) {
          peakCount = item.count;
          peakYear = item.year;
        }
        item.list.forEach(emp => {
          const unit = emp.unitKerja || 'Lainnya';
          unitCounts[unit] = (unitCounts[unit] || 0) + 1;
        });
      }
    });

    // Find most affected unit
    let topUnit = 'Tidak Ada';
    let topUnitCount = 0;
    Object.entries(unitCounts).forEach(([unit, count]) => {
      if (count > topUnitCount) {
        topUnitCount = count;
        topUnit = unit;
      }
    });

    return {
      total,
      peakYear,
      peakCount,
      topUnit,
      topUnitCount
    };
  }, [pensionDataMap, currentYear]);

  // Employees in selected year
  const activeYearData = pensionDataMap[selectedYear] || { count: 0, list: [] };

  // Filtered employees for search
  const filteredRetirees = useMemo(() => {
    if (!searchQuery.trim()) return activeYearData.list;
    const q = searchQuery.toLowerCase();
    return activeYearData.list.filter(emp => 
      emp.nama.toLowerCase().includes(q) || 
      emp.nip.toLowerCase().includes(q) || 
      (emp.jabatan || '').toLowerCase().includes(q) || 
      (emp.unitKerja || '').toLowerCase().includes(q)
    );
  }, [activeYearData.list, searchQuery]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col group mt-6">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-rose-500/5 dark:from-rose-500/10 to-transparent rounded-full blur-[50px] pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100/30 dark:border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-sm shadow-rose-100/50 dark:shadow-none">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              Proyeksi Pensiun & Demografi 5 Tahun
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wide mt-0.5">
              Proyeksi interaktif jadwal pensiun pegawai jangka menengah
            </p>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
          {projectionYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedYear === year
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm shadow-rose-100 dark:shadow-none'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Top statistics highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 relative z-10">
        <div className="bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-500/10 dark:to-slate-900 p-4 rounded-xl border border-rose-100/50 dark:border-rose-800/50 flex items-center gap-4">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
            <Users size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-extrabold block">Total Pensiun 5 Thn</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.total}</span>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">pegawai</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-500/10 dark:to-slate-900 p-4 rounded-xl border border-pink-100/50 dark:border-pink-800/50 flex items-center gap-4">
          <div className="p-2.5 bg-pink-100 dark:bg-pink-500/20 rounded-lg text-pink-600 dark:text-pink-400">
            <Calendar size={16} />
          </div>
          <div>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-extrabold block">Puncak Masa Pensiun</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{stats.peakYear}</span>
              <span className="text-xs text-pink-700 dark:text-pink-300 font-bold bg-pink-50 dark:bg-pink-500/20 px-1.5 py-0.5 rounded-md text-[10px]">
                {stats.peakCount} orang
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-500/10 dark:to-slate-900 p-4 rounded-xl border border-amber-100/50 dark:border-amber-800/50 flex items-center gap-4">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
            <MapPin size={16} />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-extrabold block">Unit Kerja Terdampak</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block truncate" title={stats.topUnit}>
              {stats.topUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Side: Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="h-[280px] w-full">
            <DeferredView>
<ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="pensionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: isMobile ? 9 : 11, fill: '#94a3b8', fontWeight: '600' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  dx={-10}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Pegawai" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#pensionGradient)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
</DeferredView>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3.5 mt-2 flex items-center gap-3">
            <Award className="text-rose-500 dark:text-rose-400 shrink-0" size={16} />
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
              Informasi: Perhitungan pensiun didasarkan pada tanggal lahir (NIP) dan batas usia pensiun (BUP) sesuai regulasi jabatan struktural maupun fungsional.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive List of employees for selected year */}
        <div className="lg:col-span-5 flex flex-col bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Daftar Pegawai Pensiun {selectedYear}</span>
              </h4>
              <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-100/60 dark:border-rose-800/60 px-2 py-0.5 rounded-full">
                {activeYearData.count} Pegawai
              </span>
            </div>

            {/* Search Input for List */}
            {activeYearData.count > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pegawai pensiun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8.5 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 dark:focus:border-rose-500 transition-all font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          {/* List Box */}
          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1 custom-scrollbar">
            {filteredRetirees.length > 0 ? (
              filteredRetirees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg p-3 hover:border-rose-200 dark:hover:border-rose-700 transition-all duration-200 group/item flex flex-col gap-1 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover/item:text-rose-600 dark:group-hover/item:text-rose-400 transition-colors block truncate max-w-[200px]">
                      {emp.nama}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap">
                      {emp.pangkat}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                    <span className="font-mono text-primary-700 dark:text-primary-400 font-semibold">{emp.nip}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{emp.unitKerja}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-1.5 flex items-center justify-between">
                    <span className="truncate max-w-[150px]" title={emp.jabatan}>{emp.jabatan}</span>
                    <span className="text-rose-700 dark:text-rose-300 font-semibold text-[9px] bg-rose-50 dark:bg-rose-500/15 px-1.5 py-0.5 rounded">BUP {getRetirementAge(emp.jabatan)} Thn</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <Users size={24} className="text-slate-400 dark:text-slate-500 mb-2" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {searchQuery 
                    ? 'Tidak ada hasil pencarian'
                    : 'Tidak ada pensiun di tahun ini'}
                </p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Hapus pencarian
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PensionProjectionDashboardChart.displayName = 'PensionProjectionDashboardChart';
export default PensionProjectionDashboardChart;
