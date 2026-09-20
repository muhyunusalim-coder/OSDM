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

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NoteColor = 'yellow' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'gray';
export type LabelColor = 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple' | 'pink' | 'teal' | 'gray';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface StickyTask {
  id: string;
  title: string;
  content: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  color: NoteColor;
  labelColor?: LabelColor;
  labelText?: string;
  dueDate?: string;
  assignee?: string;
  checklist: TaskChecklistItem[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
