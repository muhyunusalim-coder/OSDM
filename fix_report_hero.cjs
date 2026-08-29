const fs = require('fs');
let content = fs.readFileSync('components/ReportPage.tsx', 'utf8');

const regex = /<div className="bg-gray-900 dark:bg-gray-800 rounded-xl p-6 shadow-md relative overflow-hidden text-white print:hidden">[\s\S]*?Cetak\n\s*<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/;

const replacement = `<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm relative overflow-hidden text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 print:hidden">
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none transform trangray-z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase r mb-3">
                    <FileText size={16} />
                    Pusat Laporan
                </div>
                <h1 className="text-3xl font-bold mb-2">
                    {isKP ? 'Rekapitulasi Kenaikan Pangkat' : 'Rekapitulasi Kenaikan Gaji Berkala'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    {isKP ? 'Unduh dan cetak laporan nominatif kenaikan pangkat.' : 'Unduh dan cetak laporan nominatif kenaikan gaji berkala.'}
                </p>
            </div>
            
            <div className="flex gap-3">
                <button onClick={handleExportExcel} disabled={filteredData.length === 0 || isExporting} className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                    {isExporting ? 'Memproses...' : 'Ekspor Excel'}
                </button>
                <button onClick={handleExportPdf} disabled={filteredData.length === 0 || isExportingPdf} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                    {isExportingPdf ? 'Memproses...' : 'Unduh PDF'}
                </button>
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold text-sm transition-all shadow-sm border border-gray-200 dark:border-gray-600">
                    <Printer size={18} />
                    Cetak
                </button>
            </div>
        </div>
      </div>`;

if(regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('components/ReportPage.tsx', content);
    console.log("Fixed ReportPage hero banner");
} else {
    console.log("Not found in ReportPage");
}
