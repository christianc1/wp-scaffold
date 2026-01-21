# Codebase Structure

**Analysis Date:** 2026-01-21

## Directory Layout

```
wp-scaffold/
├── bin/                          # Development utilities and scaffolding tools
│   └── create-block-template/    # Block creation template generator
├── docs/                         # Project documentation
│   ├── backend-development/
│   ├── contributing-community/
│   ├── development-guides/
│   ├── frontend-development/
│   ├── testing-quality/
│   └── troubleshooting-faq/
├── mu-plugins/                   # Must-use plugins (auto-loaded)
│   └── 10up-plugin/              # Main plugin scaffold
│       ├── assets/               # Plugin JavaScript and CSS
│       │   ├── css/
│       │   ├── images/
│       │   ├── js/               # Entry: assets/js/admin/admin.js
│       │   └── svg/
│       ├── languages/            # Translation files
│       ├── src/                  # PHP source code
│       │   ├── Core/             # Core utilities (Emoji, HeadOverrides)
│       │   ├── PostTypes/        # Custom post types (Post, Page, Demo)
│       │   ├── Taxonomies/       # Custom taxonomies (Demo)
│       │   ├── PluginCore.php    # Plugin bootstrap
│       │   └── Assets.php        # Asset enqueue management
│       ├── dist/                 # Compiled assets (generated, not committed)
│       ├── composer.json         # PHP dependencies
│       └── package.json          # Node dependencies and build config
├── themes/                       # WordPress themes
│   ├── 10up-theme/               # Traditional theme with blocks
│   │   ├── assets/               # Theme JavaScript and CSS
│   │   │   ├── css/
│   │   │   │   ├── frontend/     # Frontend styles
│   │   │   │   └── globals/      # Shared styles/mixins
│   │   │   ├── fonts/
│   │   │   ├── images/
│   │   │   ├── js/               # Entry: assets/js/frontend/frontend.js
│   │   │   │   ├── block-editor/
│   │   │   │   └── frontend/
│   │   │   └── svg/
│   │   ├── blocks/               # Custom blocks source
│   │   │   └── example-block/    # Example block implementation
│   │   ├── partials/             # Template partials
│   │   ├── patterns/             # Block patterns
│   │   ├── src/                  # PHP source code
│   │   │   ├── ThemeCore.php     # Theme bootstrap
│   │   │   ├── Assets.php        # Asset enqueue management
│   │   │   └── Blocks.php        # Block registration system
│   │   ├── dist/                 # Compiled assets (generated, not committed)
│   │   ├── functions.php         # Theme entry point
│   │   ├── index.php             # WordPress template fallback
│   │   ├── header.php            # Header template
│   │   ├── footer.php            # Footer template
│   │   ├── search.php            # Search template
│   │   ├── searchform.php        # Search form
│   │   ├── style.css             # Theme metadata
│   │   ├── template-tags.php     # Reusable template functions
│   │   ├── theme.json            # Block editor settings
│   │   ├── composer.json         # PHP dependencies
│   │   └── package.json          # Node dependencies and build config
│   └── 10up-block-theme/         # Full site editing theme (block-based)
│       ├── assets/
│       ├── blocks/
│       ├── parts/                # Template parts
│       ├── patterns/
│       ├── src/
│       ├── styles/               # Block theme styles
│       ├── templates/            # FSE templates
│       ├── dist/
│       ├── functions.php
│       ├── style.css
│       ├── template-tags.php
│       ├── theme.json            # FSE design settings
│       ├── composer.json
│       └── package.json
├── phpstan/                      # Static analysis configuration
│   └── stubs/                    # WordPress stubs for PHPStan
├── .planning/                    # GSD planning documents
│   └── codebase/                 # Codebase analysis (this directory)
├── .husky/                       # Git hooks
├── .vscode/                      # VS Code configuration
├── package.json                  # Root workspace configuration
├── package-lock.json
└── .lintstagedrc.json            # Pre-commit lint configuration
```

## Directory Purposes

**bin/:**
- Purpose: Development utilities for scaffolding and code generation
- Contains: Block creation templates (mustache templates)
- Key files: `bin/create-block-template/index.js` (block generator)

**docs/:**
- Purpose: Project documentation for developers
- Contains: Guides for backend dev, frontend dev, testing, contributions, troubleshooting
- Key files: Organized by topic (backend-development/, frontend-development/, etc.)

