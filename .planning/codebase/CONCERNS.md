# Codebase Concerns

**Analysis Date:** 2026-01-21

## Tech Debt

**Version Requirement Inconsistency (PHP):**
- Issue: The root `composer.json` requires PHP >= 8.3, but individual package `composer.json` files require PHP >= 8.2
- Files:
  - `/Users/cchung/packages/wp-scaffold/composer.json` (root requires 8.3)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/composer.json` (requires 8.2)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/composer.json` (requires 8.2)
  - `/Users/cchung/packages/wp-scaffold/mu-plugins/10up-plugin/composer.json` (requires 8.2)
- Impact: Developers may encounter inconsistent behavior or unclear minimum version requirements when installing dependencies
- Fix approach: Standardize PHP requirement across all `composer.json` files to 8.3 to match root project requirements

**Node Version Requirements Documentation Gap:**
- Issue: `package.json` specifies Node >= 20.0.0 and npm >= 9.0.0 in engines field, but README.md still references older minimums (Node >= 16, npm >= 7)
- Files:
  - `/Users/cchung/packages/wp-scaffold/package.json` (defines >= 20.0.0)
  - `/Users/cchung/packages/wp-scaffold/README.md` (line 9, states old minimums)
- Impact: Documentation doesn't match actual requirements, causing confusion during setup
- Fix approach: Update README.md requirements section to reflect actual Node >= 20.0.0 and npm >= 9.0.0

**Hardcoded Scrollbar Detection Script:**
- Issue: Scrollbar detection JavaScript is hardcoded inline in `wp_head` as minified code
- Files:
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/ThemeCore.php` (line 137)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/ThemeCore.php` (line 112)
- Impact: Minified code is difficult to debug and maintain; code duplication between themes
- Fix approach: Extract scrollbar detection into a separate script file with proper versioning, minify via build process instead of hardcoding

**Frontend.js Always Enqueued:**
- Issue: `frontend.js` is unconditionally enqueued for CSS hot-reloading in development, but comment indicates it should be wrapped in SCRIPT_DEBUG check
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Assets.php` (line 57, comment on line 56-57)
- Impact: Unnecessary script loaded in production when `SCRIPT_DEBUG` is false, wasting bandwidth
- Fix approach: Wrap `wp_enqueue_script('frontend')` in `if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG )` check

## Known Bugs

**Recent Scrollbar Detection Changes:**
- Issue: Commit dc34295 added scrollbar detection to classic theme after being removed in a previous commit (7fb65ce)
- Symptoms: Scrollbar detection code appears in both themes but was previously marked for removal
- Files:
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/ThemeCore.php` (lines 111-138)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/ThemeCore.php` (lines 101-113)
- Workaround: If scrollbar detection causes issues, can be removed via filter or disabled in child theme
- Note: This represents possible disagreement on whether feature is needed

**JS Detection Script Not Escaped:**
- Issue: JS detection script in `ThemeCore.php` uses inline `echo` without escaping
- Files:
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/ThemeCore.php` (line 123)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/ThemeCore.php` (line 98)
- Impact: While the literal script content is safe, violates WordPress security practices of escaping output
- Fix approach: Use `wp_printf()` or similar escaping function for consistency with WordPress standards

## Security Considerations

**Dynamic File Inclusion in Block Registration:**
- Risk: `include $block_folder . '/markup.php'` uses variable path without validation
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Blocks.php` (line 85)
- Current mitigation: Path is constructed from glob() results on controlled dist directory, file existence check before include
- Recommendations:
  - Consider using realpath() to prevent directory traversal
  - Add additional validation that the resolved path is within expected block directory
  - Document the security assumption that dist/blocks directory is trusted

**Inline Scripts in wp_head:**
- Risk: Inline JavaScript echoed directly without use of wp_register_script() pattern
- Files:
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/ThemeCore.php` (lines 98, 112, 123, 137)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/ThemeCore.php` (lines 98, 112)
- Current mitigation: Scripts are part of core functionality, not user input
- Recommendations:
  - Consider registering as script modules with wp_register_script() for better control and versioning
  - Would allow Content Security Policy compliance
  - Enables better debugging with source maps

