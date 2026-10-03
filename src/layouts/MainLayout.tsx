import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Calendar,
  X,
  LogOut,
  Clock,
  Menu,
  BookOpen,
  BarChart2,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Award,
  Banknote,
  Archive,
  Bell,
  BellRing,
  CheckCircle,
  Sun,
  Moon,
  Users,
  HelpCircle,
  StickyNote,
  Building2,
  ShieldCheck,
  FileText,
  UserCheck
} from 'lucide-react';
import { ScrollToTop } from '../../components/ScrollToTop';
import { Employee } from '../../types';
import { TRANSLATIONS } from '../../utils/translationHelper';

export interface SystemAlertItem {
  id: string;
  type: 'kgb' | 'pensiun';
  title: string;
  message: string;
  employee: Employee;
  daysOrMonthsLeft: number;
  severity: 'critical' | 'warning';
}

export interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: any) => void;
  currentUser?: Employee | null;
  onLogout: () => void;
  systemAlerts?: SystemAlertItem[];
  notification?: string | null;
  onClearNotification?: () => void;
  onDismissAlerts?: () => void;
  masterEmployeesCount?: number;
  upcomingKGBCount?: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

interface MenuItemProps {
  view: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  label: string;
  currentView: string;
  setCurrentView: (view: any) => void;
  setMobileMenuOpen: (open: boolean) => void;
  isNested?: boolean;
  badge?: string | number | null;
}

// Format 18 digit NIP into official standard format (YYYYMMDD YYYYMM X XXX)
export const formatNIP = (nip?: string | null): string => {
  if (!nip) return '-';
  const clean = nip.replace(/\D/g, '');
  if (clean.length === 18) {
    return `${clean.slice(0, 8)} ${clean.slice(8, 14)} ${clean.slice(14, 15)} ${clean.slice(15)}`;
  }
  return nip;
};

