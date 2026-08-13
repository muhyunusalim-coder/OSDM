
import { Employee } from '../types';
import { CSV_EXPORT_URL, CSV_EXPORT_URL_KENAIKAN_PANGKAT, MOCK_EMPLOYEES, MOCK_PROMOTION_EMPLOYEES } from '../constants';

// Helper to determine status based on Golongan logic
const determineStatusKepegawaian = (pangkat: string): 'PNS' | 'PPPK' | '-' => {
  const p = pangkat.toUpperCase();
  
  // Logic: PPPK = Golongan V - XII (Roman Numerals)
  // Check specifically for PPPK numbers first to avoid confusion
  // Matches: V, VI, VII, VIII, IX, X, XI, XII surrounded by word boundaries, slashes, or parens
  const pppkRegex = /(^|[\s(\/])(V|VI|VII|VIII|IX|X|XI|XII)($|[\s)\/])/;
  
  // Logic: PNS = Golongan I - IV
  // Matches: I, II, III, IV usually followed by slash (e.g., III/a) or just the roman numeral
  const pnsRegex = /(^|[\s(\/])(I|II|III|IV)($|[\s)\/])/;

  if (pppkRegex.test(p)) {
    return 'PPPK';
  }
  
  if (pnsRegex.test(p)) {
    return 'PNS';
  }

  return '-';
};

