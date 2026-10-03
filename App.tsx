import React, { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useAppStore } from './src/store/useAppStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './components/LoginPage';
import { fetchEmployeeData, fetchPromotionData, fetchMasterPegawaiData } from './services/dataService';
import { Employee, DashboardStats as StatsType } from './types';
import { getRandomQuote } from './utils/quotesGenerator';
import { TRANSLATIONS, Language, getGreeting } from './utils/translationHelper';
import { getBirthDateFromNIP, getRetirementAge, calculateTmtPensiun } from './utils/pensionHelpers';
import { MainLayout, SystemAlertItem } from './src/layouts/MainLayout';

// Direct view imports for reliable offline/online instant rendering without dynamic chunk fetch issues
import DashboardPage from './components/DashboardPage';
import KGBDataPage from './components/KGBDataPage';
import PromotionTable from './components/PromotionTable';
import PensiunTable from './components/PensiunTable';
import KPCalendar from './components/KPCalendar';
import ReportPage from './components/ReportPage';
import FAQPage from './components/FAQPage';
import JamKerjaPage from './components/JamKerjaPage';
import DaftarSusunanPegawaiPage from './components/DaftarSusunanPegawaiPage';
import StickyNotesKanbanPage from './components/StickyNotesKanbanPage';

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
        <div className="absolute inset-0 from-transparent via-white/50 to-transparent -translate-x-full animate-pulse"></div>
      </div>
      <div className="h-[280px] sm:h-[320px] bg-gray-200 dark:bg-gray-700/50 rounded-[2rem] relative overflow-hidden">
        <div className="absolute inset-0 from-transparent via-white/50 to-transparent -translate-x-full animate-pulse"></div>
      </div>
    </div>

    {/* Metric Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-[250px] bg-gray-200 dark:bg-gray-700/50 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 from-transparent via-white/50 to-transparent -translate-x-full animate-pulse"></div>
        </div>
      ))}
    </div>

    {/* Chart Skeleton */}
    <div className="h-[400px] bg-gray-200 dark:bg-gray-700/50 rounded-2xl relative overflow-hidden mt-6">
      <div className="absolute inset-0 from-transparent via-white/50 to-transparent -translate-x-full animate-pulse"></div>
    </div>
  </div>
);

const getTmtDate = (tmt: string) => {
  if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(tmt);
  } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
    const parts = tmt.split(/[-/]/);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
};

export type AppViewType = 
  | 'dashboard' 
  | 'data-kgb' 
  | 'kenaikan-pangkat' 
  | 'faq' 
  | 'report' 
  | 'report-kp' 
  | 'pensiun' 
  | 'kalender-kp' 
  | 'jam-kerja' 
  | 'susunan-pegawai' 
  | 'sticky-notes';

function App() {
  const { isAuthenticated, login, logout } = useAppStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [promotionEmployees, setPromotionEmployees] = useState<Employee[]>([]);
  const [masterEmployees, setMasterEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const language: Language = 'id';
  
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [quote, setQuote] = useState(getRandomQuote());
  const [currentView, setCurrentView] = useState<AppViewType>('dashboard');
  const [notification, setNotification] = useState<string | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Theme state with instant persistence & system fallback
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kgb_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
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
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setQuote(getRandomQuote());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Computed alert items for KGB TMT < 30 days and Retirement (BUP) < 6 months
  const systemAlerts: SystemAlertItem[] = useMemo(() => {
    const list: SystemAlertItem[] = [];
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
      return (a.daysOrMonthsLeft || 0) - (b.daysOrMonthsLeft || 0);
    });
  }, [employees, dismissedAlertIds]);

  // Auto-clear notification
  useEffect(() => {
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
        const [data, promotionData, masterData] = await Promise.all([
          fetchEmployeeData(),
          fetchPromotionData(),
          fetchMasterPegawaiData()
        ]);
        setEmployees(data);
        setPromotionEmployees(promotionData);
        setMasterEmployees(masterData);
        const savedNip = localStorage.getItem('kgb_user_nip') || sessionStorage.getItem('kgb_user_nip');
        if (savedNip) {
          const user = data.find(e => e.nip === savedNip) || masterData.find(e => e.nip === savedNip);
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

  const handleLogin = useCallback((nip: string) => {
    login(nip);
    setQuote(getRandomQuote());
    setCurrentView('dashboard');
  }, [login]);

  const handleLogout = useCallback(() => {
    logout();
    setEmployees([]);
    setCurrentUser(null);
    setNotification('Anda telah berhasil keluar.');
  }, [logout]);

  const handleNewQuote = useCallback(() => {
    let newQuote = quote;
    do {
      newQuote = getRandomQuote();
    } while (newQuote === quote);
    setQuote(newQuote);
  }, [quote]);

  const handleStatusToggle = useCallback((id: string) => {
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

  const handleDeleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  const handleDashboardCardClick = useCallback((type: string) => {
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

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage onLogin={handleLogin} />
      </Suspense>
    );
  }

  // Common Props for DashboardPage & KGBDataPage
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
    systemAlerts
  };

  return (
    <MainLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      currentUser={currentUser}
      onLogout={handleLogout}
      systemAlerts={systemAlerts}
      notification={notification}
      onClearNotification={() => setNotification(null)}
      onDismissAlerts={() => setDismissedAlertIds(prev => [...prev, ...systemAlerts.map(a => a.id)])}
      masterEmployeesCount={masterEmployees.length}
      upcomingKGBCount={stats.upcomingKGB}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <div key={currentView} className="w-full">
              {currentView === 'susunan-pegawai' && (
                <DaftarSusunanPegawaiPage 
                  employees={masterEmployees.length > 0 ? masterEmployees : employees} 
                  currentUser={currentUser} 
                />
              )}
              {currentView === 'sticky-notes' && (
                <StickyNotesKanbanPage 
                  currentUser={currentUser} 
                  language={language} 
                />
              )}
              {currentView === 'kenaikan-pangkat' && (
                <PromotionTable 
                  employees={promotionEmployees} 
                  language={language} 
                />
              )}
              {currentView === 'kalender-kp' && (
                <KPCalendar 
                  language={language} 
                />
              )}
              {currentView === 'report' && (
                <ReportPage 
                  employees={employees} 
                  currentUser={currentUser} 
                  language={language} 
                />
              )}
              {currentView === 'report-kp' && (
                <ReportPage 
                  employees={promotionEmployees} 
                  currentUser={currentUser} 
                  isKP={true} 
                  language={language} 
                />
              )}
              {currentView === 'pensiun' && (
                <PensiunTable 
                  employees={employees} 
                  language={language} 
                />
              )}
              {currentView === 'jam-kerja' && (
                <JamKerjaPage 
                  language={language} 
                />
              )}
              {currentView === 'dashboard' && (
                <DashboardPage {...dashboardProps} />
              )}
              {currentView === 'data-kgb' && (
                <KGBDataPage {...dashboardProps} />
              )}
              {currentView === 'faq' && (
                <FAQPage 
                  employees={employees} 
                  language={language} 
                />
              )}
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </MainLayout>
  );
}

export default App;
