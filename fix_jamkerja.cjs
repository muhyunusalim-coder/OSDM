const fs = require('fs');

let content = fs.readFileSync('components/JamKerjaPage.tsx', 'utf8');

// Hide print button in drawer on print (already there maybe?)
// Make the table full-width and remove its scrolling wrapper restriction
content = content.replace(
  'className="flex bg-white dark:bg-gray-900/50 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar gap-1.5 mb-6 shadow-sm border border-gray-200 dark:border-gray-700 print:hidden relative z-20"',
  'className="flex bg-white dark:bg-gray-900/50 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar gap-1.5 mb-6 shadow-sm border border-gray-200 dark:border-gray-700 print:hidden relative z-20"'
);

// We need the table wrapper in JamKerjaPage
content = content.replace(
  'className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden overflow-x-auto bg-white dark:bg-gray-900 shadow-inner"',
  'className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden overflow-x-auto bg-white dark:bg-gray-900 shadow-inner print:overflow-visible print:border-none print:shadow-none"'
);

content = content.replace(
  '<table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">',
  '<table className="w-full text-left text-sm whitespace-nowrap min-w-[800px] print:min-w-0 print:text-[10px] print:whitespace-normal print:w-full">'
);

content = content.replace(
  'className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold uppercase r text-[10px] border-b border-gray-100 dark:border-gray-800"',
  'className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold uppercase r text-[10px] border-b border-gray-100 dark:border-gray-800 print:bg-white print:text-black print:border-black print:border-b-2"'
);

content = content.replace(
  /<th className="px-5 py-3\.5 text-center">Status<\/th>/g,
  '<th className="px-5 py-3.5 text-center print:hidden">Status</th>'
);

content = content.replace(
  /<td className="px-4 py-3\.5 text-center">([\s\S]*?)<\/td>/g,
  '<td className="px-4 py-3.5 text-center print:hidden">$1</td>'
);

// ensure the print body has print:hidden on the action columns too
content = content.replace(
  /<tbody className="divide-y divide-gray-200 hidden print:table-row-group">([\s\S]*?)<\/tbody>/g,
  function(match, p1) {
      let m = match.replace(/<td className="px-4 py-3\.5 text-center">([\s\S]*?)<\/td>/g, '<td className="px-4 py-3.5 text-center print:hidden">$1</td>');
      return m.replace(/text-gray-900/g, 'print:text-black').replace(/text-gray-500/g, 'print:text-black');
  }
);

fs.writeFileSync('components/JamKerjaPage.tsx', content);
console.log('Patched JamKerjaPage');
