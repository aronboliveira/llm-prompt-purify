const fs = require('fs');

let content = fs.readFileSync('src/app/features/scanner/components/scanner-toolbar/scanner-toolbar.component.scss', 'utf8');

// remove double @scope
content = content.replace(/@scope \(\.scanner-toolbar\) \{\n\n  @scope \(\.scanner-toolbar\) \{/, '@scope (.scanner-toolbar) {');
// remove the extra closing brace at the end
content = content.replace(/  \}\n\n\}$/, '  }\n}');

fs.writeFileSync('src/app/features/scanner/components/scanner-toolbar/scanner-toolbar.component.scss', content);
