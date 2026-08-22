const fs = require('fs');

let content = fs.readFileSync('components/EmployeeTable.tsx', 'utf8');

const theadRegex = /<thead className="sticky top-0 z-20 shadow-sm">[\s\S]*?<\/thead>/;

const newThead = `
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[9px] md:text-[10px] uppercase font-bold st border-b border-gray-200 dark:border-gray-700">
                  <th className={\`w-10 text-center hidden md:table-cell \${isCompact ? 'px-2 py-1.5 md:py-2' : 'px-2 py-2.5 md:px-4 md:py-3'}\`}>#</th>
                  <th className={\`cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`} onClick={() => requestSort('nama')}>
                    <div className="flex items-center gap-1">
                      Nama
                      <ArrowUpDown size={10} className={sortConfig?.key === 'nama' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                  </th>
                  <th className={\`hidden sm:table-cell \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`}>Pangkat/Gol</th>
                  <th className={\`hidden lg:table-cell \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`}>Detail</th>
                  <th className={\`hidden xl:table-cell \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`}>Status</th>
                  <th className={\`whitespace-nowrap hidden xl:table-cell \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`}>Masa Kerja</th>
                  <th className={\`hidden md:table-cell cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`} onClick={() => requestSort('tmtDate')}>
                    <div className="flex items-center gap-1">
                      TMT
                      <ArrowUpDown size={10} className={sortConfig?.key === 'tmtDate' ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'} />
                    </div>
                  </th>
                  <th className={\`text-center \${isCompact ? 'px-2 py-1.5 md:px-3 md:py-2' : 'px-3 py-2.5 md:px-4 md:py-3'}\`}>Hitungan Mundur KGB</th>
                  <th className={\`text-center \${isCompact ? 'px-1 py-1.5 md:px-2 md:py-2' : 'px-2 py-2.5 md:px-3 md:py-3'}\`}></th>
                </tr>
            </thead>
`;

content = content.replace(theadRegex, newThead);
fs.writeFileSync('components/EmployeeTable.tsx', content);
console.log("Fixed EmployeeTable header");
