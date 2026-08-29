const fs = require('fs');

let content = fs.readFileSync('components/PromotionTable.tsx', 'utf8');

const regex = /<thead className="sticky top-0 z-20 shadow-sm">[\s\S]*?<\/tbody>/;

const newBlock = `
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[9px] md:text-[10px] uppercase font-bold st border-b border-gray-200 dark:border-gray-700">
                  <th className={\`w-10 text-center hidden md:table-cell \${isCompact ? "px-2 py-1.5 md:py-2" : "px-2 py-2.5 md:px-4 md:py-3"}\`}>#</th>
                  <th className={\`cursor-pointer hover:bg-gray-100 dark:bg-gray-800 transition-colors \${isCompact ? "px-2 py-1.5 md:px-3 md:py-2" : "px-3 py-2.5 md:px-4 md:py-3"}\`} onClick={() => requestSort("nama")}>
                    <div className="flex items-center gap-1">Nama <ArrowUpDown size={10} className={sortConfig?.key === "nama" ? "text-primary-600" : "text-gray-500 dark:text-gray-400"} /></div>
                  </th>
                  <th className={\`hidden sm:table-cell \${isCompact ? "px-2 py-1.5 md:px-3 md:py-2" : "px-3 py-2.5 md:px-4 md:py-3"}\`}>Pangkat/Gol</th>
                  <th className={\`hidden lg:table-cell \${isCompact ? "px-2 py-1.5 md:px-3 md:py-2" : "px-3 py-2.5 md:px-4 md:py-3"}\`}>Detail</th>
                  <th className={\`hidden xl:table-cell \${isCompact ? "px-2 py-1.5 md:px-3 md:py-2" : "px-3 py-2.5 md:px-4 md:py-3"}\`}>TMT KP</th>
                  <th className={\`text-center \${isCompact ? "px-2 py-1.5 md:px-3 md:py-2" : "px-3 py-2.5 md:px-4 md:py-3"}\`}>Status</th>
                  <th className={\`text-center \${isCompact ? "px-1 py-1.5 md:px-2 md:py-2" : "px-2 py-2.5 md:px-3 md:py-3"}\`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={\`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 \${
                      selectedEmployee?.id === emp.id
                        ? "!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm"
                        : "border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500"
                    }\`}
                  >
                    <td className={\`text-center text-gray-400 dark:text-gray-500 font-medium text-[10px] md:text-xs hidden md:table-cell \${isCompact ? "px-2 py-1 md:py-1.5" : "px-2 py-2 md:px-4 md:py-2.5"}\`}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className={isCompact ? "px-2 py-1 md:px-3 md:py-1.5" : "px-3 py-2 md:px-4 md:py-2.5"}>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <div className={\`font-bold text-gray-800 dark:text-gray-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate pr-1 md:pr-2 \${isCompact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"}\`}>{emp.nama}</div>
                          <div className={\`text-gray-500 dark:text-gray-400 font-mono font-medium truncate \${isCompact ? "text-[9px] md:text-[10px]" : "text-[10px] md:text-xs"}\`}>{emp.nip}</div>
                        </div>
                      </div>
                    </td>
                    <td className={\`hidden sm:table-cell \${isCompact ? "px-2 py-1 md:px-3 md:py-1.5" : "px-3 py-2 md:px-4 md:py-2.5"}\`}>
                      <div className="flex items-center gap-2">
                         <span className="text-gray-400 dark:text-gray-500 line-through text-[10px]">{emp.pangkatLama || "-"}</span>
                         <ArrowRight size={12} className="text-gray-300" />
                         <span className={\`inline-flex items-center rounded-xl font-bold bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/60 shadow-sm \${isCompact ? "px-1.5 py-0.2 md:px-2 md:py-0.5 text-[9px] md:text-[10px]" : "px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs"}\`}>{emp.pangkatBaru || emp.pangkat || "-"}</span>
                      </div>
                    </td>
                    <td className={\`text-gray-600 dark:text-gray-500 hidden lg:table-cell \${isCompact ? "px-2 py-1 md:px-3 md:py-1.5" : "px-3 py-2 md:px-4 md:py-2.5"}\`}>
                      <div className={\`font-semibold text-gray-700 dark:text-gray-200 mb-0.5 \${isCompact ? "text-[11px]" : "text-xs"}\`}>{emp.jabatan}</div>
                      <div className={\`text-gray-500 dark:text-gray-500 \${isCompact ? "text-[9px]" : "text-[10px]"}\`}>{emp.unitKerja}</div>
                    </td>
                    <td className={\`hidden xl:table-cell \${isCompact ? "px-2 py-1 md:px-3 md:py-1.5" : "px-3 py-2 md:px-4 md:py-2.5"}\`}>
                      <div className={\`font-mono text-gray-800 dark:text-gray-200 font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg inline-block shadow-sm \${isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}\`}>
                        {emp.tmt}
                      </div>
                    </td>
                    <td className={\`text-center \${isCompact ? "px-2 py-1 md:py-1.5" : "px-2 py-2 md:px-4 md:py-2.5"}\`}>
                      <div className="flex items-center justify-center">
                        {emp.status === "Processed" ? (
                          <div className={\`inline-flex items-center gap-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 shadow-sm \${isCompact ? "px-1.5 py-0.5" : "px-2 py-1"}\`}>
                            <CheckCircle2 size={isCompact ? 10 : 12} />
                            <span className="text-[10px] font-bold hidden sm:inline">Selesai</span>
                          </div>
                        ) : emp.status === "Upcoming" ? (
                          <div className={\`inline-flex items-center gap-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm \${isCompact ? "px-1.5 py-0.5" : "px-2 py-1"}\`}>
                            <Clock size={isCompact ? 10 : 12} />
                            <span className="text-[10px] font-bold hidden sm:inline">Usulan</span>
                          </div>
                        ) : (
                          <div className={\`inline-flex items-center gap-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shadow-sm \${isCompact ? "px-1.5 py-0.5" : "px-2 py-1"}\`}>
                            <TrendingUp size={isCompact ? 10 : 12} />
                            <span className="text-[10px] font-bold hidden sm:inline">Diproses</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={\`text-center \${isCompact ? "px-1 py-1 md:px-2 md:py-1.5" : "px-2 py-2 md:px-3 md:py-2.5"}\`}>
                      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 inline-block" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-4">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800">
                        <Search size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 dark:text-gray-500 text-lg">Tidak ada data ditemukan</p>
                        <p className="text-sm">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
`;

content = content.replace(regex, newBlock);

if(!content.includes("import { ArrowRight")) {
    content = content.replace("import { ArrowUpDown", "import { ArrowRight, ArrowUpDown");
}

fs.writeFileSync('components/PromotionTable.tsx', content);
console.log("Fixed PromotionTable header and body");
