# Technology Stack

**Analysis Date:** 2026-01-21

## Languages

**Primary:**
- PHP 8.2+ - Backend logic, theme functions, plugin development
- JavaScript/JSX - Frontend assets, blocks, React components
- CSS/PostCSS - Styling for themes and components

**Secondary:**
- HTML - WordPress templates

## Runtime

**Environment:**
- WordPress 4.9+ core
- Local WP (local development environment)
- PHP 8.2 minimum (8.3 recommended per `composer.json`)

**Package Managers:**
- npm 9.0.0+ - JavaScript dependencies
- Composer - PHP dependencies
- Lockfiles: `package-lock.json`, `composer.lock` present

## Frameworks

**Core:**
- 10up WP Framework ~1.3.1 - Provides base Module interface and architecture for both themes and plugins
  - Included in: `themes/10up-theme`, `themes/10up-block-theme`, `mu-plugins/10up-plugin`
  - Location: `composer.json` requires `10up/wp-framework`

**WordPress:**
- WordPress 4.9+ core
- Block Editor (Gutenberg) - Full Site Editing support in block theme

**Frontend Build:**
- 10up Toolkit ^6.5.0 - Build tool for frontend assets, bundling, and compilation
  - Primary dependency across: root `package.json`, `themes/10up-theme/package.json`, `themes/10up-block-theme/package.json`, `mu-plugins/10up-plugin/package.json`
  - Provides: webpack bundling, PostCSS compilation, Jest testing, linting configuration
  - Configured via `10up-toolkit` key in `package.json` files

**Testing:**
- Jest ^29.7.0 - Unit testing framework
  - Config: `jest-environment-jsdom ^29.7.0` for DOM-based tests
  - Usage: `npm run test` in each workspace

**Build/Dev:**
- Babel (via @10up/babel-preset-default) - JavaScript transpilation
- PostCSS (via 10up Toolkit) - CSS preprocessing
- Webpack (bundled with 10up Toolkit) - Module bundling

**UI Components:**
- @10up/block-components ^1.19.4 - Reusable block UI components (block theme only)
  - Located in: `themes/10up-block-theme/package.json`
- modern-normalize ^3.0.0 - CSS normalization (theme only)
  - Located in: `themes/10up-theme/package.json`
- clsx ^2.1.1 - Conditional CSS class utility (block theme only)
  - Located in: `themes/10up-block-theme/package.json`

## Key Dependencies

**Critical:**
- 10up/wp-framework ~1.3.1 - Core architecture providing Module pattern and interfaces
- 10up-toolkit ^6.5.0 - Unified build pipeline and tooling

**Build/Dev:**
- @10up/babel-preset-default ^2.1.2 - Babel configuration preset
- @10up/eslint-config ^4.1.3+ - ESLint rules for WordPress/JavaScript standards
- @10up/stylelint-config ^3.0.0+ - Stylelint rules for CSS standards
- @wordpress/create-block 4.55.0 - Block scaffold generator

**PHP Development:**
- 10up/phpcs-composer ^3.0 - PHP CodeSniffer with 10up standards
- Debug Tools (dev-only):
  - wpackagist-plugin/debug-bar - WordPress debug bar
  - wpackagist-plugin/query-monitor - Query and performance monitoring
  - wpackagist-plugin/debug-bar-slow-actions - Slow action profiling
- Static Analysis:
  - szepeviktor/phpstan-wordpress ^1.3 - PHP static analysis for WordPress
  - phpstan/phpstan-deprecation-rules ^1.2 - Deprecation detection

**Utilities:**
- prop-types ^15.7.2 - React prop validation (plugin only)
- npm-run-all ^4.1.5 - Parallel npm script execution
- husky ^9.1.7 - Git hooks management
- lint-staged ^15.2.0 - Pre-commit linting
- prettier 3.3.3 - Code formatting

## Configuration

**Environment:**
- No `.env` files detected - WordPress configuration via `wp-config.php` (standard)
- Local WP manages database connection automatically
- Node version: 20+ (specified in `.nvmrc`)

**Build:**
- Root `package.json` uses npm workspaces:
  - `themes/*` - All themes
  - `mu-plugins/10up-plugin` - Main plugin
- Each workspace has independent build configuration via `10up-toolkit` key
- Theme build ports: 5000 (tenup-theme), 5020 (block theme), 5010 (plugin)

**Code Quality:**
- `.eslintrc` extends `@10up/eslint-config/wordpress`
- `.editorconfig` enforces:
  - Charset: UTF-8
  - Line endings: LF (CRLF for .txt and wp-config-sample.php)
  - Indent: tabs (2 spaces for JSON/YAML files)
- `.npmrc`: `engine-strict=true` enforces Node/npm version requirements
- `phpcs.xml`: 10up PHPCS ruleset scanning `themes/` and `mu-plugins/` directories
- `.lintstagedrc.json`: Pre-commit hooks via lint-staged
  - `*.css`: `10up-toolkit lint-style`
  - `*.js/*.jsx`: `10up-toolkit lint-js`
  - `*.php`: `phpcs`

## Platform Requirements

**Development:**
- Local WP application
- Node.js 20.0.0+ (per `package.json` engines)
- npm 9.0.0+ (per `package.json` engines)
- PHP 8.2+ (PHP 8.3+ recommended)
- Composer
- Git

**Production:**
- WordPress hosting supporting PHP 8.2+
- Database (MySQL/MariaDB via WordPress standard)
- Web server (Apache/Nginx with WordPress requirements)

---

*Stack analysis: 2026-01-21*
