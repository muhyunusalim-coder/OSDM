import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Scale, FileText, ChevronDown, ChevronUp, AlertCircle, 
  CheckCircle2, Search, Download, ExternalLink, Calculator, HelpCircle, 
  Send, Clock, FileCheck, MessageSquare, 
  Trash2, CalendarRange, Check, AlertTriangle, RefreshCw, Layers, User, UserCheck
} from 'lucide-react';

import { Employee } from '../types';
import { Language } from '../utils/translationHelper';
import { useDebounce } from '../hooks/useDebounce';

interface FAQPageProps {
  employees?: Employee[];
  language?: Language;
}

interface Regulation {
  code: string;
  title: string;
  desc: string;
  size: string;
  type: string;
  url: string;
}

const FAQ_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'kgb', label: 'Kenaikan Gaji Berkala (KGB)' },
  { id: 'kp', label: 'Kenaikan Pangkat (KP)' },
  { id: 'pensiun', label: 'Batas Usia Pensiun (BUP)' },
  { id: 'siasn', label: 'Sistem & Integrasi SIASN' }
];

const FAQ_ITEMS = [
  // KGB
  {
    category: 'kgb',
    question: "Apa saja syarat utama pengajuan Kenaikan Gaji Berkala (KGB)?",
    answer: "Berdasarkan peraturan kepegawaian, syarat utama KGB meliputi: (1) Telah mencapai masa kerja golongan (MKG) yang ditentukan yakni minimal 2 tahun, (2) Memiliki penilaian kinerja (SKP) tahun terakhir dengan predikat minimal 'Baik', (3) Tidak sedang dijatuhi hukuman disiplin tingkat sedang atau berat, dan (4) Memperoleh surat pengantar/usulan dari pimpinan unit kerja."
  },
  {
    category: 'kgb',
    question: "Apakah Kenaikan Gaji Berkala (KGB) PNS dapat ditunda?",
    answer: "Ya, KGB dapat ditunda apabila PNS yang bersangkutan belum memenuhi syarat kecakapan atau penilaian kinerjanya di bawah predikat 'Baik'. Penundaan dilakukan paling lama 1 (satu) tahun dengan Surat Keputusan Penundaan. Apabila masa penundaan selesai dan pegawai dinilai berkelakuan baik, KGB akan diberikan terhitung mulai bulan berikutnya."
  },
  {
    category: 'kgb',
    question: "Bagaimana perhitungan KGB untuk Pegawai Pemerintah dengan Perjanjian Kerja (PPPK)?",
    answer: "Berdasarkan Permenpan-RB No. 7 Tahun 2023, PPPK juga berhak mendapatkan KGB setelah memenuhi masa kerja golongan yang ditentukan (umumnya 2 tahun sekali) dan memiliki nilai kinerja minimal 'Baik' pada tahun terakhir kontrak yang berjalan."
  },
  {
    category: 'kgb',
    question: "Apa dampak keterlambatan pengurusan KGB terhadap pembayaran gaji?",
    answer: "Keterlambatan usulan KGB tidak akan menghapus hak pegawai, namun akan menunda penyesuaian pembayaran gaji pokok baru pada daftar gaji bulanan. Setelah SK KGB diterbitkan, pembayaran selisih kenaikan gaji (gaji rapel) akan dibayarkan terhitung sejak TMT berlakunya KGB tersebut."
  },
  // KP
  {
    category: 'kp',
    question: "Kapan periode usulan Kenaikan Pangkat (KP) PNS dilaksanakan?",
    answer: "Mulai tahun 2024, BKN memberlakukan penyederhanaan layanan kepegawaian dengan menyediakan 6 (enam) periode Kenaikan Pangkat PNS dalam setahun, yaitu pada tanggal: 1 Februari, 1 April, 1 Juni, 1 Agustus, 1 Oktober, dan 1 Desember. Hal ini mempermudah pegawai mengajukan usulan begitu memenuhi syarat tanpa perlu menunggu lama."
  },
  {
    category: 'kp',
    question: "Apa perbedaan Kenaikan Pangkat Reguler dengan Kenaikan Pangkat Pilihan?",
    answer: "KP Reguler diberikan kepada PNS yang tidak menduduki jabatan struktural atau fungsional tertentu, dengan masa kerja minimal 4 tahun dalam pangkat terakhir. Sedangkan KP Pilihan diberikan kepada PNS yang menduduki Jabatan Struktural, Jabatan Fungsional (dengan syarat Penilaian Angka Kredit/PAK), atau mereka yang memperoleh penyesuaian ijazah akademik baru."
  },
  {
    category: 'kp',
    question: "Apa saja berkas utama yang wajib diunggah untuk Kenaikan Pangkat Jabatan Fungsional?",
    answer: "Untuk Pejabat Fungsional di lingkungan BSKJI, berkas wajib meliputi: (1) SK Pangkat Terakhir, (2) SK Kenaikan Jabatan Fungsional (bila ada kenaikan jenjang), (3) Penetapan Angka Kredit (PAK) Konversi terbaru, (4) Sasaran Kinerja Pegawai (SKP) 2 tahun terakhir, dan (5) Surat Pengantar Usulan dari Unit Kerja."
  },
  {
    category: 'kp',
    question: "Apakah nilai SKP 'Cukup' diperbolehkan untuk usulan Kenaikan Pangkat?",
    answer: "Tidak diperbolehkan. Sesuai dengan Peraturan Pemerintah No. 11 Tahun 2017 tentang Manajemen PNS, salah satu syarat mutlak Kenaikan Pangkat adalah memiliki penilaian prestasi kerja / SKP dengan predikat paling rendah bernilai 'Baik' dalam 2 (dua) tahun terakhir berturut-turut."
  },
  // Pensiun
  {
    category: 'pensiun',
    question: "Berapa Batas Usia Pensiun (BUP) bagi Aparatur Sipil Negara (ASN)?",
    answer: "Sesuai UU No. 20 Tahun 2023 tentang ASN, BUP terbagi atas: (1) 58 Tahun bagi Pejabat Administrasi, Pejabat Fungsional Ahli Pertama, Ahli Muda, dan Keterampilan. (2) 60 Tahun bagi Pejabat Pimpinan Tinggi Pratama, Ahli Madya, Guru, dan Dosen. (3) 65 Tahun bagi Pejabat Fungsional Ahli Utama. (4) 70 Tahun bagi Pejabat Fungsional Peneliti atau Perekayasa Ahli Utama."
  },
  {
    category: 'pensiun',
    question: "Kapan sebaiknya berkas administrasi pensiun mulai diurus?",
    answer: "Pegawai disarankan mulai melengkapi dan mengajukan usulan berkas pensiun 6 hingga 12 bulan sebelum tanggal mencapai Batas Usia Pensiun (BUP). Hal ini penting untuk memastikan SK Pensiun dan hak tabungan hari tua (TASPEN) terbit tepat waktu sebelum pegawai berhenti bekerja."
  },
  {
    category: 'pensiun',
    question: "Apa saja dokumen wajib untuk pengusulan Pensiun BUP?",
    answer: "Dokumen wajib yang harus diunggah di antaranya: (1) SK CPNS dan PNS, (2) SK Pangkat Terakhir, (3) SK Jabatan Terakhir, (4) SKP 2 tahun terakhir, (5) Daftar Susunan Keluarga terlegalisir, (6) Akta Nikah/Cerai, (7) Surat Pernyataan Bebas dari Proses Pidana/Hukuman Disiplin, dan (8) Pasfoto terbaru."
  },
  // SIASN
  {
    category: 'siasn',
    question: "Apa itu SIASN BKN dan bagaimana perannya dalam administrasi kepegawaian?",
    answer: "SIASN (Sistem Informasi Aparatur Sipil Negara) adalah aplikasi resmi BKN yang digunakan untuk mengintegrasikan seluruh layanan administrasi kepegawaian secara nasional dan digital (paperless). Semua penerbitan SK KGB, KP, dan Pensiun di lingkungan BSKJI wajib disinkronkan melalui portal SIASN agar data ASN terupdate secara real-time."
  },
  {
    category: 'siasn',
    question: "Bagaimana jika data profil saya di sistem kepegawaian atau SIASN berbeda?",
    answer: "Jika terdapat perbedaan data (seperti nama, tanggal lahir, pangkat, atau jabatan), pegawai dapat mengajukan Pemutakhiran Data Mandiri (PDM) melalui portal MyASN BKN, atau berkoordinasi langsung dengan Operator Kepegawaian BSKJI dengan melampirkan berkas bukti autentik berupa SK terkait."
  },
  {
    category: 'siasn',
    question: "Apakah penandatanganan SK Layanan Kepegawaian saat ini sudah menggunakan TTE?",
    answer: "Ya. Sejalan dengan pilar transformasi digital Kementerian Perindustrian, seluruh SK Kenaikan Gaji Berkala (KGB), Kenaikan Pangkat, dan Pensiun saat ini sudah menggunakan Tanda Tangan Elektronik (TTE) bersertifikat BSrE BSSN yang sah dan terintegrasi penuh dalam sistem."
  }
];

