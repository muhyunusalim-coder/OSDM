import { Employee, AuthUser, LoginResponse } from '../types';
import { API_ENDPOINTS, MOCK_EMPLOYEES, MOCK_PROMOTION_EMPLOYEES } from '../constants';

// Clean up legacy localStorage & PWA cache artifacts for strict security compliance
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('kgb_emp_cache_v2');
    localStorage.removeItem('kgb_promo_cache_v2');
    localStorage.removeItem('bskji_master_pegawai_cache_v2');
    localStorage.removeItem('kgb_auth_session');
    if ('caches' in window) {
      caches.delete('google-sheets-data-cache').catch(() => {});
    }
  }
} catch (e) {
  // Ignore
}

// Token accessor from memory / sessionStorage (Never store sensitive credentials permanently in localStorage)
export const getAuthToken = (): string | null => {
  try {
    return sessionStorage.getItem('kgb_session_token');
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null): void => {
  try {
    if (token) {
      sessionStorage.setItem('kgb_session_token', token);
    } else {
      sessionStorage.removeItem('kgb_session_token');
    }
  } catch {
    // Ignore
  }
};

// In-Memory Runtime Cache (Zero persistence to localStorage for employee privacy)
let inMemoryEmployees: { data: Employee[]; timestamp: number } | null = null;
let inMemoryPromotions: { data: Employee[]; timestamp: number } | null = null;
let inMemoryMaster: { data: Employee[]; timestamp: number } | null = null;
const IN_MEMORY_CACHE_TTL = 3 * 60 * 1000; // 3 minutes in-memory cache

export const clearDataCache = () => {
  inMemoryEmployees = null;
  inMemoryPromotions = null;
  inMemoryMaster = null;
};

// ==========================================
// AUTHENTICATION SERVICES (BACKEND DRIVEN)
// ==========================================

export const loginWithBackend = async (
  nip: string,
  password: string,
  captcha?: { num1: number; num2: number; answer: string }
): Promise<LoginResponse> => {
  try {
    const res = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nip: nip.trim(),
        password,
        captchaNum1: captcha?.num1,
        captchaNum2: captcha?.num2,
        captchaAnswer: captcha?.answer,
      }),
    });

    const data: LoginResponse = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Otentikasi gagal. Silakan periksa kembali data Anda.');
    }

    if (data.token) {
      setAuthToken(data.token);
    }

    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Koneksi ke server otentikasi gagal.');
  }
};

export const verifyBackendSession = async (): Promise<AuthUser | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(API_ENDPOINTS.AUTH_ME, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      setAuthToken(null);
      return null;
    }

    const data = await res.json();
    return data.success ? data.user : null;
  } catch {
    return null;
  }
};

export const logoutFromBackend = async (): Promise<void> => {
  const token = getAuthToken();
  clearDataCache();
  setAuthToken(null);

  if (token) {
    try {
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors during logout
    }
  }
};

// ==========================================
// PROTECTED DATA FETCHER SERVICES
// ==========================================

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchEmployeeData = async (): Promise<Employee[]> => {
  if (inMemoryEmployees && Date.now() - inMemoryEmployees.timestamp < IN_MEMORY_CACHE_TTL) {
    return inMemoryEmployees.data;
  }

  try {
    const response = await fetch(API_ENDPOINTS.EMPLOYEES, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sesi otentikasi telah berakhir. Silakan login kembali.');
      }
      throw new Error('Gagal mengambil data dari server.');
    }

    const data: Employee[] = await response.json();
    inMemoryEmployees = { data, timestamp: Date.now() };
    return data;
  } catch (error: any) {
    console.warn('Backend fetch error for KGB data. Using fallback.', error);
    if (inMemoryEmployees?.data?.length) return inMemoryEmployees.data;
    
    // Offline fallback for demo
    const mapped = (MOCK_EMPLOYEES as any[]).map((m, i) => ({
      id: `mock-${i}`,
      no: m.No,
      nama: m.Nama,
      nip: m.NIP,
      jabatan: m.Jabatan || '-',
      pangkat: m.Pangkat || '-',
      statusKepegawaian: (m.Pangkat || '').includes('PPPK') ? 'PPPK' : 'PNS',
      gajiLama: parseInt(m['Gaji Lama'] || '0', 10),
      gajiBaru: parseInt(m['Gaji Baru'] || '0', 10),
      masaKerja: '2 Tahun 0 Bulan',
      tmt: m['TMT KGB Baru'] || m['TMT'] || '-',
      unitKerja: m['Unit Kerja'] || '-',
      status: (m['Status KGB'] || '').includes('Terbit') ? 'Processed' : 'Upcoming',
      statusKeterangan: m['Status KGB'] || '',
      salaryHistory: []
    })) as Employee[];
    
    return mapped;
  }
};

