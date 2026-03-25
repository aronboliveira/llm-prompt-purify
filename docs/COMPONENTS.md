# Component Architecture

This document describes the Angular component structure for the LLM Prompt Purifier web application.

## Overview

The application follows a smart/dumb component pattern:

- **Smart containers** manage state and business logic
- **Dumb presentational components** receive data via `@Input()` and emit events via `@Output()`

All components are **standalone** and use **OnPush** change detection for optimal performance.

---

## Component Hierarchy

```
AppComponent (Smart Container)
├── ProductHeaderComponent
├── HeroSectionComponent
├── WorkflowStripComponent
├── ScannerToolbarComponent
├── RawPromptPaneComponent
├── MaskedOutputPaneComponent
├── ControlsPanelComponent
│   └── MaskGroupPanelComponent
├── CountryScopeModalComponent
├── MaskingSettingsModalComponent
├── HelpModalComponent
├── ToastStackComponent
└── FeedbackSheetComponent
```

---

## Shared Components

### ProductHeaderComponent

**Location:** `src/app/shared/components/product-header/`

Displays the branded header with title, tagline, and optional icon.

| Input       | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `title`     | `string` | Main product title          |
| `tagline`   | `string` | Subtitle/tagline text       |
| `iconClass` | `string` | Optional CSS class for icon |

```html
<app-product-header [title]="'LLM Prompt Purifier'" [tagline]="'Client-side prompt protection'" />
```

---

### HeroSectionComponent

**Location:** `src/app/shared/components/hero-section/`

Hero block with body text, privacy notice panel, and help trigger.

| Input         | Type     | Description              |
| ------------- | -------- | ------------------------ |
| `body`        | `string` | Main hero body text      |
| `noticeIcon`  | `string` | SVG path for notice icon |
| `noticeTitle` | `string` | Notice panel title       |
| `noticeBody`  | `string` | Notice panel description |
| `helpLabel`   | `string` | Help button aria-label   |

| Output          | Type                 | Description                |
| --------------- | -------------------- | -------------------------- |
| `helpTriggered` | `EventEmitter<void>` | Emits when help is clicked |

```html
<app-hero-section [body]="copy.heroBody" [noticeIcon]="icons.privacy" [noticeTitle]="copy.noticeTitle" [noticeBody]="copy.noticeBody" [helpLabel]="copy.helpLabel" (helpTriggered)="showHelp()" />
```

---

### WorkflowStripComponent

**Location:** `src/app/shared/components/workflow-strip/`

Displays workflow step cards with dynamic state styling.

| Input           | Type                                           | Description                        |
| --------------- | ---------------------------------------------- | ---------------------------------- |
| `snippets`      | `WorkflowSnippet[]`                            | Array of workflow step definitions |
| `stateResolver` | `(idx: number) => 'pending'\|'active'\|'done'` | Function to determine step state   |
| `footerText`    | `string`                                       | Footer text below steps            |

**Types:**

```typescript
interface WorkflowSnippet {
  title: string;
  body: string;
}
```

```html
<app-workflow-strip [snippets]="workflowSnippets" [stateResolver]="snippetState.bind(this)" [footerText]="copy.workflowFooter" />
```

---

## Scanner Feature Components

### ScannerToolbarComponent

**Location:** `src/app/features/scanner/components/scanner-toolbar/`

Toolbar with country scope selector, settings button, and warning display.

| Input              | Type     | Description                      |
| ------------------ | -------- | -------------------------------- |
| `countrySummary`   | `string` | Selected countries summary text  |
| `scopeWarning`     | `string` | Warning message (empty = hidden) |
| `scopeIconPath`    | `string` | SVG path for scope icon          |
| `settingsIconPath` | `string` | SVG path for settings icon       |
| `scopeLabel`       | `string` | Label for scope button           |
| `settingsLabel`    | `string` | Label for settings button        |

| Output          | Type                 | Description                 |
| --------------- | -------------------- | --------------------------- |
| `openCountries` | `EventEmitter<void>` | Emits when scope is clicked |
| `openSettings`  | `EventEmitter<void>` | Emits when settings clicked |

---

### RawPromptPaneComponent

**Location:** `src/app/features/scanner/components/raw-prompt-pane/`

Input pane with textarea for raw prompt entry.

| Input         | Type     | Description             |
| ------------- | -------- | ----------------------- |
| `title`       | `string` | Pane title              |
| `body`        | `string` | Helper text below title |
| `sourceText`  | `string` | Current textarea value  |
| `placeholder` | `string` | Textarea placeholder    |
| `charLabel`   | `string` | Character count label   |
| `helpLabel`   | `string` | Help button aria-label  |

| Output             | Type                   | Description                |
| ------------------ | ---------------------- | -------------------------- |
| `sourceTextChange` | `EventEmitter<string>` | Emits on textarea input    |
| `helpTriggered`    | `EventEmitter<void>`   | Emits when help is clicked |

---

### MaskedOutputPaneComponent

**Location:** `src/app/features/scanner/components/masked-output-pane/`

Output pane displaying masked text with status and actions.

