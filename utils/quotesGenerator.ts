export const MOTIVATIONAL_QUOTES = [
  "Setiap langkah kecil membawamu lebih dekat pada tujuan besar.",
  "Bekerjalah dengan hati, maka hasil tak akan mengkhianati.",
  "Hari ini adalah peluang baru untuk menjadi versi terbaik dirimu.",
  "Kesuksesan bukan kunci kebahagiaan. Kebahagiaanlah kunci kesuksesan.",
  "Jadikan lelahmu sebagai ibadah. Teruslah berkarya!",
  "Kualitas kerjamu adalah cerminan dirimu. Buatlah menjadi luar biasa.",
  "Integritas adalah melakukan hal yang benar, bahkan ketika tidak ada yang melihat.",
  "Melayani dengan hati adalah bentuk dedikasi tertinggi bagi negeri.",
  "Profesionalisme bukan sekadar keahlian, tapi juga tentang sikap dan etika.",
  "Jadilah ASN yang solutif, adaptif, dan inovatif untuk kemajuan bangsa.",
  "Rezeki tidak akan tertukar, tapi jemputlah dengan ikhtiar terbaik.",
  "Bersyukur membuat apa yang kita miliki menjadi cukup.",
  "Inovasi membedakan antara pemimpin dan pengikut.",
  "Cara terbaik memprediksi masa depan adalah dengan menciptakannya.",
  "Ketulusan dalam melayani adalah ciri aparatur yang sejati.",
  "Satu tindakan kecil dalam integritas, lebih berharga dari seribu kata.",
  "Disiplin adalah jembatan antara tujuan dan pencapaian.",
  "Negara tidak hanya butuh orang pintar, tapi orang yang jujur dan melayani.",
  "Senyum tulus kepada masyarakat adalah layanan terbaik tanpa biaya.",
  "Reformasi birokrasi dimulai dari meja kerja kita sendiri.",
  "Berikan layanan yang lebih baik dari yang diharapkan, itu adalah nilai tambah.",
  "Setiap jam yang kamu pakai untuk bekerja dengan jujur adalah doa untuk keluargamu.",
  "Waktu takkan kembali, jadikan setiap detik di kantor sebagai amal kebaikan.",
  "Tantangan dalam pekerjaan adalah batu loncatan menuju versi dirimu yang lebih hebat.",
  "Keberhasilan pelayanan diukur dari kepuasan masyarakat, bukan sekadar laporan di atas kertas.",
  "Menjadi ASN bukan sekadar status, itu adalah amanah.",
  "Kerja keras yang tulus tidak pernah luput dari pandangan Tuhan, meski atasan mungkin luput.",
  "Semangat pagi! Mari berkarya untuk Indonesia yang lebih baik.",
  "Sebagai abdi negara, mari utamakan kepentingan publik di atas kepentingan pribadi.",
  "Kerja cerdas, kerja tuntas, kerja ikhlas.",
  "Inovasi tidak harus besar, asalkan bermanfaat untuk masyarakat.",
  "Birokrasi yang melayani adalah birokrasi yang memajukan negeri.",
  "Gaji adalah hak, namun dedikasi adalah kewajiban yang mendatangkan berkah.",
  "Mari terus belajar, karena tantangan pelayanan publik akan terus berkembang.",
  "Membangun negeri tidak dilakukan dalam semalam, tapi dilakukan setiap hari oleh kita semua."
];

// Combine fragments to simulate > 10,000 quotes
const fragmentsA = [
  "Sebagai abdi negara,",
  "Bagi seorang PNS yang berdedikasi,",
  "Dalam menjalankan amanah birokrasi,",
  "Untuk melayani sepenuh hati,",
  "Sebagai pelayan masyarakat sejati,",
  "Di setiap tugas negara,",
  "Ketika kita mengabdi,",
  "Dalam memberikan layanan prima,",
  "Mengingat janji bakti pada pertiwi,",
  "Hari ini di medan tugas,",
  "Sebagai garda depan kepemerintahan,",
  "Setiap kali melangkah ke kantor,",
  "Dalam peran kita sebagai ASN,",
  "Ketika masyarakat membutuhkan kita,",
  "Dalam setiap kebijakan dan tindakan,",
  "Dalam sumpah jabatan yang kita ucapkan,",
  "Sebagai pilar utama bangsa,",
  "Ketika kita berurusan dengan birokrasi,",
  "Untuk Indonesia yang lebih tangguh,",
  "Mengerjakan rutinitas tanpa keluh kesah,",
  "Saat memakai seragam kebanggaan,",
  "Dengan semangat korps KORPRI,"
];

