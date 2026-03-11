const fs = require('fs');
const file = 'src/app/features/scanner/components/masked-output-pane/masked-output-pane.component.scss';
let text = fs.readFileSync(file, 'utf8');

const lines = text.split('\n');
const out = [];

let inScope = false;

for (let line of lines) {
  if (line.startsWith('@use')) {
    out.push(line);
    out.push('');
    out.push(`@scope (.pane) {`);
    inScope = true;
    continue;
  }
  
  if (inScope) {
    if (line.startsWith('.pane {')) {
       line = ':scope {';
    } else if (line.startsWith('.pane--masked::before')) {
       line = ':scope.pane--masked::before {';
    } else if (line.match(/^(\.[a-zA-Z0-9_-]+)/)) {
       line = line.replace(/^(\.[a-zA-Z0-9_-]+)/, ':scope $1');
    } else if (line.match(/^([a-zA-Z0-9_-]+)(:|\s)/) && !line.match(/^(@|:|}\s*$)/) && !line.includes(': ')) {
       // but wait, is there an element selector? 
         // let's just see manually later
    }
    
    // Check for @container and @media and adjust if needed, but it's simpler to review manually afterwards
    if (line !== '') {
       out.push('  ' + line);
    } else {
       out.push('');
    }
  }
}
if (inScope) out.push('}');
fs.writeFileSync(file, out.join('\n'));
