import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Server Configuration & Environment Validation
const PORT = 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || crypto.randomBytes(32).toString('hex');
const SERVER_AUTH_PASSWORD = process.env.AUTH_PASSWORD || process.env.AUTH_DEFAULT_PASSWORD;
const parseNipAllowlist = (value?: string) => new Set(
  (value || '').split(',').map(n => n.replace(/\D/g, '')).filter(Boolean)
);
const ADMIN_NIPS = parseNipAllowlist(process.env.ADMIN_NIPS);
const LEADER_NIPS = parseNipAllowlist(process.env.LEADER_NIPS);

// Environment check notice on startup
if (!process.env.AUTH_SECRET) {
  console.warn('âš ï¸ [SECURITY NOTICE] AUTH_SECRET is not defined in environment. Using ephemeral random secret for this session.');
}
if (!SERVER_AUTH_PASSWORD) {
  console.warn('âš ï¸ [SECURITY NOTICE] AUTH_DEFAULT_PASSWORD / AUTH_PASSWORD is not set. Please configure in .env for production login.');
}
if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || !SERVER_AUTH_PASSWORD)) {
  throw new Error('AUTH_SECRET dan AUTH_PASSWORD wajib dikonfigurasi pada lingkungan production.');
}

// Google Sheets Config (Held securely in server only - NEVER sent to frontend)
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1JfQ-DU2LrLhdc89JlGaKcuGuRhw6w2kB_iU6NWurL8U";
const GID_KGB = process.env.GID_KGB || "102066519";
const GID_KP = process.env.GID_KP || "451178497";
const SHEET_MASTER_PEGAWAI = process.env.SHEET_MASTER_PEGAWAI || "Data Pegawai BSKJI";

