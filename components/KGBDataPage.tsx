import React, { Suspense } from 'react';
import { Calendar, X } from 'lucide-react';
import { Employee } from '../types';
import DashboardStats from './DashboardStats';
import KGBCharts from './KGBCharts';
import EmployeeTable from './EmployeeTable';

interface Props {
  stats: any;
  employees: Employee[];
  displayedEmployees: Employee[];
  selectedMonth: string | null;
  selectedYear: number | null;
  setSelectedMonth: (month: string | null) => void;
  setSelectedYear: (year: number | null) => void;
  handleStatusToggle: (id: string) => void;
  handleDeleteEmployee: (id: string) => void;
  onCardClick?: (type: string) => void;
  currentUser: Employee | null;
}

const KGBDataPage: React.FC<Props> = React.memo(({
  stats,
  employees,
  displayedEmployees,
  selectedMonth,
  selectedYear,
  setSelectedMonth,
  setSelectedYear,
  handleStatusToggle,
  handleDeleteEmployee,
  onCardClick,
  currentUser
}) => {
  return (
    <>
      <div className="pt-2">
        <DashboardStats stats={stats} onCardClick={onCardClick} />
      </div>
        
      <div className="py-2">
        <Suspense fallback={<div className="h-64 bg-white dark:bg-slate-900/50 rounded-xl animate-pulse" />}>
          <KGBCharts 
            employees={employees} 
            title="KGB"
            onMonthClick={(month, year) => {
              setSelectedMonth(month);
              setSelectedYear(year);
            }} 
            selectedMonth={selectedMonth} 
          />
        </Suspense>
      </div>
        
      {(selectedMonth || selectedYear) && (
        <div className="flex items-center justify-between bg-emerald-600 text-white p-4 rounded-xl shadow-md transform transition-all mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-violet-600"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 dark:bg-slate-900/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transform translate-z-0"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white dark:bg-slate-900/20 rounded-2xl  shadow-inner">
              <Calendar size={24} />
            </div>
            <div>
              <p className="font-bold font-display text-lg">
                Filter Aktif: {selectedMonth === 'Riwayat TMT Selesai' 
                  ? 'Riwayat Selesai (Sejak Jan 2026)' 
                  : `${selectedMonth || ''} ${selectedYear || ''}`.trim()}
              </p>
              <p className="text-emerald-100 text-sm font-medium opacity-90">Menampilkan {displayedEmployees.length} pegawai terseleksi</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedMonth(null);
              setSelectedYear(null);
            }}
            className="relative z-10 px-5 py-2.5 bg-white dark:bg-slate-900 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <X size={16} />
            Reset Filter
          </button>
        </div>
      )}

      <EmployeeTable 
        employees={displayedEmployees} 
        onStatusToggle={handleStatusToggle}
        onDeleteEmployee={handleDeleteEmployee}
        currentUser={currentUser}
      />
    </>
  );
});

export default KGBDataPage;
