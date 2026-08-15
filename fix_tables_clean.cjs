const fs = require('fs');

function fixTable(path) {
  let content = fs.readFileSync(path, 'utf8');

  const start = content.indexOf('<div className="h-[600px]');
  const endStr = '/>\n          </div>';
  let end = content.indexOf(endStr, start);
  
  if (start === -1 || end === -1) {
    console.log(`Could not find TableVirtuoso block in ${path}`);
    return;
  }
  end += endStr.length;

  let block = content.slice(start, end);

  // We need to extract:
  // 1. The header tr content
  // 2. The item td content
  // 3. The empty placeholder content
  
  // Extract Header
  const headStart = block.indexOf('fixedHeaderContent={() => (');
  const headStartTr = block.indexOf('<tr', headStart);
  const headEndTr = block.indexOf('</tr>', headStartTr) + '</tr>'.length;
  const headerContent = block.slice(headStartTr, headEndTr);

  // Extract td content
  // In the current broken block, itemContent looks like:
  // itemContent={(index, emp) => (
  //   <React.Fragment>
  //      <td ...>
  //      ...
  //      </td>
  //    </tr>
  //  ))
  //  ) : (
  //    <tr>
  //      <td colSpan={9}...
  //      ...
  //      </td>
  //    </React.Fragment>
  
  const tdStart = block.indexOf('<td', block.indexOf('<React.Fragment>'));
  // The end of the td block is right before `</tr>\n                ))`
  // Wait, I can find `</tr>` that matches the end of the item.
  // Actually, there's `                  </tr>\n                ))\n              ) : (\n                <tr>`
  let tdEndStr = '</tr>\n                ))\n              ) : (';
  let tdEnd = block.indexOf(tdEndStr);
  if (tdEnd === -1) {
    tdEndStr = '</tr>\n                                ))\n                            ) : (';
    tdEnd = block.indexOf(tdEndStr);
  }
  
  const tdsContent = block.slice(tdStart, tdEnd).trim();

  // Extract empty placeholder
  const emptyTdStart = block.indexOf('<td colSpan', tdEnd);
  // It ends before `</React.Fragment>`
  const emptyTdEndStr = '</td>\n                </React.Fragment>';
  let emptyTdEnd = block.indexOf(emptyTdEndStr, emptyTdStart);
  if (emptyTdEnd === -1) {
    emptyTdEndStr = '</td>\n                                </React.Fragment>';
    emptyTdEnd = block.indexOf(emptyTdEndStr, emptyTdStart);
  }
  const emptyTdContent = block.slice(emptyTdStart, emptyTdEnd + 5);

  const newVirtuosoCode = `
          <div className="h-[600px] shadow-inner bg-white dark:bg-slate-900 rounded-b-2xl border border-slate-200 dark:border-slate-800">
          <TableVirtuoso
            data={filteredEmployees || filtered}
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
              EmptyPlaceholder: () => (
                <tbody>
                  <tr>
                    ${emptyTdContent}
                  </tr>
                </tbody>
              )
            }}
            fixedHeaderContent={() => (
              ${headerContent}
            )}
            itemContent={(index, emp) => (
              <>
                ${tdsContent}
              </>
            )}
            style={{ height: '100%' }}
          />
          </div>`;

  content = content.replace(block, newVirtuosoCode);

  // One more fix: "filteredEmployees || filtered" above is a hack.
  // We need to use `filteredEmployees` for PromotionTable and `filtered` for EmployeeTable.
  const dataVar = path.includes('EmployeeTable') ? 'filtered' : 'filteredEmployees';
  content = content.replace('data={filteredEmployees || filtered}', `data={${dataVar}}`);

  fs.writeFileSync(path, content);
  console.log(`Fixed table structure in ${path}`);
}

fixTable('components/EmployeeTable.tsx');
fixTable('components/PromotionTable.tsx');
