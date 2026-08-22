const fs = require('fs');

function patchTable(filePath, paginatedVar, allVar) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Hide the search and pagination controls
  // Look for common wrapper classes for filters/pagination to hide them in print.
  // E.g., <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
  content = content.replace(
    'className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden"',
    'className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden print:shadow-none print:border-none"'
  );

  content = content.replace(
    'className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-900 relative z-10"',
    'className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-gray-900 relative z-10 print:hidden"'
  );

  content = content.replace(
    /className="p-3 md:p-4 bg-gray-50\/50 dark:bg-gray-800\/20 border-t border-gray-200\/80 dark:border-gray-700\/80 flex flex-col sm:flex-row items-center justify-between gap-4"/,
    'className="p-3 md:p-4 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-200/80 dark:border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden"'
  );

  // For the table container: h-[600px] -> print:h-auto print:overflow-visible
  content = content.replace(
    /className="h-\[600px\]([^"]+)"/,
    'className="h-[600px] print:h-auto print:overflow-visible $1"'
  );

  // Hide action column in print
  // <th className={`text-center ${isCompact ? 'px-1 py-1.5 md:px-2 md:py-2' : 'px-2 py-2.5 md:px-3 md:py-3'}`}></th>
  content = content.replace(
    /<th className=\{`text-center \$\{isCompact \? 'px-1 py-1\.5 md:px-2 md:py-2' : 'px-2 py-2\.5 md:px-3 md:py-3'\}`\}><\/th>/g,
    '<th className={`text-center print:hidden ${isCompact ? \'px-1 py-1.5 md:px-2 md:py-2\' : \'px-2 py-2.5 md:px-3 md:py-3\'}`}></th>'
  );

  content = content.replace(
    /<td className="px-1 py-1\.5 md:px-2 md:py-2 text-right">/g,
    '<td className="px-1 py-1.5 md:px-2 md:py-2 text-right print:hidden">'
  );
  content = content.replace(
    /<td className="px-2 py-2\.5 md:px-3 md:py-3 text-right">/g,
    '<td className="px-2 py-2.5 md:px-3 md:py-3 text-right print:hidden">'
  );

  // The paginated tbody
  if (content.includes(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">`) && !content.includes('print:table-row-group')) {
    content = content.replace(
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">`,
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">`
    );

    // We need to inject the print tbody right after the paginated one closes.
    // Let's find the closing of tbody
    const tbodyStart = content.indexOf(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">`);
    if (tbodyStart !== -1) {
      const tbodyEnd = content.indexOf(`</tbody>`, tbodyStart) + 8;
      const paginatedContent = content.substring(tbodyStart, tbodyEnd);
      
      let printContent = paginatedContent.replace(
        'className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden"',
        'className="divide-y divide-gray-200 hidden print:table-row-group print:text-black"'
      );
      printContent = printContent.replace(new RegExp(paginatedVar, 'g'), allVar);
      
      // also replace the onClick behavior to nothing for print? Not strictly necessary since it won't be interactive on paper.

      content = content.slice(0, tbodyEnd) + '\n' + printContent + content.slice(tbodyEnd);
    }
  }

  // General table style
  content = content.replace(
    /<table className="w-full text-left border-collapse">/g,
    '<table className="w-full text-left border-collapse print:text-xs print:border print:border-black">'
  );
  
  content = content.replace(
    /<thead className="sticky top-0 bg-gray-50 dark:bg-gray-800\/90 text-gray-600 dark:text-gray-300 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700">/g,
    '<thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 z-10 shadow-sm border-b border-gray-200 dark:border-gray-700 print:static print:bg-white print:text-black print:border-black">'
  );

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

patchTable('components/EmployeeTable.tsx', 'paginatedEmployees', 'sortedFiltered');
patchTable('components/PromotionTable.tsx', 'paginatedEmployees', 'sortedFiltered');
patchTable('components/PensiunTable.tsx', 'paginatedEmployees', 'sortedFiltered');
