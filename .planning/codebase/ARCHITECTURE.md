# Architecture

**Analysis Date:** 2026-01-21

## Pattern Overview

**Overall:** Modular WordPress plugin and theme scaffold using the 10up Framework with dependency injection and lazy-loaded modules.

**Key Characteristics:**
- Module-based architecture with interface-driven design
- Separation of concerns: Core/PostTypes/Taxonomies/Assets modules
- Monorepo workspace structure with shared build tooling (10up-toolkit)
- Two interchangeable theme implementations: traditional and block-based
- Central framework dependency (10up/wp-framework) providing base classes and utilities

## Layers

**Entry Point Layer:**
- Purpose: Bootstrap application and initialize modules
- Location: `themes/10up-theme/functions.php`, `mu-plugins/10up-plugin/plugin.php`, `themes/10up-block-theme/functions.php`
- Contains: PHP constants, Composer autoloader initialization, theme/plugin core instantiation
- Depends on: Composer vendor autoload, core classes (ThemeCore, PluginCore)
- Used by: WordPress initialization hooks

**Core Module Layer:**
- Purpose: Application bootstrapping and module discovery/initialization
- Location: `mu-plugins/10up-plugin/src/PluginCore.php`, `themes/10up-theme/src/ThemeCore.php`, `themes/10up-block-theme/src/ThemeCore.php`
- Contains: Core class implementing setup, initialization, i18n, and module delegation
- Depends on: TenupFramework\ModuleInitialization
- Used by: Bootstrap entry points, WordPress init hooks

**Module Layer:**
- Purpose: Feature-specific implementations (assets, blocks, post types, taxonomies)
- Location: `mu-plugins/10up-plugin/src/`, `themes/10up-theme/src/`
- Contains: Classes implementing ModuleInterface (Assets, Blocks, PostTypes, Taxonomies, Core utilities)
- Depends on: TenupFramework trait classes (Module, ModuleInterface, GetAssetInfo)
- Used by: ModuleInitialization discovery system that auto-registers all classes in src/

**Frontend Asset Layer:**
- Purpose: JavaScript and CSS asset management and compilation
- Location: `themes/10up-theme/assets/`, `mu-plugins/10up-plugin/assets/`
- Contains: ES6+ JavaScript (frontend.js, block-editor-script.js, admin.js), CSS/SCSS stylesheets
- Depends on: 10up-toolkit build system, modern-normalize library
- Used by: WordPress enqueue hooks, compiled to `dist/` folder

**Block Layer:**
- Purpose: Custom Gutenberg block implementation
- Location: `themes/10up-theme/blocks/`, `themes/10up-block-theme/blocks/`
- Contains: Block definitions (block.json), edit components (edit.js), save functions (save.js), server-side markup (markup.php)
- Depends on: WordPress block editor APIs, block registration system
- Used by: Theme block registration system, block inserter

**Post Types and Taxonomies Layer:**
- Purpose: Custom content structure definitions
- Location: `mu-plugins/10up-plugin/src/PostTypes/`, `mu-plugins/10up-plugin/src/Taxonomies/`
- Contains: Classes extending TenupFramework abstract classes (AbstractPostType, AbstractTaxonomy)
- Depends on: TenupFramework abstractions, WordPress registration APIs
- Used by: ModuleInitialization auto-registration

## Data Flow

**Plugin/Theme Initialization:**

1. WordPress loads `functions.php` (theme) or `plugin.php` (plugin)
2. Constants defined (paths, URLs, dist directories)
3. Composer autoloader required
4. ThemeCore/PluginCore instantiated
5. setup() called, which registers init hook at priority 8
6. On wp_init, init() executes:
   - ModuleInitialization::instance()->init_classes( TENUP_PLUGIN_INC )
   - Auto-discovers all classes implementing ModuleInterface in src/ directory
   - Calls can_register() on each, then register() if true
   - Modules set up their hooks/filters

**Block Registration Flow:**

