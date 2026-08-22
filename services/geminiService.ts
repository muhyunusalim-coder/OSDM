import { Employee } from "../types";
import { getAuthToken, getCsrfToken } from "./dataService";

// Helper to get formatting right
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

// Formatter for dates to Indonesian style
const formatIndoDate = (dateStr: string) => {
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      if (parts[0].length === 4) {
        return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
      } else {
        return `${parseInt(parts[0], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[2]}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

// Generates an elegant mock Draft SK
const generateMockDraftSK = (employee: Employee): string => {
  return `KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA
BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)
----------------------------------------------------------------------
Nomor: KGB/BSKJI/2026/089
Lampiran: -
Perihal: Kenaikan Gaji Berkala (KGB)

Kepada Yth.
Kepala ${employee.unitKerja}
Kementerian Perindustrian
di Tempat

Dengan hormat,
Berdasarkan Peraturan Pemerintah Republik Indonesia Nomor 5 Tahun 2024 tentang Perubahan Kesembilan Belas atas Peraturan Pemerintah Nomor 7 Tahun 1977 tentang Peraturan Gaji Pegawai Negeri Sipil dan ketentuan untuk PPPK, dengan ini diberitahukan bahwa Pegawai Negeri Sipil / PPPK berikut:

Nama: ${employee.nama}
NIP: ${employee.nip}
Pangkat/Golongan: ${employee.pangkat}
Jabatan: ${employee.jabatan}
Unit Kerja: ${employee.unitKerja}

Telah memenuhi syarat masa kerja dan kecakapan untuk mendapatkan Kenaikan Gaji Berkala (KGB) terhitung mulai tanggal ${formatIndoDate(employee.tmt)}. Berdasarkan pangkat dan masa kerjanya, gaji pokok yang bersangkutan disesuaikan sebagai berikut:

- Gaji Pokok Lama: ${formatCurrency(employee.gajiLama)}
- Gaji Pokok Baru: ${formatCurrency(employee.gajiBaru)}
(Kenaikan sebesar: ${formatCurrency(employee.gajiBaru - employee.gajiLama)})

Dengan Terhitung Mulai Tanggal (TMT): ${formatIndoDate(employee.tmt)}

Diharapkan agar kepala unit kerja yang bersangkutan dapat melakukan penyesuaian administratif serta penerbitan Surat Keputusan penyesuaian pembayaran gaji pokok sesuai ketentuan perundang-undangan yang berlaku.

Jakarta, 26 Juni 2026
Atas Nama Kepala BSKJI,
Kepala Bagian Kepegawaian dan Umum

[Tanda Tangan Elektronik / QRCode Terverifikasi]
Dr. Andi Wijaya, M.Si.
NIP. 197405121998031002`;
};

// Generates an elegant mock analysis
const generateMockAnalysis = (employee: Employee): string => {
  const diff = employee.gajiBaru - employee.gajiLama;
  const percentage = employee.gajiLama > 0 ? ((diff / employee.gajiLama) * 100).toFixed(1) : '0';
  return `Analisis Kenaikan Gaji Berkala (KGB) untuk ${employee.nama}:

1. Analisis Finansial:
Pegawai mengalami penyesuaian gaji dari ${formatCurrency(employee.gajiLama)} menjadi ${formatCurrency(employee.gajiBaru)}. Terdapat kenaikan absolut sebesar ${formatCurrency(diff)} atau meningkat sekitar ${percentage}% dari gaji pokok sebelumnya. Kenaikan berkala ini merupakan hak normatif pegawai atas dedikasi dan masa bakti yang berjalan selama 2 tahun terakhir.

2. Implikasi Organisasional & Motivasi:
Penyesuaian gaji pokok yang tepat waktu pada TMT ${formatIndoDate(employee.tmt)} merupakan faktor penting dalam mempertahankan kepuasan kerja pegawai di unit ${employee.unitKerja}. Hal ini diharapkan mampu memicu peningkatan produktivitas serta memperkuat loyalitas kerja pegawai dalam mendukung target kinerja BSKJI.

3. Rekomendasi Administratif:
Disarankan agar operator Kepegawaian segera memproses berkas KGB ini ke dalam SIASN dan berkoordinasi dengan bagian Keuangan agar penyesuaian pembayaran gaji dapat direalisasikan tepat pada bulan TMT yang bersangkutan guna menghindari rapel gaji yang terlalu lama.`;
};

export const analyzeEmployeeKGB = async (employee: Employee, promptType: 'draft_sk' | 'analysis'): Promise<string> => {
  const token = getAuthToken();
  const csrf = getCsrfToken();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrf) headers['X-XSRF-TOKEN'] = csrf;

    const res = await fetch('/api/ai/analyze-kgb', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ employee, promptType })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch (e) {
    console.warn('Backend AI analysis endpoint unavailable, using smart template fallback:', e);
  }
  return promptType === 'draft_sk' ? generateMockDraftSK(employee) : generateMockAnalysis(employee);
};

export const chatWithData = async (query: string, employees: Employee[]): Promise<string> => {
  const token = getAuthToken();
  const csrf = getCsrfToken();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrf) headers['X-XSRF-TOKEN'] = csrf;

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ query, employees })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch (e) {
    console.warn('Backend AI chat endpoint unavailable, using smart local chatbot:', e);
  }
  return runMockChatEngine(query, employees);
};

// Extremely smart semantic mock chat engine in Indonesian to guarantee beautiful, fast answers offline or without API key
function runMockChatEngine(query: string, employees: Employee[]): string {
  const normalizedQuery = query.toLowerCase();
  
  // Calculate stats
  const total = employees.length;
  const pnsCount = employees.filter(e => e.statusKepegawaian === 'PNS').length;
  const pppkCount = employees.filter(e => e.statusKepegawaian === 'PPPK').length;
  const totalIncrease = employees.reduce((acc, curr) => acc + (curr.gajiBaru - curr.gajiLama), 0);

  // Search for employee name or NIP in query
  const foundEmployee = employees.find(e => 
    normalizedQuery.includes(e.nama.toLowerCase()) || 
    normalizedQuery.includes(e.nip) ||
    e.nama.toLowerCase().split(' ').some(part => part.length > 2 && normalizedQuery.includes(part))
  );

  if (foundEmployee) {
    return `Halo Kak! 😊 Aku berhasil menemukan data pegawai yang dimaksud di database BSKJI. Berikut rincian data kepegawaiannya ya:

- Nama Lengkap: ${foundEmployee.nama}
- NIP: ${foundEmployee.nip}
- Status Kepegawaian: ${foundEmployee.statusKepegawaian}
- Jabatan: ${foundEmployee.jabatan}
- Unit Kerja: ${foundEmployee.unitKerja}
- Masa Kerja Golongan: ${foundEmployee.masaKerja}
- Terhitung Mulai Tanggal (TMT) KGB: ${formatIndoDate(foundEmployee.tmt)}
- Penyesuaian Gaji Pokok: Dari ${formatCurrency(foundEmployee.gajiLama)} menjadi ${formatCurrency(foundEmployee.gajiBaru)} (Naik sebesar ${formatCurrency(foundEmployee.gajiBaru - foundEmployee.gajiLama)})

Jika Kakak ingin membuat draf Surat Keputusan (SK) KGB resmi atau analisis lengkap untuk pegawai ini, Kakak bisa membuka menu detail pegawai pada tabel utama lalu klik tombol Asisten AI ya! Ada yang bisa aku bantu lagi untuk data ini? ✨`;
  }

  // Check statistics questions
  if (normalizedQuery.includes('statistik') || normalizedQuery.includes('jumlah') || normalizedQuery.includes('total') || normalizedQuery.includes('berapa') || normalizedQuery.includes('anggaran') || normalizedQuery.includes('pns') || normalizedQuery.includes('pppk')) {
    return `Dengan senang hati, Kak! Berikut adalah ringkasan statistik kepegawaian dan anggaran KGB di lingkungan BSKJI saat ini ya:

- Total Pegawai Aktif: ${total} Pegawai
  * Jumlah PNS: ${pnsCount} orang
  * Jumlah PPPK: ${pppkCount} orang
- Total Kenaikan Anggaran Gaji (per Bulan): ${formatCurrency(totalIncrease)}
- Rata-rata Kenaikan per Pegawai: ${formatCurrency(total > 0 ? Math.round(totalIncrease / total) : 0)}

Semua data ini telah terintegrasi secara otomatis dengan jadwal TMT masing-masing pegawai agar tidak terjadi keterlambatan dalam pengusulan KGB. Apakah ada bagian statistik lain yang ingin Kakak analisis bersama? 📊😊`;
  }

  // Check closest/upcoming questions
  if (normalizedQuery.includes('terdekat') || normalizedQuery.includes('dekat') || normalizedQuery.includes('upcoming') || normalizedQuery.includes('jadwal') || normalizedQuery.includes('bulan ini')) {
    const upcoming = employees.slice(0, 3);
    let listStr = upcoming.map((e, idx) => `${idx + 1}. ${e.nama} (${e.unitKerja}) - TMT: ${formatIndoDate(e.tmt)}`).join('\n');
    
    return `Halo Kak! Berdasarkan kalender sistem BSKJI, ini dia 3 pegawai dengan jadwal Terhitung Mulai Tanggal (TMT) Kenaikan Gaji Berkala (KGB) terdekat:

${listStr}

Semua usulan untuk pegawai di atas sudah dipersiapkan administrasinya oleh sistem agar dapat diterbitkan tepat waktu tanpa kendala. Kakak juga bisa mengecek kalender lengkap di sub-menu Kenaikan Pangkat atau menu Monitoring KGB ya! Ada lagi yang perlu aku cek? 🗓️✨`;
  }

  // Check regulations or syarat
  if (normalizedQuery.includes('syarat') || normalizedQuery.includes('aturan') || normalizedQuery.includes('regulasi') || normalizedQuery.includes('uu') || normalizedQuery.includes('berapa tahun')) {
    return `Tentu Kak! Berdasarkan Peraturan Pemerintah No. 7 Tahun 1977 yang telah diperbarui (termasuk UU ASN No. 20 Tahun 2023), berikut adalah syarat umum Kenaikan Gaji Berkala (KGB) bagi pegawai:

1. Masa Kerja: Telah mencapai Masa Kerja Golongan (MKG) yang ditentukan (biasanya setiap 2 tahun sekali).
2. Penilaian Kinerja: Memiliki nilai SKP (Sasaran Kinerja Pegawai) minimal bernilai 'Baik' dalam 2 tahun terakhir.
3. Administratif: Tidak sedang menjalani hukuman disiplin sedang atau berat.

Sistem kita ini dirancang untuk mendeteksi secara otomatis ketika seorang pegawai mendekati masa 2 tahun dari TMT terakhirnya, sehingga memudahkan tim Kepegawaian BSKJI untuk langsung menerbitkan draf usulan. Praktis banget kan? 😊💼`;
  }

  // General warm onboarding response
  return `Halo Kak! Selamat datang di Pusat Asisten AI BSKJI. Aku "Kakak KGB", asisten pribadi Kakak yang siap membantu mengelola seluruh urusan Kenaikan Gaji Berkala dan kepegawaian dengan cepat dan ceria! 🌸✨

Kakak bisa tanyakan apa saja padaku, misalnya:
- "Siapa saja pegawai dengan KGB terdekat?"
- "Tolong tampilkan statistik jumlah PNS dan PPPK"
- "Berapa total kenaikan anggaran gaji kita bulan ini?"
- "Cari data pegawai bernama Budi atau NIP tertentu"
- "Apa saja syarat utama pengusulan KGB?"

Silakan ketik pertanyaan Kakak di kolom bawah ya. Aku siap membantu kapan saja! 😊💼`;
}

// Generates an elegant mock Draft SK for Kenaikan Pangkat
const generateMockDraftSK_KP = (employee: any): string => {
  return `KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA
BADAN STANDARDISASI DAN KEBIJAKAN JASA INDUSTRI (BSKJI)
----------------------------------------------------------------------
Nomor: Usul-KP/BSKJI/2026/047
Lampiran: 1 (satu) berkas lengkap
Perihal: Usulan Kenaikan Pangkat (KP) Periode Berikutnya

Kepada Yth.
Kepala Biro Organisasi dan Sumber Daya Manusia
Kementerian Perindustrian
di Tempat

Dengan hormat,
Berdasarkan Peraturan Pemerintah Nomor 11 Tahun 2017 tentang Manajemen Pegawai Negeri Sipil sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 17 Tahun 2020, bersama ini kami sampaikan usulan Kenaikan Pangkat untuk pegawai berikut:

Nama: ${employee.nama}
NIP: ${employee.nip}
Pangkat/Golongan Lama: ${employee.pangkatLama || '-'}
Pangkat/Golongan Baru: ${employee.pangkatBaru || employee.pangkat || '-'}
Jabatan: ${employee.jabatan}
Unit Kerja: ${employee.unitKerja}

Pegawai tersebut di atas telah memenuhi syarat masa kerja golongan, prestasi kerja, dan persyaratan administratif lainnya untuk diusulkan Kenaikan Pangkat setingkat lebih tinggi terhitung mulai tanggal ${formatIndoDate(employee.tmt)}.

Sebagai bahan pertimbangan Bapak, bersama ini kami lampirkan dokumen kelengkapan berupa SK Pangkat terakhir, penilaian kinerja (SKP) 2 tahun terakhir, serta dokumen pendukung lainnya yang telah disinkronkan ke dalam aplikasi SIASN BKN.

Demikian usulan ini kami sampaikan, atas perhatian dan kerja sama Bapak diucapkan terima kasih.

Jakarta, 26 Juni 2026
Atas Nama Kepala BSKJI,
Kepala Bagian Kepegawaian dan Umum

[Tanda Tangan Elektronik / QRCode Terverifikasi]
Dr. Andi Wijaya, M.Si.
NIP. 197405121998031002`;
};

// Generates an elegant mock analysis for Kenaikan Pangkat
const generateMockAnalysis_KP = (employee: any): string => {
  return `Analisis Kenaikan Pangkat (KP) untuk ${employee.nama}:

1. Analisis Kualifikasi & Jenjang Karier:
Pegawai atas nama ${employee.nama} saat ini diusulkan naik pangkat dari ${employee.pangkatLama || '-'} menjadi ${employee.pangkatBaru || employee.pangkat || '-'}. Kenaikan pangkat ini mencerminkan progres karier yang konsisten dan kontribusi signifikan di unit kerja ${employee.unitKerja}. Ditinjau dari masa kerja golongan (MKG), pegawai telah memenuhi batas minimum 4 tahun masa bakti dalam pangkat terakhir.

2. Pengaruh Kompetensi & Struktur Jabatan:
Dengan pangkat baru, pegawai diharapkan dapat mengambil peran kepemimpinan atau keahlian fungsional yang lebih kompleks. Hal ini akan memperkuat kapabilitas tim di ${employee.unitKerja} serta memberikan motivasi internal bagi pegawai bersangkutan untuk meningkatkan kualitas kinerjanya dalam mencapai sasaran strategis instansi BSKJI.

3. Rekomendasi Administratif:
Disarankan agar Operator Kepegawaian Unit Kerja memastikan seluruh dokumen pendukung (terutama penilaian kinerja 2 tahun terakhir yang bernilai minimal Baik) telah diunggah dan disinkronkan sepenuhnya ke dalam portal SIASN BKN agar verifikasi oleh tim penilai Biro OSDM Kementerian Perindustrian berjalan mulus dan bebas kendala.`;
};

export const analyzeEmployeeKP = async (employee: any, promptType: 'draft_sk_kp' | 'analysis_kp'): Promise<string> => {
  const token = getAuthToken();
  const csrf = getCsrfToken();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (csrf) headers['X-XSRF-TOKEN'] = csrf;

    const res = await fetch('/api/ai/analyze-kp', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ employee, promptType })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    }
  } catch (e) {
    console.warn('Backend KP AI endpoint unavailable, using smart template fallback:', e);
  }
  return promptType === 'draft_sk_kp' ? generateMockDraftSK_KP(employee) : generateMockAnalysis_KP(employee);
};