const parseCSV = (csvText: string): Employee[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Simple CSV parser that handles quotes essentially
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  
  // Helper to find column index based on priority of keywords.
  const getColIndex = (keywords: string[]) => {
    for (const keyword of keywords) {
      const idx = headers.findIndex(h => h.includes(keyword));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxNama = getColIndex(['nama', 'name', 'pegawai']);
  const idxNip = getColIndex(['nip', 'nomor induk']);
  const idxJabatan = getColIndex(['jabatan', 'pekerjaan', 'role', 'position']); 
  const idxPangkat = getColIndex(['pangkat', 'gol', 'golongan']);
  const idxGajiLama = getColIndex(['gaji lama', 'lama', 'old']);
  const idxGajiBaru = getColIndex(['gaji baru', 'baru', 'new']);
  
  // Update: Cari kolom tahun dan bulan terpisah untuk Masa Kerja
  const idxMkThn = getColIndex(['masa kerja tahun', 'mk tahun', 'mk thn', 'mkg tahun', 'mk_thn', 'tahun']);
  const idxMkBln = getColIndex(['masa kerja bulan', 'mk bulan', 'mk bln', 'mkg bulan', 'mk_bln', 'bulan']);
  // Fallback ke kolom gabungan
  const idxMasaKerja = getColIndex(['masa kerja', 'mkg', 'mk', 'years', 'working']); 
  
  // Prioritize "tmt kgb baru" specifically as requested
  const idxTmt = getColIndex(['tmt kgb baru', 'tmt baru', 'tmt', 'tanggal', 'date']);
  
  const idxUnit = getColIndex(['unit', 'kerja', 'skpd']);
  const idxNo = getColIndex(['no', 'nomor']);
  
  // Detect Status Column from DB
  const idxStatus = getColIndex(['status kgb', 'status', 'keterangan', 'ket']);

  return lines.slice(1).map((line, index) => {
    const values: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    // Clean values
    const clean = (v: string) => v ? v.replace(/"/g, '').trim() : '';
    
    // Parse currency
    const parseMoney = (v: string) => {
      if (!v) return 0;
      return parseInt(v.replace(/[^0-9]/g, '') || '0', 10);
    };

    const tmtStr = clean(values[idxTmt] || '');
    const rawStatus = clean(values[idxStatus] || '');
    const normalizedStatus = rawStatus.toLowerCase();
    const pangkatStr = clean(values[idxPangkat] || '-');

    // Determine status logic
    let appStatus: 'Pending' | 'Processed' | 'Upcoming' = 'Upcoming';

    if (normalizedStatus.match(/sudah|selesai|terbit|sk|ok|done/)) {
        appStatus = 'Processed';
    } else {
        // Updated Logic: 
        // We do NOT automatically set status to 'Processed' if the date is past.
        // We let the frontend display "Overdue" (Lewat X Hari) based on TMT calculation
        // unless the database explicitly says it's done.
        appStatus = 'Upcoming';
    }

    // Update: Construct Masa Kerja String dengan Bulan
    let mkFinal = '-';
    // 1. Coba ambil dari kolom terpisah (Tahun & Bulan)
    if (idxMkThn !== -1 && idxMkBln !== -1) {
        const thn = clean(values[idxMkThn]);
        const bln = clean(values[idxMkBln]);
        if (thn || bln) {
             mkFinal = `${thn || '0'} Tahun ${bln || '0'} Bulan`;
        }
    } 
    
    // 2. Fallback ke kolom gabungan jika hasil di atas masih default atau kolom tidak ditemukan
    if (mkFinal === '-' && idxMasaKerja !== -1) {
        mkFinal = clean(values[idxMasaKerja] || '-');
    }

    // Mock salary history for demonstration
    const salaryHistory = [
      { date: '2022-03-01', amount: parseMoney(clean(values[idxGajiLama])) - 100000, description: 'KGB 2022' },
      { date: '2024-03-01', amount: parseMoney(clean(values[idxGajiLama])), description: 'KGB 2024' }
    ];

    return {
      id: `emp-${clean(values[idxNip]) || 'empty'}-${index}`,
      no: clean(values[idxNo] || (index + 1).toString()),
      nama: clean(values[idxNama] || 'Tanpa Nama'),
      nip: clean(values[idxNip] || '-'),
      jabatan: clean(values[idxJabatan] || '-'),
      pangkat: pangkatStr,
      statusKepegawaian: determineStatusKepegawaian(pangkatStr),
      masaKerja: mkFinal, 
      gajiLama: parseMoney(clean(values[idxGajiLama])),
      gajiBaru: parseMoney(clean(values[idxGajiBaru])),
      tmt: tmtStr || '-',
      unitKerja: clean(values[idxUnit] || '-'),
      status: appStatus,
      statusKeterangan: rawStatus,
      salaryHistory: salaryHistory
    };
  });
};

const mapMockData = (mock: any[]): Employee[] => {
  return mock.map((m, i) => {
    const rawStatus = m["Status KGB"] || m["Status"] || "";
    const normalizedStatus = rawStatus.toLowerCase();
    
    let appStatus: 'Pending' | 'Processed' | 'Upcoming' = 'Upcoming';
    
    if (normalizedStatus.match(/sudah|selesai|terbit|sk|ok/)) {
        appStatus = 'Processed';
    } else {
        appStatus = 'Upcoming';
    }

    // Check for separate columns in mock or fallback
    let mk = m["Masa Kerja"] || '-';
    // If mock data has separate keys (future proofing)
    if (m["MK Tahun"] !== undefined || m["MK Bulan"] !== undefined) {
         mk = `${m["MK Tahun"] || 0} Tahun ${m["MK Bulan"] || 0} Bulan`;
    }

    const pangkatStr = m.Pangkat || '-';

    // Mock salary history for demonstration
    const salaryHistory = [
      { date: '2022-03-01', amount: parseInt(m["Gaji Lama"]) - 100000, description: 'KGB 2022' },
      { date: '2024-03-01', amount: parseInt(m["Gaji Lama"]), description: 'KGB 2024' }
    ];

    return {
        id: `mock-${i}`,
        no: m.No,
        nama: m.Nama,
        nip: m.NIP,
        jabatan: m.Jabatan || '-', 
        pangkat: pangkatStr,
        statusKepegawaian: determineStatusKepegawaian(pangkatStr),
        gajiLama: parseInt(m["Gaji Lama"]),
        gajiBaru: parseInt(m["Gaji Baru"]),
        masaKerja: mk,
        tmt: m["TMT KGB Baru"] || m["TMT"], 
        unitKerja: m["Unit Kerja"],
        status: appStatus,
        statusKeterangan: rawStatus,
        salaryHistory: salaryHistory
    };
  });
};

const parsePromotionCSV = (csvText: string): Employee[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  
  const getColIndex = (keywords: string[]) => {
    for (const keyword of keywords) {
      const idx = headers.findIndex(h => h.includes(keyword));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxNo = getColIndex(['no']);
  const idxNama = getColIndex(['nama']);
  const idxNip = getColIndex(['nip']);
  const idxPangkatLama = getColIndex(['pangkat lama']);
  const idxPangkatBaru = getColIndex(['pangkat baru']);
  const idxUnit = getColIndex(['unit']);
  const idxTmt = getColIndex(['tmt']);
  const idxSuratUsulan = getColIndex(['surat usulan', 'usulan']);
  const idxInputSiasn = getColIndex(['input siasn', 'siasn']);
  const idxStatusSiasn = getColIndex(['status siasn', 'status']);

  return lines.slice(1).map((line, index) => {
    const values: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const clean = (v: string) => v ? v.replace(/"/g, '').trim() : '';

    const pangkatBaruStr = clean(values[idxPangkatBaru] || '-');
    const rawStatus = clean(values[idxStatusSiasn] || '');
    const normalizedStatus = rawStatus.toLowerCase();

    let appStatus: 'Pending' | 'Processed' | 'Upcoming' = 'Upcoming';
    if (normalizedStatus.match(/sudah|selesai|terbit|sk|ok|done/)) {
        appStatus = 'Processed';
    } else if (normalizedStatus.match(/batal|tolak/)) {
        appStatus = 'Pending';
    } else {
        appStatus = 'Upcoming';
    }

    return {
      id: `promo-${clean(values[idxNip]) || 'empty'}-${index}`,
      no: clean(values[idxNo] || (index + 1).toString()),
      nama: clean(values[idxNama] || 'Tanpa Nama'),
      nip: clean(values[idxNip] || '-'),
      jabatan: '-', // Not available in new structure
      pangkat: pangkatBaruStr,
      pangkatLama: clean(values[idxPangkatLama] || '-'),
      pangkatBaru: pangkatBaruStr,
      suratUsulan: clean(values[idxSuratUsulan] || '-'),
      inputSiasn: clean(values[idxInputSiasn] || '-'),
      statusSiasn: rawStatus,
      statusKepegawaian: determineStatusKepegawaian(pangkatBaruStr),
      masaKerja: '-',
      gajiLama: 0,
      gajiBaru: 0,
      tmt: clean(values[idxTmt] || '-'),
      unitKerja: clean(values[idxUnit] || '-'),
      status: appStatus,
      statusKeterangan: rawStatus
    };
  });
};

const mapMockPromotionData = (mock: any[]): Employee[] => {
  return mock.map((m, i) => {
    const rawStatus = m["Status Siasn"] || "";
    const normalizedStatus = rawStatus.toLowerCase();
    
    let appStatus: 'Pending' | 'Processed' | 'Upcoming' = 'Upcoming';
    if (normalizedStatus.match(/sudah|selesai|terbit|sk|ok|done/)) {
        appStatus = 'Processed';
    } else if (normalizedStatus.match(/batal|tolak|tidak sesuai/)) {
        appStatus = 'Pending';
    } else {
        appStatus = 'Upcoming';
    }

    const pangkatBaruStr = m["Pangkat Baru"] || '-';

    return {
      id: `mock-promo-${i}`,
      no: m.No,
      nama: m.Nama,
      nip: m.NIP,
      jabatan: '-',
      pangkat: pangkatBaruStr,
      pangkatLama: m["Pangkat Lama"] || '-',
      pangkatBaru: pangkatBaruStr,
      suratUsulan: m["Surat Usulan"] || '-',
      inputSiasn: m["Input Siasn"] || '-',
      statusSiasn: rawStatus,
      statusKepegawaian: determineStatusKepegawaian(pangkatBaruStr),
      masaKerja: '-',
      gajiLama: 0,
      gajiBaru: 0,
      tmt: m.TMT || '-',
      unitKerja: m["Unit Kerja"] || '-',
      status: appStatus,
      statusKeterangan: rawStatus
    };
  });
};

// Persistent & In-Memory Cache with Stale-While-Revalidate
let cachedEmployeeData: { data: Employee[]; timestamp: number } | null = null;
let cachedPromotionData: { data: Employee[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const getLocalCache = <T>(key: string): { data: T; timestamp: number } | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const setLocalCache = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore storage quota errors
  }
};

export const fetchEmployeeData = async (): Promise<Employee[]> => {
  // Check memory cache
  if (cachedEmployeeData && (Date.now() - cachedEmployeeData.timestamp < CACHE_TTL)) {
    return cachedEmployeeData.data;
  }
  
  // Check localStorage cache for instant zero-delay return
  const localCache = getLocalCache<Employee[]>('kgb_emp_cache_v2');
  if (localCache && (Date.now() - localCache.timestamp < CACHE_TTL)) {
    cachedEmployeeData = localCache;
    // Asynchronously revalidate in background without blocking
    fetch(CSV_EXPORT_URL, { credentials: 'omit' }).then(res => res.text()).then(text => {
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        cachedEmployeeData = { data: parsed, timestamp: Date.now() };
        setLocalCache('kgb_emp_cache_v2', parsed);
      }
    }).catch(() => {});
    return localCache.data;
  }

  try {
    const response = await fetch(CSV_EXPORT_URL, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) throw new Error("Empty CSV");
    cachedEmployeeData = { data: parsed, timestamp: Date.now() };
    setLocalCache('kgb_emp_cache_v2', parsed);
    return parsed;
  } catch (error) {
    if (localCache?.data?.length) return localCache.data;
    console.warn("Failed to fetch live data from Google Sheets. Loading mock data.", error);
    const mock = mapMockData(MOCK_EMPLOYEES);
    cachedEmployeeData = { data: mock, timestamp: Date.now() };
    setLocalCache('kgb_emp_cache_v2', mock);
    return mock;
  }
};

export const fetchPromotionData = async (): Promise<Employee[]> => {
  if (cachedPromotionData && (Date.now() - cachedPromotionData.timestamp < CACHE_TTL)) {
    return cachedPromotionData.data;
  }

  const localCache = getLocalCache<Employee[]>('kgb_promo_cache_v2');
  if (localCache && (Date.now() - localCache.timestamp < CACHE_TTL)) {
    cachedPromotionData = localCache;
    fetch(CSV_EXPORT_URL_KENAIKAN_PANGKAT, { credentials: 'omit' }).then(res => res.text()).then(text => {
      const parsed = parsePromotionCSV(text);
      if (parsed.length > 0) {
        cachedPromotionData = { data: parsed, timestamp: Date.now() };
        setLocalCache('kgb_promo_cache_v2', parsed);
      }
    }).catch(() => {});
    return localCache.data;
  }

  try {
    const response = await fetch(CSV_EXPORT_URL_KENAIKAN_PANGKAT, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    const parsed = parsePromotionCSV(text);
    if (parsed.length === 0) throw new Error("Empty CSV");
    cachedPromotionData = { data: parsed, timestamp: Date.now() };
    setLocalCache('kgb_promo_cache_v2', parsed);
    return parsed;
  } catch (error) {
    if (localCache?.data?.length) return localCache.data;
    console.warn("Failed to fetch live promotion data from Google Sheets. Loading mock promotion data.", error);
    const mock = mapMockPromotionData(MOCK_PROMOTION_EMPLOYEES);
    cachedPromotionData = { data: mock, timestamp: Date.now() };
    setLocalCache('kgb_promo_cache_v2', mock);
    return mock;
  }
};

