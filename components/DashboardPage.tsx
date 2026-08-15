import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Sparkles, X, CheckCircle, Activity, Banknote, Archive, ArrowUpRight, Check, ChevronRight, Building, Award, Clock } from 'lucide-react';
import { Employee } from '../types';
import { Language, TRANSLATIONS } from '../utils/translationHelper';
import ServiceOverviewCharts from './ServiceOverviewCharts';
import ComparisonChart from './ComparisonChart';
import PensionProjectionDashboardChart from './PensionProjectionDashboardChart';
import { DeferredView } from './DeferredView';

interface Regulation {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  points: string[];
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
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
    type: 'kgb' | 'pensiun';
    title: string;
    message: string;
    employee: Employee;
    daysOrMonthsLeft: number;
    severity: 'critical' | 'warning';
  }>;
}

const REGULATIONS: Regulation[] = [
  {
    id: 'uu20',
    code: 'UU No. 20 Tahun 2023',
    title: 'Aparatur Sipil Negara',
    subtitle: 'Pokok Reformasi Manajemen & Pola Karier PNS',
    summary: 'Undang-Undang ini menyederhanakan jenjang jabatan, mempercepat mobilitas talenta, serta memantapkan integrasi sistem informasi kepegawaian secara nasional.',
    points: [
      'Penyederhanaan klasifikasi jabatan menjadi Jabatan Manajerial dan Nonmanajerial.',
      'Kemudahan mobilitas talenta secara nasional guna mengatasi kesenjangan kapasitas.',
      'Sanksi tegas bagi pelanggaran netralitas ASN dalam kontestasi politik.',
      'Sistem jaminan pensiun dan hari tua berbasis iuran pasti (defined contribution).'
    ]
  },
  {
    id: 'pp15',
    code: 'PP No. 15 Tahun 2024',
    title: 'Penyesuaian Gaji Pokok PNS',
    subtitle: 'Tabel Gaji Pokok & Hak Kesejahteraan Terbaru',
    summary: 'Peraturan Pemerintah ini menetapkan kenaikan gaji pokok PNS sebesar 8% guna meningkatkan kesejahteraan dan produktivitas kinerja pelayanan publik.',
    points: [
      'Kenaikan nominal gaji pokok rata-rata sebesar 8% untuk seluruh Golongan I hingga IV.',
      'Penyesuaian nilai tunjangan melekat (suami/istri, anak, pangan) mengikuti gaji pokok baru.',
      'Rapelan kekurangan pembayaran gaji terhitung sejak tanggal 1 Januari 2024.',
      'Penyelarasan standar iuran jaminan kesehatan dan jaminan pensiun berkala.'
    ]
  },
  {
    id: 'se16',
    code: 'SE Kepala BKN No. 16 Tahun 2023',
    title: 'Administrasi Terintegrasi BKN',
    subtitle: 'Implementasi Penuh SIASN untuk KGB & KP',
    summary: 'Surat Edaran ini mewajibkan seluruh instansi pusat dan daerah melakukan sinkronisasi data KGB dan Kenaikan Pangkat secara real-time via web service SIASN.',
    points: [
      'Penetapan Kenaikan Pangkat (KP) dilakukan secara digital tanpa berkas fisik (paperless).',
      'Data KGB diintegrasikan otomatis guna pembaharuan basis data penggajian Kementerian.',
      'Kewajiban verifikasi berlapis oleh Admin Kepegawaian Unit Kerja sebelum disubmit.',
      'Sinkronisasi berkas pendukung (SKP, SK Pangkat terakhir) maksimal 14 hari sebelum TMT.'
    ]
  }
];

