import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { useAppStore } from './src/store/useAppStore';
import {
  LayoutDashboard,
  Calendar,
  X,
  LogOut,
  User,
  Clock,
  AlertTriangle,
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
  Moon
} from 'lucide-react';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import { fetchEmployeeData, fetchPromotionData } from './services/dataService';
import { Employee, DashboardStats as StatsType } from './types';
import { getRandomQuote } from './utils/quotesGenerator';
import { TRANSLATIONS, Language, getGreeting } from './utils/translationHelper';
import { getBirthDateFromNIP, getRetirementAge, calculateTmtPensiun } from './utils/pensionHelpers';
import { lazyWithRetry } from './utils/lazyWithRetry';

const DashboardPage = lazyWithRetry(() => import('./components/DashboardPage'));

// Lazy loaded views with resilient retry logic
const KGBDataPage = lazyWithRetry(() => import('./components/KGBDataPage'));
const PromotionTable = lazyWithRetry(() => import('./components/PromotionTable'));
const PensiunTable = lazyWithRetry(() => import('./components/PensiunTable'));
const KPCalendar = lazyWithRetry(() => import('./components/KPCalendar'));
const ReportPage = lazyWithRetry(() => import('./components/ReportPage'));
const FAQPage = lazyWithRetry(() => import('./components/FAQPage'));
const JamKerjaPage = lazyWithRetry(() => import('./components/JamKerjaPage'));

// Lightweight Loading Component for Suspense
const PageLoader = () => (
  <div className="w-full h-64 flex flex-col items-center justify-center gap-3 animate-pulse">
    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Memuat komponen...</span>
  </div>
);

// Comprehensive Dashboard Skeleton for Initial Load
const DashboardSkeleton = () => (
  <div className="w-full space-y-6 p-2 md:p-6 lg:p-8">
    {/* Hero & Status Skeleton */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 h-[280px] sm:h-[320px] bg-gray-200 dark:bg-gray-700/50 rounded-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 from-transparent via-white/50 to-transparent -trangray-x-full animate-pulse"></div>
      </div>
      <div className="h-[280px] sm:h-[320px] bg-gray-200 dark:bg-gray-700/50 rounded-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 from-transparent via-white/50 to-transparent -trangray-x-full animate-pulse"></div>
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[250px] bg-gray-200 dark:bg-gray-700/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 from-transparent via-white/50 to-transparent -trangray-x-full animate-pulse"></div>
        </div>
      ))}
    </div>

    {/* Chart Skeleton */}
    <div className="h-[400px] bg-gray-200 dark:bg-gray-700/50 rounded-2xl relative overflow-hidden mt-6">
      <div className="absolute inset-0 from-transparent via-white/50 to-transparent -trangray-x-full animate-pulse"></div>
    </div>
  </div>
);