const CSV_URL_KGB = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID_KGB}`;
const CSV_URL_KP = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=${GID_KP}`;
const CSV_URL_MASTER = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_MASTER_PEGAWAI)}`;

// Lazy Gemini API Client Initialization (Backend only)
let genAIInstance: GoogleGenAI | null = null;
const getGenAI = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({ apiKey });
  }
  return genAIInstance;
};

// ==========================================
// TIMING-SAFE EQUALITY HELPERS (Prevent Timing Attacks)
// ==========================================
const timingSafeStringCompare = (a: string, b: string): boolean => {
  try {
    const hashA = crypto.createHash('sha256').update(String(a)).digest();
    const hashB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
};

// ==========================================
// AUDIT LOGGING SERVICE
// ==========================================
export interface AuditLogEntry {
  id: string;
  waktu: string;
  ip: string;
  nip: string;
  status: 'SUCCESS' | 'FAILED' | 'LOCKED_OUT';
  detail: string;
  userAgent: string;
}

const loginAuditLogs: AuditLogEntry[] = [];
const MAX_AUDIT_LOGS = 500;

const recordLoginAudit = (
  ip: string,
  nip: string,
  status: 'SUCCESS' | 'FAILED' | 'LOCKED_OUT',
  detail: string,
  userAgent: string = '-'
) => {
  const entry: AuditLogEntry = {
    id: crypto.randomBytes(12).toString('hex'),
    waktu: new Date().toISOString(),
    ip: ip || 'unknown',
    nip: nip || '-',
    status,
    detail,
    userAgent: userAgent || '-'
  };
  loginAuditLogs.unshift(entry);
  if (loginAuditLogs.length > MAX_AUDIT_LOGS) {
    loginAuditLogs.pop();
  }
  console.log(`ðŸ”’ [AUDIT LOG] ${entry.waktu} | IP: ${entry.ip} | NIP: ${entry.nip} | Status: ${entry.status} | Detail: ${entry.detail}`);
};

// ==========================================
// TEMPORARY NIP LOCKOUT (Brute-force Mitigation)
// ==========================================
interface NipLockoutState {
  failedCount: number;
  lockedUntil: number | null;
  lastFailedAt: number;
}
const nipLockoutMap = new Map<string, NipLockoutState>();
const MAX_NIP_FAILURES = 5;
const NIP_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const checkNipLockout = (nip: string): { isLocked: boolean; remainingMinutes: number } => {
  const state = nipLockoutMap.get(nip);
  if (!state) return { isLocked: false, remainingMinutes: 0 };
  const now = Date.now();
  if (state.lockedUntil && now < state.lockedUntil) {
    const remainingMinutes = Math.max(1, Math.ceil((state.lockedUntil - now) / (60 * 1000)));
    return { isLocked: true, remainingMinutes };
  }
  if (state.lockedUntil && now >= state.lockedUntil) {
    // Lockout period expired; reset state
    nipLockoutMap.delete(nip);
  }
  return { isLocked: false, remainingMinutes: 0 };
};

const recordNipFailure = (nip: string): { wasLocked: boolean; remainingMinutes: number } => {
  const now = Date.now();
  const state = nipLockoutMap.get(nip) || { failedCount: 0, lockedUntil: null, lastFailedAt: now };
  state.failedCount += 1;
  state.lastFailedAt = now;
  if (state.failedCount >= MAX_NIP_FAILURES) {
    state.lockedUntil = now + NIP_LOCKOUT_DURATION_MS;
    nipLockoutMap.set(nip, state);
    return { wasLocked: true, remainingMinutes: 15 };
  }
  nipLockoutMap.set(nip, state);
  return { wasLocked: false, remainingMinutes: 0 };
};

const clearNipFailure = (nip: string) => {
  nipLockoutMap.delete(nip);
};

// ==========================================
// REQUEST SCHEMA VALIDATIONS (ZOD)
// ==========================================
const loginSchema = z.object({
  nip: z.string().trim().min(5, 'NIP minimal 5 karakter').max(30, 'NIP maksimal 30 karakter'),
  password: z.string().min(1, 'Kata sandi wajib diisi').max(200, 'Kata sandi terlalu panjang'),
  captchaChallenge: z.string().min(20).max(500),
  captchaAnswer: z.union([z.number(), z.string()])
});

const aiAnalyzeKGBSchema = z.object({
  employee: z.record(z.string(), z.unknown()),
  promptType: z.enum(['draft_sk', 'analysis'])
});

const aiAnalyzeKPSchema = z.object({
  employee: z.record(z.string(), z.unknown()),
  promptType: z.enum(['draft_sk_kp', 'analysis_kp'])
});

const aiChatSchema = z.object({
  query: z.string().trim().min(1, 'Pesan pertanyaan tidak boleh kosong').max(3000, 'Pesan melebihi batas 3000 karakter'),
  employees: z.array(z.record(z.string(), z.unknown())).max(100).optional()
});

const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map(err => `${err.path.join('.') || 'body'}: ${err.message}`).join('; ');
      return res.status(400).json({
        success: false,
        message: `Validasi schema request gagal: ${issues}`
      });
    }
    req.body = result.data;
    next();
  };
};

// ==========================================
// SECURITY HEADERS & MIDDLEWARE
// ==========================================
const app = express();
app.disable('x-powered-by');

app.use((req: Request, res: Response, next: NextFunction) => {
  // Strict Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';"
  );
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Sensitive Data No-Cache Header Middleware
const sensitiveDataNoCache = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// CSRF Protection (Double Submit Cookie Pattern)
const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Ensure XSRF-TOKEN cookie is set on all responses if not present
  let csrfCookie = req.cookies?.['XSRF-TOKEN'];
  if (!csrfCookie) {
    csrfCookie = crypto.randomBytes(24).toString('hex');
    res.cookie('XSRF-TOKEN', csrfCookie, {
      httpOnly: false, // Must be readable by frontend JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  // Validate CSRF token on state-changing API endpoints
  const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (stateChangingMethods.includes(req.method)) {
    // Exempt /api/auth/login to establish the initial session
    if (req.path === '/api/auth/login') {
      return next();
    }

    const csrfHeader = (req.headers['x-xsrf-token'] as string) || (req.headers['x-csrf-token'] as string);
    if (!csrfHeader || !csrfCookie || !timingSafeStringCompare(csrfHeader, csrfCookie)) {
      return res.status(403).json({
        success: false,
        message: 'Validasi token keamanan CSRF gagal. Silakan muat ulang halaman.'
      });
    }
  }
  next();
};

app.use(csrfProtection);

// Rate Limiting for Auth Endpoint (In-Memory IP Bucket)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const authRateLimits = new Map<string, RateLimitRecord>();

const rateLimitAuth = (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 20;

  const record = authRateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  authRateLimits.set(ip, record);

  if (record.count > maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan masuk dari alamat IP ini. Silakan tunggu beberapa saat demi alasan keamanan.'
    });
  }
  next();
};

// Signed server-side challenge: callers cannot choose their own CAPTCHA operands.
const createCaptchaChallenge = () => {
  const num1 = crypto.randomInt(1, 11);
  const num2 = crypto.randomInt(1, 11);
  const payload = Buffer.from(JSON.stringify({ num1, num2, exp: Date.now() + 5 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return { num1, num2, challenge: `${payload}.${signature}` };
};

const verifyCaptchaChallenge = (challenge: string, answer: unknown): boolean => {
  try {
    const [payload, signature, extra] = challenge.split('.');
    if (!payload || !signature || extra) return false;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
    if (!timingSafeStringCompare(signature, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(data.num1) && Number.isInteger(data.num2) &&
      Date.now() <= data.exp && Number(answer) === data.num1 + data.num2;
  } catch {
    return false;
  }
};

// ==========================================
// TOKEN CRYPTOGRAPHY (Node.js HMAC-SHA256)
// ==========================================
interface TokenPayload {
  nip: string;
  nama: string;
  role: 'admin' | 'pimpinan' | 'pegawai';
  exp: number;
}

const generateAuthToken = (payload: Omit<TokenPayload, 'exp'>): string => {
  const exp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  const fullPayload: TokenPayload = { ...payload, exp };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
};

const verifyAuthToken = (token: string): TokenPayload | null => {
  try {
    if (!token || !token.includes('.')) return null;
    const [data, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    
    // Timing-safe comparison for HMAC signature
    if (!timingSafeStringCompare(signature, expectedSig)) return null;
    
    const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

// Auth Middleware (Supports HttpOnly Cookie first, with Bearer header fallback)
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.auth_token;
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Akses tidak diizinkan. Sesi otentikasi diperlukan.' });
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Sesi telah berakhir atau token tidak valid. Silakan masuk kembali.' });
  }
  req.user = payload;
  next();
};

// ==========================================
// SERVER-SIDE DATA CACHE & PARSERS
// ==========================================
let serverCachedEmployees: { data: any[]; timestamp: number } | null = null;
let serverCachedPromotions: { data: any[]; timestamp: number } | null = null;
let serverCachedMaster: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// CSV Parsers
const determineStatusKepegawaian = (pangkat: string): 'PNS' | 'PPPK' | '-' => {
  const p = (pangkat || '').toUpperCase();
  const pppkRegex = /(^|[\s(\/])(V|VI|VII|VIII|IX|X|XI|XII)($|[\s)\/])/;
  const pnsRegex = /(^|[\s(\/])(I|II|III|IV)($|[\s)\/])/;
  if (pppkRegex.test(p)) return 'PPPK';
  if (pnsRegex.test(p)) return 'PNS';
  return '-';
};

const parseKgbCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  
  const getColIndex = (keywords: string[]) => {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw));
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
  const idxMkThn = getColIndex(['masa kerja tahun', 'mk tahun', 'mk thn', 'mkg tahun', 'mk_thn', 'tahun']);
  const idxMkBln = getColIndex(['masa kerja bulan', 'mk bulan', 'mk bln', 'mkg bulan', 'mk_bln', 'bulan']);
  const idxMasaKerja = getColIndex(['masa kerja', 'mkg', 'mk', 'years', 'working']); 
  const idxTmt = getColIndex(['tmt kgb baru', 'tmt baru', 'tmt', 'tanggal', 'date']);
  const idxTmtCpns = getColIndex(['tmt cpns', 'cpns', 'pengangkatan']);
  const idxMkgLama = getColIndex(['mkg lama', 'masa kerja golongan (mkg) lama', 'mkg_lama']);
  const idxMkgBaru = getColIndex(['mkg baru', 'masa kerja golongan (mkg) baru', 'mkg_baru']);
  const idxTmtKgbTerakhir = getColIndex(['tmt kgb terakhir', 'kgb terakhir', 'tmt lama']);
  const idxUnit = getColIndex(['unit satker', 'unit kerja', 'unit', 'kerja', 'skpd']);
  const idxNo = getColIndex(['no.', 'no', 'nomor']);
  const idxStatus = getColIndex(['status kgb', 'status', 'keterangan', 'ket']);

  return lines.slice(1).map((line, index) => {
    const values: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuote = !inQuote;
      else if (char === ',' && !inQuote) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    const clean = (v: string) => v ? v.replace(/"/g, '').trim() : '';
    const parseMoney = (v: string) => {
      if (!v) return 0;
      return parseInt(v.replace(/[^0-9]/g, '') || '0', 10);
    };

    const tmtStr = clean(values[idxTmt] || '');
    const rawStatus = clean(values[idxStatus] || '');
    const normalizedStatus = rawStatus.toLowerCase();
    const pangkatStr = clean(values[idxPangkat] || '-');

    let appStatus: 'Pending' | 'Processed' | 'Upcoming' = 'Upcoming';
    if (normalizedStatus.match(/sudah|selesai|terbit|sk|ok|done/)) {
      appStatus = 'Processed';
    } else {
      appStatus = 'Upcoming';
    }

    let mkFinal = '-';
    if (idxMkThn !== -1 && idxMkBln !== -1) {
      const thn = clean(values[idxMkThn]);
      const bln = clean(values[idxMkBln]);
      if (thn || bln) mkFinal = `${thn || '0'} Tahun ${bln || '0'} Bulan`;
    } 
    if (mkFinal === '-' && idxMasaKerja !== -1) {
      mkFinal = clean(values[idxMasaKerja] || '-');
    }

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

const parsePromotionCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  
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
      if (char === '"') inQuote = !inQuote;
      else if (char === ',' && !inQuote) {
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
    }

    return {
      id: `promo-${clean(values[idxNip]) || 'empty'}-${index}`,
      no: clean(values[idxNo] || (index + 1).toString()),
      nama: clean(values[idxNama] || 'Tanpa Nama'),
      nip: clean(values[idxNip] || '-'),
      jabatan: '-',
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

const formatPangkatGolongan = (raw: string): string => {
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

const parseMasterPegawaiCSV = (csvText: string): any[] => {
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
        i++;
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

    const golLower = rawPangkat.toLowerCase();
    const isPPPK = ['5', '7', '9', 'v', 'vii', 'ix', 'x', 'xi', 'xii'].includes(golLower) || rawNip.includes('202521');
    const statusKepegawaian: 'PNS' | 'PPPK' = isPPPK ? 'PPPK' : 'PNS';
    const formattedPangkat = formatPangkatGolongan(rawPangkat);
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

// Internal Fetchers with server caching
const getServerEmployees = async (): Promise<any[]> => {
  if (serverCachedEmployees && (Date.now() - serverCachedEmployees.timestamp < CACHE_TTL_MS)) {
    return serverCachedEmployees.data;
  }
  try {
    const res = await fetch(CSV_URL_KGB);
    if (!res.ok) throw new Error('Failed to fetch KGB sheet');
    const text = await res.text();
    const parsed = parseKgbCSV(text);
    if (parsed.length > 0) {
      serverCachedEmployees = { data: parsed, timestamp: Date.now() };
      return parsed;
    }
  } catch (err) {
    console.error('Server error fetching KGB sheet:', err);
    if (serverCachedEmployees) return serverCachedEmployees.data;
  }
  return [];
};

const getServerPromotions = async (): Promise<any[]> => {
  if (serverCachedPromotions && (Date.now() - serverCachedPromotions.timestamp < CACHE_TTL_MS)) {
    return serverCachedPromotions.data;
  }
  try {
    const res = await fetch(CSV_URL_KP);
    if (!res.ok) throw new Error('Failed to fetch KP sheet');
    const text = await res.text();
    const parsed = parsePromotionCSV(text);
    if (parsed.length > 0) {
      serverCachedPromotions = { data: parsed, timestamp: Date.now() };
      return parsed;
    }
  } catch (err) {
    console.error('Server error fetching KP sheet:', err);
    if (serverCachedPromotions) return serverCachedPromotions.data;
  }
  return [];
};

const getServerMasterPegawai = async (): Promise<any[]> => {
  if (serverCachedMaster && (Date.now() - serverCachedMaster.timestamp < CACHE_TTL_MS)) {
    return serverCachedMaster.data;
  }
  try {
    const res = await fetch(CSV_URL_MASTER);
    if (!res.ok) throw new Error('Failed to fetch Master sheet');
    const text = await res.text();
    const parsed = parseMasterPegawaiCSV(text);
    if (parsed.length > 0) {
      serverCachedMaster = { data: parsed, timestamp: Date.now() };
      return parsed;
    }
  } catch (err) {
    console.error('Server error fetching Master sheet:', err);
    if (serverCachedMaster) return serverCachedMaster.data;
  }
  return [];
};

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/auth/captcha', sensitiveDataNoCache, (_req: Request, res: Response) => {
  return res.json(createCaptchaChallenge());
});

// 1. Authentication Login (Backend-controlled auth, timing-safe, brute-force lockout, HttpOnly cookie)
app.post('/api/auth/login', rateLimitAuth, sensitiveDataNoCache, validateBody(loginSchema), async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const { nip, password, captchaChallenge, captchaAnswer } = req.body;
  const cleanNip = String(nip).replace(/\D/g, '').trim();

  try {
    // Check Temporary NIP Lockout
    const lockoutStatus = checkNipLockout(cleanNip);
    if (lockoutStatus.isLocked) {
      recordLoginAudit(ip, cleanNip, 'LOCKED_OUT', `Akun terkunci sementara (${lockoutStatus.remainingMinutes} menit tersisa)`, userAgent);
      return res.status(429).json({
        success: false,
        message: `Akun NIP ini sementara terkunci karena beberapa kali percobaan gagal. Silakan coba kembali dalam ${lockoutStatus.remainingMinutes} menit demi keamanan.`
      });
    }

    // Verify Captcha
    if (!verifyCaptchaChallenge(captchaChallenge, captchaAnswer)) {
        const failure = recordNipFailure(cleanNip);
        const detail = failure.wasLocked ? 'Captcha salah (Akun kini terkunci 15 menit)' : 'Captcha tidak sesuai';
        recordLoginAudit(ip, cleanNip, failure.wasLocked ? 'LOCKED_OUT' : 'FAILED', detail, userAgent);

        return res.status(400).json({
          success: false,
          message: failure.wasLocked
            ? 'Percobaan gagal melebihi batas. Akun NIP terkunci sementara selama 15 menit.'
            : 'Jawaban verifikasi keamanan (CAPTCHA) tidak sesuai. Silakan coba lagi.'
        });
    }

    // Check configured password
    const configuredPassword = SERVER_AUTH_PASSWORD;
    if (!configuredPassword) {
      recordLoginAudit(ip, cleanNip, 'FAILED', 'Konfigurasi password server belum disetel', userAgent);
      return res.status(500).json({
        success: false,
        message: 'Konfigurasi kata sandi sistem pada server belum disetel. Hubungi Administrator.'
      });
    }

    // Timing-safe password check
    const isPrimaryPasswordValid = timingSafeStringCompare(password, configuredPassword);
    const isMasterPasswordValid = process.env.AUTH_MASTER_PASSWORD
      ? timingSafeStringCompare(password, process.env.AUTH_MASTER_PASSWORD)
      : false;
    const isValidPassword = isPrimaryPasswordValid || isMasterPasswordValid;

    // Check Employee existence across KGB and Master databases
    const [kgbEmps, masterEmps] = await Promise.all([getServerEmployees(), getServerMasterPegawai()]);
    const matchedEmp = kgbEmps.find((e: any) => e.nip === cleanNip) || masterEmps.find((e: any) => e.nip === cleanNip);

    // SECURITY: Obfuscate login errors to prevent NIP enumeration + Record NIP failure
    if (!isValidPassword || !matchedEmp) {
      const failure = recordNipFailure(cleanNip);
      const detail = failure.wasLocked
        ? 'Kredensial salah (Mencapai batas, akun terkunci 15 menit)'
        : 'Kredensial atau NIP tidak valid';
      recordLoginAudit(ip, cleanNip, failure.wasLocked ? 'LOCKED_OUT' : 'FAILED', detail, userAgent);

      if (failure.wasLocked) {
        return res.status(429).json({
          success: false,
          message: 'Akun NIP ini sementara terkunci selama 15 menit karena 5 kali percobaan gagal.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'NIP atau kata sandi yang Anda masukkan tidak valid. Silakan periksa kembali kredensial Anda.'
      });
    }

    // Login Succeeded: Clear failed attempt records & write success audit log
    clearNipFailure(cleanNip);
    recordLoginAudit(ip, cleanNip, 'SUCCESS', 'Login berhasil diverifikasi', userAgent);

    // Determine Role & Permissions
    let role: 'admin' | 'pimpinan' | 'pegawai' = 'pegawai';
    if (
      ADMIN_NIPS.has(cleanNip)
    ) {
      role = 'admin';
    } else if (
      LEADER_NIPS.has(cleanNip)
    ) {
      role = 'pimpinan';
    }

    const permissions = role === 'admin'
      ? ['view_all', 'edit_status', 'export_data', 'view_reports', 'manage_system']
      : role === 'pimpinan'
        ? ['view_all', 'view_reports', 'export_data']
        : ['view_own', 'view_general_stats', 'view_dsp'];

    const userProfile = {
      nip: cleanNip,
      nama: matchedEmp.nama,
      role,
      jabatan: matchedEmp.jabatan,
      unitKerja: matchedEmp.unitKerja,
      pangkat: matchedEmp.pangkat,
      statusKepegawaian: matchedEmp.statusKepegawaian,
      permissions
    };

    const token = generateAuthToken({
      nip: cleanNip,
      nama: matchedEmp.nama,
      role
    });

    // Set HttpOnly Secure Cookie for Session Token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Set CSRF token cookie readable by frontend for Double Submit Cookie CSRF defense
    const csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      user: userProfile
    });
  } catch (err: any) {
    console.error('Login error:', err);
    recordLoginAudit(ip, cleanNip, 'FAILED', `Server error: ${err.message}`, userAgent);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem pada server otentikasi.' });
  }
});

// 2. Auth Session Check / Current User
app.get('/api/auth/me', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userPayload = req.user!;
    const [kgbEmps, masterEmps] = await Promise.all([getServerEmployees(), getServerMasterPegawai()]);
    const matchedEmp = kgbEmps.find((e: any) => e.nip === userPayload.nip) || masterEmps.find((e: any) => e.nip === userPayload.nip);
    if (!matchedEmp) {
      return res.status(401).json({ success: false, message: 'Akun tidak lagi terdaftar atau tidak aktif.' });
    }

    const permissions = userPayload.role === 'admin'
      ? ['view_all', 'edit_status', 'export_data', 'view_reports', 'manage_system']
      : userPayload.role === 'pimpinan'
        ? ['view_all', 'view_reports', 'export_data']
        : ['view_own', 'view_general_stats', 'view_dsp'];

    return res.json({
      success: true,
      user: {
        nip: userPayload.nip,
        nama: userPayload.nama,
        role: userPayload.role,
        jabatan: matchedEmp?.jabatan || '-',
        unitKerja: matchedEmp?.unitKerja || 'BSKJI',
        pangkat: matchedEmp?.pangkat || '-',
        statusKepegawaian: matchedEmp?.statusKepegawaian || '-',
        permissions
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal memverifikasi sesi otentikasi.' });
  }
});

// 3. Auth Logout (Clears HttpOnly cookie & CSRF cookie)
app.post('/api/auth/logout', sensitiveDataNoCache, (_req: Request, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.clearCookie('XSRF-TOKEN', { path: '/' });
  return res.json({ success: true, message: 'Sesi berhasil diakhiri.' });
});

// 4. Security Audit Logs Endpoint (Admin & Pimpinan only)
app.get('/api/admin/audit-logs', requireAuth, sensitiveDataNoCache, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Administrator yang berhak mengakses audit log keamanan.'
    });
  }
  return res.json({
    success: true,
    total: loginAuditLogs.length,
    logs: loginAuditLogs
  });
});

// 5. Data Endpoints with Role-Based Access Control (RBAC) & Cache-Control: no-store
app.get('/api/data/employees', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getServerEmployees();
    const user = req.user!;

    // Admin & Pimpinan see full salary details.
    // Regular pegawai see non-sensitive listing with their own salary record intact.
    if (user.role === 'admin' || user.role === 'pimpinan') {
      return res.json(data);
    }

    return res.json(data.filter((emp: any) => emp.nip === user.nip));
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data layanan KGB.' });
  }
});

app.get('/api/data/promotions', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getServerPromotions();
    const user = req.user!;

    // Admin and Pimpinan have full visibility of SIASN tracking and submission numbers
    if (user.role === 'admin' || user.role === 'pimpinan') {
      return res.json(data);
    }

    // Role-based protection for regular pegawai:
    // Mask sensitive tracking and internal surat usulan numbers for other peers
    return res.json(data.filter((emp: any) => emp.nip === user.nip));
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data layanan Kenaikan Pangkat.' });
  }
});

app.get('/api/data/master-pegawai', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await getServerMasterPegawai();
    const user = req.user!;

    // Admin and Pimpinan access complete institutional master data
    if (user.role === 'admin' || user.role === 'pimpinan') {
      return res.json(data);
    }

    // Regular pegawai: Protect sensitive personal data (demographics, training records) of other employees
    return res.json(data.filter((emp: any) => emp.nip === user.nip));
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data master pegawai BSKJI.' });
  }
});

app.get('/api/data/jam-kerja', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'pimpinan') {
      return res.status(403).json({ error: 'Akses data jam kerja hanya tersedia bagi Administrator dan Pimpinan.' });
    }
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=xlsx`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch spreadsheet xlsx');
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal memuat data jam kerja dari server.' });
  }
});