const MenuItem = React.memo(({
  view,
  icon: Icon,
  label,
  currentView,
  setCurrentView,
  setMobileMenuOpen,
  isNested = false,
  badge = null
}: MenuItemProps) => {
  const isActive = currentView === view;
  return (
    <button
      type="button"
      onClick={() => {
        setCurrentView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer text-left ${
        isActive
          ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5 shadow-xs'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'
      }`}
    >
      <Icon size={isNested ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
      <span className="text-sm flex-1 truncate">{label}</span>
      {badge !== null && badge !== undefined && (
        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
          {badge}
        </span>
      )}
    </button>
  );
});
MenuItem.displayName = 'MenuItem';

const HeaderClock = React.memo(() => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return;
    }
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
      <Clock size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
      <span>
        {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className="font-semibold text-slate-900 dark:text-white font-mono tracking-wider">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
      </span>
    </div>
  );
});
HeaderClock.displayName = 'HeaderClock';

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentView,
  setCurrentView,
  currentUser,
  onLogout,
  systemAlerts = [],
  notification,
  onClearNotification,
  onDismissAlerts,
  masterEmployeesCount = 0,
  upcomingKGBCount = 0,
  theme: controlledTheme,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Submenu expansion states
  const [isLayananKgbExpanded, setIsLayananKgbExpanded] = useState(false);
  const [isKenaikanPangkatExpanded, setIsKenaikanPangkatExpanded] = useState(false);
  const [isPensiunExpanded, setIsPensiunExpanded] = useState(false);
  const [isJamKerjaExpanded, setIsJamKerjaExpanded] = useState(false);

  // Internal theme handling if not controlled externally
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kgb_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const activeTheme = controlledTheme || localTheme;

  const handleToggleTheme = useCallback(() => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      setLocalTheme(prev => {
        const next = prev === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
          localStorage.setItem('kgb_theme', next);
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return next;
      });
    }
  }, [onToggleTheme]);

  // Keep dark class synced
  useEffect(() => {
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [activeTheme]);

  // Sync accordion expansion with active view
  useEffect(() => {
    if (['kenaikan-pangkat', 'kalender-kp', 'report-kp'].includes(currentView)) {
      setIsKenaikanPangkatExpanded(true);
      setIsLayananKgbExpanded(false);
      setIsPensiunExpanded(false);
      setIsJamKerjaExpanded(false);
    } else if (['data-kgb', 'report'].includes(currentView)) {
      setIsLayananKgbExpanded(true);
      setIsKenaikanPangkatExpanded(false);
      setIsPensiunExpanded(false);
      setIsJamKerjaExpanded(false);
    } else if (currentView === 'pensiun') {
      setIsPensiunExpanded(true);
      setIsKenaikanPangkatExpanded(false);
      setIsLayananKgbExpanded(false);
      setIsJamKerjaExpanded(false);
    } else if (currentView === 'jam-kerja') {
      setIsJamKerjaExpanded(true);
      setIsKenaikanPangkatExpanded(false);
      setIsLayananKgbExpanded(false);
      setIsPensiunExpanded(false);
    } else {
      setIsKenaikanPangkatExpanded(false);
      setIsLayananKgbExpanded(false);
      setIsPensiunExpanded(false);
      setIsJamKerjaExpanded(false);
    }
  }, [currentView]);

  const viewMetadata = useMemo(() => {
    switch (currentView) {
      case 'dashboard': 
        return { title: 'Beranda Eksekutif', category: 'SIMPEG BSKJI' };
      case 'susunan-pegawai': 
        return { title: 'Daftar Susunan Pegawai (DSP)', category: 'Bezetting & Formasi' };
      case 'data-kgb': 
        return { title: 'Kenaikan Gaji Berkala (KGB)', category: 'Layanan Berkala' };
      case 'kenaikan-pangkat': 
        return { title: 'Kenaikan Pangkat ASN (KP)', category: 'Layanan Karir' };
      case 'kalender-kp': 
        return { title: 'Kalender Pelayanan KP', category: 'Jadwal & Agenda' };
      case 'report': 
        return { title: 'Laporan Rekapitulasi KGB', category: 'Laporan & Statistik' };
      case 'report-kp': 
        return { title: 'Laporan Rekapitulasi KP', category: 'Laporan & Statistik' };
      case 'pensiun': 
        return { title: 'Layanan Purnabakti (Pensiun BUP)', category: 'Layanan Pensiun' };
      case 'jam-kerja': 
        return { title: 'Ketentuan Jam Kerja & Presensi ASN', category: 'Disiplin Pegawai' };
      case 'sticky-notes': 
        return { title: 'Papan Agenda & Tugas Kerja Pegawai', category: 'Koordinasi Tim' };
      case 'faq': 
        return { title: 'Pusat Informasi & Regulasi Kepegawaian', category: 'Regulasi ASN' };
      default: 
        return { title: 'Portal Kepegawaian BSKJI', category: 'Kementerian Perindustrian RI' };
    }
  }, [currentView]);

  const t = useMemo(() => {
    return (key: string) => TRANSLATIONS['id']?.[key] || key;
  }, []);

  const isKPAreaActive = ['kenaikan-pangkat', 'kalender-kp', 'report-kp'].includes(currentView);
  const isKGBAreaActive = ['data-kgb', 'report'].includes(currentView);
  const isPensiunAreaActive = ['pensiun'].includes(currentView);
  const isJamKerjaAreaActive = ['jam-kerja'].includes(currentView);

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-blue-600 selection:text-white overflow-hidden transition-colors duration-200">
      
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Official Government Sidebar (Persistent on Desktop, Sliding Drawer on Mobile) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1528] text-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col border-r border-slate-800/80 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } print:hidden pwa-safe-sidebar`}
        aria-label="Navigasi Kedinasan BSKJI"
      >
        {/* Government Institutional Kop / Brand Area */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              className="flex items-center gap-3 cursor-pointer text-left group focus:outline-none"
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
              }}
              title="Ke Beranda Utama"
            >
              {/* Official BSKJI/Garuda style emblem badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-b from-blue-600 to-blue-800 border border-blue-400/40 flex items-center justify-center shadow-sm">
                <Building2 size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-wider uppercase text-blue-400 leading-tight">
                  KEMENTERIAN PERINDUSTRIAN
                </p>
                <h1 className="font-extrabold text-base text-white tracking-tight leading-tight mt-0.5 group-hover:text-blue-300 transition-colors">
                  BSKJI SIMPEG
                </h1>
                <p className="text-[11px] text-slate-400 font-medium leading-tight">
                  Layanan Kepegawaian Terpadu
                </p>
              </div>
            </button>

            <button 
              type="button"
              onClick={() => setMobileMenuOpen(false)} 
              aria-label="Tutup Menu Navigasi" 
              className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <nav aria-label="Menu Utama SIMPEG" className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Main Dashboard Link */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
              currentView === 'dashboard' 
                ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5 shadow-xs' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} className={currentView === 'dashboard' ? 'text-blue-400' : 'text-slate-400'} />
            <span className="text-sm flex-1 text-left">{t('sidebar_dashboard')}</span>
          </button>

          {/* Master Kepegawaian & DSP */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              DATA KEPEGAWAIAN
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentView('susunan-pegawai');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
              currentView === 'susunan-pegawai' 
                ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5 shadow-xs' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'
            }`}
          >
            <Users size={18} strokeWidth={currentView === 'susunan-pegawai' ? 2.5 : 2} className={currentView === 'susunan-pegawai' ? 'text-blue-400' : 'text-slate-400'} />
            <span className="text-sm flex-1 text-left">Daftar Susunan Pegawai</span>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {masterEmployeesCount > 0 ? masterEmployeesCount.toLocaleString('id-ID') : '2.593'}
            </span>
          </button>

          {/* Layanan Administrasi ASN */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              LAYANAN PERIODIK & KARIR
            </p>
          </div>
            
          {/* Layanan KGB */}
          <div className="space-y-0.5">
            <button
              type="button"
              aria-expanded={isLayananKgbExpanded}
              onClick={() => {
                const newState = !isLayananKgbExpanded;
                setIsLayananKgbExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsPensiunExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('data-kgb');
                  setMobileMenuOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${(isLayananKgbExpanded || isKGBAreaActive) ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'}`}
            >
              <div className="flex items-center gap-3">
                <Banknote size={18} strokeWidth={(isLayananKgbExpanded || isKGBAreaActive) ? 2.5 : 2} className={(isLayananKgbExpanded || isKGBAreaActive) ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-sm flex-1 text-left">Gaji Berkala (KGB)</span>
                {upcomingKGBCount > 0 && (
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 mr-1">
                    {upcomingKGBCount}
                  </span>
                )}
              </div>
              <ChevronRight size={15} className={`transition-transform duration-200 text-slate-400 ${isLayananKgbExpanded ? 'rotate-90 text-blue-400' : ''}`} />
            </button>
                
            {isLayananKgbExpanded && (
              <div className="pl-6 space-y-0.5 mt-0.5 border-l border-slate-800 ml-4">
                <MenuItem view="data-kgb" icon={ClipboardList} label="Data Layanan KGB" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                <MenuItem view="report" icon={BarChart2} label="Laporan Rekap KGB" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Kenaikan Pangkat */}
          <div className="space-y-0.5">
            <button
              type="button"
              aria-expanded={isKenaikanPangkatExpanded}
              onClick={() => {
                const newState = !isKenaikanPangkatExpanded;
                setIsKenaikanPangkatExpanded(newState);
                if (newState) {
                  setIsLayananKgbExpanded(false);
                  setIsPensiunExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('kenaikan-pangkat');
                  setMobileMenuOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'}`}
            >
              <div className="flex items-center gap-3">
                <Award size={18} strokeWidth={(isKenaikanPangkatExpanded || isKPAreaActive) ? 2.5 : 2} className={(isKenaikanPangkatExpanded || isKPAreaActive) ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-sm">Kenaikan Pangkat (KP)</span>
              </div>
              <ChevronRight size={15} className={`transition-transform duration-200 text-slate-400 ${isKenaikanPangkatExpanded ? 'rotate-90 text-blue-400' : ''}`} />
            </button>
                
            {isKenaikanPangkatExpanded && (
              <div className="pl-6 space-y-0.5 mt-0.5 border-l border-slate-800 ml-4">
                <MenuItem view="kenaikan-pangkat" icon={ClipboardList} label="Data Usulan KP" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                <MenuItem view="kalender-kp" icon={Calendar} label="Kalender Periode KP" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                <MenuItem view="report-kp" icon={BarChart2} label="Laporan Rekap KP" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Purnabakti / Pensiun */}
          <div className="space-y-0.5">
            <button
              type="button"
              aria-expanded={isPensiunExpanded}
              onClick={() => {
                const newState = !isPensiunExpanded;
                setIsPensiunExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsLayananKgbExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('pensiun');
                  setMobileMenuOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${(isPensiunExpanded || isPensiunAreaActive) ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'}`}
            >
              <div className="flex items-center gap-3">
                <Archive size={18} strokeWidth={(isPensiunExpanded || isPensiunAreaActive) ? 2.5 : 2} className={(isPensiunExpanded || isPensiunAreaActive) ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-sm flex-1 text-left">Purnabakti (Pensiun BUP)</span>
                {systemAlerts.filter(a => a.type === 'pensiun').length > 0 && (
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 mr-1">
                    {systemAlerts.filter(a => a.type === 'pensiun').length}
                  </span>
                )}
              </div>
              <ChevronRight size={15} className={`transition-transform duration-200 text-slate-400 ${isPensiunExpanded ? 'rotate-90 text-blue-400' : ''}`} />
            </button>
                
            {isPensiunExpanded && (
              <div className="pl-6 space-y-0.5 mt-0.5 border-l border-slate-800 ml-4">
                <MenuItem view="pensiun" icon={ClipboardList} label="Data Proyeksi Pensiun" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Jam Kerja ASN */}
          <div className="space-y-0.5">
            <button
              type="button"
              aria-expanded={isJamKerjaExpanded}
              onClick={() => {
                const newState = !isJamKerjaExpanded;
                setIsJamKerjaExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsLayananKgbExpanded(false);
                  setIsPensiunExpanded(false);
                  setCurrentView('jam-kerja');
                  setMobileMenuOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'}`}
            >
              <div className="flex items-center gap-3">
                <Clock size={18} strokeWidth={(isJamKerjaExpanded || isJamKerjaAreaActive) ? 2.5 : 2} className={(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'text-blue-400' : 'text-slate-400'} />
                <span className="text-sm">Jam Kerja & Presensi</span>
              </div>
              <ChevronRight size={15} className={`transition-transform duration-200 text-slate-400 ${isJamKerjaExpanded ? 'rotate-90 text-blue-400' : ''}`} />
            </button>
                
            {isJamKerjaExpanded && (
              <div className="pl-6 space-y-0.5 mt-0.5 border-l border-slate-800 ml-4">
                <MenuItem view="jam-kerja" icon={ClipboardList} label="Ketentuan Jam Kerja" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Produktivitas & Regulasi */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              KOORDINASI & REGULASI
            </p>
          </div>

          {/* Agenda & Sticky Notes */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('sticky-notes');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
              currentView === 'sticky-notes' 
                ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5 shadow-xs' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'
            }`}
          >
            <StickyNote size={18} strokeWidth={currentView === 'sticky-notes' ? 2.5 : 2} className={currentView === 'sticky-notes' ? 'text-blue-400' : 'text-slate-400'} />
            <span className="text-sm flex-1 text-left">Papan Agenda & Tugas</span>
            <span className="text-[10px] font-semibold text-slate-400">
              Tim
            </span>
          </button>

          {/* Pusat Regulasi & FAQ */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('faq');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all cursor-pointer text-left ${
              currentView === 'faq' 
                ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-3 border-blue-500 pl-2.5 shadow-xs' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-3 border-transparent pl-2.5'
            }`}
          >
            <BookOpen size={18} strokeWidth={currentView === 'faq' ? 2.5 : 2} className={currentView === 'faq' ? 'text-blue-400' : 'text-slate-400'} />
            <span className="text-sm flex-1 text-left">Pusat Regulasi & FAQ</span>
          </button>
        </nav>

        {/* Sidebar Footer User Card with Official ASN Identity */}
        <div className="p-3.5 border-t border-slate-800/90 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-blue-400/30">
              {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {currentUser ? currentUser.nama.split(',')[0] : 'Pegawai ASN'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate leading-tight mt-0.5">
                NIP: {currentUser?.nip ? formatNIP(currentUser.nip) : 'Kemenperin BSKJI'}
              </p>
            </div>
            <button 
              type="button"
              onClick={onLogout} 
              title="Keluar dari Sistem SIMPEG" 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 print:h-auto print:overflow-visible print:block">
        
        {/* Floating System Notification */}
        {notification && (
          <div className="absolute top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 w-max max-w-sm animate-in fade-in slide-in-from-top-2 duration-200 border border-slate-700">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <p className="text-sm font-medium">{notification}</p>
            {onClearNotification && (
              <button 
                type="button"
                onClick={onClearNotification} 
                className="ml-2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        
        {/* Institutional Top Header - Sticky, Prestigious & Dignified */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 w-full shrink-0 print:hidden shadow-2xs transition-colors">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-1 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 active:scale-95 cursor-pointer"
              title="Buka Navigasi"
              aria-label="Buka Navigasi"
            >
              <Menu size={22} />
            </button>
            
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-xs">
                <Building2 size={16} className="text-white" />
              </div>
            </div>

            {/* Hierarchical Breadcrumb & View Title */}
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  BSKJI KEMENPERIN
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>
                <span className="truncate">{viewMetadata.category}</span>
              </div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-xl truncate leading-snug">
                {viewMetadata.title}
              </h2>
            </div>
          </div>

          {/* Right Header Controls: Clock, Theme, EWS Alert Center, ASN Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Realtime Official Clock */}
            <HeaderClock />
            
            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
              title={activeTheme === 'dark' ? "Mode Terang (Light)" : "Mode Gelap (Dark)"}
              aria-label="Ganti Tema Tampilan"
            >
              {activeTheme === 'dark' ? (
                <Sun size={17} className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={17} className="text-slate-600 dark:text-slate-300 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Early Warning System (EWS) Alert Center */}
            <div className="relative z-50">
              <button 
                type="button"
                id="notification-bell" 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
                title="Peringatan Dini Kepegawaian (EWS)"
                aria-label="Notifikasi EWS"
              >
                {systemAlerts.length > 0 ? (
                  <>
                    <BellRing size={17} className="text-blue-600 dark:text-blue-400" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900"></span>
                  </>
                ) : (
                  <Bell size={17} />
                )}
              </button>

              {/* Notification Overlay Panel */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-auto mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-88 md:w-96 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                          Peringatan Dini (EWS)
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Jatuh tempo KGB & Batas Usia Pensiun
                        </p>
                      </div>
                      {systemAlerts.length > 0 && (
                        <div className="flex gap-2 items-center">
                          {onDismissAlerts && (
                            <button 
                              type="button"
                              onClick={onDismissAlerts} 
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {systemAlerts.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar space-y-1.5">
                      {systemAlerts.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <CheckCircle size={24} className="mx-auto text-emerald-600 mb-2" />
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Semua Terpantau Sesuai Jadwal</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Tidak ada peringatan jatuh tempo saat ini.</p>
                        </div>
                      ) : (
                        systemAlerts.map(alert => (
                          <div
                            key={alert.id}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              setCurrentView(alert.type === 'kgb' ? 'data-kgb' : 'pensiun');
                            }}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer flex gap-3 ${
                              alert.severity === 'critical'
                                ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/40 dark:hover:bg-rose-950/30'
                                : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 dark:hover:bg-amber-950/30'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {alert.type === 'kgb' ? <Banknote size={16} /> : <Archive size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'}`}>
                                  {alert.title}
                                </p>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {alert.employee?.nip ? formatNIP(alert.employee.nip).slice(0, 13) + '...' : ''}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                {alert.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Official ASN User Profile Pill & Dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="min-h-[40px] flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-left active:scale-95 shadow-2xs"
                title="Akun ASN"
                aria-label="Profil Pengguna ASN"
              >
                <div className="w-7 h-7 rounded bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden lg:block min-w-0 max-w-[140px]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                    {currentUser?.nama?.split(',')[0] || 'Pegawai ASN'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate leading-tight mt-0.5">
                    {currentUser?.nip ? formatNIP(currentUser.nip).slice(0, 11) + '...' : 'BSKJI ASN'}
                  </p>
                </div>
                <ChevronDown size={14} className={`hidden lg:block text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-auto mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-50 overflow-hidden py-1">
                    
                    {/* User Card Header */}
                    <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {currentUser?.nama || 'Pegawai BSKJI'}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                            NIP: {currentUser?.nip ? formatNIP(currentUser.nip) : '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600 dark:text-slate-400">
                            <span className="font-semibold text-blue-700 dark:text-blue-400">
                              {currentUser?.statusKepegawaian || 'PNS'}
                            </span>
                            <span>•</span>
                            <span className="truncate">
                              {currentUser?.unitKerja || 'BSKJI Kemenperin'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Shortcuts */}
                    <div className="p-1 space-y-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('dashboard');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left font-medium"
                      >
                        <LayoutDashboard size={15} className="text-blue-600 shrink-0" />
                        <span>Beranda Eksekutif</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('susunan-pegawai');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left font-medium"
                      >
                        <Users size={15} className="text-blue-600 shrink-0" />
                        <span>Daftar Susunan Pegawai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('data-kgb');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left font-medium"
                      >
                        <Banknote size={15} className="text-emerald-600 shrink-0" />
                        <span>Layanan Gaji Berkala (KGB)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('faq');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-left font-medium"
                      >
                        <HelpCircle size={15} className="text-amber-600 shrink-0" />
                        <span>Pusat Regulasi & FAQ</span>
                      </button>
                    </div>

                    {/* Official Logout Option */}
                    <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer text-left font-semibold text-xs"
                      >
                        <LogOut size={15} className="shrink-0" />
                        <span>Keluar dari SIMPEG</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* View Content Slot (Persistent Main View Area with high-legibility container) */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain p-3 sm:p-5 md:p-6 pb-24 md:pb-6 scroll-smooth custom-scrollbar print:overflow-visible print:h-auto print:p-0">
          <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-4 print:space-y-0 print:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar (Persistent touch-optimized nav for Field Officers) */}
        <nav
          aria-label="Navigasi Bawah Seluler"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1 flex items-center justify-around print:hidden"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
              currentView === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={20} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 leading-tight">Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentView('data-kgb');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
              currentView === 'data-kgb' || currentView === 'report'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Banknote size={20} strokeWidth={currentView === 'data-kgb' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 leading-tight">KGB</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentView('kenaikan-pangkat');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
              isKPAreaActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Award size={20} strokeWidth={isKPAreaActive ? 2.5 : 2} />
            <span className="text-[10px] mt-1 leading-tight">Pangkat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentView('pensiun');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
              currentView === 'pensiun'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Archive size={20} strokeWidth={currentView === 'pensiun' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 leading-tight">Pensiun</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer active:scale-95"
            aria-label="Buka Menu Navigasi Lengkap"
          >
            <Menu size={20} />
            <span className="text-[10px] mt-1 leading-tight">Menu</span>
          </button>
        </nav>
      </main>
      
      <ScrollToTop />
    </div>
  );
};

export default MainLayout;
