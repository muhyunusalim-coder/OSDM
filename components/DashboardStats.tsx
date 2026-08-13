
import React from 'react';
import { Users, Calendar, CheckCircle, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react';
import { DashboardStats as StatsType } from '../types';

interface Props {
  stats: StatsType;
}


const StatCard = React.memo(({ title, value, icon: Icon, color, subtext, trend, onClick }: { title: string, value: string, icon: any, color: 'primary' | 'warning' | 'success', subtext: string, trend?: { value: string, direction: 'up' | 'down' }, onClick?: () => void }) => {
    
    const colorClasses = {
        primary: {
            text: 'text-slate-800 dark:text-slate-100',
            iconText: 'text-slate-700 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-800',
            indicator: 'bg-slate-500 dark:bg-slate-400',
        },
        warning: {
            text: 'text-amber-800 dark:text-amber-300',
            iconText: 'text-amber-700 dark:text-amber-300',
            bg: 'bg-amber-100/70 dark:bg-amber-500/20',
            indicator: 'bg-amber-500',
        },
        success: {
            text: 'text-emerald-800 dark:text-emerald-300',
            iconText: 'text-emerald-700 dark:text-emerald-300',
            bg: 'bg-emerald-100/70 dark:bg-emerald-500/20',
            indicator: 'bg-emerald-500',
        }
    };

    const theme = colorClasses[color];

    return (
        <button 
            onClick={onClick}
            className={`text-left w-full relative rounded-2xl p-4 sm:p-5 shadow-sm group hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            {/* Gradient Border Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            {/* Inner Card content */}
            <div className="absolute inset-[1.5px] bg-white dark:bg-slate-900 rounded-[14px] z-0"></div>

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1 truncate">{title}</p>
                    
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                            {value}
                        </span>
                        {trend && (
                            <span 
                                title="Tren MoM"
                                className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${trend.direction === 'up' ? 'text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-500/25' : 'text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-500/25'}`}
                            >
                                {trend.direction === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {trend.value}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.indicator} shrink-0`}></span>
                        <span className="truncate">{subtext}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                    <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.iconText} transition-transform duration-200 group-hover:scale-105`}>
                        <Icon size={18} className="sm:w-5 sm:h-5" strokeWidth={2} />
                    </div>

                    {onClick && (
                        <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors pt-2">
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
});

const DashboardStats: React.FC<Props & { onCardClick?: (type: string) => void }> = React.memo(({ stats, onCardClick }) => {


  return (
    <div className="space-y-4">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
        <StatCard 
          title="Total Pegawai" 
          value={stats.totalEmployees.toString()} 
          icon={Users} 
          color="primary"
          subtext="Total Keseluruhan"
          trend={{ value: "+2%", direction: 'up' }}
        />
        <StatCard 
          title={`Mendatang`} 
          value={stats.upcomingKGB.toString()} 
          icon={Calendar} 
          color="warning"
          subtext={`KP Bulan Depan`}
          trend={{ value: "-4%", direction: 'down' }}
          onClick={() => onCardClick?.('upcoming')}
        />
        <StatCard 
          title="Tertunda" 
          value={stats.pendingKGB.toString()} 
          icon={Clock} 
          color="primary"
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
