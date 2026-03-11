const fs = require('fs');
const file = 'src/app/features/scanner/components/scanner-toolbar/scanner-toolbar.component.scss';
let text = fs.readFileSync(file, 'utf8');

const lines = text.split('\n');
const out = [];

let inScope = false;

for (let line of lines) {
  if (line.startsWith('@use')) {
    out.push(line);
    out.push('');
    out.push(`@scope (.scanner-toolbar) {`);
    inScope = true;
    continue;
  }
  
  if (inScope) {
    if (line.startsWith('.scanner-toolbar {')) {
       line = ':scope {';
    } else if (line.match(/^(\.[a-zA-Z0-9_-]+)/)) {
       line = line.replace(/^(\.[a-zA-Z0-9_-]+)/, ':scope $1');
    }
    
    // add indentation
    if (line !== '') {
       out.push('  ' + line);
    } else {
       out.push('');
    }
  }
}
if (inScope) out.push('}');
fs.writeFileSync(file, out.join('\n'));
