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
    code: "SE Kepala BKN No. 16 Tahun 2023",
    title: "Administrasi Terintegrasi BKN",
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
      <div className="space-y-6 pb-8">
        {/* Simple & Clean Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/10 p-6 sm:p-8 shadow-sm dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            {/* Left Welcome Area */}
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 backdrop-blur-sm dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-300">
                <Building size={13} className="text-blue-600 dark:text-blue-400" />
                <span>BSKJI Kemenperin</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  {currentUser
                    ? currentUser.nama.split(",")[0]
                    : "Pegawai BSKJI"}
                </span>
              </h1>

              <p className="max-w-2xl text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                Pusat layanan administrasi Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat (KP), dan Pensiun ASN BSKJI.
              </p>

              {/* Quick Navigation Action Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  onClick={() => handleQuickNavigate("data-kgb")}
                  className="group flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white/90 p-3 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-blue-700/60 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-transform group-hover:scale-105 dark:border-blue-900/50 dark:bg-blue-900/40 dark:text-blue-300">
                    <Banknote size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      Data KGB
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      Gaji Berkala
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickNavigate("kenaikan-pangkat")}
                  className="group flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white/90 p-3 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-emerald-700/60 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm transition-transform group-hover:scale-105 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      Kenaikan Pangkat
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      KP Periode
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickNavigate("pensiun")}
                  className="group flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white/90 p-3 text-left shadow-sm transition-all hover:border-rose-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-rose-700/60 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 shadow-sm transition-transform group-hover:scale-105 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
                    <Archive size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      Pensiun
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      BUP ASN
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickNavigate("jam-kerja")}
                  className="group flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white/90 p-3 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-amber-700/60 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shadow-sm transition-transform group-hover:scale-105 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-300">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                      Jam Kerja
                    </p>
                    <p className="truncate text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      Presensi & Jam
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Rotatable Announcement Box */}
            <div className="w-full shrink-0 lg:max-w-[340px]">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                      <Sparkles size={13} />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Inspirasi BerAKHLAK
                    </span>
                  </div>

                  <button
                    onClick={handleNewQuote}
                    title="Ganti Inspirasi"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                  >
                    <RotateCw size={12} />
                  </button>
                </div>

                <div className="mt-2.5 min-h-[52px] flex items-center">
                  <p
                    key={activeMessageIndex}
                    className="text-xs leading-relaxed font-medium text-gray-700 dark:text-gray-200 transition-opacity duration-300"
                  >
                    {messages[activeMessageIndex]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Kartu Statistik Utama */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-blue-600 dark:text-blue-400" />
              Ringkasan Layanan Kepegawaian
            </h2>
          </div>

          <DashboardStats stats={stats} onCardClick={onCardClick} />
        </div>

        {/* System Alerts / Prioritas Layanan (if any) */}
        {systemAlerts && systemAlerts.length > 0 && (
          <div className="rounded-3xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/50 dark:border-amber-900/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">
                    Peringatan TMT ({systemAlerts.length})
                  </h3>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                    Pegawai mendekati jatuh tempo TMT KGB atau pensiun
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleQuickNavigate("data-kgb")}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                <span>Lihat Semua</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {systemAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          alert.severity === "critical"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900"
                        }`}
                      >
                        <AlertTriangle size={10} />
                        {alert.title}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        NIP: {alert.employee.nip}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {alert.employee.nama}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5 line-clamp-1">
                      {alert.message}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 dark:text-gray-400 truncate">
                      {alert.employee.unitKerja}
                    </span>
                    <button
                      onClick={() => handleQuickNavigate(alert.type === "pensiun" ? "pensiun" : "data-kgb")}
                      className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer shrink-0 ml-2"
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
                <Activity size={18} className="text-blue-600 dark:text-blue-400" />
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
                <span>Kelola Data KGB</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {latestProcessed.map((emp) => {
                  const lastHistory = emp.salaryHistory?.[emp.salaryHistory.length - 1];
                  return (
                    <div
                      key={emp.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 font-bold text-xs shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {emp.nama.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {emp.nama}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="font-mono">NIP: {emp.nip}</span>
                            <span>•</span>
                            <span>Gol: {emp.pangkat || emp.golonganRaw || "-"}</span>
                            <span>•</span>
                            <span className="truncate">{emp.unitKerja}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle size={10} />
                            Selesai Diproses
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DashboardPage.displayName = "DashboardPage";

export default DashboardPage;