**Vendor Autoload Dependency:**
- Risk: Both theme and plugin throw exceptions if composer autoload is missing, exposing file paths
- Files:
  - `/Users/cchung/packages/wp-scaffold/mu-plugins/10up-plugin/plugin.php` (lines 40-44)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/functions.php` (similar pattern)
- Current mitigation: Error thrown during initialization, prevents further execution
- Recommendations:
  - Consider logging errors to debug.log instead of throwing exceptions
  - Provide clearer error message to non-developers
  - Ensure vendor directory is properly gitignored

**10up/wp-framework Dependency Risk:**
- Risk: All themes and plugin depend on external 10up/wp-framework (~1.3.1)
- Files: All `composer.json` files reference this dependency
- Current mitigation: Uses composer version constraint (~1.3.1) to allow minor updates only
- Recommendations:
  - Monitor framework updates for security patches
  - Regular composer update cycles to stay current
  - Consider documenting framework upgrade path and breaking changes

## Performance Bottlenecks

**Glob Operations on Every Request:**
- Problem: `glob()` calls happen on every page load in block registration
- Files:
  - `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Blocks.php` (lines 61, 136)
  - `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/Blocks.php` (similar pattern)
- Cause: `glob()` performs filesystem scan on each request without caching
- Improvement path:
  - Cache block list in transient on first load
  - Clear cache on theme updates/activation
  - Consider registering blocks during build process instead of runtime

**Icon Registration Glob in Block Theme:**
- Problem: `glob()` scans SVG directory on every 'init' hook
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-block-theme/src/Assets.php` (line 128)
- Cause: No caching of icon list, filesystem operation on every request
- Improvement path:
  - Cache icons in transient with invalidation on deploy
  - Document expected number of icons for performance planning

**Asset Info Lookups:**
- Problem: `get_asset_info()` requires reads from JSON files for version and dependency data
- Files: Used extensively in Assets.php files throughout themes
- Cause: File I/O for each asset enqueued
- Improvement path: Consider caching asset info in memory during request lifecycle

## Fragile Areas

