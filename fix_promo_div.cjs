const fs = require('fs');

const path = 'components/PromotionTable.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('{/* Modal Detail Pegawai KP */}', '</div>\n        {/* Modal Detail Pegawai KP */}');
fs.writeFileSync(path, content);
console.log(`Fixed missing div in ${path}`);
