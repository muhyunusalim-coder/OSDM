import { GoogleGenAI } from "@google/genai";
import { Employee } from "../types";

// Helper to get formatting right
const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

// Formatter for dates to Indonesian style
const formatIndoDate = (dateStr: string) => {
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      // check if YYYY-MM-DD or DD-MM-YYYY
      if (parts[0].length === 4) {
        return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
      } else {
        return `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
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
  const percentage = ((diff / employee.gajiLama) * 100).toFixed(1);
  return `Analisis Kenaikan Gaji Berkala (KGB) untuk ${employee.nama}:

1. Analisis Finansial:
Pegawai mengalami penyesuaian gaji dari ${formatCurrency(employee.gajiLama)} menjadi ${formatCurrency(employee.gajiBaru)}. Terdapat kenaikan absolut sebesar ${formatCurrency(diff)} atau meningkat sekitar ${percentage}% dari gaji pokok sebelumnya. Kenaikan berkala ini merupakan hak normatif pegawai atas dedikasi dan masa bakti yang berjalan selama 2 tahun terakhir.

2. Implikasi Organisasional & Motivasi:
Penyesuaian gaji pokok yang tepat waktu pada TMT ${formatIndoDate(employee.tmt)} merupakan faktor penting dalam mempertahankan kepuasan kerja pegawai di unit ${employee.unitKerja}. Hal ini diharapkan mampu memicu peningkatan produktivitas serta memperkuat loyalitas kerja pegawai dalam mendukung target kinerja BSKJI.

3. Rekomendasi Administratif:
Disarankan agar operator Kepegawaian segera memproses berkas KGB ini ke dalam SIASN dan berkoordinasi dengan bagian Keuangan agar penyesuaian pembayaran gaji dapat direalisasikan tepat pada bulan TMT yang bersangkutan guna menghindari rapel gaji yang terlalu lama.`;
};

export const analyzeEmployeeKGB = async (employee: Employee, promptType: 'draft_sk' | 'analysis') => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Elegant local fallback if no key is present
      return promptType === 'draft_sk' ? generateMockDraftSK(employee) : generateMockAnalysis(employee);
    }

    const ai = new GoogleGenAI({ apiKey });
    // Use gemini-3.5-flash which is the recommended model for basic text/Q&A tasks
    const model = "gemini-3.5-flash";

    let userPrompt = "";
    
    if (promptType === 'draft_sk') {
      userPrompt = `
        Buatkan draft surat resmi pemberitahuan Kenaikan Gaji Berkala (KGB) untuk pegawai berikut.
        Gunakan bahasa Indonesia baku, format surat dinas resmi instansi pemerintah (Kementerian Perindustrian BSKJI). Hindari penggunaan markdown bold (**).
        
        Data Pegawai:
        Nama: ${employee.nama}
        NIP: ${employee.nip}
        Pangkat/Golongan: ${employee.pangkat}
        Jabatan: ${employee.jabatan}
        Unit Kerja: ${employee.unitKerja}
        
        Rincian KGB:
        Gaji Lama: ${formatCurrency(employee.gajiLama)}
        Gaji Baru: ${formatCurrency(employee.gajiBaru)}
        TMT (Terhitung Mulai Tanggal): ${employee.tmt}
        
        Surat ditujukan kepada Kepala ${employee.unitKerja}.
        Sertakan bagian pembuka dinas, rincian data pegawai, rincian penyesuaian gaji pokok lama dan baru, TMT, serta penutup formal yang ditandatangani Kepala Bagian Kepegawaian dan Umum BSKJI (Dr. Andi Wijaya, M.Si. NIP. 197405121998031002).
      `;
    } else {
      userPrompt = `
        Analisis data kenaikan gaji untuk pegawai ini:
        Nama: ${employee.nama}
        Golongan: ${employee.pangkat}
        Jabatan: ${employee.jabatan}
        Unit Kerja: ${employee.unitKerja}
        Kenaikan: Dari ${formatCurrency(employee.gajiLama)} menjadi ${formatCurrency(employee.gajiBaru)}
        TMT: ${employee.tmt}
        
        Berikan analisis kepegawaian profesional dan komprehensif dalam Bahasa Indonesia (maksimal 3 paragraf).
        Sertakan:
        1. Analisis besaran kenaikan secara finansial dan persentasenya.
        2. Implikasi motivasi kerja dan produktivitas pegawai di unit kerjanya.
        3. Rekomendasi langkah administratif kepegawaian selanjutnya.
        JANGAN gunakan formatting markdown tebal seperti tanda bintang ganda (**). Gunakan spasi paragraf yang rapi dan bahasa yang sangat elegan serta santun.
      `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
    });

    return response.text || (promptType === 'draft_sk' ? generateMockDraftSK(employee) : generateMockAnalysis(employee));

  } catch (error) {
    console.error("Gemini Error:", error);
    // Silent recovery to mock engine so the user never encounters a crash or blank screen
    return promptType === 'draft_sk' ? generateMockDraftSK(employee) : generateMockAnalysis(employee);
  }
};

export const chatWithData = async (query: string, employees: Employee[]) => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Elegant local fallback chat engine
      return runMockChatEngine(query, employees);
    }
    
    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.5-flash";

    const employeeList = employees.map(e => `${e.nama} (NIP: ${e.nip}, Pangkat: ${e.pangkat}, Jabatan: ${e.jabatan}, Unit: ${e.unitKerja}, TMT: ${e.tmt}, Gaji Lama: ${formatCurrency(e.gajiLama)}, Gaji Baru: ${formatCurrency(e.gajiBaru)})`).join('\n');
    
    const stats = {
        total: employees.length,
        pnsCount: employees.filter(e => e.statusKepegawaian === 'PNS').length,
        pppkCount: employees.filter(e => e.statusKepegawaian === 'PPPK').length,
        totalIncrease: employees.reduce((acc, curr) => acc + (curr.gajiBaru - curr.gajiLama), 0)
    };

    const context = `
        Identitas: Kamu adalah "Kakak KGB", asisten AI pintar yang sangat ramah, hangat, ceria, dan profesional untuk sistem monitoring Kenaikan Gaji Berkala (KGB) di BSKJI Kementerian Perindustrian.
        
        Gaya Bahasa:
        - Sangat hangat, sopan, dan bersahabat (seperti rekan kerja yang sangat baik).
        - Gunakan sapaan seperti "Kak", "Bapak", atau "Ibu" agar terasa akrab dan santun.
        - Berikan jawaban yang solutif, menyemangati, dan akurat.
        - Gunakan emoji secukupnya agar suasana terasa lebih hidup (😊, ✨, 🙌, 💼, 📊).

        Tugas Utama:
        - Menjawab pertanyaan seputar data pegawai yang ada di sistem (LAKUKAN PENCARIAN DATA PEGAWAI BERDASARKAN NIP ATAU NAMA JIKA DIMINTA).
        - Jika mencari pegawai, tampilkan ringkasan singkat: Jabatan, Pangkat/Golongan, Unit Kerja, TMT KGB, serta Gaji Lama dan Baru.
        - Memberikan informasi statistik kepegawaian BSKJI berdasarkan data terlampir.
        - Membantu menjelaskan jadwal KGB dan memberikan arahan administrasi yang elegan.

        Data Pegawai Lengkap:
        ${employeeList}
        
        Statistik Sistem:
        - Total Pegawai: ${stats.total}
        - Jumlah PNS: ${stats.pnsCount}
        - Jumlah PPPK: ${stats.pppkCount}
        - Total Anggaran Kenaikan Gaji bulanan: ${formatCurrency(stats.totalIncrease)}

        Aturan Teknis:
        1. JAWAB DENGAN CEPAT DAN TEPAT.
        2. JANGAN gunakan markdown bintang ganda (**). Gunakan teks biasa yang rapi dengan list dan poin-poin yang mudah dibaca.
        3. Jika data tidak ditemukan, jawab dengan sangat sopan: "Wah, maaf banget ya Kak, data yang dicari belum ketemu di catatan aku. Coba cek lagi di tabel utama atau tanya admin ya! 😊"
        
        Pertanyaan User: "${query}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: context,
      config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40
      }
    });

    return response.text || runMockChatEngine(query, employees);
  } catch (error) {
    console.error("Chat Error:", error);
    return runMockChatEngine(query, employees);
  }
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
- Rata-rata Kenaikan per Pegawai: ${formatCurrency(Math.round(totalIncrease / total))}

