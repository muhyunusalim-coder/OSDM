const fs = require('fs');
const path = require('path');

const files = [
    'components/EmployeeTable.tsx',
    'components/PromotionTable.tsx',
    'components/PensiunTable.tsx',
    'components/ReportPage.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // Remove getTmtDate
    content = content.replace(/\s*const getTmtDate = \(tmt: string\) => \{[\s\S]*?(?=\s*const (months|years|stats|currentYear|unique|getDaysRemaining|calculate|format))/g, '');

    // Remove getDaysRemaining
    content = content.replace(/\s*const getDaysRemaining = \(tmt: string\) => \{[\s\S]*?(?=\s*const (getStatusLabel|calculate|format|months|years|unique))/g, '');

    // Remove getStatusLabel
    content = content.replace(/\s*const getStatusLabel = \(tmt: string\): \{ label: string; class: string \} => \{[\s\S]*?(?=\s*const (calculate|format|months|years|unique))/g, '');

    // Remove calculateCycleDates
    content = content.replace(/\s*const calculateCycleDates = \(tmt: string\) => \{[\s\S]*?(?=\s*const (format|calculate|months|years|unique))/g, '');

    // Remove calculateKPCycleDates
    content = content.replace(/\s*const calculateKPCycleDates = \(tmt: string\) => \{[\s\S]*?(?=\s*const (getTmtDate|format|calculate|months|years|unique))/g, '');

    // Remove formatRupiah
    content = content.replace(/\s*const formatRupiah = \(num: number\) => \{[\s\S]*?(?=\s*const (months|years|unique))/g, '');

    // Remove getMasaKerjaYears from within filtered/filteredEmployees useMemo
    content = content.replace(/\s*const getMasaKerjaYears = \(masaKerjaStr: string\) => \{[\s\S]*?(?=\s*return employees\.filter)/g, '');

    // Remove months array if it exists inside the component (outside or inside)
    // Be careful with months usage
    content = content.replace(/\s*const months = \["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"\];/g, '');

    // Add import statement at the top if there were replacements
    if (content !== originalContent) {
        const importStr = `import { getTmtDate, getDaysRemaining, getStatusLabel, calculateCycleDates, calculateKPCycleDates, formatRupiah, getMasaKerjaYears, months } from '../utils/employeeUtils';\n`;
        // Insert after the last import
        const lastImportIndex = content.lastIndexOf('import ');
        const nextLineIndex = content.indexOf('\n', lastImportIndex) + 1;
        content = content.slice(0, nextLineIndex) + importStr + content.slice(nextLineIndex);
        fs.writeFileSync(file, content);
        console.log(`Refactored ${file}`);
    }
});
