const fs = require('fs');
const file = 'src/app/features/scanner/components/raw-prompt-pane/raw-prompt-pane.component.scss';
let text = fs.readFileSync(file, 'utf8');

text = text.replace('.pane {', ':scope {');
text = text.replace('.pane--raw::before {', ':scope.pane--raw::before {');
text = text.replace('.pane__header {', ':scope .pane__header {');
text = text.replace('.pane__title-wrap {', ':scope .pane__title-wrap {');
text = text.replace('.pane__title-wrap h2 {', ':scope .pane__title-wrap h2 {');
text = text.replace('.pane__body {', ':scope .pane__body {');
text = text.replace('.pane__title-wrap {', ':scope .pane__title-wrap {');

// In modern CSS, @scope (.pane) { .pane__header } would match .pane .pane__header
// However, since the DOM structure has .pane as the root element, 
// using just `:scope .pane__header` or `.pane__header` inside @scope is the same IF .pane__header is a DECSENDANT.
// If it's a descendant, we can just use .pane__header, but using `:scope .pane__header` explicitly ties it to the scope root.
