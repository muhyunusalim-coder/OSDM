const fs = require('fs');

function removeExtraDiv(file) {
  let content = fs.readFileSync(file, 'utf8');
  const target = '          )}\n        </div>\n          </div>\n        </div>\n      </div>';
  const replacement = '          )}\n        </div>\n        </div>\n      </div>';
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  } else {
    console.log('Target not found in ' + file);
  }
}

removeExtraDiv('components/EmployeeTable.tsx');
removeExtraDiv('components/PromotionTable.tsx');
