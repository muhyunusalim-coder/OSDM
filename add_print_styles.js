const fs = require('fs');
const glob = require('glob');

const files = ['components/EmployeeTable.tsx', 'components/PromotionTable.tsx', 'components/PensiunTable.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Make the table container full height on print
  // h-[600px] shadow-inner bg-white dark:bg-gray-900 rounded-b-2xl border border-gray-200 dark:border-gray-800
  if (content.includes('h-[600px]')) {
    content = content.replace(/className="h-\[600px\]([^"]+)"/, 'className="h-[600px] print:h-auto print:overflow-visible $1"');
    changed = true;
  }
  
  // Also remove Virtuoso wrapper logic if we want a plain table for printing. 
  // Wait, these tables use react-virtuoso! react-virtuoso renders a virtualized list, so it only renders visible rows in DOM!
  // Oh no! If we use react-virtuoso, the print view will only print the visible rows.
  // We need to render a normal hidden table for print.
  // Wait, we have `print:hidden` for the Virtuoso list and a hidden print-only table?
  
  console.log('Processed', file);
}