| Input                | Type        | Description                           |
| -------------------- | ----------- | ------------------------------------- |
| `title`              | `string`    | Pane title                            |
| `body`               | `string`    | Helper text below title               |
| `maskedText`         | `string`    | Masked output text                    |
| `scanState`          | `ScanState` | Current scan state for styling        |
| `statusLabel`        | `string`    | Status pill text                      |
| `statusTone`         | `PillTone`  | Status pill tone (success/error/info) |
| `findings`           | `string`    | Findings summary text                 |
| `copyLabel`          | `string`    | Copy button label                     |
| `regenerateLabel`    | `string`    | Regenerate button label               |
| `clearLabel`         | `string`    | Clear button label                    |
| `copyDisabled`       | `boolean`   | Disable copy button                   |
| `regenerateDisabled` | `boolean`   | Disable regenerate button             |
| `clearDisabled`      | `boolean`   | Disable clear button                  |
| `helpLabel`          | `string`    | Help button aria-label                |
| `copyIcon`           | `string`    | SVG path for copy icon                |
| `refreshIcon`        | `string`    | SVG path for regenerate icon          |
| `clearIcon`          | `string`    | SVG path for clear icon               |
| `spinnerLabel`       | `string`    | Loading spinner aria-label            |
| `emptyPlaceholder`   | `string`    | Placeholder when no output            |

| Output          | Type                 | Description                   |
| --------------- | -------------------- | ----------------------------- |
| `copy`          | `EventEmitter<void>` | Emits when copy is clicked    |
| `regenerate`    | `EventEmitter<void>` | Emits when regenerate clicked |
| `clear`         | `EventEmitter<void>` | Emits when clear is clicked   |
| `helpTriggered` | `EventEmitter<void>` | Emits when help is clicked    |

---

### ControlsPanelComponent

**Location:** `src/app/features/scanner/components/controls-panel/`

Wrapper panel for masking rule controls.

| Input       | Type          | Description             |
| ----------- | ------------- | ----------------------- |
| `title`     | `string`      | Panel title             |
| `body`      | `string`      | Helper text below title |
| `groups`    | `MaskGroup[]` | Masking rule groups     |
| `helpLabel` | `string`      | Help button aria-label  |

| Output          | Type                        | Description                |
| --------------- | --------------------------- | -------------------------- |
| `groupsChange`  | `EventEmitter<MaskGroup[]>` | Emits when rules change    |
| `helpTriggered` | `EventEmitter<void>`        | Emits when help is clicked |

---

## Popup/Modal Components

These components use **`.module.scss`** files for globally-scoped styles, as they are dynamically mounted at fixed positions.

| Component                       | Module SCSS File                     |
| ------------------------------- | ------------------------------------ |
| `FeedbackSheetComponent`        | `feedback-sheet.module.scss`         |
| `HelpModalComponent`            | `help-modal.module.scss`             |
| `ToastStackComponent`           | `toast-stack.module.scss`            |
| `CountryScopeModalComponent`    | `country-scope-modal.module.scss`    |
| `MaskingSettingsModalComponent` | `masking-settings-modal.module.scss` |

#### MaskingSettingsModalComponent — Polyglot Outputs

The modal exposes three additional outputs for the polyglot mask alphabet feature (active when the masking strategy is "random"):

| Output                           | Type                          | Description                                  |
| -------------------------------- | ----------------------------- | -------------------------------------------- |
| `polyglotEnabledChanged`         | `EventEmitter<boolean>`       | Emits when the polyglot toggle is flipped    |
| `polyglotFamiliesChanged`        | `EventEmitter<readonly string[]>` | Emits with the updated list of enabled families |
| `polyglotExcludedSubtypesChanged`| `EventEmitter<readonly string[]>` | Emits with the updated list of excluded subtypes |

### Why `.module.scss`?

Angular's view encapsulation adds attribute selectors to component styles, but this breaks for:

- Elements with `position: fixed` that escape the component tree
- Dynamically created overlays/portals
- Elements rendered via `@if` that need immediate styling

The `.module.scss` pattern imports these styles globally via `styles.scss`:

```scss
// styles.scss
@import "./app/features/feedback/components/feedback-sheet/feedback-sheet.module";
@import "./app/features/scanner/components/help-modal/help-modal.module";
// ...
```

---

## Style Guidelines

### Component SCSS Structure

Each component has its own `.scss` file using design system mixins:

```scss
@use "../../../shared/styles/design" as ui;

.component-root {
  @include ui.surface-card();
  @include ui.entrance-slide(Y, 1rem);
}
```

### Design System Mixins

| Mixin              | Description                        |
| ------------------ | ---------------------------------- |
| `surface-card()`   | Standard card styling with shadows |
| `entrance-slide()` | Slide-in animation                 |
| `focus-ring()`     | Accessible focus outline           |
| `flex-bar()`       | Horizontal flex container          |
| `pill-chip()`      | Small badge/chip styling           |
| `help-button`      | Circular help trigger button       |
| `warning-banner()` | Warning message banner             |

---

## Testing

Each component should have a corresponding `.spec.ts` file:

```
product-header/
├── product-header.component.ts
├── product-header.component.html
├── product-header.component.scss
└── product-header.component.spec.ts
```

Run tests with:

```bash
npm test
```
