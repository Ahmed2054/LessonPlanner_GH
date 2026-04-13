const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const templatesDir = path.join(projectRoot, 'templates');
const outputPath = path.join(projectRoot, 'src', 'data', 'templates.js');
const rootCsvFiles = fs.readdirSync(projectRoot).filter(f => f.endsWith('.csv'));
const templateCsvFiles = fs.existsSync(templatesDir)
  ? fs.readdirSync(templatesDir).filter(f => f.endsWith('.csv')).map(f => path.join('templates', f))
  : [];
const files = [...new Set([...templateCsvFiles, ...rootCsvFiles])];

const existingEntries = new Map();

if (fs.existsSync(outputPath)) {
  const existingContent = fs.readFileSync(outputPath, 'utf8');
  const entryPattern = /'([^']+)': '((?:\\.|[^'])*)',/g;
  let match;

  while ((match = entryPattern.exec(existingContent)) !== null) {
    existingEntries.set(match[1], match[2]);
  }
}

files.forEach(file => {
  const name = path.basename(file, '.csv');
  const content = fs.readFileSync(path.join(projectRoot, file), 'utf8');
  const escaped = content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  existingEntries.set(name, escaped);
});

let output = 'export const CURRICULUM_TEMPLATES = {\n';

for (const [name, escaped] of existingEntries) {
  output += `  '${name}': '${escaped}',\n`;
}

output += '};\n';
output += '\n';
output += "export const CURRICULUM_DATA = CURRICULUM_TEMPLATES['JHS Computing'] || '';\n";

fs.writeFileSync(outputPath, output);
console.log('Generated src/data/templates.js');
