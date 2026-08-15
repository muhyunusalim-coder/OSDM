const fs = require('fs');

function fixFile(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/<\/tr>\s*<\/React\.Fragment>/g, '</React.Fragment>');
  fs.writeFileSync(path, content);
  console.log(`Fixed ${path}`);
}

fixFile('components/EmployeeTable.tsx');
fixFile('components/PromotionTable.tsx');
