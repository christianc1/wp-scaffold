# Coding Conventions

**Analysis Date:** 2026-01-21

## Naming Patterns

**Files:**
- Block components: Use kebab-case for directory names, e.g., `example-block`, `custom-block`
  - Example: `/themes/10up-theme/blocks/example-block/`
- Entry point files: Use descriptive names matching their purpose
  - Examples: `block-editor-script.js`, `block-collection.js`, `frontend.js`, `admin.js`
- Config files: Use camelCase or standard naming
  - Examples: `edit.js`, `save.js`, `index.js`, `block.json`
- CSS files: Use kebab-case within descriptive paths
  - Example: `assets/css/frontend/style.css`, `assets/css/admin/admin-style.css`

**Functions:**
- Use camelCase for function names: `ExampleBlockEdit`, `registerBlockCollection`
- Export named components from block files: `const ExampleBlockEdit = (props) => { ... }; export default ExampleBlockEdit;`
- For functional components, use PascalCase: `ExampleBlockEdit`, `ExampleBlockSave`
- For callbacks, use descriptive names: `onChange`, `setAttributes`, `registerBlockType`

**Variables:**
- Use camelCase for variable names: `attributes`, `setAttributes`, `blockProps`, `title`
- Use descriptive names that reflect purpose: `attributes` for block data, `blockProps` for block container props
- WordPress destructuring pattern: `const { attributes, setAttributes } = props;`

**Types:**
- Block.json uses snake_case for WordPress-standard fields: `textdomain`, `apiVersion`, `editorScript`
- Attributes use camelCase: `title`, `customTitle`
- Supports object uses standard WordPress naming: `html`, `align`, etc.
- Class names use kebab-case with BEM-style naming: `wp-block-example-block__title`

## Code Style

**Formatting:**
- Prettier version 3.3.3 is installed but configuration is via 10up-toolkit defaults
- Tab-based indentation (WordPress standard)
- No explicit .prettierrc file—uses 10up-toolkit's built-in formatting

**Linting:**
- ESLint with `@10up/eslint-config/wordpress` preset
- Root config: `/.eslintrc` extends WordPress configuration
- Theme config: `/themes/10up-theme/.eslintrc` extends same preset
- Plugin config: `/mu-plugins/10up-plugin/.eslintrc.json` extends preset with additional globals (`module`, `process`)
- Block theme config: `/themes/10up-block-theme/.eslintrc` extends WordPress preset
- StyleLint with `@10up/stylelint-config` preset
  - Config file: `/themes/10up-block-theme/stylelint.config.js`
  - Pattern: Export config object via `module.exports`

## Import Organization

**Order:**
1. External dependencies (WordPress packages, third-party libraries)
2. Internal dependencies (local modules, components, utilities)
3. Side effects (CSS imports)

**Examples:**

Block edit component (`/themes/10up-theme/blocks/example-block/edit.js`):
```javascript
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

// Internal dependencies would go here if needed
```

Block registration (`/themes/10up-theme/blocks/example-block/index.js`):
```javascript
/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import block from './block.json';
```

Entry point with CSS (`/themes/10up-theme/assets/js/frontend/frontend.js`):
```javascript
import '../../css/frontend/style.css';

// import foo from './components/bar';
```

**Path Aliases:**
- No path aliases detected in tsconfig or similar config
- Relative imports used throughout: `import edit from './edit';`, `import block from './block.json';`

## Error Handling

**Patterns:**
- No try/catch patterns observed in explored files
- Null returns used for dynamic blocks: `const ExampleBlockSave = () => null;`
- No explicit error handling middleware or utilities detected
- Error handling deferred to 10up-toolkit and WordPress core

## Logging

**Framework:**
- Console object (standard browser/Node.js console)
- No dedicated logging library detected

**Patterns:**
- No logging statements observed in sample files
- Recommended approach: Use console.log, console.warn, console.error as needed
- Keep console output minimal in production code

## Comments

**When to Comment:**
- Use JSDoc comments for public functions and components
- Include comments in entry points explaining purpose
- Comment out code explaining intent: `// import foo from './components/bar';`
- Use section comments to organize large files: `// Entry point for block editor specific scripts.`

**JSDoc/TSDoc:**
- Use JSDoc comments for React components and functions
- Include parameter descriptions, return types, and purpose
- Example from `/themes/10up-theme/blocks/example-block/edit.js`:
```javascript
/**
 * Edit component.
 * See https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-edit-save/#edit
 *
 * @param {object}   props                  The block props.
 * @param {object}   props.attributes       Block attributes.
 * @param {string}   props.attributes.title Custom title to be displayed.
 * @param {string}   props.className        Class name for the block.
 * @param {Function} props.setAttributes    Sets the value for block attributes.
 * @returns {Function} Render the edit screen
 */
const ExampleBlockEdit = (props) => {
	// ...
};
```

## Function Design

**Size:**
- Prefer small, focused functions
- Block edit/save components typically 5-35 lines
- Break complex logic into separate utility functions

**Parameters:**
- React components receive props object
- Destructure props at function start: `const { attributes, setAttributes } = props;`
- Document all prop types in JSDoc

**Return Values:**
- Components return JSX elements
- Dynamic blocks can return `null` from save function
- Entry point files typically don't return values (side effects only)

## Module Design

**Exports:**
- Use ES6 `export default` for primary exports
- Example: `export default ExampleBlockEdit;` for block components
- Default exports for block module files: `export default ExampleBlockSave;`

**Barrel Files:**
- Entry point pattern used for organizing related imports
- Examples: `/themes/10up-theme/assets/js/block-editor/block-editor-script.js` imports and registers child modules
- Pattern: Index file imports related functionality and enables/disables features via comments

**File Structure for Blocks:**
- Each block in own directory: `/blocks/{block-name}/`
- Standard files: `index.js` (registration), `edit.js`, `save.js`, `block.json`
- Optional: Component files, utilities, styles

---

*Convention analysis: 2026-01-21*
