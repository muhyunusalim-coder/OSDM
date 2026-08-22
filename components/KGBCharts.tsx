import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Filter, BarChart3, PieChart } from 'lucide-react';
import { Employee } from '../types';
import { DeferredView } from './DeferredView';

// Lazy load chart components
const MonthlyBarChart = lazy(() => import('./charts/MonthlyBarChart'));
const StaticStatusPieChart = lazy(() => import('./charts/StaticStatusPieChart'));

interface Props {
  employees: Employee[];
  title?: string;
  onMonthClick?: (month: string, year: number) => void;
  selectedMonth?: string | null;
}

// Skeleton loader for charts
const ChartSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-200/50">
    <div className="relative flex items-center justify-center">
      <div className="w-32 h-32 border-4 border-gray-100 dark:border-gray-800 border-t-primary-200 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
      </div>
    </div>
  </div>
);

const KGBCharts: React.FC<Props> = React.memo(({ employees, title = "Monitoring KGB", onMonthClick, selectedMonth }) => {
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const parseDate = (dateStr: string) => {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateStr.split('-');
      return { year: parseInt(parts[0]), monthIdx: parseInt(parts[1]) - 1 };
    } else if (dateStr.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
      const parts = dateStr.split(/[-/]/);
      return { year: parseInt(parts[2]), monthIdx: parseInt(parts[1]) - 1 };
    }
    return { year: null, monthIdx: null };
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    employees.forEach(e => {
      const { year } = parseDate(e.tmt);
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [employees]);

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    employees.forEach(e => {
      const { year, monthIdx } = parseDate(e.tmt);
      if (year === filterYear && monthIdx !== null && monthIdx >= 0 && monthIdx < 12) {
        const monthName = months[monthIdx];
        counts[monthName] = (counts[monthName] || 0) + 1;
      }
    });
    // Mengubah 'value' menjadi 'Pegawai'
    return months.map(m => ({ name: m, Pegawai: counts[m] || 0 }));
  }, [employees, filterYear]);

  const avgKGBPeriod = useMemo(() => {
    let totalGaps = 0;
    let totalCount = 0;
    employees.forEach(e => {
      if (e.salaryHistory && e.salaryHistory.length >= 2) {
        const sortedHistory = [...e.salaryHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        for (let i = 1; i < sortedHistory.length; i++) {
          const date1 = new Date(sortedHistory[i - 1].date);
          const date2 = new Date(sortedHistory[i].date);
          const diffTime = Math.abs(date2.getTime() - date1.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalGaps += diffDays;
          totalCount++;
        }
      }
    });
    if (totalCount === 0) return 0;
    return Math.round(totalGaps / totalCount / 365 * 12); // In months
  }, [employees]);

  const statusData = useMemo(() => {
    let pns = 0;
    let pppk = 0;

    // Filter hanya untuk ASN (PNS & PPPK)
    employees.forEach(e => {
      if (e.statusKepegawaian === 'PNS') pns++;
      else if (e.statusKepegawaian === 'PPPK') pppk++;
    });
    return [
      { name: 'PNS', value: pns, color: '#6366f1' }, // Indigo 500
      { name: 'PPPK', value: pppk, color: '#f59e0b' }, // Amber 500
    ].filter(item => item.value > 0);
  }, [employees]);

  const totalASN = useMemo(() => {
    return statusData.reduce((acc, curr) => acc + curr.value, 0);
  }, [statusData]);

  return (
    <DeferredView minHeight="300px">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Bar Chart (Monthly Schedule) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-200/80 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-sm">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Distribusi Jadwal Bulanan {title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase ">Klik grafik untuk memfilter tabel</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 self-start sm:self-auto hover:border-primary-200 dark:hover:border-primary-800 transition-colors shadow-sm">
              <Filter size={14} className="text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase ">Tahun:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-primary-600 dark:text-primary-400 focus:outline-none cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-80 w-full">
            <Suspense fallback={<ChartSkeleton />}>
              <MonthlyBarChart
                data={monthlyData}
                onMonthClick={onMonthClick}
                selectedMonth={selectedMonth}
                filterYear={filterYear}
              />
            </Suspense>
          </div>
        </div>

        {/* Chart 2: Pie Chart (Status Distribution) */}
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-200/80 dark:border-gray-800 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <PieChart size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Komposisi {title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase ">PNS vs PPPK</p>
            </div>
          </div>

          {/* Average Stats Box */}
          <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-800/40 rounded-2xl p-4 mb-6 text-center">
            <p className="text-primary-900 dark:text-primary-300 font-bold text-2xl">{avgKGBPeriod} <span className="text-sm font-medium">bulan</span></p>
            <p className="text-xs text-primary-700 dark:text-primary-400 font-bold uppercase ">Rata-rata Periode KGB</p>
          </div>

          <div className="flex-1 min-h-[250px] flex items-center justify-center relative">
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{employees.length}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase r mt-1">Total</span>
            </div>

            <Suspense fallback={<ChartSkeleton />}>
              <StaticStatusPieChart data={statusData} totalASN={totalASN} />
            </Suspense>
          </div>
        </div>
      </div>
    </DeferredView>
  );
});

export default KGBCharts;
