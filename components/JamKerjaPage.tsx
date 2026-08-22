import React, { useState, useEffect, useMemo } from 'react';
import { DeferredView } from './DeferredView';
import { 
  Search, Clock, User, AlertTriangle, Calendar, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight,
  X, Filter, Loader2, Download, CheckCircle, HelpCircle, 
  Briefcase, Activity, CalendarDays, BarChart3, ArrowUpDown, ChevronDown, Award,
  FileSpreadsheet, Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { fetchJamKerjaData, JamKerjaRecord, DailyAttendance, formatMinutesFriendly, getDayNameIndonesian, getDayOfWeekForMonth, isWeekendForMonth, getIndonesianHolidayName
} from '../utils/jamKerjaHelpers';
import { useJamKerja } from './JamKerja/useJamKerja';
import { LOCAL_TRANSLATIONS } from './JamKerja/translations';
import { getQuarterFromMonth, translateMonthName } from './JamKerja/utils';

interface JamKerjaPageProps {
  language?: 'id' | 'en';
}

const JamKerjaPage = React.memo(({ language = 'id' }: JamKerjaPageProps) => {
  const {
    t, data, setData, loading, setLoading, error, setError,
    searchTerm, setSearchTerm, selectedMonth, setSelectedMonth,
    selectedUnitKerja, setSelectedUnitKerja, sortConfig, setSortConfig,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage,
    selectedRecord, setSelectedRecord, activeChartTab, setActiveChartTab,
    isExporting, setIsExporting, mainTab, setMainTab,
    quarterSearch, setQuarterSearch, quarterStatusFilter, setQuarterStatusFilter,
    quarterMinDeficiency, setQuarterMinDeficiency, quarterCurrentPage, setQuarterCurrentPage,
    quarterItemsPerPage, setQuarterItemsPerPage, isExportingQuarterly, setIsExportingQuarterly,
    exportingNip, setExportingNip, drawerFilterDeficiencyOnly, setDrawerFilterDeficiencyOnly,
    uniqueMonths, uniqueUnitKerjas, monthFilteredData, filteredRecords, sortedRecords,
    paginatedRecords, totalPages, requestSort, metrics, quarterlyMetrics,
    filteredQuarterlyEmployees, quarterTotalPages, paginatedQuarterlyEmployees,
    dailyTrendData, topDeficiencyData, distributionData, monthlyPerformanceData,
    getDisciplineStatus, handleExportExcel, handleExportQuarterlyExcel, handleExportSingleEmployeeExcel
  } = useJamKerja(language);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm max-w-2xl mx-auto">
        <AlertTriangle size={48} className="text-rose-500 mb-4 " />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('error_title')}</h2>
        <p className="text-gray-500 dark:text-gray-500 text-sm max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer">
          {t('error_retry')}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 w-full px-1 md:px-2 ${selectedRecord ? 'print:hidden' : ''}`}>
      {/* Header Laporan Resmi untuk Cetak (Hanya Muncul Saat Print Halaman Utama) */}
      <div className="hidden print:block border-b-4 border-double border-gray-900 pb-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg border border-gray-800 shrink-0">
            KGB
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold st text-gray-800 dark:text-gray-100 uppercase leading-none mb-1">KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA</p>
            <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">BADAN STANDARISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)</h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold mt-1.5">{t('print_title')}</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-gray-500 dark:text-gray-500 font-mono mt-3">
          {language === 'en' ? 'Printed on: ' : 'Dicetak pada: '} {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Hero Banner / Rules Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-gray-900 dark:text-white relative overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-extrabold st uppercase border border-primary-200 dark:border-primary-800">
              <Clock size={12} /> {t('presence_perf')} & {t('deficiency')}
            </span>
            <h1 className="text-2xl md:text-3xl font-black leading-tight text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* Quick Rules Sheet */}
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-5 max-w-md space-y-3.5 shrink-0 text-gray-600 dark:text-gray-300 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase r pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <HelpCircle size={14} className="text-primary-600 dark:text-primary-400" /> {t('rules_title')}
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-[11px]">
              <div className="space-y-1">
                <span className="block font-bold text-gray-900 dark:text-white text-xs">{t('mon_thu')}</span>
                <span className="block text-primary-600 dark:text-primary-400 font-medium">07:30 – 16:00</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('break')}: 60 m</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('max_checkout')}: 17:00</span>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-gray-900 dark:text-white text-xs">{t('fri')}</span>
                <span className="block text-primary-600 dark:text-primary-400 font-medium">07:30 – 16:30</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('break')}: 90 m</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('max_checkout')}: 17:30</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium pt-1.5 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
              <div>* {t('rule_note_1')}</div>
              <div className="text-primary-600 dark:text-primary-400 font-semibold">* {t('rule_note_2')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="text-primary-600 animate-spin" />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 ">{t('loader_message')}</span>
        </div>
      ) : (
        <>
          {/* Main Navigation Tabs */}
          <div className="flex bg-white dark:bg-gray-900/50 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar gap-1.5 mb-6 shadow-sm border border-gray-200 dark:border-gray-700 print:hidden relative z-20">
            <button onClick={() => setMainTab('ringkasan')} className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${ mainTab === 'ringkasan' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800' }`}>
              <BarChart3 size={18} /> {t('tab_ringkasan')}
            </button>
            <button onClick={() => setMainTab('triwulan')} className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${ mainTab === 'triwulan' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800' }`}>
              <CalendarDays size={18} /> {t('tab_triwulan')}
            </button>
            <button onClick={() => setMainTab('bulanan')} className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${ mainTab === 'bulanan' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:bg-gray-800' }`}>
              <FileSpreadsheet size={18} /> {t('tab_bulanan')}
            </button>
          </div>

          {mainTab === 'ringkasan' && (
            <div className="space-y-6">
              {/* Dashboard Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase r block truncate">{t('total_employees')}</span>
                    <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 block mt-0.5 truncate">{metrics.totalEmployees}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium block mt-0.5 truncate">{t('total_employees_sub')}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase r block truncate">{t('avg_deficiency')}</span>
                    <span className="text-xl sm:text-2xl font-bold text-rose-600 block mt-0.5 truncate" title={formatMinutesFriendly(metrics.avgDeficiency)}>
                      {formatMinutesFriendly(metrics.avgDeficiency)}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium block mt-0.5 truncate" title={t('avg_deficiency_sub')}>{t('avg_deficiency_sub')}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase r block truncate">{t('presence_rate')}</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600 block mt-0.5 truncate">
                      {metrics.overallPresence.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium block mt-0.5 truncate">{t('presence_rate_sub')}</span>
                  </div>
                </div>

                <div className="from-amber-50/40 via-white to-orange-50/20 p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md hover:border-amber-200 transition-all">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 shadow-inner">
                    <Award size={22} className="text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-amber-800 font-extrabold uppercase r block bg-amber-100/65 px-2 py-0.5 rounded-md w-max">{t('exemplary_employee')}</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate block mt-1.5 max-w-[170px]" title={metrics.disciplineLeader}>
                      {metrics.disciplineLeader.split(',')[0]}
                    </span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-500 font-semibold block mt-1.5 leading-relaxed">
                      {t('work_time')}: <span className="text-primary-600 font-bold">{formatMinutesFriendly(metrics.disciplineLeaderActualWorked)}</span><br />
                      {t('def_time')}: <span className="text-rose-600 font-bold">{formatMinutesFriendly(metrics.disciplineLeaderDeficiency)}</span> | {t('leave_time')}: <span className="text-primary-600">{metrics.disciplineLeaderLeave} {language === 'en' ? t('days') : 'hari'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mainTab === 'triwulan' && (
            <div className="space-y-6">
              {/* SECTION: REKAPITULASI TRIWULAN & AKUMULASI */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary-500" /> {t('quarter_recap')}
                  </h2>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{t('quarter_recap_sub')}</p>
                </div>

                {/* Office Quarterly Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card Q1 */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    <span className="text-[10px] text-primary-600 font-extrabold uppercase st block mb-1">{t('quarter_1')}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium block">{t('quarter_1_sub')}</span>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-rose-600 ">
                        {formatMinutesFriendly(quarterlyMetrics.officeQ1Deficiency)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{language === 'en' ? 'Collective' : 'Kolektif'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2 font-medium">{t('quarter_1_desc')}</p>
                  </div>

                  {/* Card Q2 */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    <span className="text-[10px] text-primary-600 font-extrabold uppercase st block mb-1">{t('quarter_2')}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium block">{t('quarter_2_sub')}</span>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-rose-600 ">
                        {formatMinutesFriendly(quarterlyMetrics.officeQ2Deficiency)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{language === 'en' ? 'Collective' : 'Kolektif'}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2 font-medium">{t('quarter_2_desc')}</p>
                  </div>

                  {/* Card Cumulative */}
                  <div className="bg-primary-950 text-white p-5 rounded-2xl border border-primary-900/30 relative overflow-hidden">
                    <span className="text-[10px] text-primary-300 font-extrabold uppercase st block mb-1">{t('total_accumulated')}</span>
                    <span className="text-[11px] text-gray-300 font-medium block">{t('until_now')}</span>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-amber-400 ">
                        {formatMinutesFriendly(quarterlyMetrics.officeTotalAccumulatedDeficiency)}
                      </span>
                      <span className="text-[10px] text-primary-200 font-bold">{language === 'en' ? 'Office Collective' : 'Kolektif Kantor'}</span>
                    </div>
                    <p className="text-[10px] text-gray-300 mt-2 font-medium">{t('total_accumulated_desc')}</p>
                  </div>
                </div>

                {/* Collapsible / Interactive Table of Employee Accumulations */}
                <div className="bg-gray-50/30 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{t('accumulation_list')}</h3>
                      <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-0.5">{t('accumulation_list_sub')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-bold">
                          {language === 'en' ? 'Total: ' : 'Total: '} {quarterlyMetrics.employeesSummaryList.length} {language === 'en' ? t('employee') : 'Pegawai'}
                        </span>
                        {filteredQuarterlyEmployees.length !== quarterlyMetrics.employeesSummaryList.length && (
                          <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold">
                            {language === 'en' ? 'Filtered: ' : 'Terfilter: '} {filteredQuarterlyEmployees.length} {language === 'en' ? t('employee') : 'Pegawai'}
                          </span>
                        )}
                      </div>
                      <button onClick={handleExportQuarterlyExcel} disabled={isExportingQuarterly || filteredQuarterlyEmployees.length === 0} id="btn-ekspor-excel-akumulasi" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 dark:bg-gray-700 text-white disabled:text-gray-400 dark:text-gray-500 rounded-xl text-[11px] font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:cursor-not-allowed border border-primary-500/10" title={t('export_accumulation')}>
                        {isExportingQuarterly ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-white" />
                            {language === 'en' ? 'Exporting...' : 'Mengekspor...'}
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet size={13} className="text-white" />
                            {t('export_accumulation')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Filters Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    {/* Search Name/NIP */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Search size={14} />
                      </span>
                      <input type="text" value={quarterSearch} onChange={(e) => setQuarterSearch(e.target.value)} placeholder={t('search_placeholder')} className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-700 dark:text-gray-200" />
                      {quarterSearch && (
                        <button onClick={() => setQuarterSearch('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-500">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Filter Unit Kerja */}
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <Briefcase size={14} />
                      </span>
                      <input type="text" list="unit-kerja-list-quarter" value={selectedUnitKerja === 'Semua' ? '' : selectedUnitKerja} onChange={(e) => { setSelectedUnitKerja(e.target.value || 'Semua'); setCurrentPage(1); }} placeholder={t('all_units')} className="w-full pl-9 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-700 dark:text-gray-200" />
                      <datalist id="unit-kerja-list-quarter">
                        {uniqueUnitKerjas.map(unit => (
                          <option key={unit} value={unit} />
                        ))}
                      </datalist>
                      {selectedUnitKerja !== 'Semua' && (
                        <button onClick={() => setSelectedUnitKerja('Semua')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-500">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Filter Status */}
                    <div className="relative">
                      <select value={quarterStatusFilter} onChange={(e) => setQuarterStatusFilter(e.target.value)} className="w-full pl-3 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-700 dark:text-gray-200 appearance-none cursor-pointer">
                        <option value="Semua">{t('all_statuses')}</option>
                        <option value="Sangat Baik">{t('very_good')} (0 {language === 'en' ? 'h' : 'jam'})</option>
                        <option value="Baik">{t('good')} (&lt; 22.5 {language === 'en' ? 'h' : 'jam'})</option>
                        <option value="Teguran Lisan">{t('lisan_warning')} (&ge; 22.5 {language === 'en' ? 'h' : 'jam'} / 3 {language === 'en' ? 'Days' : 'Hari'})</option>
                        <option value="Perlu Pembinaan">{t('need_guidance')} (&gt; 30 {language === 'en' ? 'h' : 'jam'})</option>
                        <option value="Tidakan Berat">{t('heavy_action')} (&gt; 60 {language === 'en' ? 'h' : 'jam'})</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <ChevronDown size={14} />
                      </span>
                    </div>

                    {/* Filter Deficiency Threshold */}
                    <div className="relative">
                      <select value={quarterMinDeficiency} onChange={(e) => setQuarterMinDeficiency(e.target.value)} className="w-full pl-3 pr-8 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-700 dark:text-gray-200 appearance-none cursor-pointer">
                        <option value="Semua">{language === 'en' ? 'All Deficit Levels' : 'Semua Tingkat Kekurangan'}</option>
                        <option value="has_deficiency">{language === 'en' ? 'Only those with deficiencies' : 'Hanya yang memiliki kekurangan'}</option>
                        <option value="gt_22_5h">{language === 'en' ? 'Deficiency \u2265 22.5 Hours (3 Work Days)' : 'Kekurangan \u2265 22.5 Jam (3 Hari Kerja)'}</option>
                        <option value="gt_30h">{language === 'en' ? 'Deficiency > 30 Hours' : 'Kekurangan > 30 Jam'}</option>
                        <option value="gt_60h">{language === 'en' ? 'Deficiency > 60 Hours' : 'Kekurangan > 60 Jam'}</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                        <ChevronDown size={14} />
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold r border-b border-gray-100 dark:border-gray-800">
                          <th className="px-4 py-3">{language === 'en' ? 'Employee Name / NIP' : 'Nama Pegawai / NIP'}</th>
                          <th className="px-4 py-3 text-center">{t('quarter_1')} (Jan-Mar)</th>
                          <th className="px-4 py-3 text-center">{t('quarter_2')} (Apr-Jun)</th>
                          <th className="px-4 py-3 text-center bg-primary-50/30 text-primary-900">{t('total_accumulated')}</th>
                          <th className="px-4 py-3 text-center">{language === 'en' ? 'Information' : 'Keterangan'}</th>
                          <th className="px-4 py-3 text-center">{language === 'en' ? 'Accumulation Status' : 'Status Akumulasi'}</th>
                          <th className="px-4 py-3 text-center">{language === 'en' ? 'Download Details' : 'Unduh Rincian'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredQuarterlyEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                              <AlertTriangle className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={24} />
                              {t('not_found')}
                            </td>
                          </tr>
                        ) : (
                          paginatedQuarterlyEmployees.map((emp) => {
                            const totalDeficiencyHours = emp.totalDeficiency / 60;
                            const teguranThresholdMins = 22.5 * 60; // 1350 minutes (3 days * 7.5 hours/day)
                            const remainingToTeguran = teguranThresholdMins - emp.totalDeficiency;
                            let statusLabel = t('very_good');
                            let statusBg = "bg-primary-50 text-primary-700";
                            if (totalDeficiencyHours > 60) {
                              statusLabel = `${t('heavy_action')} (>60h)`;
                              statusBg = "bg-rose-100 text-rose-700 font-bold ";
                            } else if (totalDeficiencyHours > 30) {
                              statusLabel = `${t('need_guidance')} (>30h)`;
                              statusBg = "bg-rose-50 text-rose-700 font-bold";
                            } else if (totalDeficiencyHours >= 22.5) {
                              statusLabel = `${t('lisan_warning')} (>=22.5h)`;
                              statusBg = "bg-amber-100 text-amber-800 font-bold border border-amber-200";
                            } else if (totalDeficiencyHours > 0) {
                              statusLabel = `${t('good')} (<22.5h)`;
                              statusBg = "bg-sky-50 text-sky-700";
                            }
                            return (
                              <tr key={emp.nip} className="border-l-4 border-l-transparent hover:border-l-primary-400 dark:hover:border-l-primary-500 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 transition-all duration-150 group">
                                <td className="px-4 py-3.5">
                                  <div className="font-bold text-gray-800 dark:text-gray-100">{emp.nama.split(',')[0]}</div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">NIP. {emp.nip} • {emp.gol}</div>
                                </td>
                                <td className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-500">
                                  {emp.q1Deficiency > 0 ? (
                                    <span className="text-rose-600">{formatMinutesFriendly(emp.q1Deficiency)}</span>
                                  ) : (
                                    <span className="text-primary-600">0m</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-center font-semibold text-gray-600 dark:text-gray-500">
                                  {emp.q2Deficiency > 0 ? (
                                    <span className="text-rose-600">{formatMinutesFriendly(emp.q2Deficiency)}</span>
                                  ) : (
                                    <span className="text-primary-600">0m</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold bg-primary-50/10 text-primary-950">
                                  {emp.totalDeficiency > 0 ? (
                                    <span className="text-rose-700 font-black">{formatMinutesFriendly(emp.totalDeficiency)}</span>
                                  ) : (
                                    <span className="text-primary-700">0m ({language === 'en' ? 'Perfect' : 'Sempurna'})</span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-center font-medium text-gray-500 dark:text-gray-500">
                                  {emp.totalHadir} {language === 'en' ? 'days present' : 'hari hadir'}<br />
                                  <span className="text-[10px] text-primary-600">({emp.totalLeave} {language === 'en' ? 'days leave' : 'hari cuti/izin'})</span>
                                </td>
                                <td className="px-4 py-3.5 text-center print:hidden">
                                  <div className="flex flex-col items-center justify-center gap-1.5">
                                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusBg}`}>
                                      {statusLabel}
                                    </span>
                                    {emp.totalDeficiency < teguranThresholdMins ? (
                                      <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium block leading-tight">
                                        {t('remaining_lisan_warning').replace('{remaining}', formatMinutesFriendly(remainingToTeguran))}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-rose-500 font-semibold block leading-tight">
                                        {t('reached_lisan_warning')}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-center print:hidden">
                                  <button onClick={() => handleExportSingleEmployeeExcel(emp)} disabled={exportingNip !== null} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary-50 hover:bg-primary-100 disabled:bg-gray-50 dark:bg-gray-800/50 text-primary-700 disabled:text-gray-400 dark:text-gray-500 rounded-lg text-[10px] font-bold transition-all border border-primary-200/50 hover:border-primary-300 shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed" title={`Unduh rincian kekurangan jam kerja untuk ${emp.nama}`}>
                                    {exportingNip === emp.nip ? (
                                      <>
                                        <Loader2 size={12} className="animate-spin text-primary-700" />
                                        <span>{language === 'en' ? 'Downloading...' : 'Mengunduh...'}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Download size={12} className="text-primary-600" />
                                        <span>{t('download_excel')}</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Quarterly Pagination Footer */}
                  <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Menampilkan {Math.min(filteredQuarterlyEmployees.length, (quarterCurrentPage - 1) * quarterItemsPerPage + 1)}-{Math.min(filteredQuarterlyEmployees.length, quarterCurrentPage * quarterItemsPerPage)} dari {filteredQuarterlyEmployees.length} pegawai
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Tampilkan:</span>
                        <select value={quarterItemsPerPage} onChange={(e) => setQuarterItemsPerPage(Number(e.target.value))} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-300">
                          <option value={10}>10</option>
                          <option value={20}>20</option>
<option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>

                    {quarterTotalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQuarterCurrentPage(1)} disabled={quarterCurrentPage === 1} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all cursor-pointer" title="Halaman Pertama">
                          <ChevronsLeft size={14} />
                        </button>
                        <button onClick={() => setQuarterCurrentPage(prev => Math.max(prev - 1, 1))} disabled={quarterCurrentPage === 1} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all cursor-pointer" title="Halaman Sebelumnya">
                          <ChevronLeft size={14} />
                        </button>

                        <div className="flex items-center gap-1 px-2">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Hal</span>
                          <input type="number" min={1} max={quarterTotalPages} value={quarterCurrentPage} onChange={(e) => setQuarterCurrentPage(Math.max(1, Math.min(Number(e.target.value), quarterTotalPages)))} className="w-10 text-center py-0.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
                          <span className="text-xs font-bold text-gray-400 dark:text-gray-500">/ {quarterTotalPages}</span>
                        </div>

                        <button onClick={() => setQuarterCurrentPage(prev => Math.min(prev + 1, quarterTotalPages))} disabled={quarterCurrentPage === quarterTotalPages} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all cursor-pointer" title="Halaman Berikutnya">
                          <ChevronRight size={14} />
                        </button>
                        <button onClick={() => setQuarterCurrentPage(quarterTotalPages)} disabled={quarterCurrentPage === quarterTotalPages} className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-all cursor-pointer" title="Halaman Terakhir">
                          <ChevronsRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <BarChart3 size={18} className="text-primary-500" /> {t('visual_analysis')}
                    </h2>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{t('visual_analysis_sub')}</p>
                  </div>

                  {/* Chart Tabs */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto custom-scrollbar gap-1">
                    <button onClick={() => setActiveChartTab('performance-summary')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${ activeChartTab === 'performance-summary' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100' }`}>
                      {t('presence_perf')}
                    </button>
                    <button onClick={() => setActiveChartTab('daily-trend')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${ activeChartTab === 'daily-trend' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100' }`}>
                      {t('daily_trend')}
                    </button>
                    <button onClick={() => setActiveChartTab('top-deficiency')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${ activeChartTab === 'top-deficiency' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100' }`}>
                      {t('highest_def')}
                    </button>
                    <button onClick={() => setActiveChartTab('distribution')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${ activeChartTab === 'distribution' ? 'bg-white dark:bg-gray-900 text-primary-600 shadow-sm' : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:text-gray-100' }`}>
                      {t('status_dist')}
                    </button>
                  </div>
                </div>

                <div className="h-[360px] w-full">
                  {activeChartTab === 'performance-summary' && (
                    <div className="space-y-2 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                          {selectedMonth === 'Semua' 
                            ? t('performance_summary_all_desc')
                            : `${t('performance_summary_month_desc')} ${selectedMonth}`}
                        </span>
                      </div>
                      <div className="flex-1 min-h-[300px]">
                        <DeferredView>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyPerformanceData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="left" stroke="#f43f5e" fontSize={11} tickLine={false} axisLine={false} label={{ value: t('deficiency_axis'), angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, offset: 10 }} />
                              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} label={{ value: t('attendance_rate_axis'), angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10, offset: 10 }} />
                              <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} formatter={(value, name) => { if (name === 'presenceRate') return [`${value}%`, t('presence_rate')]; if (name === 'deficiencyHours') return [`${value} ${language === 'en' ? t('hours') : 'Jam'}`, t('deficiency')]; return [value, name]; }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Bar yAxisId="right" dataKey="presenceRate" name={t('presence_rate')} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                              <Bar yAxisId="left" dataKey="deficiencyHours" name={t('deficiency')} fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={45} />
                            </BarChart>
                          </ResponsiveContainer>
                        </DeferredView>
                      </div>
                    </div>
                  )}

                  {activeChartTab === 'daily-trend' && (
                    <DeferredView>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorDef" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPres" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#ef4444" fontSize={11} tickLine={false} axisLine={false} label={{ value: t('total_deficiency_label'), angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={11} tickLine={false} axisLine={false} label={{ value: t('attendance_rate_label'), angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} labelFormatter={(label) => { const monthName = selectedMonth === 'Semua' ? (language === 'en' ? 'June' : 'Juni') : selectedMonth; return `${language === 'en' ? 'Date' : 'Tanggal'} ${label} ${monthName} 2026`; }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Area yAxisId="left" type="monotone" dataKey="deficiencyHours" name={t('total_deficiency_label')} stroke="#ef4444" fillOpacity={1} fill="url(#colorDef)" strokeWidth={2} />
                          <Area yAxisId="right" type="monotone" dataKey="presencePercentage" name={t('attendance_rate_label')} stroke="#6366f1" fillOpacity={1} fill="url(#colorPres)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </DeferredView>
                  )}

                  {activeChartTab === 'top-deficiency' && (
                    <DeferredView>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topDeficiencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
                          <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="deficiencyHours" name={`${t('deficiency')} (${language === 'en' ? 'Hours' : 'Jam'})`} fill="#ef4444" radius={[0, 8, 8, 0]}>
                            {topDeficiencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#f87171'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </DeferredView>
                  )}

                  {activeChartTab === 'distribution' && (
                    <div className="flex flex-col md:flex-row items-center justify-around h-full">
                      <div className="w-[240px] h-[240px] shrink-0">
                        <DeferredView>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                                {distributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </DeferredView>
                      </div>
                      <div className="space-y-3.5 grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-0 mt-4 md:mt-0">
                        {distributionData.map((item, index) => { const translatedName = item.name === 'Sangat Baik' ? t('very_good') : item.name === 'Baik' ? t('good') : item.name === 'Teguran Lisan' ? t('lisan_warning') : item.name === 'Perlu Pembinaan' ? t('need_guidance') : item.name === 'Tindakan Berat' ? t('heavy_action') : item.name; return (
                            <div key={index} className="flex items-center gap-3">
                              <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: item.color }}></div>
                              <div>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 block">{translatedName}</span>
                                <span className="text-[11px] text-gray-500 dark:text-gray-500 font-medium">{item.value} {language === 'en' ? t('employee') : 'Pegawai'} ({Math.round((item.value / data.length) * 100)}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mainTab === 'bulanan' && (
            <div className="space-y-6">
              {/* Main Table Container */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Table Header Filter controls */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className=" text-lg font-bold text-gray-900 dark:text-gray-100">{t('attendance_list')}</h2>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{t('attendance_list_sub')}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center print:hidden">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 transform -trangray-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                      <input type="text" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium" />
                    </div>

                    {/* Filter Bulan */}
                    <div className="relative w-full sm:w-40 flex items-center shrink-0">
                      <Filter className="absolute left-3.5 top-1/2 transform -trangray-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={14} />
                      <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-semibold text-gray-600 dark:text-gray-500 cursor-pointer appearance-none">
                        <option value="Semua">{t('all_months')}</option>
                        {uniqueMonths.map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 transform -trangray-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={14} />
                    </div>

                    {/* Filter Unit Kerja */}
                    <div className="relative w-full sm:w-56 flex items-center shrink-0">
                      <Briefcase className="absolute left-3.5 top-1/2 transform -trangray-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={14} />
                      <input type="text" list="unit-kerja-list-month" value={selectedUnitKerja === 'Semua' ? '' : selectedUnitKerja} onChange={(e) => { setSelectedUnitKerja(e.target.value || 'Semua'); setCurrentPage(1); }} placeholder={t('all_units')} className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-gray-700 dark:text-gray-200" />
                      <datalist id="unit-kerja-list-month">
                        {uniqueUnitKerjas.map(unit => (
                          <option key={unit} value={unit} />
                        ))}
                      </datalist>
                      {selectedUnitKerja !== 'Semua' && (
                        <button onClick={() => setSelectedUnitKerja('Semua')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-500">
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Export Button */}
                    <button onClick={handleExportExcel} disabled={isExporting} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:border-primary-200 hover:bg-primary-50 text-gray-600 dark:text-gray-500 hover:text-primary-700 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                      {isExporting ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-primary-600" />
                          {language === 'en' ? 'Exporting...' : 'Mengekspor...'}
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          {t('export_excel')}
                        </>
                      )}
                    </button>

                    {/* Cetak Laporan Button */}
                    <button onClick={() => window.print()} id="btn-cetak-laporan-utama" className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-primary-200 hover:border-primary-300 bg-primary-50 hover:bg-primary-100 text-primary-700 hover:text-primary-800 rounded-xl font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-sm" title={t('print_report')}>
                      <Printer size={14} />
                      {t('print_report')}
                    </button>
                  </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold st border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-3.5">No</th>
                        <th className="px-5 py-3.5 cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('nama')}>
                          {language === 'en' ? 'Employee' : 'Pegawai'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('bulan')}>
                          {language === 'en' ? 'Month' : 'Bulan'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('unitKerja')}>
                          {language === 'en' ? 'Unit / Dept' : 'Unit Kerja'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('totalHadir')}>
                          {language === 'en' ? 'Present' : 'Hadir'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('totalLeave')}>
                          {language === 'en' ? 'Leave' : 'Cuti'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('totalActualWorked')}>
                          {language === 'en' ? 'Worked Time' : 'Waktu Kerja'} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 text-center cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors" onClick={() => requestSort('totalDeficiency')}>
                          {t('deficiency')} <ArrowUpDown size={11} className="inline ml-1 text-gray-400 dark:text-gray-500" />
                        </th>
                        <th className="px-5 py-3.5 text-center print:hidden">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 print:hidden">
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((r, index) => {
                          const recordNumber = (currentPage - 1) * itemsPerPage + index + 1;
                          const status = getDisciplineStatus(r.totalDeficiency);
                          return (
                            <tr key={`${r.nip}-${r.bulan}`} onClick={() => setSelectedRecord(r)} className="border-l-4 border-l-transparent hover:border-l-primary-400 dark:hover:border-l-primary-500 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 transition-all duration-150 cursor-pointer group">
                              <td className="px-5 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">{recordNumber}</td>
                              <td className="px-5 py-4">
                                <div>
                                  <div className=" font-bold text-gray-800 dark:text-gray-100 text-xs md:text-sm group-hover:text-primary-600 transition-colors">{r.nama}</div>
                                  <div className="text-gray-400 dark:text-gray-500 text-[10px] font-mono mt-0.5">NIP. {r.nip} • Gol. {r.gol}</div>
                                </div>
                              </td>
                              <td className="px-5 py-4 text-gray-600 dark:text-gray-500 text-xs font-semibold">{r.bulan}</td>
                              <td className="px-5 py-4 text-gray-600 dark:text-gray-500 text-xs font-semibold">{r.unitKerja}</td>
                              <td className="px-5 py-4 text-center font-mono text-xs font-bold text-gray-700 dark:text-gray-200">{r.totalHadir} hr</td>
                              <td className="px-5 py-4 text-center font-mono text-xs text-gray-500 dark:text-gray-500">{r.totalLeave} hr</td>
                              <td className="px-5 py-4 text-center font-mono text-xs font-bold text-primary-600">
                                {Math.round(r.totalActualWorked / 60)}j
                              </td>
                              <td className="px-5 py-4 text-center font-mono text-xs font-black text-rose-600">
                                {formatMinutesFriendly(r.totalDeficiency)}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg border uppercase r ${status.bg}`}>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                            {t('no_matching_search')}
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Print-only tbody showing ALL sorted/filtered records without pagination */}
                    <tbody className="divide-y divide-gray-200 hidden print:table-row-group">
                      {sortedRecords.length > 0 ? (
                        sortedRecords.map((r, index) => {
                          const recordNumber = index + 1;
                          const status = getDisciplineStatus(r.totalDeficiency);
                          return (
                            <tr key={`print-${r.nip}-${r.bulan}`} className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                              <td className="px-4 py-3 font-mono text-xs print:text-black dark:text-gray-100 border border-gray-200 dark:border-gray-700">{recordNumber}</td>
                              <td className="px-4 py-3 border border-gray-200 dark:border-gray-700">
                                <div>
                                  <div className="font-bold print:text-black dark:text-gray-100 text-xs">{r.nama}</div>
                                  <div className="print:text-black dark:print:text-black text-[10px] font-mono mt-0.5">NIP. {r.nip} • {r.gol}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-100 text-xs font-medium border border-gray-200 dark:border-gray-700">{r.bulan}</td>
                              <td className="px-4 py-3 text-gray-800 dark:text-gray-100 text-xs border border-gray-200 dark:border-gray-700">{r.unitKerja}</td>
                              <td className="px-4 py-3 text-center font-mono text-xs font-bold print:text-black dark:text-gray-100 border border-gray-200 dark:border-gray-700">{r.totalHadir} hr</td>
                              <td className="px-4 py-3 text-center font-mono text-xs print:text-black dark:print:text-black border border-gray-200 dark:border-gray-700">{r.totalLeave} hr</td>
                              <td className="px-4 py-3 text-center font-mono text-xs font-bold print:text-black dark:text-gray-100 border border-gray-200 dark:border-gray-700">
                                {Math.round(r.totalActualWorked / 60)}j
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-xs font-black text-rose-700 border border-gray-200 dark:border-gray-700">
                                {formatMinutesFriendly(r.totalDeficiency)}
                              </td>
                              <td className="px-4 py-3 text-center border border-gray-200 dark:border-gray-700">
                                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-100 uppercase">
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:print:text-black">
                            {t('no_data')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Panel */}
                <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {language === 'en' 
                        ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, sortedRecords.length)} of ${sortedRecords.length} employees`
                        : `Menampilkan ${(currentPage - 1) * itemsPerPage + 1} hingga ${Math.min(currentPage * itemsPerPage, sortedRecords.length)} dari ${sortedRecords.length} pegawai`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Tampilkan:</span>
                      <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-300">
                        <option value={10}>10</option>
                        <option value={20}>20</option>
<option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 disabled:opacity-50 disabled:pointer-events-none text-gray-600 dark:text-gray-400 transition-all cursor-pointer" title="Halaman Pertama">
                        <ChevronsLeft size={16} />
                      </button>
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 disabled:opacity-50 disabled:pointer-events-none text-gray-600 dark:text-gray-400 transition-all cursor-pointer" title="Halaman Sebelumnya">
                        <ChevronLeft size={16} />
                      </button>
                      
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        const isNear = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages;
                        if (!isNear) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={pageNum} className="text-gray-300 dark:text-gray-600 px-1 text-xs font-bold">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${ currentPage === pageNum 
                                ? 'bg-primary-600 text-white shadow-sm' 
                                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 disabled:opacity-50 disabled:pointer-events-none text-gray-600 dark:text-gray-400 transition-all cursor-pointer" title="Halaman Berikutnya">
                        <ChevronRight size={16} />
                      </button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-50 dark:bg-gray-800/50 disabled:opacity-50 disabled:pointer-events-none text-gray-600 dark:text-gray-400 transition-all cursor-pointer" title="Halaman Terakhir">
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Employee Detail Sidebar Drawer */}
      <>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 overflow-hidden print:absolute print:inset-0 print:bg-white dark:bg-gray-900 print:text-black print:overflow-visible">
            {/* Backdrop */}
            <div onClick={() => setSelectedRecord(null)} className="absolute inset-0 bg-gray-950/40 print:hidden" />

            {/* Content Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-4xl w-full flex pl-10 print:static print:w-full print:max-w-none print:p-0">
              <div className="w-full bg-white dark:bg-gray-900 h-screen shadow-2xl flex flex-col print:h-auto print:shadow-none print:static">
                {/* Header */}
                <div className="p-6 bg-gray-900 text-white flex items-start justify-between print:hidden">
                  <div>
                    <span className="text-[9px] font-extrabold text-primary-400 uppercase st leading-none block mb-1.5">
                      {language === 'en' ? 'ATTENDANCE DETAIL CALENDAR' : 'KALENDER DETAIL KEHADIRAN'}
                    </span>
                    <h3 className="text-lg font-black leading-tight">{selectedRecord.nama}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                      NIP. {selectedRecord.nip} • Gol. {selectedRecord.gol} • {selectedRecord.unitKerja}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Cetak Rincian Button */}
                    <button onClick={() => window.print()} className="p-2 bg-white/10 hover:bg-white/20 text-primary-400 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold px-3 py-2 print:hidden" title={language === 'en' ? 'Print daily details of this employee' : 'Cetak rincian harian pegawai ini'}>
                      <Printer size={15} />
                      <span>{t('print')}</span>
                    </button>
                    <button onClick={() => setSelectedRecord(null)} className="p-2 bg-white/10 hover:bg-white/20 text-gray-400 dark:text-gray-500 hover:text-white rounded-xl transition cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Body scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:overflow-visible print:p-0 print:space-y-4">
                  {/* Header Laporan Resmi untuk Cetak (Drawer) */}
                  <div className="hidden print:block border-b-4 border-double border-gray-900 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-lg border border-gray-800 shrink-0">
                        KGB
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold st text-gray-800 dark:text-gray-100 uppercase leading-none mb-1">
                          {language === 'en' ? 'MINISTRY OF INDUSTRY OF THE REPUBLIC OF INDONESIA' : 'KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA'}
                        </p>
                        <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">
                          {language === 'en' ? 'AGENCY FOR INDUSTRIAL STANDARDIZATION AND SERVICES POLICY (BSKJI)' : 'BADAN STANDARISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)'}
                        </h1>
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold mt-1.5">
                          {t('print_title_detail')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end text-xs text-gray-700 dark:text-gray-200">
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">{selectedRecord.nama}</p>
                        <p className="font-mono text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">NIP: {selectedRecord.nip} | Gol: {selectedRecord.gol}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">{language === 'en' ? 'Working Unit' : 'Unit Kerja'}: {selectedRecord.unitKerja}</p>
                      </div>
                      <div className="text-right text-[10px] text-gray-500 dark:text-gray-500 font-mono">
                        {language === 'en' ? 'Month' : 'Bulan'}: {selectedRecord.bulan} 2026 <br />
                        {language === 'en' ? 'Printed on' : 'Dicetak pada'}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Summary Statistics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block uppercase r">{t('work_time')}</span>
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-100 font-mono block mt-1">
                        {selectedRecord.totalHadir} {language === 'en' ? t('days') : 'Hari'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block uppercase r">{t('leave_time')}</span>
                      <span className="text-xl font-bold text-primary-600 font-mono block mt-1">
                        {selectedRecord.totalLeave} {language === 'en' ? t('days') : 'Hari'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block uppercase r">{t('work_duration')}</span>
                      <span className="text-xl font-bold text-primary-600 font-mono block mt-1">
                        {Math.round(selectedRecord.totalActualWorked / 60)} {language === 'en' ? t('hours') : 'Jam'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block uppercase r">{t('deficiency')}</span>
                      <span className="text-xl font-bold text-rose-600 font-mono block mt-1">{formatMinutesFriendly(selectedRecord.totalDeficiency)}</span>
                    </div>
                  </div>

                  {/* Day-by-Day Calendar logs */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase st flex items-center gap-1.5">
                          <CalendarDays size={14} className="text-primary-500" /> {t('daily_log')} ({selectedRecord.bulan} 2026)
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{t('daily_log_sub')}</p>
                      </div>

                      {/* Toggle Filter Deficiency */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary-300 px-3 py-1.5 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-500 hover:text-primary-700 transition-all shadow-sm print:hidden">
                        <input type="checkbox" checked={drawerFilterDeficiencyOnly} onChange={(e) => setDrawerFilterDeficiencyOnly(e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5 cursor-pointer accent-primary-600" />
                        <span>{t('only_deficiencies')}</span>
                      </label>
                    </div>

                    {/* Legend bar */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-[10px] text-gray-500 dark:text-gray-500 font-semibold bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 print:hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-primary-50 border border-primary-200 rounded inline-block shrink-0"></span>
                        <span>{t('fulfilled')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-rose-50 border border-rose-200 rounded inline-block shrink-0"></span>
                        <span>{language === 'en' ? 'Has Deficit / Absent' : 'Ada Kekurangan / Alfa'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-primary-50 border border-primary-200 rounded inline-block shrink-0"></span>
                        <span>{language === 'en' ? 'Leave / Business Trip (CT, C, D, DL, TL, T, DK)' : 'Cuti / Dinas Luar (CT, C, D, DL, TL, T, DK)'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded inline-block shrink-0"></span>
                        <span>{t('weekend')}</span>
                      </div>
                    </div>

                    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden shadow-inner bg-gray-50/30">
                      <div className="grid grid-cols-1 divide-y divide-gray-100">
                        {/* Day Header */}
                        <div className="grid grid-cols-6 px-4 py-2.5 bg-gray-100 dark:bg-gray-800/70 text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase r">
                          <div className="col-span-2">{t('day_date')}</div>
                          <div className="text-center">{t('check_in')}</div>
                          <div className="text-center">{t('check_out')}</div>
                          <div className="text-center">{t('work_duration')}</div>
                          <div className="text-center">{t('deficiency')}</div>
                        </div>

                        {/* Log Row Items */}
                        {(() => {
                          const attendanceEntries = Object.entries(selectedRecord.attendance)
                            .map(([dayStr, attVal]) => ({ dayStr, att: attVal as DailyAttendance, day: parseInt(dayStr, 10) }))
                            .sort((a, b) => a.day - b.day);
                          const filteredEntries = drawerFilterDeficiencyOnly 
                            ? attendanceEntries.filter(entry => entry.att.deficiency > 0 && entry.att.isRequiredDay)
                            : attendanceEntries;
                          
                          if (filteredEntries.length === 0) {
                            return (
                              <div className="px-4 py-12 text-center text-gray-400 dark:text-gray-500 text-xs font-semibold bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-2">
                                <CheckCircle className="text-primary-500 " size={24} />
                                <span>
                                  {language === 'en' 
                                    ? 'No working hour deficiency in this month. Perfect!' 
                                    : 'Tidak ada hari yang memiliki kekurangan jam kerja di bulan ini. Sempurna!'}
                                </span>
                              </div>
                            );
                          }

                          return filteredEntries.map(({ dayStr, att, day }) => {
                            const isWeekend = att.dayOfWeek === 0 || att.dayOfWeek === 6;
                            const hasDeficiency = att.deficiency > 0;
                            let rowBg = "bg-white dark:bg-gray-900 hover:bg-gray-50/80 dark:bg-gray-800/80";
                            let defTextClass = "text-rose-600 font-black";
                            let noteBadge = null;

                            if (isWeekend) {
                              rowBg = "bg-gray-50/50 text-gray-400 dark:text-gray-500";
                              defTextClass = "text-gray-400 dark:text-gray-500";
                            } else if (att.note.includes("Hari Libur")) {
                              rowBg = "bg-amber-50/20 text-gray-500 dark:text-gray-500";
                              defTextClass = "text-gray-400 dark:text-gray-500";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100 rounded">
                                  {language === 'en' ? 'Holiday' : 'Libur'}
                                </span>
                              );
                            } else if (att.note === "Tidak Hadir") {
                              rowBg = "bg-rose-50/15";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded">
                                  {language === 'en' ? 'Absent' : 'Alfa'}
                                </span>
                              );
                            } else if (att.note !== "Hadir") {
                              // Leave code (C, CT, DL, S)
                              rowBg = "bg-primary-50/10 text-gray-600 dark:text-gray-500";
                              defTextClass = "text-gray-400 dark:text-gray-500";
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary-50 text-primary-600 border border-primary-100 rounded">
                                  {att.note}
                                </span>
                              );
                            } else if (!hasDeficiency) {
                              noteBadge = (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary-50 text-primary-600 border border-primary-100 rounded">
                                  {t('fulfilled')}
                                </span>
                              );
                            }

                            return (
                              <div key={day} className={`grid grid-cols-6 px-4 py-3 items-center text-xs transition-colors ${rowBg}`}>
                                <div className="col-span-2 flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-200 w-5">{day.toString().padStart(2, '0')}</span>
                                  <div className="min-w-0">
                                    <span className="block font-bold text-gray-800 dark:text-gray-100 text-[11px] leading-tight">
                                      {language === 'en' 
                                        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][att.dayOfWeek] 
                                        : getDayNameIndonesian(att.dayOfWeek)}
                                    </span>
                                    <span className="block text-[9px] text-gray-400 dark:text-gray-500 font-mono ">
                                      {day} {translateMonthName(selectedRecord.bulan, language)} 2026
                                    </span>
                                  </div>
                                  {noteBadge}
                                </div>

                                <div className="text-center font-mono font-semibold text-gray-600 dark:text-gray-500">
                                  {att.checkIn || "-"}
                                </div>

                                <div className="text-center font-mono font-semibold text-gray-600 dark:text-gray-500">
                                  {att.checkOut || "-"}
                                </div>

                                <div className="text-center font-mono font-bold text-gray-700 dark:text-gray-200">
                                  {att.actualWorked > 0 ? formatMinutesFriendly(att.actualWorked) : "-"}
                                </div>

                                <div className={`text-center font-mono ${defTextClass}`}>
                                  {att.deficiency > 0 ? formatMinutesFriendly(att.deficiency) : (isWeekend || att.note !== "Hadir") ? "-" : "0m"}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                  <button onClick={() => setSelectedRecord(null)} className="px-5 py-2.5 bg-gray-800 text-white hover:bg-gray-900 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer">
                    {t('done')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
});

export default JamKerjaPage;
