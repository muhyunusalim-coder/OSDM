const fs = require('fs');

const path = 'components/PromotionTable.tsx';
let content = fs.readFileSync(path, 'utf8');
if (!content.includes("import { TableVirtuoso } from 'react-virtuoso';")) {
  content = content.replace("import { Search,", "import { TableVirtuoso } from 'react-virtuoso';\nimport { Search,");
}
fs.writeFileSync(path, content);
console.log(`Fixed imports in ${path}`);
