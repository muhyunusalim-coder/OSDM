import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  CheckCircle,
  Activity,
  Banknote,
  Archive,
  ChevronRight,
  Building2,
  Award,
  Clock,
  AlertTriangle,
  RotateCw,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  StickyNote,
  Users,
  Compass,
  FileCheck2,
  CalendarCheck
} from "lucide-react";
import { Employee } from "../types";
import { Language, TRANSLATIONS } from "../utils/translationHelper";
import DashboardStats from "./DashboardStats";
import ServiceOverviewCharts from "./ServiceOverviewCharts";
import ComparisonChart from "./ComparisonChart";
import PensionProjectionDashboardChart from "./PensionProjectionDashboardChart";
import { DeferredView } from "./DeferredView";
import { formatNIP } from "../src/layouts/MainLayout";

interface Props {
  language: Language;
  currentUser: Employee | null;
  currentUserDaysRemaining: number | null;
  greeting: string;
  quote: string;
  handleNewQuote: () => void;
  stats: any;
  employees: Employee[];
  promotionEmployees?: Employee[];
  displayedEmployees: Employee[];
  selectedMonth: string | null;
  selectedYear: number | null;
  setSelectedMonth: (month: string | null) => void;
  setSelectedYear: (year: number | null) => void;
  handleStatusToggle: (id: string) => void;
  handleDeleteEmployee: (id: string) => void;
  onCardClick?: (type: string) => void;
  setCurrentView?: (view: any) => void;
  setIsKenaikanPangkatExpanded?: (expanded: boolean) => void;
  setIsLayananKgbExpanded?: (expanded: boolean) => void;
  setIsPensiunExpanded?: (expanded: boolean) => void;
  systemAlerts?: Array<{
    id: string;
    type: "kgb" | "pensiun";
    title: string;
    message: string;
    employee: Employee;
    daysOrMonthsLeft: number;
    severity: "critical" | "warning";
  }>;
}

const ASN_CORE_VALUES = [
  {
    code: "Berorientasi Pelayanan",
    description: "Berkomitmen memberikan pelayanan prima demi kepuasan masyarakat dan seluruh insan ASN BSKJI."
  },
  {
    code: "Akuntabel",
    description: "Bertanggung jawab atas kepercayaan yang diberikan dengan integritas tinggi, cermat, dan disiplin."
  },
  {
    code: "Kompeten",
    description: "Terus belajar dan mengembangkan kapabilitas profesional dalam tata kelola administrasi kepegawaian."
  },
  {
    code: "Harmonis",
    description: "Saling peduli dan menghargai perbedaan untuk mewujudkan lingkungan kerja yang kondusif di BSKJI."
  },
  {
    code: "Loyal",
    description: "Berdedikasi dan mengutamakan kepentingan bangsa, negara, dan instansi Kementerian Perindustrian."
  },
  {
    code: "Adaptif",
    description: "Terus berinovasi dan antusias dalam menggerakkan serta menghadapi transformasi digital birokrasi."
  },
  {
    code: "Kolaboratif",
    description: "Membangun kerja sama yang sinergis antar satuan kerja dan balai industri di lingkungan BSKJI."
  }
];

