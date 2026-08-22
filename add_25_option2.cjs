const fs = require('fs');

const files = [
  'components/EmployeeTable.tsx',
  'components/PromotionTable.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<option value=\{20\}>20<\/option>/g, '<option value={20}>20</option>\n<option value={25}>25</option>');
  fs.writeFileSync(file, content);
  console.log('Added 25 to ' + file);
}