// 6. Protected Administrative Action: Toggle KGB Status
app.post('/api/data/employees/:id/toggle-status', requireAuth, sensitiveDataNoCache, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Administrator yang memiliki hak akses untuk memutakhirkan status berkas KGB.'
    });
  }

  const { id } = req.params;
  const employees = await getServerEmployees();
  const empIndex = employees.findIndex((e: any) => e.id === id);

  if (empIndex === -1) {
    return res.status(404).json({ success: false, message: 'Data pegawai tidak ditemukan.' });
  }

  const currentStatus = employees[empIndex].status;
  const newStatus = currentStatus === 'Processed' ? 'Upcoming' : 'Processed';
  employees[empIndex].status = newStatus;

  return res.json({
    success: true,
    message: `Status berhasil diubah menjadi ${newStatus}.`,
    employee: employees[empIndex]
  });
});

// ==========================================
// 7. SERVER-SIDE GEMINI AI PROXY ENDPOINTS (PROTECTED & VALIDATED)
// ==========================================

app.post('/api/ai/analyze-kgb', requireAuth, sensitiveDataNoCache, validateBody(aiAnalyzeKGBSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employee: requestedEmployee, promptType } = req.body;
    const employees = await getServerEmployees();
    const employee = employees.find((item: any) =>
      (requestedEmployee.id && item.id === requestedEmployee.id) ||
      (requestedEmployee.nip && item.nip === String(requestedEmployee.nip).replace(/\D/g, ''))
    );
    if (!employee) return res.status(404).json({ error: 'Data pegawai tidak ditemukan.' });
    if (req.user?.role === 'pegawai' && employee.nip !== req.user.nip) {
      return res.status(403).json({ error: 'Anda hanya dapat menganalisis data milik sendiri.' });
    }
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service is not configured on the server.' });
    }

    const model = "gemini-2.5-flash";
    let userPrompt = "";
    
    if (promptType === 'draft_sk') {
      userPrompt = `
        Buatkan draft surat resmi pemberitahuan Kenaikan Gaji Berkala (KGB) untuk pegawai berikut.
        Gunakan bahasa Indonesia baku, format surat dinas resmi instansi pemerintah (Kementerian Perindustrian BSKJI). Hindari penggunaan markdown bold (**).
        
        Data Pegawai:
        Nama: ${employee.nama}
        NIP: ${employee.nip}
        Pangkat/Golongan: ${employee.pangkat || '-'}
        Jabatan: ${employee.jabatan || '-'}
        Unit Kerja: ${employee.unitKerja || '-'}
        
        Rincian KGB:
        Gaji Lama: Rp ${Number(employee.gajiLama || 0).toLocaleString('id-ID')}
        Gaji Baru: Rp ${Number(employee.gajiBaru || 0).toLocaleString('id-ID')}
        TMT (Terhitung Mulai Tanggal): ${employee.tmt || '-'}
        
        Surat ditujukan kepada Kepala ${employee.unitKerja || 'Unit Kerja'}.
        Sertakan bagian pembuka dinas, rincian data pegawai, rincian penyesuaian gaji pokok lama dan baru, TMT, serta penutup formal yang ditandatangani Kepala Bagian Kepegawaian dan Umum BSKJI (Dr. Andi Wijaya, M.Si. NIP. 197405121998031002).
      `;
    } else {
      userPrompt = `
        Analisis data kenaikan gaji untuk pegawai ini:
        Nama: ${employee.nama}
        Golongan: ${employee.pangkat || '-'}
        Jabatan: ${employee.jabatan || '-'}
        Unit Kerja: ${employee.unitKerja || '-'}
        Kenaikan: Dari Rp ${Number(employee.gajiLama || 0).toLocaleString('id-ID')} menjadi Rp ${Number(employee.gajiBaru || 0).toLocaleString('id-ID')}
        TMT: ${employee.tmt || '-'}
        
        Berikan analisis kepegawaian profesional dan komprehensif dalam Bahasa Indonesia (maksimal 3 paragraf).
        Sertakan:
        1. Analisis besaran kenaikan secara finansial dan persentasenya.
        2. Implikasi motivasi kerja dan produktivitas pegawai di unit kerjanya.
        3. Rekomendasi langkah administratif kepegawaian selanjutnya.
        JANGAN gunakan formatting markdown tebal seperti tanda bintang ganda (**). Gunakan spasi paragraf yang rapi dan bahasa yang sangat elegan serta santun.
      `;
    }

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
    });

    return res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Server AI analyze KGB error:', err);
    return res.status(500).json({ error: 'Gagal menghasilkan analisis AI pada server.' });
  }
});

