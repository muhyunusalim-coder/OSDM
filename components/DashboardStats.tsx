
import React from 'react';
import { Users, Calendar, CheckCircle, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react';
import { DashboardStats as StatsType } from '../types';

interface Props {
  stats: StatsType;
}

const StatCard = React.memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtext, 
  trend, 
  onClick 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  color: 'primary' | 'warning' | 'rose' | 'success'; 
  subtext: string; 
  trend?: { value: string; direction: 'up' | 'down' }; 
  onClick?: () => void; 
}) => {
    
    const colorClasses = {
        primary: {
            iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
            dot: 'bg-emerald-500 dark:bg-emerald-400',
            borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
            glow: 'group-hover:bg-emerald-500/5',
        },
        warning: {
            iconBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-800/40 text-amber-600 dark:text-amber-400',
            dot: 'bg-amber-500 dark:bg-amber-400',
            borderHover: 'hover:border-amber-300 dark:hover:border-amber-700/60',
            glow: 'group-hover:bg-amber-500/5',
        },
        rose: {
            iconBg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-800/40 text-rose-600 dark:text-rose-400',
            dot: 'bg-rose-500 dark:bg-rose-400',
            borderHover: 'hover:border-rose-300 dark:hover:border-rose-700/60',
            glow: 'group-hover:bg-rose-500/5',
        },
        success: {
            iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400',
            dot: 'bg-emerald-500 dark:bg-emerald-400',
            borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
            glow: 'group-hover:bg-emerald-500/5',
        }
    };

    const theme = colorClasses[color];

    return (
        <button 
            onClick={onClick}
            className={`group relative text-left w-full bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm ${theme.borderHover} hover:shadow-md transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            {/* Subtle corner soft glow on hover */}
            <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full transition-all duration-500 opacity-0 group-hover:opacity-100 pointer-events-none ${theme.glow} blur-xl`}></div>

            <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                        {title}
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-sans font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                            {value}
                        </span>
                        {trend && (
                            <span 
                                title="Tren MoM"
                                className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                    trend.direction === 'up' 
                                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-800/50' 
                                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-800/50'
                                }`}
                            >
                                {trend.direction === 'up' ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`p-3 rounded-xl border ${theme.iconBg} shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-sm`}>
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${theme.dot} shrink-0`}></span>
                    <span className="truncate">{subtext}</span>
                </div>
                {onClick && (
                    <div className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0 ml-2">
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                )}
            </div>
        </button>
    );
});

const DashboardStats: React.FC<Props & { onCardClick?: (type: string) => void }> = React.memo(({ stats, onCardClick }) => {

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
        <StatCard 
          title="Total Pegawai" 
          value={stats.totalEmployees.toString()} 
          icon={Users} 
          color="primary"
          subtext="Total Keseluruhan"
          trend={{ value: "+2%", direction: 'up' }}
        />
        <StatCard 
          title="Mendatang" 
          value={stats.upcomingKGB.toString()} 
          icon={Calendar} 
          color="warning"
          subtext="KP Bulan Depan"
          trend={{ value: "-4%", direction: 'down' }}
          onClick={() => onCardClick?.('upcoming')}
        />
        <StatCard 
          title="Tertunda" 
          value={stats.pendingKGB.toString()} 
          icon={Clock} 
          color="rose"
          subtext="Berkas Belum Lengkap"
          onClick={() => onCardClick?.('pending')}
        />
        <StatCard 
          title="Selesai" 
          value={stats.processedKGB.toString()} 
          icon={CheckCircle} 
          color="success"
          subtext="Dokumen SK Terbit"
          trend={{ value: "+12%", direction: 'up' }}
          onClick={() => onCardClick?.('processed')}
        />
      </div>
    </div>
  );
});

export default DashboardStats;
