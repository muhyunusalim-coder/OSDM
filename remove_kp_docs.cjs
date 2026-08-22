const fs = require('fs');

let content = fs.readFileSync('components/PromotionTable.tsx', 'utf8');

// 1. Remove KP_DOC_CHECKLIST
const startChecklist = content.indexOf('const KP_DOC_CHECKLIST = [');
if (startChecklist !== -1) {
  const endChecklist = content.indexOf('];', startChecklist) + 2;
  content = content.slice(0, startChecklist) + content.slice(endChecklist);
}

// 2. Remove checkedDocs state
content = content.replace(/const \[checkedDocs, setCheckedDocs\] = useState<Record<string, boolean>>\(\{\}\);\n/g, '');

// 3. Remove toggleDoc function
const startToggle = content.indexOf('const toggleDoc = (docId: string) => {');
if (startToggle !== -1) {
  // finding the end of the function. It's a simple one, let's just find the closing brace
  // const toggleDoc = (docId: string) => {
  //   const key = `${selectedEmployee?.id}_${docId}`;
  //   setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  // };
  const endToggle = content.indexOf('};', startToggle) + 2;
  content = content.slice(0, startToggle) + content.slice(endToggle);
}

// 4. Remove UI block
const startUI = content.indexOf('{/* Kelengkapan Berkas KP */}');
if (startUI !== -1) {
  // the block ends before `{/* Status KP */}`
  const endUI = content.indexOf('{/* Status KP */}', startUI);
  content = content.slice(0, startUI) + content.slice(endUI);
}

fs.writeFileSync('components/PromotionTable.tsx', content);
console.log('Removed KP Document Checklist');