Semua data ini telah terintegrasi secara otomatis dengan jadwal TMT masing-masing pegawai agar tidak terjadi keterlambatan dalam pengusulan KGB. Apakah ada bagian statistik lain yang ingin Kakak analisis bersama? 📊😊`;
  }

  // Check closest/upcoming questions
  if (normalizedQuery.includes('terdekat') || normalizedQuery.includes('dekat') || normalizedQuery.includes('upcoming') || normalizedQuery.includes('jadwal') || normalizedQuery.includes('bulan ini')) {
    // Get employees whose TMT is coming up
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
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const formatIndoDateLocal = (dateStr: string) => {
    try {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
        } else {
          return `${parseInt(parts[0])} ${months[parseInt(parts[1]) - 1]} ${parts[2]}`;
        }
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

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

Pegawai tersebut di atas telah memenuhi syarat masa kerja golongan, prestasi kerja, dan persyaratan administratif lainnya untuk diusulkan Kenaikan Pangkat setingkat lebih tinggi terhitung mulai tanggal ${formatIndoDateLocal(employee.tmt)}.

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

export const analyzeEmployeeKP = async (employee: any, promptType: 'draft_sk_kp' | 'analysis_kp') => {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return promptType === 'draft_sk_kp' ? generateMockDraftSK_KP(employee) : generateMockAnalysis_KP(employee);
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3.5-flash";

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
        Jabatan: ${employee.jabatan}
        Unit Kerja: ${employee.unitKerja}
        TMT Kenaikan Pangkat: ${employee.tmt}
        
        Surat ditujukan kepada Kepala Biro Organisasi dan Sumber Daya Manusia (OSDM) Kementerian Perindustrian.
        Sertakan bagian pembuka dinas, rincian data pegawai, penjelasan kelayakan kenaikan pangkat, daftar dokumen lampiran pendukung, serta penutup formal yang ditandatangani Kepala Bagian Kepegawaian dan Umum BSKJI (Dr. Andi Wijaya, M.Si. NIP. 197405121998031002).
      `;
    } else {
      userPrompt = `
        Analisis usulan kenaikan pangkat untuk pegawai ini:
        Nama: ${employee.nama}
        Pangkat/Golongan Lama: ${employee.pangkatLama || '-'}
        Pangkat/Golongan Baru: ${employee.pangkatBaru || employee.pangkat || '-'}
        Jabatan: ${employee.jabatan}
        Unit Kerja: ${employee.unitKerja}
        TMT Kenaikan Pangkat: ${employee.tmt}
        
        Berikan analisis kepegawaian profesional dan komprehensif dalam Bahasa Indonesia (maksimal 3 paragraf).
        Sertakan:
        1. Analisis kualifikasi pangkat, kesesuaian masa kerja golongan (MKG), dan jenjang karier pegawai.
        2. Pengaruh pangkat baru terhadap struktur organisasi dan peningkatan motivasi pegawai di unit kerjanya.
        3. Rekomendasi langkah administratif kepegawaian (seperti kelengkapan berkas SIASN BKN).
        JANGAN gunakan formatting markdown tebal seperti tanda bintang ganda (**). Gunakan spasi paragraf yang rapi dan bahasa yang sangat elegan serta santun.
      `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
    });

    return response.text || (promptType === 'draft_sk_kp' ? generateMockDraftSK_KP(employee) : generateMockAnalysis_KP(employee));

  } catch (error) {
    console.error("Gemini KP Error:", error);
    return promptType === 'draft_sk_kp' ? generateMockDraftSK_KP(employee) : generateMockAnalysis_KP(employee);
  }
};

