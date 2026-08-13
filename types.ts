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
  statusKepegawaian: 'PNS' | 'PPPK' | '-'; // Field baru
  gajiLama: number;
  gajiBaru: number;
  masaKerja: string; 
  tmt: string; 
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