const REGULATIONS: Regulation[] = [
  {
    code: "UU No. 20 Tahun 2023",
    title: "Undang-Undang Aparatur Sipil Negara",
    desc: "Landasan pokok reformasi manajemen ASN, penyederhanaan jabatan, dan pola karir pegawai.",
    size: "1.8 MB",
    type: "PDF Document",
    url: "https://peraturan.bpk.go.id/Download/321854/UU%20Nomor%2020%20Tahun%202023.pdf"
  },
  {
    code: "PP No. 5 Tahun 2024",
    title: "Peraturan Gaji Pokok PNS Terbaru",
    desc: "Tabel penyesuaian besaran gaji pokok PNS yang mengalami kenaikan sebesar 8% di seluruh golongan.",
    size: "1.2 MB",
    type: "PDF Document",
    url: "https://peraturan.bpk.go.id/Download/335286/PP%20Nomor%205%20Tahun%202024.pdf"
  },
  {
    code: "PP No. 11 Tahun 2017",
    title: "Manajemen Pegawai Negeri Sipil",
    desc: "Aturan komprehensif penataan pangkat, pola karir, mutasi, penilaian kinerja, dan pemberhentian pensiun.",
    size: "2.4 MB",
    type: "PDF Document",
    url: "https://jdih.bkn.go.id/assets/produk/PP_Nomor_11_Tahun_2017.pdf"
  },
  {
    code: "SE Kepala BKN No. 16 Tahun 2023",
    title: "Administrasi Terintegrasi SIASN",
    desc: "Instruksi pelaksanaan layanan kepegawaian digital secara paperless dan pemutakhiran data terpadu.",
    size: "820 KB",
    type: "PDF Document",
    url: "https://jdih.bkn.go.id/assets/produk/SE_BKN_16_2023.pdf"
  },
  {
    code: "Permenpan-RB No. 1 Tahun 2023",
    title: "Jabatan Fungsional PNS",
    desc: "Ketentuan baru tata cara penilaian kinerja pegawai fungsional berbasis konversi angka kredit (PAK) tahunan.",
    size: "1.5 MB",
    type: "PDF Document",
    url: "https://peraturan.bpk.go.id/Download/295412/Permenpan%20Nomor%201%20Tahun%2023.pdf"
  }
];