1. Blocks module registers on init hook
2. register_theme_blocks() discovers all block.json files in dist/blocks/
3. For each block with markup.php, creates render_callback
4. register_block_type_from_metadata() registers block with WordPress
5. Block-specific styles auto-enqueued from autoenqueue/ directory

**Asset Enqueuing Flow:**

1. Assets module registers on wp_enqueue_scripts and enqueue_block_editor_assets hooks
2. setup_asset_vars() reads generated .asset.php files from dist/ (created by 10up-toolkit)
3. wp_enqueue_script/wp_enqueue_style with dependencies and version from asset manifest
4. Block editor scripts enqueued separately on enqueue_block_editor_assets

**State Management:**
- No centralized state container; uses WordPress hooks/filters for cross-module communication
- Module state is instance-based; ModuleInitialization manages singleton instances
- Post types and taxonomies maintain state through WordPress post_type and taxonomy globals
- Front-end JavaScript manages component state independently (no framework specified)

## Key Abstractions

**ModuleInterface:**
- Purpose: Contract for registrable, hookable modules
- Examples: `mu-plugins/10up-plugin/src/Assets.php`, `themes/10up-theme/src/Blocks.php`, `mu-plugins/10up-plugin/src/PostTypes/Demo.php`
- Pattern: Can_register() check, register() hook attachment, trait composition

**AbstractPostType (via TenupFramework):**
- Purpose: Base class for custom post types with automatic WP registration
- Examples: `mu-plugins/10up-plugin/src/PostTypes/Demo.php`, `mu-plugins/10up-plugin/src/PostTypes/Post.php`
- Pattern: Subclass defines get_name(), get_*_label(), get_menu_icon(), get_supported_taxonomies(), can_register()

**Block Definition (block.json):**
- Purpose: Block metadata and configuration
- Examples: `themes/10up-theme/blocks/example-block/block.json`
- Pattern: Declares name, attributes, editorScript, supports, example properties

**GetAssetInfo Trait (via TenupFramework):**
- Purpose: Access compiled asset manifest data (dependencies, versions)
- Examples: Used in `themes/10up-theme/src/Assets.php`, `themes/10up-theme/src/Blocks.php`
- Pattern: setup_asset_vars() initializes, get_asset_info() retrieves version/dependencies

## Entry Points

**Plugin Entry Point:**
- Location: `mu-plugins/10up-plugin/plugin.php`
- Triggers: WordPress plugin loader (must-use plugins automatically loaded)
- Responsibilities: Define plugin constants, load Composer, instantiate PluginCore, register hooks

**Theme Entry Point (Traditional):**
- Location: `themes/10up-theme/functions.php`
- Triggers: WordPress theme loader
- Responsibilities: Define theme constants, load Composer, instantiate ThemeCore, optional fast-refresh for local dev

**Theme Entry Point (Block):**
- Location: `themes/10up-block-theme/functions.php`
- Triggers: WordPress theme loader
- Responsibilities: Define block theme constants, load Composer, instantiate ThemeCore

**Block Template Builder:**
- Location: `bin/create-block-template/index.js`
- Triggers: npm scaffold:block command
- Responsibilities: Create new block with wp-create-block, apply custom template

## Error Handling

**Strategy:** Fail-safe with admin notices

**Patterns:**
- Composer autoloader missing → Exception thrown (requires manual intervention)
- TenupFramework not installed → Admin notice displayed, init bailed early
- Block registration → Silently skipped if no dist/blocks/ directory
- Missing .asset.php files → Fallback to file modification time as version

## Cross-Cutting Concerns

**Logging:** console methods (JavaScript), error_log (PHP) - no centralized logging framework

**Validation:** WordPress sanitization/escaping functions (wp_kses_post, esc_attr, esc_html__) applied at output points

**Authentication:** Handled by WordPress core (add_action conditionals check user capabilities); no custom auth system

**Internationalization:** Text domain 'tenup-plugin' / 'tenup-theme', load_textdomain in i18n() method on WordPress init hook

---

*Architecture analysis: 2026-01-21*
