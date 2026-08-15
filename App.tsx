
import React, { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import { LayoutDashboard, Calendar, X, LogOut, User, Clock, AlertTriangle, Menu, BookOpen, BarChart2, ClipboardList, ChevronRight, ChevronDown, Award, Banknote, Archive, Landmark, Bell, BellRing, CheckCircle, Sun, Moon } from 'lucide-react';
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
    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Memuat komponen...</span>
  </div>
);

// Comprehensive Dashboard Skeleton for Initial Load
const DashboardSkeleton = () => (
  <div className="w-full space-y-6 p-2 md:p-6 lg:p-8">
    {/* Hero & Status Skeleton */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 h-[280px] sm:h-[320px] bg-slate-200 dark:bg-slate-700/50 rounded-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
      <div className="h-[280px] sm:h-[320px] bg-slate-200 dark:bg-slate-700/50 rounded-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[250px] bg-slate-200 dark:bg-slate-700/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
      ))}
    </div>

    {/* Chart Skeleton */}
    <div className="h-[400px] bg-slate-200 dark:bg-slate-700/50 rounded-2xl relative overflow-hidden mt-6">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
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
  colorClass = "text-primary-400", 
  currentView, 
  setCurrentView, 
  setMobileMenuOpen, 
  className = "", 
  isNested = false,
  badge = null,
  badgeColor = "bg-primary-500/20 text-primary-400 border border-primary-500/30"
}: MenuItemProps) => {
  const isActive = currentView === view;

  return (
    <button 
        onClick={() => { setCurrentView(view as any); setMobileMenuOpen(false); }}
        className={`w-full flex items-center justify-start transition-all duration-200 group relative overflow-hidden text-left ${
            isNested 
            ? 'text-[13px] py-2 px-3 gap-2.5 rounded-xl ml-0.5' 
            : 'text-sm py-2.5 px-3.5 gap-3 rounded-xl'
        } ${
            isActive 
            ? 'bg-gradient-to-r from-primary-500/20 via-primary-500/10 to-slate-900/40 text-primary-400 font-semibold border-l-2 border-primary-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ring-1 ring-primary-500/30' 
            : 'text-slate-300 hover:text-white hover:bg-slate-900/90 font-medium'
        } ${className}`}
    >
        <div className={`flex items-center justify-center shrink-0 transition-all duration-300 ${
          isActive 
            ? 'text-primary-400 scale-110 drop-shadow-[0_0_8px_var(--primary-500)]' 
            : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
        }`}>
          <Icon 
              size={isNested ? 16 : 18} 
              strokeWidth={isActive ? 2.5 : 2}
          />
        </div>
        <span className={`relative z-10 whitespace-nowrap transition-transform duration-200 flex-1 truncate ${isActive ? 'font-semibold tracking-wide text-white' : 'text-slate-300 group-hover:text-white'}`}>
            {label}
        </span>
        {badge !== null && badge !== undefined && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0 ml-auto ${badgeColor}`}>
            {badge}
          </span>
        )}
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] ml-auto shrink-0 animate-pulse"></span>
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
    <div className="hidden lg:flex items-center gap-3 ml-6 text-[13px] font-medium">
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-3.5 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700">
        <Clock size={14} className="text-primary-600" />
        <span className="tracking-wide">
          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
        <span className="font-mono text-slate-900 font-bold tracking-tight">
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
        </span>
      </div>
    </div>
  );
});
HeaderClock.displayName = 'HeaderClock';

const getTmtDate = (tmt: string) => {
  if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(tmt);
  } 
  else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
      const parts = tmt.split(/[-/]/);
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('kgb_auth_session') === 'true' || sessionStorage.getItem('kgb_auth_session') === 'true';
    } catch {
      return false;
    }
  });
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
    try {
      const isAuth = localStorage.getItem('kgb_auth_session') === 'true' || sessionStorage.getItem('kgb_auth_session') === 'true';
      if (isAuth && !isAuthenticated) {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn("Storage check error:", e);
    }
  }, [isAuthenticated]);

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
      setIsAuthenticated(true);
      try {
        localStorage.setItem('kgb_auth_session', 'true');
        localStorage.setItem('kgb_user_nip', nip);
        sessionStorage.setItem('kgb_auth_session', 'true');
        sessionStorage.setItem('kgb_user_nip', nip);
      } catch (e) {
        console.warn("Error saving login session:", e);
      }
      setQuote(getRandomQuote());
      setCurrentView('dashboard');
  }, []);

  const handleLogout = React.useCallback(() => {
      setIsAuthenticated(false);
      try {
        localStorage.removeItem('kgb_auth_session');
        localStorage.removeItem('kgb_user_nip');
        sessionStorage.removeItem('kgb_auth_session');
        sessionStorage.removeItem('kgb_user_nip');
      } catch (e) {
        console.warn("Error clearing login session:", e);
      }
      setEmployees([]); 
      setCurrentUser(null);
      setNotification('Anda telah berhasil keluar.');
  }, []);

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
      now.setHours(0,0,0,0);
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
    <div className="h-[100dvh] min-h-[100dvh] w-full flex bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans selection:bg-primary-500 selection:text-white overflow-hidden transition-colors duration-300">
      {/* Background Ambient Mesh (Optimized for performance: Static Gradients instead of heavy blurs) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50 dark:bg-slate-900 print:hidden transition-colors duration-300">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08)_0%,transparent_60%)]"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.06)_0%,transparent_60%)]"></div>
      </div>

      {/* Dark Theme Modern Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[270px] max-w-[85vw] bg-[#090d16] text-slate-200 transform transition-transform duration-300 ease-out md:translate-x-0 md:static flex flex-col border-r border-slate-800/80 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden select-none relative overflow-hidden`}>

        {/* Ambient Dark Glows */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.06),transparent_70%)] pointer-events-none"></div>

        {/* Brand Area */}
        <div className="px-4.5 pt-5 pb-4 group relative overflow-hidden border-b border-slate-800/80">
            <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-primary-400/30 group-hover:scale-105 transition-transform duration-300">
                        <Landmark size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="font-display font-bold text-lg tracking-tight text-white leading-none">
                                BSKJI
                            </h1>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse"></span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 leading-snug tracking-normal mt-1 group-hover:text-slate-300 transition-colors truncate">
                            Portal Layanan Kepegawaian
                        </p>
                    </div>
                </div>
                {/* Mobile Drawer Close Button */}
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="md:hidden p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 shrink-0 mt-0.5"
                  title="Tutup Menu"
                >
                  <X size={18} />
                </button>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto py-3 relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div>
                <button 
                    onClick={() => { 
                        setCurrentView('dashboard'); 
                        setMobileMenuOpen(false);
                        setIsKenaikanPangkatExpanded(false);
                        setIsLayananKgbExpanded(false);
                        setIsPensiunExpanded(false);
                        setIsJamKerjaExpanded(false);
                    }}
                    className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-300 group relative overflow-hidden ${
                        currentView === 'dashboard' 
                        ? 'bg-gradient-to-r from-primary-500/20 via-primary-500/10 to-slate-900/40 text-primary-400 font-semibold border-l-2 border-primary-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ring-1 ring-primary-500/30' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                    }`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-primary-500/20 text-primary-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                        <LayoutDashboard size={18} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} className="relative z-10 group-hover:scale-110 duration-300" />
                    </div>
                    <span className={`text-sm tracking-wide relative z-10 whitespace-nowrap flex-1 text-left ${currentView === 'dashboard' ? 'font-semibold text-white' : 'font-medium'}`}>{t('sidebar_dashboard')}</span>
                    {currentView === 'dashboard' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_var(--primary-500)] ml-auto shrink-0 animate-pulse"></span>
                    )}
                </button>
            </div>

            <div className="my-3 border-t border-slate-800/80 mx-2"></div>

            <div className="px-3 pt-1 pb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('sidebar_monitoring_services')}</p>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">LAYANAN</span>
            </div>
            
            {/* Layanan Kenaikan Pangkat */}
            <div className="space-y-1 relative">
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
                    className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'bg-slate-900/90 text-white border border-slate-800 shadow-sm' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-900 text-slate-400 group-hover:text-primary-400'}`}>
                        <Award size={17} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className={`text-sm tracking-wide relative z-10 flex-1 text-left ${(isKenaikanPangkatExpanded || isKPAreaActive) ? 'font-semibold text-white' : 'font-medium'}`}>{t('sidebar_promotion')}</span>
                    <ChevronRight size={15} className={`ml-auto transition-transform duration-300 relative z-10 ${isKenaikanPangkatExpanded ? 'rotate-90 text-primary-400' : 'rotate-0 text-slate-400'}`} />
                </button>
                
                {isKenaikanPangkatExpanded && (
                    <div className="pl-2.5 ml-4 border-l border-slate-800/80 space-y-1 my-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <MenuItem view="kenaikan-pangkat" icon={ClipboardList} label={t('sidebar_promotion_service')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                        <MenuItem view="kalender-kp" icon={Calendar} label={t('sidebar_promotion_calendar')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                        <MenuItem view="report-kp" icon={BarChart2} label={t('sidebar_promotion_report')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                    </div>
                )}
            </div>
            
            {/* Layanan KGB */}
            <div className="space-y-1 relative">
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
                    className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${(isLayananKgbExpanded || isKGBAreaActive) ? 'bg-slate-900/90 text-white border border-slate-800 shadow-sm' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${(isLayananKgbExpanded || isKGBAreaActive) ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-900 text-slate-400 group-hover:text-primary-400'}`}>
                        <Banknote size={17} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className={`text-sm tracking-wide relative z-10 flex-1 text-left ${(isLayananKgbExpanded || isKGBAreaActive) ? 'font-semibold text-white' : 'font-medium'}`}>{t('sidebar_kgb')}</span>
                    {stats.upcomingKGB > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 mr-1">
                            {stats.upcomingKGB}
                        </span>
                    )}
                    <ChevronRight size={15} className={`ml-auto transition-transform duration-300 relative z-10 ${isLayananKgbExpanded ? 'rotate-90 text-primary-400' : 'rotate-0 text-slate-400'}`} />
                </button>
                
                {isLayananKgbExpanded && (
                    <div className="pl-2.5 ml-4 border-l border-slate-800/80 space-y-1 my-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <MenuItem view="data-kgb" icon={ClipboardList} label={t('sidebar_kgb_service')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested badge={stats.upcomingKGB > 0 ? stats.upcomingKGB : null} badgeColor="bg-primary-500/20 text-primary-400 border border-primary-500/30" />
                        <MenuItem view="report" icon={BarChart2} label={t('sidebar_kgb_report')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                    </div>
                )}
            </div>

            {/* Layanan Pensiun */}
            <div className="space-y-1 relative">
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
                    className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${(isPensiunExpanded || isPensiunAreaActive) ? 'bg-slate-900/90 text-white border border-slate-800 shadow-sm' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${(isPensiunExpanded || isPensiunAreaActive) ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-900 text-slate-400 group-hover:text-primary-400'}`}>
                        <Archive size={17} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className={`text-sm tracking-wide relative z-10 flex-1 text-left ${(isPensiunExpanded || isPensiunAreaActive) ? 'font-semibold text-white' : 'font-medium'}`}>{t('sidebar_retirement')}</span>
                    {systemAlerts.filter(a => a.type === 'pensiun').length > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 mr-1">
                            {systemAlerts.filter(a => a.type === 'pensiun').length}
                        </span>
                    )}
                    <ChevronRight size={15} className={`ml-auto transition-transform duration-300 relative z-10 ${isPensiunExpanded ? 'rotate-90 text-primary-400' : 'rotate-0 text-slate-400'}`} />
                </button>
                
                {isPensiunExpanded && (
                    <div className="pl-2.5 ml-4 border-l border-slate-800/80 space-y-1 my-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <MenuItem view="pensiun" icon={ClipboardList} label={t('sidebar_retirement_service')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                    </div>
                )}
            </div>

            {/* Layanan Jam Kerja */}
            <div className="space-y-1 relative">
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
                    className={`w-full flex items-center justify-start gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'bg-slate-900/90 text-white border border-slate-800 shadow-sm' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}
                >
                    <div className={`p-1 rounded-lg transition-colors ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-900 text-slate-400 group-hover:text-primary-400'}`}>
                        <Clock size={17} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className={`text-sm tracking-wide relative z-10 flex-1 text-left ${(isJamKerjaExpanded || isJamKerjaAreaActive) ? 'font-semibold text-white' : 'font-medium'}`}>{t('sidebar_work_hours')}</span>
                    <ChevronRight size={15} className={`ml-auto transition-transform duration-300 relative z-10 ${isJamKerjaExpanded ? 'rotate-90 text-primary-400' : 'rotate-0 text-slate-400'}`} />
                </button>
                
                {isJamKerjaExpanded && (
                    <div className="pl-2.5 ml-4 border-l border-slate-800/80 space-y-1 my-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <MenuItem view="jam-kerja" icon={ClipboardList} label={t('sidebar_work_hours_service')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} isNested />
                    </div>
                )}
            </div>

            <div className="my-3 border-t border-slate-800/80 mx-2"></div>

            <div className="px-3 pt-1 pb-1">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('sidebar_help')}</p>
            </div>
            <div className="pb-2">
                <MenuItem view="faq" icon={BookOpen} label={t('sidebar_info_center')} colorClass="text-primary-400" currentView={currentView} setCurrentView={setCurrentView} setMobileMenuOpen={setMobileMenuOpen} />
            </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/95 relative z-10">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between gap-2.5 shadow-xs group">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs border border-primary-400/20 shrink-0">
                        {(currentUser?.nama || 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                            {currentUser ? currentUser.nama.split(' ')[0] : 'Pegawai'}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                            {currentUser?.nip || 'BSKJI ASN'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    title="Keluar / Log Out"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-primary-500/10 border border-transparent hover:border-primary-500/20 transition-colors shrink-0"
                >
                    <LogOut size={15} />
                </button>
            </div>
            <div className="flex items-center justify-between px-1 pt-2 text-[9px] font-mono text-slate-400">
                <span>PORTAL BSKJI</span>
                <span className="text-primary-400 font-semibold">v2.4 ONLINE</span>
            </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10 print:h-auto print:overflow-visible print:block">
        <>
          {notification && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-4 z-[100] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 w-[90%] max-w-sm md:w-auto"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-primary-400" />
              </div>
              <p className="text-sm font-medium tracking-wide flex-1">{notification}</p>
              <button 
                onClick={() => setNotification(null)}
                className="p-1 rounded-lg hover:bg-white dark:bg-slate-900/10 transition-colors shrink-0"
              >
                <X size={14} className="text-slate-300 dark:text-slate-600" />
              </button>
            </div>
          )}
        </>
        
        {/* Sleek, responsive Top Header & Notification Center */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 print:hidden shadow-xs w-full">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden p-2 -ml-1 text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shrink-0 active:scale-95 border border-slate-800 shadow-xs"
              aria-label="Buka Menu"
            >
              <Menu size={19} />
            </button>
            <div className="flex flex-col gap-0.5 min-w-0 max-w-[200px] md:max-w-[280px] lg:max-w-[450px]">
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider hidden sm:block">
                Sistem Informasi Kepegawaian BSKJI
              </span>
              <h2 className="font-display font-bold text-slate-900 dark:text-white text-lg sm:text-xl md:text-2xl leading-tight truncate pb-0.5">
                {viewTitle}
              </h2>
            </div>
            
            <HeaderClock />
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Notification Center Trigger */}
            <div className="relative z-50">
              <button
                id="notification-bell"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full border transition-all active:scale-95 flex items-center justify-center cursor-pointer relative shadow-sm ${
                  isNotificationsOpen
                    ? 'bg-primary-50 border-primary-200 text-primary-600'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-primary-50/50 hover:border-primary-100'
                }`}
                title="Pusat Notifikasi Kepegawaian"
              >
                {systemAlerts.length > 0 ? (
                  <>
                    <BellRing size={16} className="text-primary-400 animate-bounce" />
                    <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 rounded-full bg-primary-500 text-white font-black text-[8px] flex items-center justify-center px-1 border border-white shadow-sm">
                      {systemAlerts.length}
                    </span>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500 animate-ping"></span>
                  </>
                ) : (
                  <Bell size={16} />
                )}
              </button>

              {/* Notification Overlay Panel */}
              <>
                {isNotificationsOpen && (
                  <>
                    {/* Invisible backdrop to dismiss dropdown */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                    
                    <div
                      className="fixed inset-x-3 top-16 md:absolute md:top-auto md:right-0 md:left-auto md:mt-3 w-auto md:w-96 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-2xl z-50 overflow-hidden max-w-sm ml-auto mr-0 md:mx-0"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <BellRing size={15} className="text-primary-600 dark:text-primary-500" />
                          <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tracking-tight">
                            Pusat Notifikasi Kepegawaian
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {systemAlerts.length > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDismissedAlertIds(prev => [...prev, ...systemAlerts.map(a => a.id)]);
                              }}
                              className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                              Tandai Semua Dibaca
                            </button>
                          )}
                          {systemAlerts.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary-500 dark:bg-primary-500/10 text-primary-400 dark:text-primary-400 border border-primary-500 dark:border-primary-500 font-extrabold text-[9px] uppercase tracking-wide">
                              {systemAlerts.length} Peringatan
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                        {systemAlerts.length === 0 ? (
                          <div className="py-8 px-4 text-center flex flex-col items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500 flex items-center justify-center border border-primary-100 dark:border-primary-800 shadow-sm">
                              <CheckCircle size={18} />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Semua Berkas Terpantau Aman!
                              </p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                                Tidak ada berkas KGB atau BUP Pensiun yang mendekati tenggat waktu administrasi.
                              </p>
                            </div>
                          </div>
                        ) : (
                          systemAlerts.map(alert => (
                            <div
                              key={alert.id}
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                if (alert.type === 'kgb') {
                                  setCurrentView('data-kgb');
                                } else {
                                  setCurrentView('pensiun');
                                }
                              }}
                              className={`p-2.5 rounded-xl border transition-all hover:bg-slate-50/50 dark:hover:bg-slate-800 cursor-pointer flex gap-2.5 ${
                                alert.severity === 'critical'
                                  ? 'border-primary-500 dark:border-primary-500/50 bg-primary-500/30 dark:bg-primary-500/5 hover:border-primary-500 dark:hover:border-primary-500'
                                  : 'border-primary-500 dark:border-primary-500/50 bg-primary-500/10 dark:bg-primary-500/5 hover:border-primary-500 dark:hover:border-primary-500'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                                alert.severity === 'critical'
                                  ? 'bg-primary-500 dark:bg-primary-500/10 border-primary-500 dark:border-primary-500 text-primary-400 dark:text-primary-400 shadow-sm'
                                  : 'bg-primary-500 dark:bg-primary-500/10 border-primary-500 dark:border-primary-500 text-primary-400 dark:text-primary-400 shadow-sm'
                              }`}>
                                {alert.type === 'kgb' ? <Banknote size={14} /> : <Archive size={14} />}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {alert.title}
                                  </p>
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full tracking-wide ${
                                    alert.severity === 'critical'
                                      ? 'bg-primary-500 dark:bg-primary-500/20 text-primary-400 dark:text-primary-400'
                                      : 'bg-primary-500 dark:bg-primary-500/20 text-primary-400 dark:text-primary-400'
                                  }`}>
                                    {alert.severity === 'critical' ? 'URGENT' : 'PERINGATAN'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-relaxed mt-1">
                                  {alert.message}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {systemAlerts.length > 0 && (
                        <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 flex justify-end">
                          <button 
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              setCurrentView('dashboard');
                            }}
                            className="hover:text-primary-800 dark:hover:text-primary-400 text-[10px] font-bold text-primary-600 dark:text-primary-500 flex items-center gap-1 cursor-pointer transition-all active:translate-x-0.5"
                          >
                            <span>Buka Dashboard</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
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
                      <div
                        key={currentView}
                        className="w-full"
                      >
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