const GOLONGAN_OPTIONS = [
  { value: 'I/a', label: 'Juru Muda (I/a)' },
  { value: 'I/b', label: 'Juru Muda Tingkat I (I/b)' },
  { value: 'I/c', label: 'Juru (I/c)' },
  { value: 'I/d', label: 'Juru Tingkat I (I/d)' },
  { value: 'II/a', label: 'Pengatur Muda (II/a)' },
  { value: 'II/b', label: 'Pengatur Muda Tingkat I (II/b)' },
  { value: 'II/c', label: 'Pengatur (II/c)' },
  { value: 'II/d', label: 'Pengatur Tingkat I (II/d)' },
  { value: 'III/a', label: 'Penata Muda (III/a)' },
  { value: 'III/b', label: 'Penata Muda Tingkat I (III/b)' },
  { value: 'III/c', label: 'Penata (III/c)' },
  { value: 'III/d', label: 'Penata Tingkat I (III/d)' },
  { value: 'IV/a', label: 'Pembina (IV/a)' },
  { value: 'IV/b', label: 'Pembina Tingkat I (IV/b)' },
  { value: 'IV/c', label: 'Pembina Utama Muda (IV/c)' },
  { value: 'IV/d', label: 'Pembina Utama Madya (IV/d)' },
  { value: 'IV/e', label: 'Pembina Utama (IV/e)' }
];

