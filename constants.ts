
// API Endpoints (All communication routes through backend securely)
export const API_BASE_URL = "/api";
export const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_ME: "/api/auth/me",
  AUTH_LOGOUT: "/api/auth/logout",
  EMPLOYEES: "/api/data/employees",
  PROMOTIONS: "/api/data/promotions",
  MASTER_PEGAWAI: "/api/data/master-pegawai",
  TOGGLE_STATUS: (id: string) => `/api/data/employees/${id}/toggle-status`,
};

// Fallback mock data in case offline or backend bootstrapping
export const MOCK_EMPLOYEES = [
  {
    "No": "1",
    "Nama": "Budi Santoso",
    "NIP": "198501012010011001",
    "Jabatan": "Guru Ahli Pertama",
    "Pangkat": "Penata Muda (III/a)",
    "Gaji Lama": "2579400",
    "Gaji Baru": "2661000",
    "TMT KGB Baru": "2026-03-01",
    "Unit Kerja": "Dinas Pendidikan",
    "Status KGB": "Belum Proses"
  },
  {
    "No": "2",
    "Nama": "Siti Aminah",
    "NIP": "198805052011012005",
    "Jabatan": "Perawat Mahir",
    "Pangkat": "Penata (III/c)",
    "Gaji Lama": "3000000",
    "Gaji Baru": "3150000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Dinas Kesehatan",
    "Status KGB": "Belum Proses"
  },
  {
    "No": "3",
    "Nama": "Ahmad Fauzi",
    "NIP": "199012122019031009",
    "Jabatan": "Pengelola Keuangan",
    "Pangkat": "Pengatur (II/c)",
    "Gaji Lama": "2300000",
    "Gaji Baru": "2380000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Kecamatan Kota",
    "Status KGB": "SK Terbit"
  },
  {
    "No": "4",
    "Nama": "Dewi Sartika",
    "NIP": "199507072020122001",
    "Jabatan": "Perencana Ahli Muda",
    "Pangkat": "Penata Muda Tk.I (III/b)",
    "Gaji Lama": "2800000",
    "Gaji Baru": "2900000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Bappeda",
    "Status KGB": "Proses BKD"
  },
  {
    "No": "5",
    "Nama": "Eko Prasetyo",
    "NIP": "198203152009021002",
    "Jabatan": "Kepala Bagian Umum",
    "Pangkat": "Pembina (IV/a)",
    "Gaji Lama": "4500000",
    "Gaji Baru": "4700000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Sekretariat Daerah",
    "Status KGB": ""
  },
  {
    "No": "6",
    "Nama": "Rina Wati",
    "NIP": "199201012015022001",
    "Jabatan": "Analis Kepegawaian",
    "Pangkat": "Penata Muda (III/a)",
    "Gaji Lama": "2661000",
    "Gaji Baru": "2744000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "BKPSDM",
    "Status KGB": "Sudah Proses"
  },
  {
    "No": "7",
    "Nama": "Joko Susilo",
    "NIP": "198909092014031002",
    "Jabatan": "Pranata Komputer",
    "Pangkat": "Penata (III/c)",
    "Gaji Lama": "3150000",
    "Gaji Baru": "3250000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Diskominfo",
    "Status KGB": "SK Terbit"
  },
  {
    "No": "8",
    "Nama": "Sri Wahyuni",
    "NIP": "199305202019012005",
    "Jabatan": "Guru Kelas",
    "Pangkat": "Penata Muda Tk.I (III/b)",
    "Gaji Lama": "2900000",
    "Gaji Baru": "3000000",
    "TMT KGB Baru": "2026-04-01",
    "Unit Kerja": "Dinas Pendidikan",
    "Status KGB": "Sudah Proses"
  },
  {
    "No": "9",
    "Nama": "Hendra Gunawan",
    "NIP": "198011112005011003",
    "Jabatan": "Pengawas Sekolah",
    "Pangkat": "Pembina (IV/a)",
    "Gaji Lama": "4700000",
    "Gaji Baru": "4900000",
    "TMT KGB Baru": "2026-02-01",
    "Unit Kerja": "Dinas Pendidikan",
    "Status KGB": "SK Terbit"
  }
];

export const MOCK_PROMOTION_EMPLOYEES = [
  {
    "No": "1",
    "Nama": "Aditya Andika Wicaksono",
    "NIP": "198608202010121002",
    "Pangkat Lama": "Penata Muda Tk.I (III/b)",
    "Pangkat Baru": "Penata (III/c)",
    "Unit Kerja": "BBSPJPPI",
    "TMT": "2026-04-01",
    "Surat Usulan": "001/KP/BSKJI/2026",
    "Input Siasn": "Sudah",
    "Status Siasn": "Terbit SK"
  },
  {
    "No": "2",
    "Nama": "Agus Surya Mulyawan",
    "NIP": "198308132010121002",
    "Pangkat Lama": "Penata Muda (III/a)",
    "Pangkat Baru": "Penata Muda Tk.I (III/b)",
    "Unit Kerja": "BBSPJIT",
    "TMT": "2026-04-01",
    "Surat Usulan": "002/KP/BSKJI/2026",
    "Input Siasn": "Sudah",
    "Status Siasn": "Terbit SK"
  },
  {
    "No": "3",
    "Nama": "Ahmad Mursid Widodo",
    "NIP": "198804032010121001",
    "Pangkat Lama": "Pengatur Tk.I (II/d)",
    "Pangkat Baru": "Penata Muda (III/a)",
    "Unit Kerja": "BBSPJIKKP",
    "TMT": "2026-04-01",
    "Surat Usulan": "003/KP/BSKJI/2026",
    "Input Siasn": "Sudah",
    "Status Siasn": "Proses"
  },
  {
    "No": "4",
    "Nama": "Ahmad Nashoruddin Muammar",
    "NIP": "198211262006041002",
    "Pangkat Lama": "Penata Tk.I (III/d)",
    "Pangkat Baru": "Pembina (IV/a)",
    "Unit Kerja": "BSPJI Pontianak",
    "TMT": "2026-04-01",
    "Surat Usulan": "004/KP/BSKJI/2026",
    "Input Siasn": "Sudah",
    "Status Siasn": "Terbit SK"
  },
  {
    "No": "5",
    "Nama": "Siti Aminah",
    "NIP": "198805052011012005",
    "Pangkat Lama": "Penata Muda (III/a)",
    "Pangkat Baru": "Penata Muda Tk.I (III/b)",
    "Unit Kerja": "BSPJI Banjarbaru",
    "TMT": "2026-04-01",
    "Surat Usulan": "005/KP/BSKJI/2026",
    "Input Siasn": "Sudah",
    "Status Siasn": "Bahan Tidak Sesuai"
  }
];