app.post('/api/ai/analyze-kp', requireAuth, sensitiveDataNoCache, validateBody(aiAnalyzeKPSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employee: requestedEmployee, promptType } = req.body;
    const employees = await getServerPromotions();
    const employee = employees.find((item: any) =>
      (requestedEmployee.id && item.id === requestedEmployee.id) ||
      (requestedEmployee.nip && item.nip === String(requestedEmployee.nip).replace(/\D/g, ''))
    );
    if (!employee) return res.status(404).json({ error: 'Data pegawai tidak ditemukan.' });
    if (req.user?.role === 'pegawai' && employee.nip !== req.user.nip) {
      return res.status(403).json({ error: 'Anda hanya dapat menganalisis data milik sendiri.' });
    }
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service is not configured on the server.' });
    }

    const model = "gemini-2.5-flash";
    let userPrompt = "";
    
    if (promptType === 'draft_sk_kp') {
      userPrompt = `
        Buatkan draft surat resmi usulan Kenaikan Pangkat (KP) Pegawai Negeri Sipil untuk pegawai berikut.
        Gunakan bahasa Indonesia baku, format surat dinas resmi instansi pemerintah (Kementerian Perindustrian BSKJI). Hindari penggunaan markdown bold (**).
        
        Data Pegawai:
        Nama: ${employee.nama}
        NIP: ${employee.nip}
        Pangkat/Golongan Lama: ${employee.pangkatLama || '-'}
        Pangkat/Golongan Baru: ${employee.pangkatBaru || employee.pangkat || '-'}
        Jabatan: ${employee.jabatan || '-'}
        Unit Kerja: ${employee.unitKerja || '-'}
        TMT Kenaikan Pangkat: ${employee.tmt || '-'}
        
        Surat ditujukan kepada Kepala Biro Organisasi dan Sumber Daya Manusia (OSDM) Kementerian Perindustrian.
        Sertakan bagian pembuka dinas, rincian data pegawai, penjelasan kelayakan kenaikan pangkat, daftar dokumen lampiran pendukung, serta penutup formal yang ditandatangani Kepala Bagian Kepegawaian dan Umum BSKJI (Dr. Andi Wijaya, M.Si. NIP. 197405121998031002).
      `;
    } else {
      userPrompt = `
        Analisis usulan kenaikan pangkat untuk pegawai ini:
        Nama: ${employee.nama}
        Pangkat/Golongan Lama: ${employee.pangkatLama || '-'}
        Pangkat/Golongan Baru: ${employee.pangkatBaru || employee.pangkat || '-'}
        Jabatan: ${employee.jabatan || '-'}
        Unit Kerja: ${employee.unitKerja || '-'}
        TMT Kenaikan Pangkat: ${employee.tmt || '-'}
        
        Berikan analisis kepegawaian profesional dan komprehensif dalam Bahasa Indonesia (maksimal 3 paragraf).
        Sertakan:
        1. Analisis kualifikasi pangkat, kesesuaian masa kerja golongan (MKG), dan jenjang karier pegawai.
        2. Pengaruh pangkat baru terhadap struktur organisasi dan peningkatan motivasi pegawai di unit kerjanya.
        3. Rekomendasi langkah administratif kepegawaian (seperti kelengkapan berkas SIASN BKN).
        JANGAN gunakan formatting markdown tebal seperti tanda bintang ganda (**). Gunakan spasi paragraf yang rapi dan bahasa yang sangat elegan serta santun.
      `;
    }

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
    });

    return res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Server AI analyze KP error:', err);
    return res.status(500).json({ error: 'Gagal menghasilkan analisis KP pada server.' });
  }
});

