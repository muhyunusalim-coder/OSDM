const fs = require('fs');
let content = fs.readFileSync('components/JamKerjaPage.tsx', 'utf8');

const regex = /<div className="bg-gray-900 dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-primary-500\/10 print:hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-gray-900 dark:text-white relative overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-extrabold st uppercase border border-primary-200 dark:border-primary-800">
              <Clock size={12} /> {t('presence_perf')} & {t('deficiency')}
            </span>
            <h1 className="text-2xl md:text-3xl font-black leading-tight text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-normal leading-relaxed">
              {t('subtitle')}
            </p>
          </div>

          {/* Quick Rules Sheet */}
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-5 max-w-md space-y-3.5 shrink-0 text-gray-600 dark:text-gray-300 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase r pb-1.5 border-b border-gray-200 dark:border-gray-700">
              <HelpCircle size={14} className="text-primary-600 dark:text-primary-400" /> {t('rules_title')}
            </h3>
            <div className="grid grid-cols-2 gap-3.5 text-[11px]">
              <div className="space-y-1">
                <span className="block font-bold text-gray-900 dark:text-white text-xs">{t('mon_thu')}</span>
                <span className="block text-primary-600 dark:text-primary-400 font-medium">07:30 – 16:00</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('break')}: 60 m</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('max_checkout')}: 17:00</span>
              </div>
              <div className="space-y-1">
                <span className="block font-bold text-gray-900 dark:text-white text-xs">{t('fri')}</span>
                <span className="block text-primary-600 dark:text-primary-400 font-medium">07:30 – 16:30</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('break')}: 90 m</span>
                <span className="block text-gray-500 dark:text-gray-400 font-medium">{t('max_checkout')}: 17:30</span>
              </div>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium pt-1.5 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
              <div>* {t('rule_note_1')}</div>
              <div className="text-primary-600 dark:text-primary-400 font-semibold">* {t('rule_note_2')}</div>
            </div>
          </div>
        </div>
      </div>`;

if(regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('components/JamKerjaPage.tsx', content);
    console.log("Fixed JamKerjaPage hero banner");
} else {
    console.log("Not found in JamKerjaPage");
}
