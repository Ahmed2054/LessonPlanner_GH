const fs = require('fs');
const path = require('path');

const templatesDir = './templates';
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.csv'));

let output = 'export const CURRICULUM_TEMPLATES = {\n';

files.forEach(file => {
  const name = path.basename(file, '.csv');
  const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
  const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  output += `  '${name}': '${escaped}',\n`;
});

output += '};\n';

fs.writeFileSync('./src/data/templates.js', output);
console.log('Generated src/data/templates.js');
