const fs = require('fs');
const files = [
  'src/app/shared/components/workflow-strip/workflow-strip.component.ts',
  'src/app/shared/components/hero-section/hero-section.component.ts',
  'src/app/shared/components/product-header/product-header.component.ts',
  'src/app/features/scanner/components/controls-panel/controls-panel.component.ts',
  'src/app/features/scanner/components/raw-prompt-pane/raw-prompt-pane.component.ts',
  'src/app/features/scanner/components/scanner-toolbar/scanner-toolbar.component.ts',
  'src/app/features/scanner/components/masked-output-pane/masked-output-pane.component.ts',
  'src/app/app.component.ts'
];
for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/input\s+ViewEncapsulation\s*\n\}\s*from\s*"@angular\/core";/, 'input,\n  ViewEncapsulation\n} from "@angular/core";');
  content = content.replace(/output\s+ViewEncapsulation\s*\n\}\s*from\s*"@angular\/core";/, 'output,\n  ViewEncapsulation\n} from "@angular/core";');
  content = content.replace(/Component\s+ViewEncapsulation\s*\n\}\s*from\s*"@angular\/core";/, 'Component,\n  ViewEncapsulation\n} from "@angular/core";');
  fs.writeFileSync(file, content);
}
