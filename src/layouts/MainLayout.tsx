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
  Landmark,
  Bell,
  BellRing,
  CheckCircle,
  Sun,
  Moon,
  Users,
  HelpCircle,
  StickyNote
} from 'lucide-react';
import { ScrollToTop } from '../../components/ScrollToTop';
import { StatusCheck } from '../components/StatusCheck';
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
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
        isActive
          ? 'bg-primary-500/10 text-primary-400 font-medium'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
      }`}
    >
      <Icon size={isNested ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-sm flex-1 truncate">{label}</span>
      {badge !== null && badge !== undefined && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-500/20 text-primary-400">
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
    <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
      <Clock size={16} className="text-primary-500 shrink-0" />
      <span>
        {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span className="font-semibold text-gray-900 dark:text-white font-mono">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

  const viewTitle = useMemo(() => {
    switch (currentView) {
      case 'dashboard': return 'Beranda';
      case 'susunan-pegawai': return 'Daftar Susunan Pegawai (DSP)';
      case 'data-kgb': return 'Data Layanan KGB';
      case 'kenaikan-pangkat': return 'Data Layanan Kenaikan Pangkat';
      case 'kalender-kp': return 'Kalender Kenaikan Pangkat';
      case 'report': return 'Laporan Layanan KGB';
      case 'report-kp': return 'Laporan Kenaikan Pangkat';
      case 'pensiun': return 'Layanan Pensiun (BUP)';
      case 'jam-kerja': return 'Layanan Jam Kerja ASN';
      case 'sticky-notes': return 'Sticky Notes & Kanban Tugas';
      case 'faq': return 'Pusat Informasi & FAQ';
      default: return 'Portal Kepegawaian BSKJI';
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
    <div className="flex h-screen h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 selection:bg-primary-500 selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar (Persistent on Desktop, Sliding Drawer on Mobile) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static flex flex-col border-r border-gray-800 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } print:hidden pwa-safe-sidebar`}
        aria-label="Navigasi Samping"
      >
        {/* Brand Area */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer p-1.5 -ml-1.5 rounded-xl hover:bg-gray-800/80 transition-all text-left group active:scale-95 focus:outline-none"
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            title="Ke Beranda Utama"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-600 group-hover:bg-primary-500 flex items-center justify-center shadow-sm transition-colors">
              <Landmark size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-white group-hover:text-primary-300 leading-tight transition-colors">BSKJI</h1>
              <p className="text-[11px] font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Portal Kepegawaian</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setMobileMenuOpen(false)} 
            aria-label="Tutup Menu Navigasi" 
            className="md:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav aria-label="Navigasi Utama" className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
              currentView === 'dashboard' 
                ? 'bg-primary-500/10 text-primary-400 font-semibold' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-sm flex-1 text-left">{t('sidebar_dashboard')}</span>
          </button>

          {/* Menu Daftar Susunan Pegawai */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('susunan-pegawai');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
              currentView === 'susunan-pegawai' 
                ? 'bg-primary-500/10 text-primary-400 font-semibold' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
          >
            <Users size={18} strokeWidth={currentView === 'susunan-pegawai' ? 2.5 : 2} />
            <span className="text-sm flex-1 text-left">Daftar Susunan Pegawai</span>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary-500/20 text-primary-400">
              {masterEmployeesCount > 0 ? masterEmployeesCount.toLocaleString('id-ID') : '2.593'}
            </span>
          </button>

          {/* Menu Sticky Notes & Kanban */}
          <button
            type="button"
            onClick={() => {
              setCurrentView('sticky-notes');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${
              currentView === 'sticky-notes' 
                ? 'bg-amber-500/10 text-amber-400 font-semibold' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
          >
            <StickyNote size={18} strokeWidth={currentView === 'sticky-notes' ? 2.5 : 2} className={currentView === 'sticky-notes' ? 'text-amber-400' : 'text-gray-400'} />
            <span className="text-sm flex-1 text-left">{t('sidebar_sticky_notes') || 'Sticky Notes & Tugas'}</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300">
              Notion
            </span>
          </button>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('sidebar_monitoring_services')}</p>
          </div>
            
          {/* Layanan Kenaikan Pangkat */}
          <div className="space-y-1">
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'bg-primary-500/10 text-primary-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Award size={18} strokeWidth={(isKenaikanPangkatExpanded || isKPAreaActive) ? 2.5 : 2} />
                <span className="text-sm">{t('sidebar_promotion')}</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-200 ${isKenaikanPangkatExpanded ? 'rotate-90' : ''}`} />
            </button>
                
            {isKenaikanPangkatExpanded && (
              <div className="pl-9 space-y-1 mt-1">
                <MenuItem view="kenaikan-pangkat" icon={ClipboardList} label={t('sidebar_promotion_service')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                <MenuItem view="kalender-kp" icon={Calendar} label={t('sidebar_promotion_calendar')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                <MenuItem view="report-kp" icon={BarChart2} label={t('sidebar_promotion_report')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>
            
          {/* Layanan KGB */}
          <div className="space-y-1">
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${(isLayananKgbExpanded || isKGBAreaActive) ? 'bg-primary-500/10 text-primary-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Banknote size={18} strokeWidth={(isLayananKgbExpanded || isKGBAreaActive) ? 2.5 : 2} />
                <span className="text-sm flex-1 text-left">{t('sidebar_kgb')}</span>
                {upcomingKGBCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 mr-2">
                    {upcomingKGBCount}
                  </span>
                )}
              </div>
              <ChevronRight size={16} className={`transition-transform duration-200 ${isLayananKgbExpanded ? 'rotate-90' : ''}`} />
            </button>
                
            {isLayananKgbExpanded && (
              <div className="pl-9 space-y-1 mt-1">
                <MenuItem view="data-kgb" icon={ClipboardList} label={t('sidebar_kgb_service')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested badge={upcomingKGBCount > 0 ? upcomingKGBCount : null} />
                <MenuItem view="report" icon={BarChart2} label={t('sidebar_kgb_report')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Pensiun */}
          <div className="space-y-1">
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${(isPensiunExpanded || isPensiunAreaActive) ? 'bg-primary-500/10 text-primary-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Archive size={18} strokeWidth={(isPensiunExpanded || isPensiunAreaActive) ? 2.5 : 2} />
                <span className="text-sm flex-1 text-left">{t('sidebar_retirement')}</span>
                {systemAlerts.filter(a => a.type === 'pensiun').length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 mr-2">
                    {systemAlerts.filter(a => a.type === 'pensiun').length}
                  </span>
                )}
              </div>
              <ChevronRight size={16} className={`transition-transform duration-200 ${isPensiunExpanded ? 'rotate-90' : ''}`} />
            </button>
                
            {isPensiunExpanded && (
              <div className="pl-9 space-y-1 mt-1">
                <MenuItem view="pensiun" icon={ClipboardList} label={t('sidebar_retirement_service')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Jam Kerja */}
          <div className="space-y-1">
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer text-left ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'bg-primary-500/10 text-primary-400 font-semibold' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Clock size={18} strokeWidth={(isJamKerjaExpanded || isJamKerjaAreaActive) ? 2.5 : 2} />
                <span className="text-sm">{t('sidebar_work_hours')}</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-200 ${isJamKerjaExpanded ? 'rotate-90' : ''}`} />
            </button>
                
            {isJamKerjaExpanded && (
              <div className="pl-9 space-y-1 mt-1">
                <MenuItem view="jam-kerja" icon={ClipboardList} label={t('sidebar_work_hours_service')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('sidebar_help')}</p>
          </div>
          <div>
            <MenuItem view="faq" icon={BookOpen} label={t('sidebar_info_center')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 text-gray-300 font-semibold text-sm flex items-center justify-center shrink-0 ring-1 ring-gray-700">
              {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">
                {currentUser ? currentUser.nama.split(' ')[0] : 'Pegawai'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser?.nip || 'BSKJI ASN'}
              </p>
            </div>
            <button 
              type="button"
              onClick={onLogout} 
              title="Keluar / Log Out" 
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 print:h-auto print:overflow-visible print:block">
        {/* Floating System Notification */}
        {notification && (
          <div className="absolute top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 w-max max-w-sm animate-in fade-in slide-in-from-top-2 duration-200 border border-gray-800">
            <CheckCircle size={18} className="text-primary-400 shrink-0" />
            <p className="text-sm font-medium">{notification}</p>
            {onClearNotification && (
              <button 
                type="button"
                onClick={onClearNotification} 
                className="ml-2 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
        
        {/* Top Header - Sticky & Persistent across all views */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-30 w-full shrink-0 print:hidden shadow-xs pwa-safe-top transition-colors">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Hamburger Button for Mobile Drawer */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-1 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors shrink-0 active:scale-95 cursor-pointer"
              title="Buka Menu"
              aria-label="Buka Navigasi"
            >
              <Menu size={22} />
            </button>
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-xs">
                <Landmark size={17} className="text-white" />
              </div>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="text-[10px] sm:text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 uppercase tracking-wider block mb-0.5 transition-colors cursor-pointer text-left truncate leading-tight"
                title="Ke Beranda"
              >
                BSKJI Kepegawaian
              </button>
              <h2 className="font-bold text-gray-900 dark:text-white text-sm sm:text-xl lg:text-2xl truncate leading-tight">
                {viewTitle}
              </h2>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Clock on Desktop */}
            <HeaderClock />

            {/* Google Sheets Health & Connectivity Indicator */}
            <StatusCheck />
            
            {/* Theme Switcher Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative cursor-pointer active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              title={activeTheme === 'dark' ? "Beralih ke Mode Terang (Light)" : "Beralih ke Mode Gelap (Dark)"}
              aria-label="Ganti Tema"
            >
              {activeTheme === 'dark' ? (
                <Sun size={19} className="text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon size={19} className="text-gray-600 dark:text-gray-300 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notification Center Trigger */}
            <div className="relative z-50">
              <button 
                type="button"
                id="notification-bell" 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative cursor-pointer active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                title="Notifikasi Sistem"
                aria-label="Notifikasi"
              >
                {systemAlerts.length > 0 ? (
                  <>
                    <BellRing size={19} className="text-primary-600 dark:text-primary-400" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900"></span>
                  </>
                ) : (
                  <Bell size={19} />
                )}
              </button>

              {/* Notification Overlay Panel */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-80 md:w-96 max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifikasi</h3>
                      {systemAlerts.length > 0 && (
                        <div className="flex gap-3 items-center">
                          {onDismissAlerts && (
                            <button 
                              type="button"
                              onClick={onDismissAlerts} 
                              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                          <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold">
                            {systemAlerts.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                      {systemAlerts.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <CheckCircle size={24} className="mx-auto text-primary-500 mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Semua Terpantau Aman!</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tidak ada peringatan saat ini.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {systemAlerts.map(alert => (
                            <div
                              key={alert.id}
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                setCurrentView(alert.type === 'kgb' ? 'data-kgb' : 'pensiun');
                              }}
                              className={`p-3 rounded-lg border transition-colors cursor-pointer flex gap-3 ${
                                alert.severity === 'critical'
                                  ? 'bg-red-50/50 border-red-100 hover:bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 dark:hover:bg-red-900/20'
                                  : 'bg-yellow-50/50 border-yellow-100 hover:bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:hover:bg-yellow-900/20'
                              }`}
                            >
                              <div className={`mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {alert.type === 'kgb' ? <Banknote size={16} /> : <Archive size={16} />}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${alert.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                  {alert.title}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Desktop & Mobile User Profile Pill & Dropdown */}
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="min-h-[44px] flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200/90 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer text-left active:scale-95 shadow-2xs"
                title="Menu Pengguna"
                aria-label="Profil Pengguna"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                  {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden lg:block min-w-0 max-w-[130px]">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
                    {currentUser?.nama?.split(',')[0] || 'Pegawai'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate leading-tight mt-0.5">
                    {currentUser?.nip ? currentUser.nip.slice(0, 8) + '...' : 'BSKJI'}
                  </p>
                </div>
                <ChevronDown size={14} className={`hidden lg:block text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl z-50 overflow-hidden py-1">
                    {/* User Card Header */}
                    <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                          {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {currentUser?.nama || 'Pegawai BSKJI'}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate mt-0.5">
                            NIP: {currentUser?.nip || '-'}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                              {currentUser?.statusKepegawaian || 'PNS'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {currentUser?.unitKerja || 'BSKJI'}
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
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <LayoutDashboard size={15} className="text-primary-500 shrink-0" />
                        <span>Dashboard Utama</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('data-kgb');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <Banknote size={15} className="text-blue-500 shrink-0" />
                        <span>Data Layanan KGB</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('susunan-pegawai');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <Users size={15} className="text-indigo-500 shrink-0" />
                        <span>Daftar Susunan Pegawai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('sticky-notes');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <StickyNote size={15} className="text-amber-500 shrink-0" />
                        <span>Sticky Notes & Kanban</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setCurrentView('faq');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <HelpCircle size={15} className="text-emerald-500 shrink-0" />
                        <span>Panduan & Regulasi</span>
                      </button>
                    </div>

                    {/* Logout Option */}
                    <div className="p-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer text-left font-medium"
                      >
                        <LogOut size={15} className="shrink-0" />
                        <span>Keluar Sistem</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* View Content Slot (Persistent Main View Area with clean responsive padding) */}
        <div className="flex-1 overflow-y-auto overscroll-y-contain p-2.5 sm:p-5 md:p-6 pb-24 md:pb-6 scroll-smooth custom-scrollbar print:overflow-visible print:h-auto print:p-0">
          <div className="w-full space-y-4 sm:space-y-6 pb-4 print:space-y-0 print:pb-0">
            {children}
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar (Persistent touch-optimized nav) */}
        <nav
          aria-label="Navigasi Bawah Seluler"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/90 dark:border-gray-800 shadow-lg px-2 py-1 flex items-center justify-around print:hidden"
          style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              currentView === 'dashboard'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              currentView === 'data-kgb' || currentView === 'report'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              isKPAreaActive
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
              currentView === 'pensiun'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Archive size={20} strokeWidth={currentView === 'pensiun' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 leading-tight">Pensiun</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all cursor-pointer active:scale-95"
            aria-label="Buka Menu Selengkapnya"
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
