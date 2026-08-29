const fs = require('fs');

let content = fs.readFileSync('components/ReportPage.tsx', 'utf8');

// The paginated tbody
if (content.includes(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:divide-black">`) && !content.includes('print:table-row-group')) {
    content = content.replace(
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:divide-black">`,
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">`
    );

    const tbodyStart = content.indexOf(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden">`);
    if (tbodyStart !== -1) {
      const tbodyEnd = content.indexOf(`</tbody>`, tbodyStart) + 8;
      const paginatedContent = content.substring(tbodyStart, tbodyEnd);
      
      let printContent = paginatedContent.replace(
        'className="divide-y divide-gray-100 dark:divide-gray-800 text-sm print:hidden"',
        'className="divide-y divide-gray-200 hidden print:table-row-group print:text-[10px] print:text-black"'
      );
      printContent = printContent.replace(/paginatedData/g, 'filteredData');
      
      content = content.slice(0, tbodyEnd) + '\n' + printContent + content.slice(tbodyEnd);
    }
}

// Make the table full-width and remove overflow-x-auto restriction for print
content = content.replace(
  'className="overflow-x-auto border-t border-gray-200 dark:border-gray-700"',
  'className="overflow-x-auto border-t border-gray-200 dark:border-gray-700 print:overflow-visible print:border-none"'
);

content = content.replace(
  /<table className="w-full text-left border-collapse">/g,
  '<table className="w-full text-left border-collapse print:text-[10px] print:border print:border-black">'
);

// We need to style the thead to be simple
content = content.replace(
  /<thead className="bg-gray-100\/80 dark:bg-gray-800\/80 text-gray-500 dark:text-gray-400 text-\[10px\] uppercase r font-bold print:bg-gray-200 print:text-black">/g,
  '<thead className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 text-[10px] uppercase r font-bold print:bg-white print:text-black print:border-b-2 print:border-black">'
);

fs.writeFileSync('components/ReportPage.tsx', content);
console.log('Patched ReportPage');
