const fs = require('fs');

function removeExtraDiv(file) {
  let content = fs.readFileSync(file, 'utf8');
  // We want to match:
  //         </div>
  // 
  //           </div>
  //         </div>
  //       </div>
  // And replace with 3 divs instead of 4.
  const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*(?=\{\/\*\s*(Employee|Modal))/;
  if (regex.test(content)) {
    content = content.replace(regex, (match, group1) => {
      return `</div>\n        </div>\n      </div>\n      `;
    });
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  } else {
    console.log('Target not found in ' + file);
  }
}

removeExtraDiv('components/EmployeeTable.tsx');
removeExtraDiv('components/PromotionTable.tsx');
