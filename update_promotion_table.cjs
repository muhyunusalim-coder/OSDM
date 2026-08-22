const fs = require('fs');

let content = fs.readFileSync('components/PromotionTable.tsx', 'utf8');

// 1. Remove TableVirtuoso import
content = content.replace("import { TableVirtuoso } from \"react-virtuoso\";\n", "");

// 2. Replace TableVirtuoso block with normal table
const virtuosoStart = content.indexOf('<TableVirtuoso');
const virtuosoEnd = content.indexOf('/>\n          </div>\n        </div>\n\n        {/* Employee Detail Modal */}');

if (virtuosoStart !== -1 && virtuosoEnd !== -1) {
  // Extract itemContent logic
  const itemContentRegex = /itemContent=\{\(index: number, emp: Employee\) => \(\s*<>\s*([\s\S]*?)\s*<\/>\s*\)\}/;
  const itemContentMatch = content.match(itemContentRegex);
  const rowContent = itemContentMatch ? itemContentMatch[1] : '';

  // Extract fixedHeaderContent logic
  const headerContentRegex = /fixedHeaderContent=\{\(\) => \(\s*([\s\S]*?)\s*\)\}/;
  const headerContentMatch = content.match(headerContentRegex);
  const headerContent = headerContentMatch ? headerContentMatch[1] : '';
  
  const emptyPlaceholderRegex = /EmptyPlaceholder: \(\) => \(\s*<tbody>\s*([\s\S]*?)<\/tbody>\s*\)/;
  const emptyPlaceholderMatch = content.match(emptyPlaceholderRegex);
  const emptyPlaceholder = emptyPlaceholderMatch ? emptyPlaceholderMatch[1] : '';

  const newTable = `
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20 shadow-sm">
              ${headerContent}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={\`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 \${
                      selectedEmployee?.id === emp.id
                        ? '!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm'
                        : 'border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500'
                    }\`}
                  >
                    ${rowContent}
                  </tr>
                ))
              ) : (
                ${emptyPlaceholder}
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between px-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase r">
              Total: {filteredEmployees.length} Pegawai
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase">
                Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-700 dark:text-gray-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
              </button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={\`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition-all \${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }\`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
`;

  // Actually replace the virtuoso part
  content = content.substring(0, virtuosoStart) + newTable + content.substring(virtuosoEnd + 2);
  
  // Save it back
  fs.writeFileSync('components/PromotionTable.tsx', content);
  console.log("Replaced TableVirtuoso in PromotionTable");
} else {
  console.log("Could not find TableVirtuoso block in PromotionTable");
}
