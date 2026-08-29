const fs = require('fs');
const glob = require('glob');

const files = glob.sync('components/**/*.tsx');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // ReportPage, FAQPage, JamKerjaPage headers
  if (content.includes('className="bg-primary-50 dark:bg-gray-800 rounded-xl p-6 shadow-md relative overflow-hidden text-white')) {
    content = content.replace('bg-primary-50 dark:bg-gray-800 rounded-xl p-6 shadow-md relative overflow-hidden text-white', 'bg-gray-900 dark:bg-gray-800 rounded-xl p-6 shadow-md relative overflow-hidden text-white');
    changed = true;
  }
  if (content.includes('bg-primary-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-white')) {
    content = content.replace('bg-primary-50 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-white', 'bg-gray-900 dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden text-white');
    changed = true;
  }
  if (content.includes('bg-primary-50 dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl')) {
    content = content.replace('bg-primary-50 dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl', 'bg-gray-900 dark:bg-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl');
    changed = true;
  }

  // Modals avatar boxes
  const modalAvatar1 = 'bg-primary-50 dark:bg-gray-800 border-2 border-primary-500 text-white';
  if (content.includes(modalAvatar1)) {
    content = content.replace(new RegExp(modalAvatar1, 'g'), 'bg-gray-800 border-2 border-primary-500 text-white');
    changed = true;
  }
  const modalAvatar2 = 'bg-primary-50 dark:bg-gray-800 border-2 border-rose-500 text-white';
  if (content.includes(modalAvatar2)) {
    content = content.replace(new RegExp(modalAvatar2, 'g'), 'bg-gray-800 border-2 border-rose-500 text-white');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed contrast in ' + file);
  }
}
