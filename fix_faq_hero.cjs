const fs = require('fs');
let content = fs.readFileSync('components/FAQPage.tsx', 'utf8');

const regex = /<div className="bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-white border border-primary-800\/40">[\s\S]*?<\/div>\s*<\/div>/;

const replacement = `<div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase r mb-4 shadow-sm">
            <BookOpen size={14} className="text-primary-600 dark:text-primary-400" />
            Pusat Informasi & Bantuan Terpadu
          </span>
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-gray-900 dark:text-white">
            Dasar Hukum & Informasi Kepegawaian
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
            Selamat datang di pusat bantuan resmi BSKJI. Temukan kompilasi
            regulasi terkini serta kumpulan pertanyaan umum (FAQ) seputar
            administrasi kepegawaian Anda secara lengkap.
          </p>
        </div>
      </div>`;

if(regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('components/FAQPage.tsx', content);
    console.log("Fixed FAQPage hero banner");
} else {
    console.log("Not found in FAQPage");
}
