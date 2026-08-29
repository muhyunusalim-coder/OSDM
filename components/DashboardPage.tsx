import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Sparkles,
  X,
  CheckCircle,
  CheckCircle2,
  Activity,
  Banknote,
  Archive,
  ChevronRight,
  Building,
  Award,
  Clock,
  BookOpen,
  AlertTriangle,
  RotateCw,
  FileText,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Briefcase,
  User,
  Users,
  UserCheck,
  Search,
  Zap,
  ShieldCheck,
  HeartPulse,
  Calendar,
  Layers,
  FileSpreadsheet,
  Building2,
  ExternalLink,
} from "lucide-react";
import { Employee } from "../types";
import { Language, TRANSLATIONS } from "../utils/translationHelper";
import DashboardStats from "./DashboardStats";
import ServiceOverviewCharts from "./ServiceOverviewCharts";
import ComparisonChart from "./ComparisonChart";
import PensionProjectionDashboardChart from "./PensionProjectionDashboardChart";
import { DeferredView } from "./DeferredView";

interface Regulation {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  points: string[];
}

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

const REGULATIONS: Regulation[] = [
  {
    id: "uu20",
    code: "UU No. 20 Tahun 2023",
    title: "Aparatur Sipil Negara",
    subtitle: "Pokok Reformasi Manajemen & Pola Karier PNS",
    summary:
      "Undang-Undang ini menyederhanakan jenjang jabatan, mempercepat mobilitas talenta, serta memantapkan integrasi sistem informasi kepegawaian secara nasional.",
    points: [
      "Penyederhanaan klasifikasi jabatan menjadi Jabatan Manajerial dan Nonmanajerial.",
      "Kemudahan mobilitas talenta secara nasional guna mengatasi kesenjangan kapasitas.",
      "Sanksi tegas bagi pelanggaran netralitas ASN dalam kontestasi politik.",
      "Sistem jaminan pensiun dan hari tua berbasis iuran pasti (defined contribution).",
    ],
  },
  {
    id: "pp15",
    code: "PP No. 15 Tahun 2024",
    title: "Penyesuaian Gaji Pokok PNS",
    subtitle: "Tabel Gaji Pokok & Hak Kesejahteraan Terbaru",
    summary:
      "Peraturan Pemerintah ini menetapkan kenaikan gaji pokok PNS sebesar 8% guna meningkatkan kesejahteraan dan produktivitas kinerja pelayanan publik.",
    points: [
      "Kenaikan nominal gaji pokok rata-rata sebesar 8% untuk seluruh Golongan I hingga IV.",
      "Penyesuaian nilai tunjangan melekat (suami/istri, anak, pangan) mengikuti gaji pokok baru.",
      "Rapelan kekurangan pembayaran gaji terhitung sejak tanggal 1 Januari 2024.",
      "Penyelarasan standar iuran jaminan kesehatan dan jaminan pensiun berkala.",
    ],
  },
  {
    id: "se16",
    code: "SE Kepala Badan Standardisasi dan Kebijakan Jasa Industri No. 16 Tahun 2023",
    title: "Administrasi Terintegrasi Badan Standardisasi dan Kebijakan Jasa Industri",
    subtitle: "Implementasi Penuh SIASN untuk KGB & KP",
    summary:
      "Surat Edaran ini mewajibkan seluruh instansi pusat dan daerah melakukan sinkronisasi data KGB dan Kenaikan Pangkat secara real-time via web service SIASN.",
    points: [
      "Penetapan Kenaikan Pangkat (KP) dilakukan secara digital tanpa berkas fisik (paperless).",
      "Data KGB diintegrasikan otomatis guna pembaharuan basis data penggajian Kementerian.",
      "Kewajiban verifikasi berlapis oleh Admin Kepegawaian Unit Kerja sebelum disubmit.",
      "Sinkronisasi berkas pendukung (SKP, SK Pangkat terakhir) maksimal 14 hari sebelum TMT.",
    ],
  },
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

    const [activeMessageIndex, setActiveMessageIndex] = useState(0);
    const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);
    const [quickSearch, setQuickSearch] = useState("");

    const messages = useMemo(
      () => [
        "💪 Dedikasi Tanpa Batas: Menjadi ASN bukan sekadar pekerjaan, melainkan pengabdian tulus kepada bangsa.",
        "🌟 BerAKHLAK: Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, dan Kolaboratif.",
        "🚀 Semangat Berinovasi: Tingkatkan terus kompetensi diri dan hadirkan solusi digital terbaik bagi negeri!",
        "💡 Integritas Utama: Bekerja dengan jujur dan transparan adalah bentuk kepedulian terhadap masa depan Indonesia.",
        "🔥 Gaji berkala naik, semangat makin membara! Lengkapi berkas KGB-mu ya sebelum masa TMT tiba.",
        "❤️ Pelayanan Prima: Senyum ramah, solusi cepat, dan kepedulian tulus adalah hadiah terbaik untuk masyarakat.",
        "🌱 Tumbuh Bersama: Kolaborasi antar instansi mempererat persatuan dan mempercepat kemajuan pembangunan.",
        "🎯 Fokus & Presisi: Unggah dokumen secara lengkap dan teliti adalah cermin profesionalisme tinggi ASN.",
        "✨ Kerja adalah Ibadah: Satukan niat baik, jadikan setiap pelayanan sebagai pengabdian bernilai berkah.",
        "🧠 Adaptif & Gesit: Di era transformasi digital, mari responsif dan terus bergerak selangkah lebih maju!",
        "🤝 Sinergi Positif: Lingkungan kerja yang harmonis melahirkan kreativitas tanpa batas dan produktivitas tinggi.",
        "⭐ Bangga Melayani Bangsa: Jadilah teladan integritas karena kinerja kita mencerminkan wajah birokrasi negara.",
        "📅 Disiplin Waktu: Mengurus administrasi tepat waktu menunjukkan komitmen sejati seorang abdi negara.",
        "🌈 Energi Positif: Awali hari dengan senyuman hangat, layani dengan hati, sebarkan kebaikan di tempat kerja.",
        "🛡️ Layanan Bersih: Komitmen BSKJI menghadirkan sistem administrasi cepat, bersih, dan bebas gratifikasi.",
        "🎓 Pembelajar Sepanjang Hayat: ASN hebat adalah mereka yang selalu adaptif dan terus memperbarui wawasan.",
        "⚡ Birokrasi Efisien: Sistem digital mempercepat layanan, memberi Anda waktu lebih untuk berfokus pada inovasi baru.",
        "🎉 Apresiasi Pengabdian: Setiap langkah karir Anda sangat bernilai. Teruslah berkarya untuk kemakmuran bangsa!",
      ],
      []
    );

    useEffect(() => {
      const interval = setInterval(() => {
        setActiveMessageIndex((prev) => (prev + 1) % messages.length);
      }, 7000);
      return () => clearInterval(interval);
    }, [messages]);

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
      } else {
        setIsLayananKgbExpanded?.(false);
        setIsKenaikanPangkatExpanded?.(false);
        setIsPensiunExpanded?.(false);
      }
      setCurrentView(view);
    };

    // Filtered search results for instant lookup
    const searchResults = useMemo(() => {
      if (!quickSearch.trim()) return [];
      const query = quickSearch.toLowerCase();
      return employees
        .filter(
          (emp) =>
            emp.nama.toLowerCase().includes(query) ||
            emp.nip.includes(query) ||
            emp.unitKerja.toLowerCase().includes(query) ||
            emp.jabatan.toLowerCase().includes(query)
        )
        .slice(0, 5);
    }, [quickSearch, employees]);

    // Unit Kerja aggregated supervision stats
    const unitKerjaStats = useMemo(() => {
      const map: Record<string, { total: number; pending: number; processed: number }> = {};
      employees.forEach((emp) => {
        const unit = emp.unitKerja || "Balai / Unit Kerja BSKJI";
        if (!map[unit]) {
          map[unit] = { total: 0, pending: 0, processed: 0 };
        }
        map[unit].total += 1;
        if (emp.status === "Pending") map[unit].pending += 1;
        if (emp.status === "Processed") map[unit].processed += 1;
      });

      return Object.entries(map)
        .map(([unit, data]) => ({ unit, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    }, [employees]);

    // Calculate PNS / PPPK Ratio
    const pnsCount = useMemo(
      () => employees.filter((e) => e.statusKepegawaian === "PNS").length,
      [employees]
    );
    const pppkCount = useMemo(
      () => employees.filter((e) => e.statusKepegawaian === "PPPK").length,
      [employees]
    );

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
              ? new Date(
                  b.salaryHistory[b.salaryHistory.length - 1].date
                ).getTime()
              : 0;
          const dateA =
            a.salaryHistory && a.salaryHistory.length > 0
              ? new Date(
                  a.salaryHistory[a.salaryHistory.length - 1].date
                ).getTime()
              : 0;
          return dateB - dateA;
        })
        .slice(0, 4);
    }, [employees]);

    return (
      <div className="flex flex-col xl:flex-row gap-6 pb-8">
        {/* Left Column (Main Content) */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* Welcome Card */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-4 border-[#2f9ed6] bg-gray-50 flex items-center justify-center text-2xl font-bold text-[#2f9ed6] dark:bg-gray-800 shadow-sm shrink-0">
                 {currentUser ? currentUser.nama.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                 <h1 className="text-xl md:text-2xl font-extrabold text-[#2f9ed6] truncate">
                   Selamat Datang, {currentUser ? currentUser.nama.split(",")[0] : "Pegawai"}
                 </h1>
                 <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mt-1 truncate">
                   NIP: {currentUser ? currentUser.nip : "-"}
                 </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 shrink-0">
              <span className="inline-block bg-[#2f9ed6] text-white px-5 py-1.5 rounded-full text-xs font-extrabold tracking-wider shadow-md shadow-[#2f9ed6]/20">
                PNS
              </span>
            </div>
          </div>

          {/* Inspirasi BerAKHLAK Box (Ditempatkan di atas Aksi Cepat) */}
          <div className="relative overflow-hidden rounded-[24px] border border-gray-100/80 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100/80 dark:border-gray-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-50/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                  <Sparkles size={14} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  Inspirasi BerAKHLAK
                </span>
              </div>

              <button
                onClick={handleNewQuote}
                title="Ganti Inspirasi"
                className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <RotateCw size={14} />
              </button>
            </div>

            <div className="mt-3.5 min-h-[40px] flex items-center">
              <p
                key={activeMessageIndex}
                className="text-[13px] leading-relaxed font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-300 italic"
              >
                "{messages[activeMessageIndex]}"
              </p>
            </div>
          </div>

          {/* Aksi Cepat */}
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] dark:bg-gray-900 dark:border-gray-800">
            <h2 className="text-[14px] font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-white">
              <Activity size={18} className="text-[#2f9ed6]" /> Aksi Cepat
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <button onClick={() => handleQuickNavigate("jam-kerja")} className="bg-white rounded-lg p-5 flex flex-col items-center justify-center gap-3 border border-gray-100 border-t-[3px] border-t-[#2f9ed6] hover:bg-blue-50/50 transition-colors cursor-pointer shadow-sm">
                 <Clock size={24} strokeWidth={2} className="text-[#2f9ed6]" />
                 <span className="text-[13px] font-bold text-[#2f9ed6]">Jam Kerja</span>
              </button>

              <button onClick={() => handleQuickNavigate("data-kgb")} className="bg-white rounded-lg p-5 flex flex-col items-center justify-center gap-3 border border-gray-100 border-t-[3px] border-t-emerald-500 hover:bg-emerald-50/50 transition-colors cursor-pointer shadow-sm">
                 <Banknote size={24} strokeWidth={2} className="text-emerald-500" />
                 <span className="text-[13px] font-bold text-emerald-500">Data KGB</span>
              </button>
              
              <button onClick={() => handleQuickNavigate("kenaikan-pangkat")} className="bg-white rounded-lg p-5 flex flex-col items-center justify-center gap-3 border border-gray-100 border-t-[3px] border-t-purple-500 hover:bg-purple-50/50 transition-colors cursor-pointer shadow-sm">
                 <Award size={24} strokeWidth={2} className="text-purple-500" />
                 <span className="text-[13px] font-bold text-purple-500">Kenaikan Pangkat</span>
              </button>
              
              <button onClick={() => handleQuickNavigate("pensiun")} className="bg-white rounded-lg p-5 flex flex-col items-center justify-center gap-3 border border-gray-100 border-t-[3px] border-t-orange-500 hover:bg-orange-50/50 transition-colors cursor-pointer shadow-sm">
                 <Archive size={24} strokeWidth={2} className="text-orange-500" />
                 <span className="text-[13px] font-bold text-orange-500">Data Pensiun</span>
              </button>
            </div>
          </div>

          {/* Section: Kartu Statistik Utama */}
          <div className="space-y-3">
            <DashboardStats stats={stats} onCardClick={onCardClick} />
          </div>

          {/* System Alerts / Prioritas Layanan (if any) */}
          {systemAlerts && systemAlerts.length > 0 && (
            <div className="rounded-[24px] border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/30 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] dark:border-amber-900/30 dark:bg-gradient-to-r dark:from-amber-950/20 dark:to-gray-900/50">
              <div className="flex items-center justify-between pb-4 border-b border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] dark:bg-amber-900/30 dark:text-amber-400 dark:shadow-none">
                    <ShieldAlert size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-gray-900 dark:text-white">
                      Peringatan TMT ({systemAlerts.length})
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      Pegawai mendekati jatuh tempo
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickNavigate("data-kgb")}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {systemAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col justify-between rounded-[20px] border border-white/50 bg-white/70 p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-transform hover:-translate-y-1 hover:bg-white dark:border-gray-800/60 dark:bg-gray-900/60 dark:hover:bg-gray-900"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border ${
                            alert.severity === "critical"
                              ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50"
                          }`}
                        >
                          <AlertTriangle size={12} strokeWidth={2.5} />
                          {alert.title}
                        </span>
                        <span className="text-[10px] font-semibold font-mono text-gray-400">
                          NIP: {alert.employee.nip}
                        </span>
                      </div>

                      <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                        {alert.employee.nama}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1 line-clamp-1">
                        {alert.message}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100/60 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                        {alert.employee.unitKerja}
                      </span>
                      <button
                        onClick={() => handleQuickNavigate(alert.type === "pensiun" ? "pensiun" : "data-kgb")}
                        className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
                      >
                        Proses &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Analitik & Visualisasi Data Layanan */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-[#2f9ed6]" />
                  {t("chart_overview_title") || "Analitik Layanan Kepegawaian"}
                </h2>
              </div>
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
          </div>

          {/* Section: Riwayat Layanan Terakhir Diproses */}
          {latestProcessed && latestProcessed.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    SK Selesai Diproses Terbaru
                  </h2>
                </div>

                <button
                  onClick={() => handleQuickNavigate("data-kgb")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Kelola Data</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {latestProcessed.map((emp) => {
                  return (
                    <div
                      key={emp.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-transform hover:-translate-y-1 hover:border-gray-200 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] dark:border-gray-800/60 dark:bg-gray-900/60"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-50 bg-emerald-50/80 text-emerald-600 font-bold text-[13px] transition-transform duration-300 group-hover:scale-105 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {emp.nama.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
                            {emp.nama}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                            <span className="font-mono">NIP: {emp.nip}</span>
                            <span>•</span>
                            <span>Gol: {emp.pangkat || emp.golonganRaw || "-"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100/80 dark:border-gray-800/80">
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle size={12} strokeWidth={2.5} />
                            Selesai Diproses
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar-like info) */}
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.02)] dark:bg-gray-900 dark:border-gray-800 text-center relative overflow-hidden">
             {/* Decorative Background blob */}
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-[#f3f9fc] dark:bg-blue-900/20 opacity-50 blur-2xl"></div>
             
             <div className="flex justify-center mb-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#eaf5fa] flex items-center justify-center text-[#2f9ed6] dark:bg-blue-900/30">
                   <Building size={32} strokeWidth={2} />
                </div>
             </div>
             <h2 className="text-lg font-black text-[#2f9ed6] mb-3 uppercase tracking-wide relative z-10">Selamat Datang di MYASN</h2>
             <p className="text-[13px] font-medium text-gray-500 mb-6 text-justify leading-relaxed dark:text-gray-400 relative z-10">
                Aplikasi portal kepegawaian resmi untuk mempermudah pegawai BSKJI dalam memantau dan mengelola data Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat, dan Pensiun.
             </p>
             
             <div className="text-left space-y-3.5 relative z-10 pt-4 border-t border-gray-100 dark:border-gray-800">
               <h3 className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Fitur Utama:</h3>
               <div className="flex items-start gap-3">
                  <CheckCircle size={16} strokeWidth={2.5} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">Notifikasi otomatis jatuh tempo layanan kepegawaian.</span>
               </div>
               <div className="flex items-start gap-3">
                  <CheckCircle size={16} strokeWidth={2.5} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">Dashboard analitik terintegrasi untuk pimpinan.</span>
               </div>
               <div className="flex items-start gap-3">
                  <CheckCircle size={16} strokeWidth={2.5} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-[12px] font-semibold text-gray-600 dark:text-gray-400 leading-tight">Pelacakan progres SK pegawai secara real-time.</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }
);

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
