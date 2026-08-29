const fs = require('fs');
const path = 'components/JamKerjaPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Extract LOCAL_TRANSLATIONS
const transStart = content.indexOf('const LOCAL_TRANSLATIONS = {');
const transEndStr = '\n  }\n};\n';
const transEnd = content.indexOf(transEndStr, transStart) + transEndStr.length;

if (transStart !== -1 && transEnd !== -1) {
  const translationsCode = content.slice(transStart, transEnd);
  fs.writeFileSync('components/JamKerja/translations.ts', 'export ' + translationsCode);
  content = content.slice(0, transStart) + content.slice(transEnd);
  console.log('Extracted LOCAL_TRANSLATIONS');
}

// 2. Remove getQuarterFromMonth
const qStart = content.indexOf('function getQuarterFromMonth');
const qEndStr = '\n}\n';
const qEnd = content.indexOf(qEndStr, qStart) + qEndStr.length;
if (qStart !== -1 && qEnd !== -1) {
  content = content.slice(0, qStart) + content.slice(qEnd);
  console.log('Removed getQuarterFromMonth');
}

// 3. Remove translateMonthName
const tStart = content.indexOf('export function translateMonthName');
const tEnd = content.indexOf(qEndStr, tStart) + qEndStr.length;
if (tStart !== -1 && tEnd !== -1) {
  content = content.slice(0, tStart) + content.slice(tEnd);
  console.log('Removed translateMonthName');
}

// 4. Insert imports
const importTarget = "import {\n   fetchJamKerjaData, JamKerjaRecord, DailyAttendance,\n   formatMinutesFriendly, getDayNameIndonesian,\n  getDayOfWeekForMonth, isWeekendForMonth, getIndonesianHolidayName\n} from '../utils/jamKerjaHelpers';";

const newImports = `import { LOCAL_TRANSLATIONS } from './JamKerja/translations';\nimport { getQuarterFromMonth, translateMonthName } from './JamKerja/utils';`;

content = content.replace(importTarget, `${importTarget}\n${newImports}`);

fs.writeFileSync(path, content);
console.log('Updated JamKerjaPage.tsx');
