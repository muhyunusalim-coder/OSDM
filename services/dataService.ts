
import { Employee } from '../types';
import { CSV_EXPORT_URL, CSV_EXPORT_URL_KENAIKAN_PANGKAT, CSV_EXPORT_URL_MASTER_PEGAWAI, MOCK_EMPLOYEES, MOCK_PROMOTION_EMPLOYEES } from '../constants';

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
  const idxTmtCpns = getColIndex(['tmt cpns', 'cpns', 'pengangkatan']);
  const idxMkgLama = getColIndex(['mkg lama', 'masa kerja golongan (mkg) lama', 'mkg_lama']);
  const idxMkgBaru = getColIndex(['mkg baru', 'masa kerja golongan (mkg) baru', 'mkg_baru']);
  const idxTmtKgbTerakhir = getColIndex(['tmt kgb terakhir', 'kgb terakhir', 'tmt lama']);
  
  const idxUnit = getColIndex(['unit satker', 'unit kerja', 'unit', 'kerja', 'skpd']);
  const idxNo = getColIndex(['no.', 'no', 'nomor']);
  
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
      tmtCpns: idxTmtCpns !== -1 ? clean(values[idxTmtCpns]) : undefined,
      mkgLama: idxMkgLama !== -1 ? clean(values[idxMkgLama]) : undefined,
      mkgBaru: idxMkgBaru !== -1 ? clean(values[idxMkgBaru]) : undefined,
      tmtKgbTerakhir: idxTmtKgbTerakhir !== -1 ? clean(values[idxTmtKgbTerakhir]) : undefined,
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

// ==========================================
// MASTER PEGAWAI BSKJI (2.593 PEGAWAI)
// ==========================================

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

const determineJenjangPendidikan = (pend: string): string => {
  const p = (pend || '').toUpperCase();
  if (p.includes('S3') || p.includes('S-3') || p.includes('DOKTOR')) return 'S3 (Doktor)';
  if (p.includes('S2') || p.includes('S-2') || p.includes('MAGISTER')) return 'S2 (Magister)';
  if (p.includes('S1') || p.includes('S-1') || p.includes('SARJANA') || p.includes('D4') || p.includes('D-IV')) return 'S1 / D4 (Sarjana)';
  if (p.includes('D3') || p.includes('D-III') || p.includes('DIPLOMA')) return 'D3 (Diploma)';
  if (p.includes('SMA') || p.includes('SMK') || p.includes('SLTA') || p.includes('STM') || p.includes('MADRASAH ALIYAH')) return 'SMA / SMK';
  if (p.includes('SMP') || p.includes('SLTP')) return 'SMP';
  if (p.includes('SD')) return 'SD';
  return '-';
};

