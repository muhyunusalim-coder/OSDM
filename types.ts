export interface SalaryHistory {
  date: string;
  amount: number;
  description: string;
}

export interface Employee {
  id: string;
  no: string;
  nama: string;
  nip: string;
  jabatan: string;
  pangkat: string;
  pangkatLama?: string;
  pangkatBaru?: string;
  suratUsulan?: string;
  inputSiasn?: string;
  statusSiasn?: string;
  statusKepegawaian: 'PNS' | 'PPPK' | '-'; // Field status ASN
  jenisKelamin?: string; // 'Laki-laki' | 'Perempuan'
  usia?: string | number; // e.g. 51 atau "51 th"
  pendidikan?: string; // Riwayat pendidikan lengkap
  pendidikanTerakhir?: string; // e.g. S2 Manajemen Teknologi
  jenjangPendidikan?: string; // 'S3' | 'S2' | 'S1' | 'D3' | 'SMA/SMK' | '-'
  diklatStruktural?: string; // Riwayat Diklat Struktural
  golonganRaw?: string; // Raw input seperti "4c", "9", "3a"
  gajiLama: number;
  gajiBaru: number;
  masaKerja: string; 
  tmt: string; 
  tmtCpns?: string;
  mkgLama?: string;
  mkgBaru?: string;
  tmtKgbTerakhir?: string;
  unitKerja: string;
  status: 'Pending' | 'Processed' | 'Upcoming';
  statusKeterangan?: string; 
  salaryHistory?: SalaryHistory[];
}

export interface DashboardStats {
  totalEmployees: number;
  upcomingKGB: number;
  processedKGB: number;
  pendingKGB: number;
  nextMonthName?: string;
  nextMonthYear?: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export type UserRole = 'admin' | 'pimpinan' | 'pegawai';

export interface AuthUser {
  nip: string;
  nama: string;
  role: UserRole;
  jabatan?: string;
  unitKerja?: string;
  pangkat?: string;
  statusKepegawaian?: 'PNS' | 'PPPK' | '-';
  permissions: string[];
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
}
