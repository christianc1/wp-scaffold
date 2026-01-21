# External Integrations

**Analysis Date:** 2026-01-21

## APIs & External Services

**Package Registries:**
- npm Registry (npmjs.org) - JavaScript dependency distribution
- Composer (Packagist) - PHP dependency distribution
  - wpackagist.org - WordPress plugin/theme repository
    - Configuration: `composer.json` repositories entry
    - Used for: debug plugins, development tools

**WordPress Ecosystem:**
- WordPress.org REST API - No custom endpoints detected in scaffold
- WordPress Plugin Directory - Debug Bar, Query Monitor, Debug Bar Slow Actions (dev-only)

## Data Storage

**Databases:**
- MySQL/MariaDB (via Local WP or WordPress hosting)
  - Connection: Configured via Local WP UI or `wp-config.php`
  - Client: WordPress built-in database layer (wpdb)
  - No direct database client dependency detected

**File Storage:**
- Local filesystem only - WordPress standard `wp-content/uploads/`
- No cloud storage integration detected

**Caching:**
- WordPress built-in transients API (via Core)
- Object cache: Not configured (standard)

## Authentication & Identity

**Auth Provider:**
- Custom WordPress authentication
  - Implementation: WordPress native user/role system
  - Location: Core WordPress functionality
  - Framework support: `TenUpPlugin\`, `TenUpTheme\` classes in `mu-plugins/10up-plugin/src/` and `themes/*/src/`

**No third-party identity providers detected** (OAuth, SAML, etc.)

## Monitoring & Observability

**Error Tracking:**
- Not detected in core scaffold

**Logs:**
- WordPress debug log (if `WP_DEBUG_LOG` enabled in wp-config.php)
- Standard WordPress error handling

**Development Tools (Local):**
- Debug Bar - `wpackagist-plugin/debug-bar`
- Query Monitor - `wpackagist-plugin/query-monitor`
- Debug Bar Slow Actions - `wpackagist-plugin/debug-bar-slow-actions`
- PHPStan - `szepeviktor/phpstan-wordpress` for static analysis

## CI/CD & Deployment

**Hosting:**
- Not specified in scaffold (configured per project)
- Supports standard WordPress hosting

**CI Pipeline:**
- Not detected in scaffold
- Infrastructure ready for: GitHub Actions, GitLab CI, etc.

**Version Control:**
- Git repository
- GitHub integration reference: Update URI in plugin points to GitHub repo

**Local Development:**
- Local WP application
- npm workspaces for coordinated builds

## Environment Configuration

**Required env vars:**
- None enforced - Standard WordPress `wp-config.php` configuration
- Local WP handles database credentials automatically

**Secrets location:**
- `wp-config.php` (standard WordPress location)
- Not in version control (typical .gitignore includes wp-config.php pattern)

**Build Configuration:**
- Node version: `.nvmrc` specifies version 20
- Engine requirements: `package.json` enforces npm 9.0.0+, node 20.0.0+

## Webhooks & Callbacks

**Incoming:**
- WordPress REST API endpoints can be registered (not implemented in scaffold)
- No webhook receivers detected

**Outgoing:**
- WordPress Action Hooks - Internal event system (no external webhooks)
- No external webhook integrations detected

---

*Integration audit: 2026-01-21*
