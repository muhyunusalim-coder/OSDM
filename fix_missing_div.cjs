const fs = require('fs');

function fixMissingDiv(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace('{/* Employee Detail Modal */}', '</div>\n      {/* Employee Detail Modal */}');
  content = content.replace('{/* Promotion Detail Modal */}', '</div>\n      {/* Promotion Detail Modal */}');
  fs.writeFileSync(path, content);
  console.log(`Fixed missing div in ${path}`);
}

fixMissingDiv('components/EmployeeTable.tsx');
fixMissingDiv('components/PromotionTable.tsx');