interface MenuItemProps {
  view: string;
  icon: any;
  label: string;
  colorClass?: string;
  currentView: string;
  setCurrentView: (view: any) => void;
  setMobileMenuOpen: (open: boolean) => void;
  className?: string;
  isNested?: boolean;
  badge?: string | number | null;
  badgeColor?: string;
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
      onClick={() => {
        setCurrentView(view as any);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-500/10 text-primary-400 font-medium'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
      }`}
    >
      <Icon size={isNested ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-sm flex-1 text-left">{label}</span>
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
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
      <Clock size={16} className="text-primary-500" />
      <span>
        {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <span className="font-semibold text-gray-900 dark:text-white">
        {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
});
HeaderClock.displayName = 'HeaderClock';

const getTmtDate = (tmt: string) => {
  if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(tmt);
  } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
    const parts = tmt.split(/[-/]/);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
};

function App() {
  const { isAuthenticated, login, logout, userNip } = useAppStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [promotionEmployees, setPromotionEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const language: Language = 'id';
  const t = useMemo(() => {
    return (key: string) => TRANSLATIONS['id'][key] || key;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [quote, setQuote] = useState(getRandomQuote());

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setQuote(getRandomQuote());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'data-kgb' | 'kenaikan-pangkat' | 'faq' | 'report' | 'report-kp' | 'pensiun' | 'kalender-kp' | 'jam-kerja'>('dashboard');
  const [isLayananKgbExpanded, setIsLayananKgbExpanded] = useState(false);
  const [isKenaikanPangkatExpanded, setIsKenaikanPangkatExpanded] = useState(false);
  const [isPensiunExpanded, setIsPensiunExpanded] = useState(false);
  const [isJamKerjaExpanded, setIsJamKerjaExpanded] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Computed alert items for KGB TMT < 30 days and Retirement (BUP) < 6 months
  const systemAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'kgb' | 'pensiun';
      title: string;
      message: string;
      employee: Employee;
      daysOrMonthsLeft: number;
      severity: 'critical' | 'warning';
    }> = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    employees.forEach(emp => {
      // 1. KGB Warning Check (< 30 days)
      if (emp.status !== 'Processed') {
        const tmtDate = getTmtDate(emp.tmt);
        if (tmtDate) {
          const diffTime = tmtDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 30) {
            list.push({
              id: `kgb-${emp.id}-${emp.tmt}`,
              type: 'kgb',
              title: 'Mendekati TMT KGB',
              message: `${emp.nama} (${emp.nip}) akan memasuki TMT KGB dalam ${diffDays} hari (${emp.tmt}).`,
              employee: emp,
              daysOrMonthsLeft: diffDays,
              severity: diffDays <= 10 ? 'critical' : 'warning'
            });
          } else if (diffDays < 0) {
            // KGB Overdue
            list.push({
              id: `kgb-overdue-${emp.id}`,
              type: 'kgb',
              title: 'KGB Terlambat',
              message: `${emp.nama} (${emp.nip}) belum diproses, terlambat ${Math.abs(diffDays)} hari (TMT ${emp.tmt}).`,
              employee: emp,
              daysOrMonthsLeft: diffDays,
              severity: 'critical'
            });
          }
        }
      }

      // 2. Pension BUP Warning Check (< 6 months)
      const birthDate = getBirthDateFromNIP(emp.nip);
      if (birthDate) {
        const bup = getRetirementAge(emp.jabatan);
        const tmtPensiun = calculateTmtPensiun(birthDate, bup);
        const monthsRemaining = (tmtPensiun.getFullYear() - now.getFullYear()) * 12 + (tmtPensiun.getMonth() - now.getMonth());
        if (monthsRemaining >= 0 && monthsRemaining < 6) {
          list.push({
            id: `pensiun-${emp.id}`,
            type: 'pensiun',
            title: 'Memasuki Usia Pensiun',
            message: `${emp.nama} (${emp.nip}) memasuki Batas Usia Pensiun (BUP ${bup} th) dalam ${monthsRemaining} bulan (${tmtPensiun.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}).`,
            employee: emp,
            daysOrMonthsLeft: monthsRemaining,
            severity: monthsRemaining <= 2 ? 'critical' : 'warning'
          });
        }
      }
    });

    return list.filter(alert => !dismissedAlertIds.includes(alert.id)).sort((a, b) => {
      // Critical first, then sort by lower time remaining
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return a.daysOrMonthsLeft - b.daysOrMonthsLeft;
    });
  }, [employees, dismissedAlertIds]);

  // Automatically expand/collapse primary sections based on currentView to provide a fluid, premium UX
  useEffect(() => {
    if (currentView === 'kenaikan-pangkat' || currentView === 'kalender-kp' || currentView === 'report-kp') {
      setIsKenaikanPangkatExpanded(true);
      setIsLayananKgbExpanded(false);
      setIsPensiunExpanded(false);
      setIsJamKerjaExpanded(false);
    } else if (currentView === 'data-kgb' || currentView === 'report') {
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

  // Auto-clear notification
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const greeting = useMemo(() => getGreeting('id'), []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [data, promotionData] = await Promise.all([
          fetchEmployeeData(),
          fetchPromotionData()
        ]);
        setEmployees(data);
        setPromotionEmployees(promotionData);
        const savedNip = localStorage.getItem('kgb_user_nip') || sessionStorage.getItem('kgb_user_nip');
        if (savedNip) {
          const user = data.find(e => e.nip === savedNip);
          if (user) setCurrentUser(user);
        }
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // Prefetch all route chunks on idle for instant zero-delay navigation
  useEffect(() => {
    if (!isAuthenticated) return;
    const prefetchRoutes = () => {
      import('./components/DashboardPage');
      import('./components/KGBDataPage');
      import('./components/PromotionTable');
      import('./components/PensiunTable');
      import('./components/KPCalendar');
      import('./components/ReportPage');
      import('./components/FAQPage');
      import('./components/JamKerjaPage');
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchRoutes);
    } else {
      setTimeout(prefetchRoutes, 200);
    }
  }, [isAuthenticated]);

  const handleLogin = React.useCallback((nip: string) => {
    login(nip);
    setQuote(getRandomQuote());
    setCurrentView('dashboard');
  }, [login]);

  const handleLogout = React.useCallback(() => {
    logout();
    setEmployees([]);
    setCurrentUser(null);
    setNotification('Anda telah berhasil keluar.');
  }, [logout]);

  const handleNewQuote = React.useCallback(() => {
    let newQuote = quote;
    do {
      newQuote = getRandomQuote();
    } while (newQuote === quote);
    setQuote(newQuote);
  }, [quote]);

  const handleStatusToggle = React.useCallback((id: string) => {
    setEmployees(currentEmployees =>
      currentEmployees.map(emp => {
        if (emp.id === id) {
          const newStatus: 'Processed' | 'Upcoming' = emp.status === 'Processed' ? 'Upcoming' : 'Processed';
          const updatedEmp: Employee = { ...emp, status: newStatus };
          if (newStatus === 'Processed') {
            const historyEntry = {
              date: new Date().toISOString().split('T')[0],
              amount: emp.gajiBaru,
              description: `KGB ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
            };
            updatedEmp.salaryHistory = [...(emp.salaryHistory || []), historyEntry];
          }
          return updatedEmp;
        }
        return emp;
      })
    );
  }, []);

  const getMonthName = (tmt: string) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const parts = tmt.split(/[-/]/);
    if (parts.length < 2) return '';
    const monthIdx = parseInt(parts[1]) - 1;
    if (monthIdx >= 0 && monthIdx < 12) return months[monthIdx];
    return '';
  };

  const displayedEmployees = useMemo(() => {
    if (selectedMonth === 'Riwayat TMT Selesai') {
      const now = new Date();
      const currentM = now.getMonth();
      const currentY = now.getFullYear();
      return employees.filter(e => {
        const tmtDate = getTmtDate(e.tmt);
        if (!tmtDate) return false;
        const m = tmtDate.getMonth();
        const prevY = tmtDate.getFullYear() - 2;
        return (prevY > 2026 || (prevY === 2026 && m >= 0)) && (prevY < currentY || (prevY === currentY && m <= currentM));
      });
    }
    if (!selectedMonth || !selectedYear) return employees;
    return employees.filter(e => {
      const tmtDate = getTmtDate(e.tmt);
      if (!tmtDate) return false;
      const isMonthMatch = getMonthName(e.tmt) === selectedMonth;
      const isYearMatch = tmtDate.getFullYear() === selectedYear;
      return isMonthMatch && isYearMatch;
    });
  }, [employees, selectedMonth, selectedYear]);

  const currentUserDaysRemaining = useMemo(() => {
    if (!currentUser) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tmtDate = getTmtDate(currentUser.tmt);
    if (!tmtDate) return null;
    const diff = tmtDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [currentUser]);

  const stats: StatsType = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let currentMonthCount = 0;

    // Create a map to store counts for future months
    const futureMonthsMap = new Map<string, number>();
    employees.forEach(e => {
      const tmtDate = getTmtDate(e.tmt);
      if (!tmtDate || isNaN(tmtDate.getTime())) return;
      const m = tmtDate.getMonth();
      const y = tmtDate.getFullYear();
      const prevY = y - 2;
      if ((prevY > 2026 || (prevY === 2026 && m >= 0)) && (prevY < currentYear || (prevY === currentYear && m <= currentMonth))) {
        currentMonthCount++;
      } else if (y > currentYear || (y === currentYear && m > currentMonth)) {
        const key = `${y}-${m}`;
        futureMonthsMap.set(key, (futureMonthsMap.get(key) || 0) + 1);
      }
    });

    // Find the closest future month that has KGB
    let upcomingKGB = 0;
    let nextMonthName = undefined;
    let nextMonthYear = undefined;
    if (futureMonthsMap.size > 0) {
      // Sort keys correctly by year then month
      const sortedKeys = Array.from(futureMonthsMap.keys()).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });
      const closestKey = sortedKeys[0];
      upcomingKGB = futureMonthsMap.get(closestKey) || 0;
      const [closestYear, closestMonth] = closestKey.split('-').map(Number);
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      nextMonthName = months[closestMonth];
      nextMonthYear = closestYear;
    } else {
      // Default to next month if no future data
      const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      nextMonthName = months[nextMonthDate.getMonth()];
      nextMonthYear = nextMonthDate.getFullYear();
    }
    return {
      totalEmployees: employees.length,
      upcomingKGB,
      processedKGB: currentMonthCount,
      pendingKGB: 0,
      nextMonthName,
      nextMonthYear
    };
  }, [employees]);

  const handleDeleteEmployee = React.useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  const handleDashboardCardClick = React.useCallback((type: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    if (type === 'upcoming') {
      const shortMonths = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const fullMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      let monthSet = "Jan"; // default
      if (stats.nextMonthName) {
        const index = fullMonths.indexOf(stats.nextMonthName);
        if (index !== -1) monthSet = shortMonths[index];
      }
      setSelectedMonth(monthSet);
      setSelectedYear(stats.nextMonthYear || currentYear);
    } else if (type === 'processed') {
      setSelectedMonth('Riwayat TMT Selesai');
      setSelectedYear(null);
    }
    setCurrentView('data-kgb');
  }, [stats.nextMonthName, stats.nextMonthYear]);

  const viewTitle = useMemo(() => {
    switch (currentView) {
      case 'dashboard': return 'Dasbor Utama';
      case 'data-kgb': return 'Data Layanan KGB';
      case 'kenaikan-pangkat': return 'Data Layanan Kenaikan Pangkat';
      case 'kalender-kp': return 'Kalender Kenaikan Pangkat';
      case 'report': return 'Laporan Layanan KGB';
      case 'report-kp': return 'Laporan Kenaikan Pangkat';
      case 'pensiun': return 'Layanan Pensiun (BUP)';
      case 'jam-kerja': return 'Layanan Jam Kerja ASN';
      case 'faq': return 'Pusat Informasi & FAQ';
      default: return 'Portal Kepegawaian BSKJI';
    }
  }, [currentView]);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Common Props for DashboardPage
  const dashboardProps = {
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
    onCardClick: handleDashboardCardClick,
    setCurrentView,
    setIsKenaikanPangkatExpanded,
    setIsLayananKgbExpanded,
    setIsPensiunExpanded,
    systemAlerts
  };

  const isKPAreaActive = ['kenaikan-pangkat', 'kalender-kp', 'report-kp'].includes(currentView);
  const isKGBAreaActive = ['data-kgb', 'report'].includes(currentView);
  const isPensiunAreaActive = ['pensiun'].includes(currentView);
  const isJamKerjaAreaActive = ['jam-kerja'].includes(currentView);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 selection:bg-primary-500 selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-30 md:hidden transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Modern Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out md:trangray-x-0 md:static flex flex-col border-r border-gray-800 ${mobileMenuOpen ? 'trangray-x-0' : '-trangray-x-full'} print:hidden`}>
        {/* Brand Area */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm">
              <Landmark size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-white leading-tight">BSKJI</h1>
              <p className="text-[11px] font-medium text-gray-400">Portal Kepegawaian</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
              setIsKenaikanPangkatExpanded(false);
              setIsLayananKgbExpanded(false);
              setIsPensiunExpanded(false);
              setIsJamKerjaExpanded(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-primary-500/10 text-primary-400' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
          >
            <LayoutDashboard size={18} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-sm flex-1 text-left">{t('sidebar_monitoring_services')}</span>
          </button>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase r">{t('sidebar_monitoring_services')}</p>
          </div>
            
          {/* Layanan Kenaikan Pangkat */}
          <div className="space-y-1">
            <button
              onClick={() => {
                const newState = !isKenaikanPangkatExpanded;
                setIsKenaikanPangkatExpanded(newState);
                if (newState) {
                  setIsLayananKgbExpanded(false);
                  setIsPensiunExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('kenaikan-pangkat');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
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
              onClick={() => {
                const newState = !isLayananKgbExpanded;
                setIsLayananKgbExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsPensiunExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('data-kgb');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${(isLayananKgbExpanded || isKGBAreaActive) ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                <Banknote size={18} strokeWidth={(isLayananKgbExpanded || isKGBAreaActive) ? 2.5 : 2} />
                <span className="text-sm flex-1 text-left">{t('sidebar_kgb')}</span>
                {stats.upcomingKGB > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 mr-2">
                    {stats.upcomingKGB}
                  </span>
                )}
              </div>
              <ChevronRight size={16} className={`transition-transform duration-200 ${isLayananKgbExpanded ? 'rotate-90' : ''}`} />
            </button>
                
            {isLayananKgbExpanded && (
              <div className="pl-9 space-y-1 mt-1">
                <MenuItem view="data-kgb" icon={ClipboardList} label={t('sidebar_kgb_service')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested badge={stats.upcomingKGB > 0 ? stats.upcomingKGB : null} />
                <MenuItem view="report" icon={BarChart2} label={t('sidebar_kgb_report')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
              </div>
            )}
          </div>

          {/* Layanan Pensiun */}
          <div className="space-y-1">
            <button
              onClick={() => {
                const newState = !isPensiunExpanded;
                setIsPensiunExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsLayananKgbExpanded(false);
                  setIsJamKerjaExpanded(false);
                  setCurrentView('pensiun');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${(isPensiunExpanded || isPensiunAreaActive) ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
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
              onClick={() => {
                const newState = !isJamKerjaExpanded;
                setIsJamKerjaExpanded(newState);
                if (newState) {
                  setIsKenaikanPangkatExpanded(false);
                  setIsLayananKgbExpanded(false);
                  setIsPensiunExpanded(false);
                  setCurrentView('jam-kerja');
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
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
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase r">{t('sidebar_help')}</p>
          </div>
          <div>
            <MenuItem view="faq" icon={BookOpen} label={t('sidebar_info_center')} currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 text-gray-300 font-semibold text-sm flex items-center justify-center shrink-0">
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
            <button onClick={handleLogout} title="Keluar / Log Out" className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors shrink-0">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 print:h-auto print:overflow-visible print:block">
        <>
          {notification && (
            <div className="absolute top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 w-max">
              <CheckCircle size={18} className="text-primary-400" />
              <p className="text-sm font-medium">{notification}</p>
              <button onClick={() => setNotification(null)} className="ml-2 text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}
        </>
        
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30 w-full shrink-0 print:hidden">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0">
              <Menu size={20} />
            </button>
            <div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase r hidden sm:block mb-0.5">
                Sistem Informasi Kepegawaian BSKJI
              </span>
              <h2 className="font-bold text-gray-900 dark:text-white text-xl sm:text-2xl truncate">
                {viewTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <HeaderClock />
            
            {/* Notification Center Trigger */}
            <div className="relative z-50">
              <button id="notification-bell" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
                {systemAlerts.length > 0 ? (
                  <>
                    <BellRing size={20} className="text-primary-600 dark:text-primary-400" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-gray-900"></span>
                  </>
                ) : (
                  <Bell size={20} />
                )}
              </button>

              {/* Notification Overlay Panel */}
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifikasi</h3>
                      {systemAlerts.length > 0 && (
                        <div className="flex gap-3 items-center">
                          <button onClick={() => setDismissedAlertIds(prev => [...prev, ...systemAlerts.map(a => a.id)])} className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            Tandai Dibaca
                          </button>
                          <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold">
                            {systemAlerts.length}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2">
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
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-y-contain p-2.5 sm:p-5 md:p-6 scroll-smooth custom-scrollbar print:overflow-visible print:h-auto print:p-0">
          <div className="w-full space-y-4 sm:space-y-6 pb-4 print:space-y-0 print:pb-0">
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <>
                    <div key={currentView} className="w-full">
                      {currentView === 'kenaikan-pangkat' && <PromotionTable employees={promotionEmployees} language={language} />}
                      {currentView === 'kalender-kp' && <KPCalendar language={language} />}
                      {currentView === 'report' && <ReportPage employees={employees} currentUser={currentUser} language={language} />}
                      {currentView === 'report-kp' && <ReportPage employees={promotionEmployees} currentUser={currentUser} isKP={true} language={language} />}
                      {currentView === 'pensiun' && <PensiunTable employees={employees} language={language} />}
                      {currentView === 'jam-kerja' && <JamKerjaPage language={language} />}
                      {currentView === 'dashboard' && <DashboardPage {...dashboardProps} />}
                      {currentView === 'data-kgb' && <KGBDataPage {...dashboardProps} />}
                      {currentView === 'faq' && <FAQPage employees={employees} language={language} />}
                    </div>
                  </>
                </Suspense>
              </ErrorBoundary>
            )}
          </div>
        </div>
      </main>
      
      <ScrollToTop />
    </div>
  );
}

export default App;
