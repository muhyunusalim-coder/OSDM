const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

const asideStart = content.indexOf('<aside className={`fixed inset-y-0');
const asideEnd = content.indexOf('</aside>', asideStart);

if (asideStart !== -1 && asideEnd !== -1) {
    let asideContent = content.substring(asideStart, asideEnd + 8);

    // Apply replacements only to asideContent
    asideContent = asideContent.replace(/bg-white dark:bg-gray-900/g, 'bg-gray-900');
    asideContent = asideContent.replace(/text-gray-700 dark:text-gray-300/g, 'text-gray-300');
    asideContent = asideContent.replace(/border-gray-200 dark:border-gray-800/g, 'border-gray-800');
    asideContent = asideContent.replace(/text-gray-900 dark:text-white/g, 'text-white');
    asideContent = asideContent.replace(/text-gray-500 dark:text-gray-400/g, 'text-gray-400');
    
    asideContent = asideContent.replace(/bg-primary-50 dark:bg-primary-500\/10 text-primary-600 dark:text-primary-400/g, 'bg-primary-500/10 text-primary-400');
    asideContent = asideContent.replace(/text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800\/50 hover:text-gray-900 dark:hover:text-gray-200/g, 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200');
    
    asideContent = asideContent.replace(/bg-gray-50 dark:bg-gray-900\/50/g, 'bg-gray-900/50');
    asideContent = asideContent.replace(/bg-gray-200 dark:bg-gray-800/g, 'bg-gray-800');
    asideContent = asideContent.replace(/text-gray-900 dark:text-gray-100/g, 'text-gray-100');
    asideContent = asideContent.replace(/text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:text-gray-200 dark:hover:bg-gray-800/g, 'text-gray-400 hover:text-gray-200 hover:bg-gray-800');
    
    // AlsoMenuItem Component might be defined outside aside, let's check
    content = content.slice(0, asideStart) + asideContent + content.slice(asideEnd + 8);
    fs.writeFileSync('App.tsx', content);
    console.log('Patched App.tsx sidebar');
}
