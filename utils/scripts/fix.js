const fs = require('fs');

function fixFile(file, scopeRootClass) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes(`@scope (.${scopeRootClass})`)) return;

  const lines = text.split('\n');
  const out = [];

  let inScope = false;
  let hasUi = false;

  for (let line of lines) {
    if (line.startsWith('@use')) {
      out.push(line);
      out.push('');
      out.push(`@scope (.${scopeRootClass}) {`);
      inScope = true;
      continue;
    }
    if (!inScope && line.trim() && !line.startsWith('@use')) {
      out.push(`@scope (.${scopeRootClass}) {`);
      inScope = true;
    }

    if (inScope) {
      if (line.startsWith(`.${scopeRootClass}`)) {
         line = line.replace(`.${scopeRootClass}`, ':scope');
      } else if (line.match(/^(\.[a-zA-Z0-9_-]+)/)) {
         line = ':scope ' + line;
      } else if (line.match(/^([a-zA-Z0-9_-]+)/) && !line.match(/^(@|:|}\s*$)/) && !line.includes(': ')) {
         // handle tags like h2
         line = ':scope ' + line;
      } else if (line.startsWith('@container') || line.startsWith('@media')) {
         // inside these, we also want to scope? The script is getting complex...
      }
      out.push(line === '' ? line : '  ' + line);
    }
  }
  if (inScope) out.push('}');
  
  // It's probably easier to just format the string explicitly or use a simpler sed for the few files left.
}