const fragmentsB = [
  "integritas dan kejujuran adalah kompas yang tidak pernah salah",
  "disiplin kerja akan menjadi fondasi bagi kepercayaan publik",
  "kesabaran menghadapi keluhan adalah bentuk profesionalisme yang tinggi",
  "inovasi kecil yang konsisten akan membawa perubahan yang nyata",
  "ikhlaskan hati dari pamrih karena Tuhan yang maha melihat batas usaha kita",
  "kita tidak hanya bekerja untuk negara, tapi sejarah kehidupan kita",
  "loyalitas pada kebenaran akan membawa kehormatan",
  "kualitas pelayanan publik menentukan tingkat kemajuan bangsa",
  "hambatan dan tantangan hanyalah ujian menuju birokrasi berkelas dunia",
  "kita harus beradaptasi lebih cepat dari perubahan itu sendiri",
  "transparansi dan akuntabilitas menjadi mahkota pengabdian",
  "kerjasama yang solid menumbuhkan prestasi hebat yang tak bisa diraih sendiri",
  "setiap keringat yang jatuh akan menjadi amal kebaikan untuk keluarga dan negeri",
  "jangan pernah lelah memberikan yang terbaik meskipun hari terasa panjang",
  "sikap antusias akan mengubah pekerjaan yang berat menjadi lebih ringan",
  "ketelitian dan kecermatan menentukan nasib banyak orang",
  "tanggung jawab yang dipegang harus dijaga layaknya nyawa",
  "rasa empati kepada warga adalah standar moral tertinggi",
  "kejujuran administratif bukan sekadar aturan, tapi pelindung jiwa",
  "kinerja yang hebat dimulai dari niat yang lurus",
  "tetaplah rendah hati walau prestasi tinggi",
  "jangan pernah menyerah untuk membuat sistem yang lebih fair dan inklusif",
  "dedikasi tiada henti adalah ciri abdi negara profesional"
];

const fragmentsC = [
  "demi mewujudkan Indonesia emas.",
  "karena itu adalah janji kita pada bangsa.",
  "dan pada akhirnya semua akan berbuah kebaikan.",
  "untuk mengharumkan nama instansi dan diri sendiri.",
  "karena amanah ini dititipkan bukan untuk disia-siakan.",
  "dan hal itu akan selamanya diingat oleh masyarakat.",
  "sebagai wujud cinta kita pada tanah air.",
  "demi reformasi birokrasi yang sesungguhnya.",
  "karena itu adalah kunci sebuah pelayanan paripurna.",
  "maka birokrasi kita akan terbang lebih tinggi.",
  "untuk menciptakan lingkungan kerja yang harmonis dan produktif.",
  "sebab kepercayaan publik sangatlah mahal.",
  "demi warisan terbaik bagi generasi ASN mendatang.",
  "karena Tuhan mencatat setiap perbuatan abdi-Nya.",
  "maka dari itu, jadilah teladan sedari sekarang.",
  "demi masa depan pelayanan yang lebih terang.",
  "karena kita adalah mesin penggerak republik ini.",
  "sebab di situlah nilai sejati keberkahan rizki.",
  "sebagai pembuktian semangat nasionalisme.",
  "dan mari laksanakan dengan senyuman luhur.",
  "sebab keadilan sosial dimulai dari pelayanan pemerintahan.",
  "demi memastikan tak ada warga yang merasa tertinggal."
];

export function getRandomQuote(): string {
  if (Math.random() < 0.1) {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }
  
  const a = fragmentsA[Math.floor(Math.random() * fragmentsA.length)];
  const b = fragmentsB[Math.floor(Math.random() * fragmentsB.length)];
  const c = fragmentsC[Math.floor(Math.random() * fragmentsC.length)];
  
  return `${a} ${b}, ${c}`;
}
