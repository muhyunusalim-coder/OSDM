const fs = require('fs');

const path = 'components/PromotionTable.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { TableVirtuoso } from 'react-virtuoso';")) {
  content = content.replace("import { Search,", "import { TableVirtuoso } from 'react-virtuoso';\nimport { Search,");
}

const tableStartStr = '<table className="w-full text-left border-collapse min-w-[1000px]">';
const tableStart = content.indexOf(tableStartStr);

const tbodyEndStr = '                    </tbody>\n                </table>\n            </div>';
const tbodyEnd = content.indexOf(tbodyEndStr, tableStart);

if (tableStart !== -1 && tbodyEnd !== -1) {
  const tableContent = content.slice(tableStart, tbodyEnd + tbodyEndStr.length);
  
  const theadStart = tableContent.indexOf('<tr className="bg-slate-50');
  const theadEnd = tableContent.indexOf('</thead>');
  const headerContent = tableContent.slice(theadStart, theadEnd).trim();

  const trMapStart = tableContent.indexOf('paginatedEmployees.map((emp, index) => (');
  const trStart = tableContent.indexOf('<tr', trMapStart);
  const tdStart = tableContent.indexOf('<td', trStart);
  
  // Find where the tr ends inside the map
  const trEndStr = '\n                                </tr>';
  const trEnd = tableContent.indexOf(trEndStr, tdStart) + trEndStr.length;
  let trContent = tableContent.slice(tdStart, trEnd).trim();
  trContent = trContent.replace(/\{\(currentPage - 1\) \* itemsPerPage \+ index \+ 1\}/g, '{index + 1}');

  const newVirtuosoCode = `
          <div className="h-[600px] shadow-inner bg-white dark:bg-slate-900 rounded-b-2xl">
          <TableVirtuoso
            data={filteredEmployees}
            components={{
              Table: (props) => <table className="w-full text-left border-collapse min-w-[1000px]" {...props} />,
              TableHead: React.forwardRef((props, ref) => <thead className="sticky top-0 z-20 shadow-sm" ref={ref} {...props} />),
              TableRow: (props) => {
                const emp = props.item;
                return (
                  <tr 
                    {...props} 
                    onClick={() => setSelectedEmployee(emp)}
                    className={\`transition-all duration-150 group cursor-pointer border-l-4 \${
                      selectedEmployee?.id === emp?.id 
                        ? 'bg-primary-50/80 dark:bg-primary-950/40 border-l-primary-500 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]' 
                        : 'border-l-transparent hover:bg-primary-50/40 dark:hover:bg-slate-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500'
                    }\`}
                  />
                );
              },
              TableBody: React.forwardRef((props, ref) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm" ref={ref} {...props} />),
            }}
            fixedHeaderContent={() => (
              ${headerContent}
            )}
            itemContent={(index, emp) => (
              <React.Fragment>
                ${trContent}
              </React.Fragment>
            )}
            style={{ height: '100%' }}
          />
          </div>
`;

  content = content.replace(tableContent, newVirtuosoCode);
  fs.writeFileSync(path, content);
  console.log('PromotionTable virtualized');
} else {
  console.log('Failed to find boundaries in PromotionTable');
}

// Remove Pagination Logic Footer
const paginationStartStr = '            {/* Pagination & Footer */}\n            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between px-6 md:px-8 gap-4">';
const paginationStart = content.indexOf(paginationStartStr);
const paginationEndStr = '            </div>\n        </div>';
const paginationEnd = content.indexOf(paginationEndStr, paginationStart);

if (paginationStart !== -1 && paginationEnd !== -1) {
  content = content.slice(0, paginationStart) + '        </div>' + content.slice(paginationEnd + paginationEndStr.length);
  fs.writeFileSync(path, content);
  console.log('Pagination footer removed from PromotionTable');
}