const DashboardPage: React.FC<Props> = React.memo(
  ({
    language,
    currentUser,
    currentUserDaysRemaining,
    greeting,
    quote,
    handleNewQuote,
    stats,
    employees,
    promotionEmployees,
    displayedEmployees,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    handleStatusToggle,
    handleDeleteEmployee,
    onCardClick,
    setCurrentView,
    setIsKenaikanPangkatExpanded,
    setIsLayananKgbExpanded,
    setIsPensiunExpanded,
    systemAlerts = [],
  }) => {
    const t = useCallback(
      (key: string) => {
        return TRANSLATIONS[language]?.[key] || key;
      },
      [language]
    );

    const [activeValueIndex, setActiveValueIndex] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setActiveValueIndex((prev) => (prev + 1) % ASN_CORE_VALUES.length);
      }, 8000);
      return () => clearInterval(interval);
    }, []);

    const handleQuickNavigate = (view: string) => {
      if (!setCurrentView) return;
      if (view === "data-kgb" && setIsLayananKgbExpanded) {
        setIsLayananKgbExpanded(true);
        setIsKenaikanPangkatExpanded?.(false);
        setIsPensiunExpanded?.(false);
      } else if (view === "kenaikan-pangkat" && setIsKenaikanPangkatExpanded) {
        setIsKenaikanPangkatExpanded(true);
        setIsLayananKgbExpanded?.(false);
        setIsPensiunExpanded?.(false);
      } else if (view === "pensiun" && setIsPensiunExpanded) {
        setIsPensiunExpanded(true);
        setIsLayananKgbExpanded?.(false);
        setIsKenaikanPangkatExpanded?.(false);
      }
      setCurrentView(view);
    };

    const latestProcessed = useMemo(() => {
      return employees
        .filter(
          (e) =>
            e.status === "Processed" &&
            e.salaryHistory &&
            e.salaryHistory.length > 0
        )
        .sort((a, b) => {
          const dateB =
            b.salaryHistory && b.salaryHistory.length > 0
              ? new Date(b.salaryHistory[b.salaryHistory.length - 1].date).getTime()
              : 0;
          const dateA =
            a.salaryHistory && a.salaryHistory.length > 0
              ? new Date(a.salaryHistory[a.salaryHistory.length - 1].date).getTime()
              : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
    }, [employees]);

    return (
      <div className="space-y-6 pb-6">
        
        {/* Institutional Welcome & Officer Profile Banner */}
        <section aria-label="Informasi Pegawai dan Instansi" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          {/* Top Institutional Header Ribbon */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-5 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-950">
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-blue-300 shrink-0" />
              <div className="text-xs">
                <span className="font-bold tracking-wider uppercase text-blue-200">
                  BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI
                </span>
                <span className="hidden md:inline mx-2 text-blue-400">·</span>
                <span className="hidden md:inline text-blue-100 font-medium">
                  Kementerian Perindustrian Republik Indonesia
                </span>
              </div>
            </div>

            <div className="text-[11px] text-blue-200 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Sistem Pemantauan Terpadu ASN</span>
            </div>
          </div>

          {/* Officer Profile & Quick Actions Area */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Left Officer Info */}
            <div className="lg:col-span-2 space-y-3">
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  {greeting}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                  {currentUser ? currentUser.nama : "Aparatur Sipil Negara BSKJI"}
                </h1>
                
                {currentUser && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      NIP: {formatNIP(currentUser.nip)}
                    </span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
                    <span>{currentUser.jabatan || "Pengelola Kepegawaian"}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      {currentUser.statusKepegawaian || "PNS"}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                Selamat bertugas dalam pengelolaan administrasi Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat (KP), Pensiun (BUP), dan pemantauan disiplin jam kerja aparatur sipil negara di lingkungan BSKJI.
              </p>

              {/* Functional Quick Navigation Cards */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickNavigate("data-kgb")}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Banknote size={15} className="text-blue-600 shrink-0" />
                    <span>Layanan KGB</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Pemantauan Berkala
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickNavigate("kenaikan-pangkat")}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Award size={15} className="text-emerald-600 shrink-0" />
                    <span>Layanan KP</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Periode & Usulan
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickNavigate("pensiun")}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Archive size={15} className="text-amber-600 shrink-0" />
                    <span>Pensiun (BUP)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Batas Usia Pensiun
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickNavigate("susunan-pegawai")}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                    <Users size={15} className="text-indigo-600 shrink-0" />
                    <span>Data DSP</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Susunan Pegawai
                  </p>
                </button>
              </div>
            </div>

            {/* Right ASN Core Values Card (BerAKHLAK) */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  <Compass size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>Nilai Dasar ASN BerAKHLAK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveValueIndex((prev) => (prev + 1) % ASN_CORE_VALUES.length)}
                  title="Nilai Selanjutnya"
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCw size={12} />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {ASN_CORE_VALUES[activeValueIndex].code}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal min-h-[48px]">
                  {ASN_CORE_VALUES[activeValueIndex].description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/50 text-[10px] text-slate-400 font-mono">
                <span>Panduan Perilaku Kerja ASN</span>
                <span>{activeValueIndex + 1} / {ASN_CORE_VALUES.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Kartu Statistik Utama Kepegawaian */}
        <section aria-label="Statistik Utama Kepegawaian" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Ikhtisar Data Layanan Kepegawaian</span>
            </h2>
          </div>

          <DashboardStats stats={stats} onCardClick={onCardClick} />
        </section>

        {/* Early Warning System (EWS) - Peringatan Jatuh Tempo Layanan */}
        {systemAlerts && systemAlerts.length > 0 && (
          <section aria-label="Peringatan Dini Kepegawaian" className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200">
                    Sistem Peringatan Dini Kepegawaian ({systemAlerts.length} Peringatan)
                  </h3>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
                    Daftar pegawai yang mendekati batas waktu TMT KGB (H-30 hari) atau batas usia pensiun (BUP).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickNavigate("data-kgb")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 cursor-pointer self-start sm:self-auto"
              >
                <span>Kelola Seluruh Daftar</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {systemAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className={`font-semibold flex items-center gap-1 ${
                      alert.severity === "critical"
                        ? "text-rose-700 dark:text-rose-400 font-bold"
                        : "text-amber-700 dark:text-amber-400 font-bold"
                    }`}>
                      <AlertTriangle size={12} />
                      {alert.title}
                    </span>
                    <span className="font-mono text-slate-400">
                      NIP: {formatNIP(alert.employee.nip).slice(0, 11)}...
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {alert.employee.nama}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[170px]">
                      {alert.employee.unitKerja || "BSKJI"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickNavigate(alert.type === "pensiun" ? "pensiun" : "data-kgb")}
                      className="font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                    >
                      Tindak Lanjut &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Analitik & Visualisasi Data Layanan */}
        <section aria-label="Analitik Data Kepegawaian" className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Activity size={16} className="text-blue-600 dark:text-blue-400" />
              <span>Analisis & Visualisasi Realisasi Layanan</span>
            </h2>
          </div>

          <DeferredView minHeight="300px">
            <div className="space-y-6">
              <ServiceOverviewCharts
                employees={employees}
                promotionEmployees={promotionEmployees || []}
                stats={stats}
                language={language}
              />
              <ComparisonChart employees={employees} language={language} />
              <PensionProjectionDashboardChart
                employees={employees}
                language={language}
              />
            </div>
          </DeferredView>
        </section>

        {/* Section: Riwayat Realisasi Penerbitan SK Terakhir */}
        {latestProcessed && latestProcessed.length > 0 && (
          <section aria-label="Riwayat Layanan Selesai" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileCheck2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Realisasi SK Selesai Diproses Terbaru</span>
              </h2>

              <button
                type="button"
                onClick={() => handleQuickNavigate("data-kgb")}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Data KGB Lengkap</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {latestProcessed.map((emp) => {
                  return (
                    <div
                      key={emp.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {emp.nama.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {emp.nama}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono">NIP: {formatNIP(emp.nip)}</span>
                            <span aria-hidden="true">·</span>
                            <span>Gol: {emp.pangkat || emp.golonganRaw || "-"}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{emp.unitKerja || "BSKJI"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs">
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle size={13} />
                            <span>SK Selesai Diterbitkan</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }
);

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
