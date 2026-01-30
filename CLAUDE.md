# CLAUDE.md

This file provides context for Claude Code when working with this repository.

## Project Overview

**Mayo GBS WordPress** — A WordPress project using the 10up scaffold with custom theme and mu-plugins.

## Fueled Documentation System

This project uses **Fueled** for documentation-driven development.

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `requirements/` | PRDs organized by domain/epic/feature |
| `.planning/` | State tracking, roadmap, phase plans |
| `.fueled/` | Config, status dashboard, research, exports |

### Key Files

| File | Purpose |
|------|---------|
| `requirements/index.md` | Root requirements index — start here for project context |
| `.planning/STATE.md` | Current project state — read first every session |
| `.fueled/config.json` | System configuration |
| `.fueled/STATUS.md` | Master status dashboard |

### Workflow

1. **Read** `.planning/STATE.md` at session start
2. **Check** `requirements/index.md` for project context
3. **Follow** PRD-first development (create PRD before coding)
4. **Update** STATE.md after significant work

## Project Structure

```
wp-content/
├── mu-plugins/           # Must-use plugins
│   └── 10up-plugin/      # Core plugin functionality
├── themes/
│   ├── 10up-theme/       # Classic theme
│   └── 10up-block-theme/ # Block theme
├── docs/                 # Project documentation
├── requirements/         # PRDs (Fueled)
├── .planning/            # State & roadmap (Fueled)
└── .fueled/              # System config (Fueled)
```

## Tech Stack

- **CMS:** WordPress
- **PHP Framework:** 10up scaffold
- **Build Tools:** npm, webpack
- **Code Quality:** PHPStan, PHPCS

## Commands

### Development
```bash
npm install          # Install dependencies
npm run build        # Build assets
npm run watch        # Watch for changes
```

### Code Quality
```bash
composer run lint    # Run PHPCS
composer run phpstan # Run PHPStan
```

## Fueled Commands

Use these slash commands in conversation:

- `/fueled:status` — View project dashboard
- `/fueled:new-prd [domain/epic/feature]` — Create new PRD
- `/fueled:generate-stakeholder <type>` — Generate exec/pm/dev docs
- `/fueled:validate-build` — Validate code matches PRD