const parseMasterPegawaiCSV = (csvText: string): Employee[] => {
  // Robust CSV parser supporting multiline cells within double quotes
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  // Headers: "No.","Nama.","NIP.","Jenis Kelamin / Usia","Pangkat Gol/Ruang","Jabatan","TMT","Masa Kerja","Pendidikan","Diklat Struktural"
  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const getColIndex = (keywords: string[]) => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxNo = getColIndex(['no']);
  const idxNama = getColIndex(['nama']);
  const idxNip = getColIndex(['nip']);
  const idxGenderUsia = getColIndex(['jeniskelamin', 'usia', 'gender']);
  const idxPangkat = getColIndex(['pangkat', 'gol', 'ruang']);
  const idxJabatan = getColIndex(['jabatan', 'posisi', 'role']);
  const idxTmt = getColIndex(['tmt']);
  const idxMasaKerja = getColIndex(['masakerja', 'mk']);
  const idxPendidikan = getColIndex(['pendidikan']);
  const idxDiklat = getColIndex(['diklat']);

  const clean = (val?: string) => (val || '').replace(/^["']|["']$/g, '').trim();

  return rows.slice(1).map((values, index) => {
    const rawNo = idxNo !== -1 ? clean(values[idxNo]) : (index + 1).toString();
    const rawNama = idxNama !== -1 ? clean(values[idxNama]) : 'Tanpa Nama';
    const rawNip = idxNip !== -1 ? clean(values[idxNip]) : '-';
    const rawGenderUsia = idxGenderUsia !== -1 ? clean(values[idxGenderUsia]) : '';
    const rawPangkat = idxPangkat !== -1 ? clean(values[idxPangkat]) : '';
    const rawJabatan = idxJabatan !== -1 ? clean(values[idxJabatan]) : '-';
    const rawTmt = idxTmt !== -1 ? clean(values[idxTmt]) : '-';
    const rawMasaKerja = idxMasaKerja !== -1 ? clean(values[idxMasaKerja]) : '-';
    const rawPendidikan = idxPendidikan !== -1 ? clean(values[idxPendidikan]) : '';
    const rawDiklat = idxDiklat !== -1 ? clean(values[idxDiklat]) : '';

    // Parse Gender and Age
    let jenisKelamin = '-';
    let usia: string | number = '-';
    if (rawGenderUsia) {
      const parts = rawGenderUsia.split('/');
      jenisKelamin = parts[0]?.trim() || '-';
      if (parts[1]) {
        const ageMatch = parts[1].match(/(\d+)/);
        usia = ageMatch ? parseInt(ageMatch[1], 10) : parts[1].trim();
      }
    }

    // Determine Status Kepegawaian (PNS vs PPPK)
    const golLower = rawPangkat.toLowerCase();
    const isPPPK = ['5', '7', '9', 'v', 'vii', 'ix', 'x', 'xi', 'xii'].includes(golLower) || rawNip.includes('202521');
    const statusKepegawaian: 'PNS' | 'PPPK' = isPPPK ? 'PPPK' : 'PNS';

    // Formatted Pangkat & Golongan
    const formattedPangkat = formatPangkatGolongan(rawPangkat);

    // Education
    const firstEduLine = rawPendidikan.split('\n')[0] || rawPendidikan;
    const jenjangPendidikan = determineJenjangPendidikan(rawPendidikan);

    return {
      id: `master-emp-${rawNip || index}`,
      no: rawNo || (index + 1).toString(),
      nama: rawNama,
      nip: rawNip,
      jabatan: rawJabatan,
      pangkat: formattedPangkat,
      golonganRaw: rawPangkat,
      statusKepegawaian,
      jenisKelamin,
      usia,
      pendidikan: rawPendidikan,
      pendidikanTerakhir: firstEduLine,
      jenjangPendidikan,
      diklatStruktural: rawDiklat,
      masaKerja: rawMasaKerja,
      tmt: rawTmt,
      unitKerja: 'Badan Standardisasi dan Kebijakan Jasa Industri (BSKJI)',
      gajiLama: 0,
      gajiBaru: 0,
      status: 'Upcoming'
    };
  });
};

let cachedMasterData: { data: Employee[]; timestamp: number } | null = null;

export const fetchMasterPegawaiData = async (): Promise<Employee[]> => {
  if (cachedMasterData && (Date.now() - cachedMasterData.timestamp < CACHE_TTL)) {
    return cachedMasterData.data;
  }

  const localCache = getLocalCache<Employee[]>('bskji_master_pegawai_cache_v2');
  if (localCache && (Date.now() - localCache.timestamp < CACHE_TTL)) {
    cachedMasterData = localCache;
    fetch(CSV_EXPORT_URL_MASTER_PEGAWAI, { credentials: 'omit' })
      .then(res => res.text())
      .then(text => {
        const parsed = parseMasterPegawaiCSV(text);
        if (parsed.length > 0) {
          cachedMasterData = { data: parsed, timestamp: Date.now() };
          setLocalCache('bskji_master_pegawai_cache_v2', parsed);
        }
      })
      .catch(() => {});
    return localCache.data;
  }

  try {
    const response = await fetch(CSV_EXPORT_URL_MASTER_PEGAWAI, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    const parsed = parseMasterPegawaiCSV(text);
    if (parsed.length === 0) throw new Error("Empty CSV");
    cachedMasterData = { data: parsed, timestamp: Date.now() };
    setLocalCache('bskji_master_pegawai_cache_v2', parsed);
    return parsed;
  } catch (error) {
    if (localCache?.data?.length) return localCache.data;
    console.warn("Failed to fetch live master pegawai data from Google Sheets.", error);
    return [];
  }
};


