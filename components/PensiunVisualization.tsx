import React, { useMemo } from 'react';
import { DeferredView } from './DeferredView';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { getBirthDateFromNIP, getRetirementAge, calculateTmtPensiun } from '../utils/pensionHelpers';
import { Employee } from '../types';
import { Calendar, Users, Clock, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface Props {
  employees: Employee[];
}

export const PensiunVisualization: React.FC<Props> = ({ employees }) => {
  // 1. Process employee data to extract pension info
  const pensionData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    return employees
      .map(emp => {
        const birthDate = getBirthDateFromNIP(emp.nip);
        if (!birthDate) return null;
        
        const bup = getRetirementAge(emp.jabatan);
        const tmtPensiun = calculateTmtPensiun(birthDate, bup);
        const retirementYear = tmtPensiun.getFullYear();
        
        // Calculate remaining years
        const age = currentYear - birthDate.getFullYear();
        const yearsRemaining = Math.max(0, bup - age);
        
        return {
          id: emp.id,
          nama: emp.nama,
          nip: emp.nip,
          unitKerja: emp.unitKerja,
          jabatan: emp.jabatan,
          bup,
          retirementYear,
          yearsRemaining,
          pangkat: emp.pangkat
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [employees]);

  // 2. Year distribution data
  const yearDistribution = useMemo(() => {
    const counts: { [year: number]: number } = {};
    pensionData.forEach(p => {
      counts[p.retirementYear] = (counts[p.retirementYear] || 0) + 1;
    });

    const years = Object.keys(counts).map(Number).sort((a, b) => a - b);
    
    // If empty or very small, create a nice visual range
    if (years.length === 0) return [];
    
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const data = [];
    
    for (let y = minYear; y <= maxYear; y++) {
      data.push({
        tahun: y.toString(),
        "Jumlah Pegawai": counts[y] || 0,
      });
    }
    
    return data;
  }, [pensionData]);

  // 3. Unit Kerja distribution data (Top 5 Units with most retirees)
  const unitDistribution = useMemo(() => {
    const counts: { [unit: string]: number } = {};
    pensionData.forEach(p => {
      counts[p.unitKerja] = (counts[p.unitKerja] || 0) + 1;
    });

    const data = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Top 5 and others
    if (data.length > 5) {
      const top5 = data.slice(0, 5);
      const othersValue = data.slice(5).reduce((acc, curr) => acc + curr.value, 0);
      if (othersValue > 0) {
        top5.push({ name: 'Lain-lain', value: othersValue });
      }
      return top5;
    }
    
    return data;
  }, [pensionData]);

  // 4. Pension timelines stats
  const stats = useMemo(() => {
    const total = pensionData.length;
    const within1Year = pensionData.filter(p => p.yearsRemaining <= 1).length;
    const within5Years = pensionData.filter(p => p.yearsRemaining <= 5).length;
    const within10Years = pensionData.filter(p => p.yearsRemaining <= 10).length;
    
    return {
      total,
      within1Year,
      within5Years,
      within10Years,
      percentage5Y: total > 0 ? ((within5Years / total) * 100).toFixed(1) : '0'
    };
  }, [pensionData]);

  const COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Urgen (≤ 1 Tahun)', value: stats.within1Year.toString(), icon: Clock, color: 'rose' as const, subtext: 'Tindakan Segera Diperlukan' },
          { label: 'Proyeksi 5 Tahun', value: stats.within5Years.toString(), icon: Calendar, color: 'amber' as const, subtext: `${stats.percentage5Y}% dari seluruh SDM` },
          { label: 'Proyeksi 10 Tahun', value: stats.within10Years.toString(), icon: Users, color: 'emerald' as const, subtext: 'Suksesi SDM Jangka Panjang' },
          { label: 'Indeks Suksesi', value: 'Kondusif', icon: Award, color: 'emerald' as const, subtext: 'Perencanaan Formasi Aktif' },
        ].map((stat, i) => {
          const statThemes = {
            rose: { bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-800/30', text: 'text-rose-600 dark:text-rose-400', border: 'from-rose-500 to-red-500' },
            amber: { bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/30', text: 'text-amber-600 dark:text-amber-400', border: 'from-amber-500 to-orange-500' },
            emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'from-emerald-500 to-teal-500' }
          };
          const theme = statThemes[stat.color];
          return (
            <div 
              key={i} 
              className="text-left w-full relative rounded-2xl p-5 shadow-sm group hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Gradient Border Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${theme.border} rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity`}></div>
              
              {/* Inner Card content */}
              <div className="absolute inset-[1.5px] bg-white dark:bg-slate-900 rounded-[15px] z-0"></div>

              <div className="relative z-10 flex items-start gap-4">
                <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} flex-shrink-0`}>
                  <stat.icon size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-none mb-1.5">{stat.label}</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl md:text-3xl font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                      {stat.value}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
                    {stat.subtext}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Graphical Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Distribution of Pension Years */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between min-h-[380px] hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight">Distribusi Kebutuhan Regenerasi Pegawai</h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Jumlah proyeksi pegawai yang memasuki Batas Usia Pensiun (BUP) per tahun.</p>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            {yearDistribution.length > 0 ? (
              <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="pensionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.85}/>
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="tahun" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }}
                  />
                  <Bar 
                    dataKey="Jumlah Pegawai" 
                    fill="url(#pensionGradient)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
</DeferredView>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                Tidak ada data distribusi tahun pensiun
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-2 text-right">
            💡 Distribusi tahun dihitung otomatis berdasarkan tanggal lahir pada NIP dan BUP jabatan masing-masing pegawai.
          </div>
        </div>

        {/* Side Chart: Distribution by Unit Kerja */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between min-h-[380px] hover:shadow-md transition-all duration-300">
          <div>
            <h3 className="text-base font-display font-bold text-slate-800 dark:text-slate-100 tracking-tight">Dampak Pensiun per Unit</h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1">Konsentrasi pensiun di lingkungan BSKJI.</p>
          </div>
          
          <div className="h-[210px] w-full mt-4 flex items-center justify-center">
            {unitDistribution.length > 0 ? (
              <DeferredView>
<ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={unitDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {unitDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#f8fafc',
                      fontSize: '10px',
                      textShadow: 'none'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
</DeferredView>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs">
                Tidak ada data Unit Kerja
              </div>
            )}
          </div>

          {/* Custom Legends list */}
          <div className="space-y-1.5 mt-2 overflow-y-auto max-h-[100px] no-scrollbar">
            {unitDistribution.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[150px]" title={entry.name}>{entry.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{entry.value} Pegawai</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