export const FAQPage: React.FC<FAQPageProps> = React.memo(({ employees }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  // Filter FAQs based on active tab & search
  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchTab = activeTab === 'all' || item.category === activeTab;
      const matchSearch = item.question.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          item.answer.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeTab, debouncedSearch]);

  // Reset FAQ accordion open state on tab change
  useEffect(() => {
    setOpenIndex(filteredFAQs.length > 0 ? 0 : null);
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-4">
      
      {/* Dynamic Header Banner with elegant background */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-white border border-emerald-800/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <BookOpen size={14} className="text-emerald-400" />
            Pusat Informasi & Bantuan Terpadu
          </span>
          <h1 className="text-3xl md:text-5xl font-display font-black leading-tight tracking-tight mb-4">
            Dasar Hukum & Informasi Kepegawaian
          </h1>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
            Selamat datang di pusat bantuan resmi BSKJI. Temukan kompilasi regulasi terkini serta kumpulan pertanyaan umum (FAQ) seputar administrasi kepegawaian Anda secara lengkap.
          </p>
        </div>
      </div>

      {/* Main Grid: Left column FAQ / Calculator, Right Column AI Chat / Regulations */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Columns (Col Span 2): FAQ Hub and Eligibility Calculator */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Section 2: FAQ Accordion Hub */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-display">Daftar Pertanyaan Umum Kepegawaian</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Temukan penjelasan akurat mengenai administrasi kepegawaian.</p>
                </div>
              </div>

              {/* Inline Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Cari topik atau kata kunci..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-thin">
              {FAQ_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all border cursor-pointer shrink-0 ${
                    activeTab === cat.id
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-3.5">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((item, index) => {
                  const isOpen = openIndex === index;
                  return (
                    <div 
                      key={index}
                      className={`rounded-2xl border transition-all duration-300 ${
                        isOpen 
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-50 dark:ring-emerald-900/50' 
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <button 
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="w-full text-left px-5 py-4.5 flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className={`font-bold text-xs sm:text-sm leading-snug ${isOpen ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                          {item.question}
                        </span>
                        <span className={`p-1.5 rounded-full shrink-0 transition-colors ${isOpen ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'}`}>
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="h-px w-full bg-slate-100 dark:bg-slate-800/50 mb-3.5"></div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm font-medium">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <AlertTriangle className="text-amber-500 mx-auto mb-2" size={20} />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada hasil ditemukan.</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Coba sesuaikan kata kunci atau bersihkan pencarian Anda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Downloadable Regulations */}
        <div className="space-y-8">

          {/* Section 4: Legal Foundations Grid (Dasar Hukum) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200/60 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-950/20 rounded-full blur-xl pointer-events-none -mr-8 -mt-8"></div>
            
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Scale size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">Dasar Hukum & Dokumen</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Unduh draf regulasi resmi kepegawaian nasional.</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {REGULATIONS.map((reg, idx) => (
                <a 
                  key={idx} 
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group cursor-pointer items-start relative"
                >
                  <div className="absolute top-3.5 right-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Download size={14} />
                  </div>

                  <div className="mt-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 shrink-0 group-hover:border-emerald-100">
                    <FileText size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  
                  <div className="pr-4">
                    <span className="inline-block bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono mb-1">
                      {reg.code}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 leading-snug flex items-center gap-1">
                      {reg.title}
                      <ExternalLink size={9} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-400 shrink-0" />
                    </h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{reg.desc}</p>
                    <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold font-mono mt-1.5">{reg.type} &bull; {reg.size}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>



    </div>
  );
});

export default FAQPage;