**Block Markup File Pattern (Classic Theme):**
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Blocks.php` (lines 74-88)
- Why fragile:
  - Depends on exact file naming convention (markup.php)
  - Uses ob_start/ob_get_clean which can be affected by output earlier in request
  - Variable scope access via use() is implicit
- Safe modification:
  - Always test custom blocks after changes
  - Verify markup files don't have output in global scope
  - Document markup file context variables (e.g., $context, $block)
- Test coverage: No visible unit tests for block rendering logic

**Theme/Plugin Core Initialization:**
- Files: `ThemeCore.php` in both themes and plugin
- Why fragile:
  - Depends on 10up/wp-framework being installed and functional
  - Admin notice only shown if framework missing (line 64-82 in theme)
  - Silent failure if ModuleInitialization can't find classes
- Safe modification:
  - Test with framework missing to ensure proper error handling
  - Add logging for failed module initialization
  - Consider adding admin health check status

**Module Initialization Pattern:**
- Files: All modules implement ModuleInterface via framework
- Why fragile:
  - Depends on class naming conventions for auto-discovery
  - PSR-4 autoload path must match namespace (TenupBlockTheme\, TenUpTheme\, TenUpPlugin\)
  - Hook timing and priority affects execution order
- Safe modification:
  - Document required namespace to directory structure mapping
  - Test that namespace changes are reflected in composer.json autoload
  - Verify load_order priorities don't conflict

**Asset File Dependencies:**
- Files: `get_asset_info()` calls in all Assets.php files
- Why fragile:
  - Depends on build process generating correct .asset.php files
  - Missing dependencies could cause JavaScript errors on frontend
  - Fallback version only used if asset info missing
- Safe modification:
  - Verify build output before deployment
  - Test critical assets in both development and production builds
  - Monitor browser console for missing dependencies

## Scaling Limits

**glob() Performance with Many Blocks:**
- Current capacity: Works well with current example blocks (typically < 10)
- Limit: Performance degrades significantly with > 50-100 blocks per theme
- Scaling path:
  - Implement block registry caching with deployment hooks
  - Consider build-time block registration instead of runtime
  - Profile with realistic block count before scaling

**Icon Registration (Block Theme):**
- Current capacity: Works well with typical icon set (< 100 SVGs)
- Limit: Icon lookup and map construction could slow with > 500 icons
- Scaling path:
  - Implement icon registry caching
  - Consider splitting icons into categories/sets
  - Lazy-load icons if icon system becomes bottleneck

## Dependencies at Risk

**10up-toolkit ^6.5.0:**
- Risk: Major tool for asset building, actively maintained by 10up
- Impact: Build failures if incompatible version installed, all assets affected
- Migration plan:
  - Pin to specific version during stable development
  - Test major version upgrades in isolated branch
  - Review changelog for breaking changes before updating
- Current status: Updated to latest in recent commit aba6289

**10up/wp-framework ~1.3.1:**
- Risk: External dependency for core functionality, controls module system
- Impact: If framework has breaking changes, all themes/plugins affected
- Migration plan:
  - Monitor framework releases
  - Document framework version constraints
  - Plan major version upgrades with comprehensive testing

**Query Monitor (Debug Dev Dependency):**
- Risk: Contains large database profiler, should never reach production
- Impact: Performance impact if accidentally enabled in production
- Mitigation: Ensure vendor directory is excluded from production deployments

## Missing Critical Features

**No Automated Testing:**
- Problem: No unit tests, integration tests, or e2e tests visible
- Blocks: Cannot confidently refactor block code
- Tests exist: `test` scripts in package.json run with --passWithNoTests flag (intentionally passing empty test suites)

**No Static Analysis Baseline:**
- Problem: PHPStan configured but no baseline established for legacy code
- Blocks: Cannot add PHPStan to CI/CD without fixing all level 9 errors first
- Guidance: PHPstan documentation recommends starting at level 4, but docs suggest this should be done (see docs/testing-quality/phpstan.md)

**No Automated Security Scanning:**
- Problem: No SAST (static application security testing) in CI/CD
- Blocks: Security issues won't be caught before deployment
- Examples: Dynamic includes, inline scripts, missing escaping

**No Dependency Vulnerability Scanning:**
- Problem: No automated checking for vulnerable packages
- Blocks: Known vulnerabilities in dependencies won't be detected
- Recommendation: Add composer audit and npm audit to CI checks

## Test Coverage Gaps

**Block Rendering Logic (10up-theme):**
- What's not tested: Custom block render callbacks with markup.php loading
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Blocks.php`
- Risk: Block rendering breaking silently, only detected manually
- Priority: High - core theme functionality

**Asset Enqueueing:**
- What's not tested: Asset version management, hot reload script loading
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Assets.php` (and block theme equivalent)
- Risk: Missing dependencies or incorrect versions not caught before production
- Priority: High - frontend functionality depends on this

**Theme Core Hooks:**
- What's not tested: JS detection, scrollbar detection script output
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/ThemeCore.php`
- Risk: Script injection issues or unintended HTML output
- Priority: Medium - affects all frontend pages

**Module Initialization:**
- What's not tested: Fallback when ModuleInitialization missing, class discovery
- Files: ThemeCore.php and PluginCore.php in all packages
- Risk: Silent failures if framework not properly loaded
- Priority: Medium - affects site functionality

**Block Pattern Categories:**
- What's not tested: Custom block pattern category registration
- Files: `/Users/cchung/packages/wp-scaffold/themes/10up-theme/src/Blocks.php` (line 182-188)
- Risk: Pattern categories may not register properly
- Priority: Low - UI feature, doesn't break site

---

*Concerns audit: 2026-01-21*