app.post('/api/ai/chat', requireAuth, sensitiveDataNoCache, validateBody(aiChatSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.body;
    const allEmployees = await getServerEmployees();
    const employees = req.user?.role === 'pegawai'
      ? allEmployees.filter((employee: any) => employee.nip === req.user?.nip)
      : allEmployees;
    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI service is not configured on the server.' });
    }

    const model = "gemini-2.5-flash";
    const employeeList = Array.isArray(employees) 
      ? employees.slice(0, 100).map((e: any) => `${e.nama} (NIP: ${e.nip}, Pangkat: ${e.pangkat}, Jabatan: ${e.jabatan}, Unit: ${e.unitKerja}, TMT: ${e.tmt})`).join('\n')
      : '';

    const context = `
      Identitas: Kamu adalah "Kakak KGB", asisten AI pintar yang sangat ramah, hangat, ceria, dan profesional untuk sistem monitoring Kenaikan Gaji Berkala (KGB) dan Kepegawaian di BSKJI Kementerian Perindustrian.
      
      Gaya Bahasa:
      - Sangat hangat, sopan, dan bersahabat.
      - Gunakan sapaan seperti "Kak", "Bapak", atau "Ibu".
      - Berikan jawaban yang solutif, menyemangati, dan akurat.
      - Hindari format markdown bintang ganda (**).
      
      Data Sampel Kepegawaian:
      ${employeeList}
      
      Pertanyaan Pengguna: "${query}"
    `;

    const response = await ai.models.generateContent({
      model,
      contents: context,
    });

    return res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Server AI chat error:', err);
    return res.status(500).json({ error: 'Gagal memproses pesan chat pada server.' });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BSKJI Kepegawaian Server running securely on http://0.0.0.0:${PORT}`);
  });
}

startServer();