**mu-plugins/10up-plugin/:**
- Purpose: Main plugin functionality, custom post types, taxonomies, admin scripts
- Contains: Plugin core, modules for features
- Key files: `mu-plugins/10up-plugin/plugin.php` (entry), `mu-plugins/10up-plugin/src/PluginCore.php` (bootstrap)

**mu-plugins/10up-plugin/src/:**
- Purpose: PHP business logic organized by feature
- Contains: PluginCore (bootstrap), Assets (admin JS/CSS), Core utilities, PostTypes, Taxonomies
- Key files: `Assets.php`, `PluginCore.php`, `PostTypes/*.php`, `Taxonomies/*.php`

**mu-plugins/10up-plugin/assets/:**
- Purpose: Plugin frontend assets (admin panel scripts and styles)
- Contains: JavaScript (admin.js), CSS, images, SVGs
- Key files: `assets/js/admin/admin.js` (entry point defined in package.json)

**themes/10up-theme/:**
- Purpose: Traditional theme with block support, template system, and custom blocks
- Contains: Theme templates, block definitions, frontend assets
- Key files: `functions.php` (entry), `src/ThemeCore.php` (bootstrap), `blocks/` (custom blocks)

**themes/10up-theme/src/:**
- Purpose: Theme PHP logic
- Contains: ThemeCore (bootstrap), Assets (frontend JS/CSS enqueue), Blocks (block registration system)
- Key files: `ThemeCore.php`, `Assets.php`, `Blocks.php`

**themes/10up-theme/blocks/:**
- Purpose: Custom Gutenberg block implementations
- Contains: Block metadata (block.json), edit UI (edit.js), save logic (save.js), server markup (markup.php)
- Key files: `example-block/block.json`, `example-block/edit.js`, `example-block/markup.php`

**themes/10up-theme/assets/:**
- Purpose: Theme frontend assets
- Contains: JavaScript (frontend, block-editor), CSS (frontend, globals), images, fonts, SVGs
- Key files: `js/frontend/frontend.js` (entry), `css/globals/` (shared styles)

**themes/10up-block-theme/:**
- Purpose: Full site editing (FSE) theme with block-based templates
- Contains: Block templates, template parts, patterns, design system via theme.json
- Key files: `theme.json` (design settings), `templates/` (page templates), `parts/` (reusable parts)

**themes/10up-block-theme/src/:**
- Purpose: Block theme PHP logic (similar to traditional theme)
- Contains: ThemeCore, Assets, Blocks modules

**phpstan/:**
- Purpose: Static analysis configuration for PHP code quality
- Contains: PHPStan rules, WordPress type stubs
- Key files: `phpstan/stubs/` (WordPress function signatures)

**.planning/codebase/:**
- Purpose: GSD codebase analysis documents
- Contains: Architecture, structure, conventions, testing, concerns analysis
- Key files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md

## Key File Locations

**Entry Points:**
- `mu-plugins/10up-plugin/plugin.php`: Plugin bootstrap (auto-loaded as must-use)
- `themes/10up-theme/functions.php`: Traditional theme bootstrap
- `themes/10up-block-theme/functions.php`: Block theme bootstrap
- `bin/create-block-template/index.js`: Block scaffolding tool

**Configuration:**
- `package.json`: Root workspace, script definitions, Node config
- `themes/10up-theme/package.json`: Theme-specific build, scripts, 10up-toolkit config
- `mu-plugins/10up-plugin/package.json`: Plugin-specific build, scripts, 10up-toolkit config
- `themes/10up-theme/theme.json`: Block editor settings, design system
- `themes/10up-block-theme/theme.json`: FSE design system, layout settings
- `composer.json`: PHP dependencies (in plugin and theme roots)

**Core Logic:**
- `mu-plugins/10up-plugin/src/PluginCore.php`: Plugin initialization, module loading
- `themes/10up-theme/src/ThemeCore.php`: Theme initialization, module loading
- `themes/10up-theme/src/Blocks.php`: Block registration system, auto-enqueueing
- `mu-plugins/10up-plugin/src/PostTypes/`: Custom post type definitions
- `mu-plugins/10up-plugin/src/Taxonomies/`: Custom taxonomy definitions

**Testing:**
- `package.json` scripts: test (jest), with passWithNoTests flag
- Jest configuration via `10up-toolkit` (no explicit jest.config.js at root)

