const fs = require('fs');
const glob = require('glob'); // Need to find files, or just hardcode the list.

const files = [
  'App.tsx',
  'components/ScrollToTop.tsx',
  'components/DashboardPage.tsx',
  'components/KPCalendar.tsx',
  'components/JamKerjaPage.tsx',
  'components/LoginPage.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove import
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]motion\/react['"];?\n?/g, '');
  
  // Replace <motion.div> to <div> and </motion.div> to </div>
  content = content.replace(/<motion\.([a-zA-Z0-9]+)/g, '<$1');
  content = content.replace(/<\/motion\.([a-zA-Z0-9]+)>/g, '</$1>');
  
  // Remove AnimatePresence (keep children)
  // This might be tricky if it has attributes.
  // <AnimatePresence mode="wait"> ... </AnimatePresence>
  content = content.replace(/<AnimatePresence[^>]*>/g, '<>');
  content = content.replace(/<\/AnimatePresence>/g, '</>');
  
  // Remove motion specific attributes:
  // initial={...} animate={...} exit={...} transition={...} whileHover={...} whileTap={...} layout
  // We need to carefully remove these JSX attributes. A regex might be a bit brittle but maybe enough.
  // Using regex for JSX attributes: attr=\{[^}]+\}
  
  // We'll run a few passes or a regex that handles nested brackets if possible, 
  // but since it's just a few files, we can use a recursive regex or just generic one.
  content = content.replace(/\s+(initial|animate|exit|transition|whileHover|whileTap|whileInView|viewport|layoutId|variants|custom)=\{((?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*)\}/g, '');
  
  // Remove boolean attributes like `layout`
  content = content.replace(/\s+layout\b/g, '');
  
  fs.writeFileSync(file, content, 'utf8');
}
