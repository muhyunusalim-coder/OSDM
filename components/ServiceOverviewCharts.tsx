import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { Employee } from '../types';
import {
  getBirthDateFromNIP,
  getRetirementAge,
  calculateTmtPensiun,
} from '../utils/pensionHelpers';
import { Language, TRANSLATIONS } from '../utils/translationHelper';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Props {
  employees: Employee[]; // KGB
  promotionEmployees: Employee[]; // KP
  stats?: any;
  language: Language;
}

const COLORS = [
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
];

const ServiceOverviewCharts: React.FC<Props> = React.memo(
  ({ employees, promotionEmployees, stats, language }) => {
    const [kgbYear, setKgbYear] = useState<string>('All');
    const isMobile = useMediaQuery('(max-width: 640px)');
    const t = (key: string) => TRANSLATIONS['id']?.[key] || key;

    // Aggregate Employee data by Golongan
    const golonganData = useMemo(() => {
      const counts: Record<string, number> = {};
      employees.forEach((emp) => {
        const p = emp.pangkat || '';
        let group = 'Lainnya';
        if (p.includes('IV/') || p.includes('Pembina') || p.includes('Utama')) {
          group = 'Golongan IV';
        } else if (p.includes('III/') || p.includes('Penata')) {
          group = 'Golongan III';
        } else if (p.includes('II/') || p.includes('Pengatur')) {
          group = 'Golongan II';
        } else if (p.includes('I/') || p.includes('Juru')) {
          group = 'Golongan I';
        } else if (emp.statusKepegawaian === 'PPPK') {
          group = 'PPPK';
        } else {
          const match = p.match(/(IX|VII|V|X|XI|XII|VIII)/);
          if (match) {
            group = `PPPK ${match[0]}`;
          } else if (p) {
            group = p;
          }
        }
        counts[group] = (counts[group] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    }, [employees]);

    // Extract available years from KGB employees TMT
    const availableKgbYears = useMemo(() => {
      const years = new Set<string>();
      employees.forEach((emp) => {
        // Basic extraction: find a 4 digit number in tmt
        const match = emp.tmt.match(/\b(20\d{2})\b/);
        if (match) {
          years.add(match[1]);
        }
      });
      return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    }, [employees]);

    // Aggregate KGB Distribution
    const kgbData = useMemo(() => {
      const counts = { Selesai: 0, Proses: 0, Pending: 0, 'Belum Waktunya': 0 };

      // filtered employees
      const filteredEmployees = employees.filter((emp) => {
        if (kgbYear === 'All') return true;
        const match = emp.tmt.match(/\b(20\d{2})\b/);
        return match && match[1] === kgbYear;
      });

      filteredEmployees.forEach((emp) => {
        if (emp.status === 'Processed') counts['Selesai']++;
        else if (
          (emp.status as string) === 'Processing' ||
          emp.status === 'Upcoming'
        )
          counts['Proses']++;
        else if (emp.status === 'Pending') counts['Pending']++;
        else counts['Belum Waktunya']++;
      });

      // Only use stats.processedKGB if we're not filtering by year
      if (kgbYear === 'All' && stats?.processedKGB !== undefined) {
        counts['Selesai'] = stats.processedKGB;
      }
      return [
        { name: 'Selesai', value: counts['Selesai'] },
        { name: 'Proses', value: counts['Proses'] },
        { name: 'Pending', value: counts['Pending'] },
        { name: 'Belum Waktunya', value: counts['Belum Waktunya'] },
      ];
    }, [employees, stats, kgbYear]);

    // Aggregate KP Distribution by Golongan
    const kpData = useMemo(() => {
      const golCounts: { [key: string]: number } = {};
      promotionEmployees.forEach((emp) => {
        // PPPK do not have Kenaikan Pangkat (e.g. IX/9, VII/7, V/5)
        if (emp.statusKepegawaian === 'PPPK') return;
        if (
          emp.pangkat &&
          (emp.pangkat.includes('IX') ||
            emp.pangkat.includes('VII') ||
            emp.pangkat.includes('V/'))
        )
          return;
        golCounts[emp.pangkat] = (golCounts[emp.pangkat] || 0) + 1;
      });
      return Object.entries(golCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // top 5
    }, [promotionEmployees]);

    // Aggregate Pensiun Timeline (Next 5 years)
    const pensiunData = useMemo(() => {
      const currentYear = new Date().getFullYear();
      const years: { [key: string]: number } = {
        [currentYear]: 0,
        [currentYear + 1]: 0,
        [currentYear + 2]: 0,
        [currentYear + 3]: 0,
        [currentYear + 4]: 0,
      };
      employees.forEach((emp) => {
        const birthDate = getBirthDateFromNIP(emp.nip);
        if (birthDate) {
          const bup = getRetirementAge(emp.jabatan);
          const tmt = calculateTmtPensiun(birthDate, bup);
          const y = tmt.getFullYear();
          if (years[y] !== undefined) {
            years[y]++;
          }
        }
      });
      return Object.entries(years).map(([year, Pensiun]) => ({ year, Pensiun }));
    }, [employees]);

    // Aggregate Age Distribution
    const ageDistData = useMemo(() => {
      const brackets = {
        '< 30': 0,
        '30-39': 0,
        '40-49': 0,
        '50-55': 0,
        '56-58': 0,
        '> 58': 0,
      };
      employees.forEach((emp) => {
        const birthDate = getBirthDateFromNIP(emp.nip);
        if (birthDate) {
          let age = new Date().getFullYear() - birthDate.getFullYear();
          if (
            new Date().getMonth() < birthDate.getMonth() ||
            (new Date().getMonth() === birthDate.getMonth() &&
              new Date().getDate() < birthDate.getDate())
          ) {
            age--;
          }
          if (age < 30) brackets['< 30']++;
          else if (age <= 39) brackets['30-39']++;
          else if (age <= 49) brackets['40-49']++;
          else if (age <= 55) brackets['50-55']++;
          else if (age <= 58) brackets['56-58']++;
          else brackets['> 58']++;
        }
      });
      return Object.entries(brackets).map(([range, Jumlah]) => ({
        range,
        Jumlah,
      }));
    }, [employees]);

    const ageColors = [
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#f59e0b',
      '#ef4444',
      '#b91c1c',
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* KGB Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-40 h-40 from-primary-400/10 dark:from-primary-400/5 to-transparent rounded-full blur-[30px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-50 dark:bg-gray-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

          <div className="flex justify-between items-start mb-6">
            <h3 className=" font-medium text-gray-800 dark:text-gray-100 text-lg relative z-10">
              {t('chart_kgb_title')}
            </h3>

            {/* Year Filter */}
            {availableKgbYears.length > 0 && (
              <div className="relative z-20">
                <div className="relative">
                  <select
                    value={kgbYear}
                    onChange={(e) => setKgbYear(e.target.value)}
                    className="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <option value="All">{t('chart_kgb_filter_all')}</option>
                    {availableKgbYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -trangray-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kgbData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {kgbData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '1rem',
                    border: 'none',
                    boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KP Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-40 h-40 from-primary-400/10 dark:from-primary-400/5 to-transparent rounded-full blur-[30px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-50 dark:bg-gray-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

          <h3 className=" font-medium text-gray-800 dark:text-gray-100 text-lg mb-6 relative z-10">
            {t('chart_kp_title')}
          </h3>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: isMobile ? 9 : 11,
                    fill: '#94a3b8',
                    fontWeight: '600',
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(248, 250, 252, 0.1)' }}
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                >
                  {kpData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[(index + 1) % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pensiun Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-40 h-40 from-pink-400/10 dark:from-pink-400/5 to-transparent rounded-full blur-[30px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-50 dark:bg-gray-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

          <h3 className=" font-medium text-gray-800 dark:text-gray-100 text-lg mb-6 relative z-10">
            {t('chart_pensiun_title')}
          </h3>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pensiunData}>
                <defs>
                  <linearGradient id="colorPensiun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: isMobile ? 9 : 11,
                    fill: '#94a3b8',
                    fontWeight: '600',
                  }}
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
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Pensiun"
                  stroke="#ec4899"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPensiun)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-40 h-40 from-amber-400/10 dark:from-amber-400/5 to-transparent rounded-full blur-[30px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-125"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary-50 dark:bg-gray-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

          <h3 className=" font-medium text-gray-800 dark:text-gray-100 text-lg mb-6 relative z-10">
            {t('chart_age_title')}
          </h3>
          <div className="h-[250px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: isMobile ? 9 : 11,
                    fill: '#94a3b8',
                    fontWeight: '600',
                  }}
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
                  cursor={{ fill: 'rgba(248, 250, 252, 0.1)' }}
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="Jumlah" radius={[6, 6, 0, 0]} barSize={24}>
                  {ageDistData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ageColors[index % ageColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }
);

// Exporting the memoized component
export default ServiceOverviewCharts;
