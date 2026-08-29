const fs = require('fs');
let content = fs.readFileSync('components/PensiunTable.tsx', 'utf8');

if (content.includes(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm">`) && !content.includes('print:table-row-group')) {
    content = content.replace(
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm">`,
      `<tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm print:hidden">`
    );

    const tbodyStart = content.indexOf(`<tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm print:hidden">`);
    if (tbodyStart !== -1) {
      const tbodyEnd = content.indexOf(`</tbody>`, tbodyStart) + 8;
      const paginatedContent = content.substring(tbodyStart, tbodyEnd);
      
      let printContent = paginatedContent.replace(
        'className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm print:hidden"',
        'className="divide-y divide-gray-200 hidden print:table-row-group print:text-black"'
      );
      printContent = printContent.replace(/paginatedEmployees/g, 'sortedFiltered');
      
      content = content.slice(0, tbodyEnd) + '\n' + printContent + content.slice(tbodyEnd);
    }
}

fs.writeFileSync('components/PensiunTable.tsx', content);
