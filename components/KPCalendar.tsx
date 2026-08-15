import React, { useState } from 'react';
import { KP_SCHEDULES } from '../src/constants_kp_schedule';
import { Calendar, ChevronDown, Clock } from 'lucide-react';

import { Language } from '../utils/translationHelper';

interface Props {
  language?: Language;
}

export const KPCalendar: React.FC<Props> = React.memo(() => {
    const defaultSchedule = React.useMemo(() => {
        const currentMonthIndex = new Date().getMonth();
        // Mapping: current month index + 3 (e.g. June (5) + 3 = September (8))
        const targetMonthIndex = (currentMonthIndex + 3) % 12;
        const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const targetMonthName = monthsList[targetMonthIndex];
        return KP_SCHEDULES.find(m => m.month === targetMonthName) || KP_SCHEDULES[0];
    }, []);

    const [selectedMonth, setSelectedMonth] = useState(defaultSchedule);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/5 to-transparent rounded-full blur-[40px] -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
            
            <div className="relative z-10">
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-primary-50 dark:bg-primary-950/30 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-800/50 shrink-0">
                                <Calendar size={20} strokeWidth={2.5} />
                            </div>
                            Jadwal Kenaikan Pangkat
                        </h2>
                        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                            Pilih periode untuk melihat detail lini masa kegiatan secara lengkap.
                        </p>
                    </div>
                    <div className="relative w-full md:w-auto mt-2 md:mt-0">
                        <select 
                            className="w-full md:w-auto appearance-none bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs md:text-sm py-2 px-4 pr-10 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 transition-all cursor-pointer shadow-sm"
                            onChange={(e) => setSelectedMonth(KP_SCHEDULES.find(m => m.month === e.target.value) || KP_SCHEDULES[0])}
                            value={selectedMonth.month}
                        >
                            {KP_SCHEDULES.map(m => <option key={m.month} value={m.month}>Periode {m.month}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>
                </div>
                
                <div className="relative pl-2 sm:pl-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[23px] sm:left-[39px] top-4 bottom-8 w-[2px] bg-gradient-to-b from-primary-200 via-purple-200 to-transparent rounded-full opacity-60"></div>
                    
                    <div className="space-y-5">
                        <>
                            <div 
                                key={selectedMonth.month}
                                className="space-y-5"
                            >
                                {selectedMonth.activities.map((act, index) => (
                                    <div 
                                        key={act.id + selectedMonth.month}
                                        className="relative flex items-start gap-4 sm:gap-6 group/item"
                                    >
                                        {/* Timeline Node */}
                                        <div className="relative z-10 flex flex-col items-center mt-1">
                                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 font-bold text-xs sm:text-sm border-[3px] border-primary-100/80 dark:border-primary-800/60 shadow-sm group-hover/item:border-primary-500 group-hover/item:text-primary-700 dark:group-hover/item:text-primary-300 transition-colors duration-300 shrink-0">
                                                {index + 1}
                                            </div>
                                            {/* Glow effect on hover */}
                                            <div className="absolute inset-0 rounded-full bg-primary-400 blur-[8px] opacity-0 group-hover/item:opacity-35 transition-opacity duration-300 scale-125"></div>
                                        </div>
                                        
                                        {/* Card */}
                                        <div className="flex-1 p-4 md:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 group-hover/item:-translate-y-0.5 group-hover/item:shadow-md group-hover/item:border-primary-200 dark:group-hover/item:border-primary-800 relative overflow-hidden">
                                            {/* Subtle Left Border Highlight */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-purple-400 scale-y-0 group-hover/item:scale-y-100 transition-transform duration-300 origin-top"></div>
                                            
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 bg-primary-50 dark:bg-primary-950/40 rounded text-primary-600 dark:text-primary-400">
                                                    <Clock size={11} strokeWidth={2.5} />
                                                </div>
                                                <p className="text-[10px] md:text-[11px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">{act.range}</p>
                                            </div>
                                            <p className="font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-sm md:text-[15px] leading-relaxed">{act.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default KPCalendar;