export const fetchPromotionData = async (): Promise<Employee[]> => {
  if (inMemoryPromotions && Date.now() - inMemoryPromotions.timestamp < IN_MEMORY_CACHE_TTL) {
    return inMemoryPromotions.data;
  }

  try {
    const response = await fetch(API_ENDPOINTS.PROMOTIONS, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data kenaikan pangkat.');
    }

    const data: Employee[] = await response.json();
    inMemoryPromotions = { data, timestamp: Date.now() };
    return data;
  } catch (error: any) {
    console.warn('Backend fetch error for promotion data.', error);
    if (inMemoryPromotions?.data?.length) return inMemoryPromotions.data;

    const mapped = (MOCK_PROMOTION_EMPLOYEES as any[]).map((m, i) => ({
      id: `mock-promo-${i}`,
      no: m.No,
      nama: m.Nama,
      nip: m.NIP,
      jabatan: '-',
      pangkat: m['Pangkat Baru'] || '-',
      pangkatLama: m['Pangkat Lama'] || '-',
      pangkatBaru: m['Pangkat Baru'] || '-',
      suratUsulan: m['Surat Usulan'] || '-',
      inputSiasn: m['Input Siasn'] || '-',
      statusSiasn: m['Status Siasn'] || '',
      statusKepegawaian: (m['Pangkat Baru'] || '').includes('PPPK') ? 'PPPK' : 'PNS',
      masaKerja: '-',
      gajiLama: 0,
      gajiBaru: 0,
      tmt: m.TMT || '-',
      unitKerja: m['Unit Kerja'] || '-',
      status: (m['Status Siasn'] || '').includes('Terbit') ? 'Processed' : 'Upcoming',
      statusKeterangan: m['Status Siasn'] || '',
    })) as Employee[];

    return mapped;
  }
};

export const fetchMasterPegawaiData = async (): Promise<Employee[]> => {
  if (inMemoryMaster && Date.now() - inMemoryMaster.timestamp < IN_MEMORY_CACHE_TTL) {
    return inMemoryMaster.data;
  }

  try {
    const response = await fetch(API_ENDPOINTS.MASTER_PEGAWAI, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data master pegawai.');
    }

    const data: Employee[] = await response.json();
    inMemoryMaster = { data, timestamp: Date.now() };
    return data;
  } catch (error: any) {
    console.warn('Backend fetch error for master pegawai data.', error);
    return inMemoryMaster?.data || [];
  }
};

export const toggleEmployeeStatusBackend = async (id: string): Promise<Employee> => {
  const response = await fetch(API_ENDPOINTS.TOGGLE_STATUS(id), {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const resData = await response.json();
  if (!response.ok || !resData.success) {
    throw new Error(resData.message || 'Gagal mengubah status pegawai.');
  }

  // Update in-memory cache
  if (inMemoryEmployees) {
    inMemoryEmployees.data = inMemoryEmployees.data.map(emp =>
      emp.id === id ? { ...emp, status: resData.employee?.status || emp.status } : emp
    );
  }

  return resData.employee;
};

// Helper for formatting Golongan/Pangkat
export const formatPangkatGolongan = (raw: string): string => {
  const r = (raw || '').trim().toLowerCase();
  const map: { [key: string]: string } = {
    '4e': 'IV/e (Pembina Utama)',
    '4d': 'IV/d (Pembina Utama Madya)',
    '4c': 'IV/c (Pembina Utama Muda)',
    '4b': 'IV/b (Pembina Tk. I)',
    '4a': 'IV/a (Pembina)',
    '3d': 'III/d (Penata Tk. I)',
    '3c': 'III/c (Penata)',
    '3b': 'III/b (Penata Muda Tk. I)',
    '3a': 'III/a (Penata Muda)',
    '2d': 'II/d (Pengatur Tk. I)',
    '2c': 'II/c (Pengatur)',
    '2b': 'II/b (Pengatur Muda Tk. I)',
    '2a': 'II/a (Pengatur Muda)',
    '1d': 'I/d (Juru Tk. I)',
    '1c': 'I/c (Juru)',
    '1b': 'I/b (Juru Muda Tk. I)',
    '1a': 'I/a (Juru Muda)',
    '5': 'Golongan V (PPPK)',
    '7': 'Golongan VII (PPPK)',
    '9': 'Golongan IX (PPPK)',
    'ix': 'Golongan IX (PPPK)',
    'vii': 'Golongan VII (PPPK)',
    'v': 'Golongan V (PPPK)',
  };
  return map[r] || (raw ? `Golongan ${raw}` : '-');
};
