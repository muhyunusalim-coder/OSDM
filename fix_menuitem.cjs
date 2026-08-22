const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

const menuStart = content.indexOf('const MenuItem = React.memo');
const menuEnd = content.indexOf('MenuItem.displayName = \'MenuItem\';');

if (menuStart !== -1 && menuEnd !== -1) {
    let menuContent = content.substring(menuStart, menuEnd);

    menuContent = menuContent.replace(/bg-primary-50 dark:bg-primary-500\/10 text-primary-600 dark:text-primary-400/g, 'bg-primary-500/10 text-primary-400');
    menuContent = menuContent.replace(/text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800\/50 hover:text-gray-900 dark:hover:text-gray-200/g, 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200');
    menuContent = menuContent.replace(/bg-primary-100 dark:bg-primary-500\/20 text-primary-600 dark:text-primary-400/g, 'bg-primary-500/20 text-primary-400');

    content = content.slice(0, menuStart) + menuContent + content.slice(menuEnd);
    fs.writeFileSync('App.tsx', content);
    console.log('Patched App.tsx MenuItem');
}