**Block Definitions:**
- `themes/10up-theme/blocks/example-block/block.json`: Block metadata
- `themes/10up-theme/blocks/example-block/edit.js`: Block edit component
- `themes/10up-theme/blocks/example-block/save.js`: Block save function
- `themes/10up-theme/blocks/example-block/markup.php`: Server-side render markup

## Naming Conventions

**Files:**
- PHP classes: PascalCase, match namespace structure (e.g., `Assets.php` in `src/` maps to `TenUpTheme\Assets`)
- Template files: lowercase with hyphens (e.g., `header.php`, `search.php`)
- Asset files: camelCase for JS components, kebab-case for CSS utilities (e.g., `frontend.js`, `editor-style-overrides.css`)
- Block files: kebab-case directories, structured (e.g., `example-block/` containing `block.json`, `edit.js`, `save.js`, `markup.php`)

**Directories:**
- Feature modules: PascalCase singular (e.g., `PostTypes/`, `Taxonomies/`, `Assets.php`)
- Theme assets: lowercase plural (e.g., `assets/`, `blocks/`, `patterns/`, `partials/`)
- Build output: `dist/` (contains compiled JS, CSS, asset manifests)

## Where to Add New Code

**New Feature (Plugin):**
- Primary code: `mu-plugins/10up-plugin/src/[FeatureName].php` implementing `ModuleInterface`
- Tests: `mu-plugins/10up-plugin/` (no test directory structure shown; uses jest with passWithNoTests)
- Build config: Define entry point in `mu-plugins/10up-plugin/package.json` 10up-toolkit config

**New Post Type:**
- Implementation: `mu-plugins/10up-plugin/src/PostTypes/[PostTypeName].php` extending `AbstractPostType`
- Taxonomies: Link in PostTypes class via get_supported_taxonomies() method
- Auto-registration: Class auto-discovered by ModuleInitialization in src/ directory

**New Block:**
- Directory: `themes/10up-theme/blocks/[block-name]/`
- Files: `block.json` (metadata), `edit.js` (editor component), `save.js` (frontend save), `index.js` (entry), `markup.php` (server render, optional)
- Registration: Auto-discovered by Blocks module from dist/blocks/ after build
- Scaffolding: Use `npm run scaffold:block` command in theme root

**New Theme Asset:**
- JavaScript: `themes/10up-theme/assets/js/[section]/[feature].js`, add to package.json entry or import from frontend.js
- CSS: `themes/10up-theme/assets/css/[section]/[feature].css`, import in corresponding JS or add direct enqueue
- Build: Automatically compiled to `dist/` by 10up-toolkit on npm run build

**New Taxonomy:**
- Implementation: `mu-plugins/10up-plugin/src/Taxonomies/[TaxonomyName].php` extending `AbstractTaxonomy`
- Association: Referenced in PostTypes via get_supported_taxonomies() return
- Auto-registration: Class auto-discovered by ModuleInitialization

**Utilities:**
- Shared PHP: `mu-plugins/10up-plugin/src/Core/` for reusable plugin utilities
- Theme helpers: `themes/10up-theme/template-tags.php` for template functions
- Shared styles: `themes/10up-theme/assets/css/globals/` (mixins and design tokens referenced by both theme and plugin)

## Special Directories

**dist/ (in theme and plugin):**
- Purpose: Compiled assets generated by 10up-toolkit build system
- Generated: Yes (created by npm run build)
- Committed: No (add to .gitignore)
- Contains: Compiled JavaScript bundles, CSS files, .asset.php manifests (with dependencies/versions)

**vendor/ (in theme and plugin):**
- Purpose: Composer dependencies (TenupFramework and WordPress utilities)
- Generated: Yes (created by composer install)
- Committed: No (add to .gitignore)
- Contains: 10up/wp-framework classes, WordPress stubs, autoloader

**node_modules/ (root and workspaces):**
- Purpose: NPM dependencies (10up-toolkit, build tools, linters)
- Generated: Yes (created by npm install)
- Committed: No (add to .gitignore)
- Contains: 10up-toolkit, prettier, husky, lint-staged, WordPress create-block

**languages/ (theme and plugin):**
- Purpose: Internationalization translation files
- Generated: No (manually created, use WordPress i18n tools)
- Committed: Yes (translation files)
- Contains: .mo/.po files for localization

---

*Structure analysis: 2026-01-21*
