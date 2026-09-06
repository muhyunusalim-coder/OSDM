import React, { Suspense } from "react";
import { Calendar, X } from "lucide-react";
import { Employee } from "../types";
import DashboardStats from "./DashboardStats";
import KGBCharts from "./KGBCharts";
import EmployeeTable from "./EmployeeTable";
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
const KGBDataPage: React.FC<Props> = React.memo(
  ({
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
    currentUser,
  }) => {
    return (
      <>
        <div className="pt-2">
          <DashboardStats stats={stats} onCardClick={onCardClick} />
        </div>

        <div className="py-2">
          <Suspense
            fallback={
              <div className="h-64 bg-white dark:bg-gray-900/50 rounded-xl " />
            }
          >
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-2xl shadow-xs mb-6 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-bold text-base text-gray-900 dark:text-white">
                  Filter Aktif:{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {selectedMonth === "Riwayat TMT Selesai"
                      ? "Riwayat Selesai (Sejak Jan 2026)"
                      : `${selectedMonth || ""} ${selectedYear || ""}`.trim()}
                  </span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  Menampilkan {displayedEmployees.length} pegawai terseleksi
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedMonth(null);
                setSelectedYear(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/60 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <X size={14} />
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
  },
);
export default KGBDataPage;