const DashboardPage: React.FC<Props> = React.memo(({
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
  systemAlerts = []
}) => {
  const t = useCallback((key: string) => {
    return TRANSLATIONS[language]?.[key] || key;
  }, [language]);

  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  
  // Regulation modal state
  const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);

  const messages = useMemo(() => [
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
    "🎉 Apresiasi Pengabdian: Setiap langkah karir Anda sangat bernilai. Teruslah berkarya untuk kemakmuran bangsa!"
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % messages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [messages]);



  const handleMonthClick = useCallback((month: string, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  }, [setSelectedMonth, setSelectedYear]);

  const latestProcessed = useMemo(() => {
    return employees
      .filter(e => e.status === 'Processed' && e.salaryHistory && e.salaryHistory.length > 0)
      .sort((a, b) => {
        const dateB = b.salaryHistory && b.salaryHistory.length > 0 ? new Date(b.salaryHistory[b.salaryHistory.length - 1].date).getTime() : 0;
        const dateA = a.salaryHistory && a.salaryHistory.length > 0 ? new Date(a.salaryHistory[a.salaryHistory.length - 1].date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [employees]);

  const handleQuickNavigate = (view: string) => {
    if (!setCurrentView) return;
    
    // Expand corresponding sidebar menu
    if (view === 'data-kgb' && setIsLayananKgbExpanded) {
      setIsLayananKgbExpanded(true);
      setIsKenaikanPangkatExpanded?.(false);
      setIsPensiunExpanded?.(false);
    } else if (view === 'kenaikan-pangkat' && setIsKenaikanPangkatExpanded) {
      setIsKenaikanPangkatExpanded(true);
      setIsLayananKgbExpanded?.(false);
      setIsPensiunExpanded?.(false);
    } else if (view === 'pensiun' && setIsPensiunExpanded) {
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

  return (
    <>
      {/* Hero Section */}
      <div className="w-full">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-10 flex flex-col justify-between min-h-0 sm:min-h-[300px] group border border-slate-200/60 dark:border-slate-800/60 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.04)] dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.2)]">
          {/* Subtle Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.1),transparent_50%)] pointer-events-none rounded-bl-full transition-transform duration-1000 group-hover:scale-105"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.04),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none rounded-tr-full"></div>

          <div className="relative z-10 flex flex-col justify-between h-full w-full gap-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-2">
              <div className="flex-1 flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold leading-[1.15] mb-3 sm:mb-5 text-slate-900 dark:text-slate-50">
                  {greeting},<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-blue-600 dark:from-primary-400 dark:to-blue-400 italic">
                    {currentUser ? currentUser.nama.split(',')[0] : 'Pegawai BSKJI'}
                  </span>
                </h1>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl font-medium leading-relaxed mb-6 sm:mb-8">
                  {t('hero_subtitle')}
                </p>

                <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
                    <button onClick={() => handleQuickNavigate('data-kgb')} className="px-2 sm:px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-center sm:text-left group cursor-pointer whitespace-nowrap overflow-hidden">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary-100/80 dark:bg-primary-500/20 border border-primary-200 dark:border-primary-800/60 flex items-center justify-center shrink-0 text-primary-700 dark:text-primary-300 group-hover:scale-110 transition-transform">
                          <Banknote size={14} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="truncate text-slate-800 dark:text-slate-100 font-semibold">Data KGB</span>
                    </button>
                    <button onClick={() => handleQuickNavigate('kenaikan-pangkat')} className="px-2 sm:px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-center sm:text-left group cursor-pointer whitespace-nowrap overflow-hidden">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-100/80 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-300 group-hover:scale-110 transition-transform">
                          <Award size={14} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="truncate text-slate-800 dark:text-slate-100 font-semibold">Kenaikan Pangkat</span>
                    </button>
                    <button onClick={() => handleQuickNavigate('pensiun')} className="px-2 sm:px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-center sm:text-left group cursor-pointer whitespace-nowrap overflow-hidden">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-100/80 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0 text-rose-700 dark:text-rose-300 group-hover:scale-110 transition-transform">
                          <Archive size={14} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="truncate text-slate-800 dark:text-slate-100 font-semibold">Pensiun</span>
                    </button>
                    <button onClick={() => handleQuickNavigate('jam-kerja')} className="px-2 sm:px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold rounded-2xl shadow-sm transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 text-center sm:text-left group cursor-pointer whitespace-nowrap overflow-hidden">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100/80 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300 group-hover:scale-110 transition-transform">
                          <Clock size={14} className="sm:w-3.5 sm:h-3.5" />
                        </div>
                        <span className="truncate text-slate-800 dark:text-slate-100 font-semibold">Jam Kerja</span>
                    </button>
                </div>
              </div>

              {/* Minimalist Announcement Banner */}
              <div 
                className="w-full lg:max-w-[420px] relative overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-[0_4px_24px_-6px_rgba(16,185,129,0.1)] transition-all duration-300 self-stretch flex flex-col justify-center"
                title="Monitoring Terintegrasi BSKJI"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none"></div>
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 text-primary-600 dark:text-primary-400 mt-0.5 shadow-sm">
                    <Building size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Info & Inspirasi</p>
                    <div className="min-h-[48px] relative overflow-hidden flex items-start">
                      <>
                        <p
                          key={activeMessageIndex}
                          className="text-[13px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed"
                        >
                          {messages[activeMessageIndex]}
                        </p>
                      </>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regulation Detail Modal */}
      <>
        {selectedReg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              onClick={() => setSelectedReg(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60"
            />

            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden relative z-10"
            >
              <div className="p-6 md:p-8 relative">
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedReg(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all active:scale-95 cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="mb-6">
                  <span className="inline-block bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest font-mono mb-2">
                    {selectedReg.code}
                  </span>
                  <h3 className="text-slate-900 dark:text-slate-100 font-display font-black text-xl leading-snug tracking-tight">
                    {selectedReg.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold mt-1">{selectedReg.subtitle}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="text-[10px] text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 font-mono">Ringkasan Regulasi</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {selectedReg.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-widest mb-3 font-mono flex items-center gap-1.5">
                      <CheckCircle className="text-primary-500 dark:text-primary-400" size={13} /> Poin Pokok Perubahan
                    </h4>
                    <ul className="space-y-2.5">
                      {selectedReg.points.map((pt, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-mono text-[9px] font-bold border border-primary-100 dark:border-primary-800">
                            {i + 1}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedReg(null)}
                    className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    Tutup Regulasi
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedReg(null);
                      handleQuickNavigate('faq');
                    }}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl shadow-md shadow-primary-600/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Pelajari Lebih Lanjut</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-12">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 border border-primary-100/50 dark:border-primary-500/20 flex items-center justify-center shrink-0 shadow-sm text-primary-600 dark:text-primary-500">
                <Activity size={20} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 tracking-tight">{t('chart_overview_title')}</h2>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">Ringkasan analitik real-time</p>
            </div>
        </div>
      </div>

      <DeferredView minHeight="300px">
        <div className="space-y-6">
          <ServiceOverviewCharts employees={employees} promotionEmployees={promotionEmployees || []} stats={stats} language={language} />
          <ComparisonChart employees={employees} language={language} />
          <PensionProjectionDashboardChart employees={employees} language={language} />
        </div>
      </DeferredView>
    </>
  );
});

export default DashboardPage;
