import React, { useState, useMemo } from 'react';
import { DeferredView } from './DeferredView';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Layers } from 'lucide-react';
import { Employee } from '../types';
import { Language, TRANSLATIONS } from '../utils/translationHelper';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Props {
  employees: Employee[];
  language: Language;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

const ComparisonChart: React.FC<Props> = React.memo(({ employees, language }) => {
  const [comparisonTab, setComparisonTab] = useState<'unit' | 'golongan'>('unit');
  const isMobile = useMediaQuery('(max-width: 640px)');

  const t = (key: string) => TRANSLATIONS['id']?.[key] || key;

  // Aggregate Employee data by Unit Kerja
  const unitKerjaData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
      const unit = emp.unitKerja || 'Tidak Diketahui';
      counts[unit] = (counts[unit] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Aggregate Employee data by Golongan
  const golonganData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(emp => {
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

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between group mt-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/10 to-transparent rounded-full blur-[40px] pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.01] dark:opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
      
      {/* Header with Title and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100/30 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 shadow-sm">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">
              {t('chart_comparison_title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wide mt-0.5">
              {comparisonTab === 'unit' 
                ? 'Distribusi pegawai berdasarkan masing-masing unit kerja'
                : 'Distribusi pegawai berdasarkan tingkat golongan kepegawaian'
              }
            </p>
          </div>
        </div>
        
        {/* Toggle pill buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200/40 dark:border-slate-700/50 relative z-10">
          <button
            onClick={() => setComparisonTab('unit')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              comparisonTab === 'unit'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-100 dark:shadow-none'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Building2 size={13} />
            <span>{t('chart_comparison_by_unit')}</span>
          </button>
          <button
            onClick={() => setComparisonTab('golongan')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              comparisonTab === 'golongan'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-100 dark:shadow-none'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Layers size={13} />
            <span>{t('chart_comparison_by_golongan')}</span>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[320px] w-full relative z-10 mt-2">
        <DeferredView>
<ResponsiveContainer width="100%" height="100%">
          {comparisonTab === 'unit' ? (
            // Horizontal Bar Chart for Unit Kerja to fit long text
            <BarChart
              data={unitKerjaData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: '500' }}
                width={isMobile ? 100 : 150}
                tickFormatter={(val) => {
                  const maxLength = isMobile ? 12 : 25;
                  return val.length > maxLength ? val.slice(0, maxLength - 3) + '...' : val;
                }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                formatter={(value: any) => [value, t('chart_comparison_label_jumlah')]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {unitKerjaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            // Vertical Bar Chart for Golongan
            <BarChart
              data={golonganData}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: '600' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}
                formatter={(value: any) => [value, t('chart_comparison_label_jumlah')]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                {golonganData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
</DeferredView>
      </div>
    </div>
  );
});

export default ComparisonChart;
