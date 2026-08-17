const fs = require('fs');

let content = fs.readFileSync('components/PensiunTable.tsx', 'utf8');
const originalContent = content;

// Remove getMasaKerjaYears
content = content.replace(/\s*const getMasaKerjaYears = \(masaKerjaStr: string\) => \{[\s\S]*?(?=\s*const years = getMasaKerjaYears\(emp\.masaKerja\);)/g, '');

if (content !== originalContent) {
    const importStr = `import { getMasaKerjaYears } from '../utils/employeeUtils';\n`;
    const lastImportIndex = content.lastIndexOf('import ');
    const nextLineIndex = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, nextLineIndex) + importStr + content.slice(nextLineIndex);
    fs.writeFileSync('components/PensiunTable.tsx', content);
    console.log('Refactored PensiunTable.tsx');
}
