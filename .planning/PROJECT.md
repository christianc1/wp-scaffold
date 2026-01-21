# Requirements-as-Code System

## What This Is

A paradigm shift for the WP Scaffold where Product Requirement Documents (PRDs) live in the repository as versioned, first-class artifacts. Requirements are authored with agent assistance, synced to Teamwork for PM visibility, rendered as browsable documentation, and executed via GSD. The repository becomes the canonical source of truth for what we're building across all Fueled WordPress projects.

## Core Value

Requirements live where the code lives — versioned, diffable, agent-readable, and executable.

## Requirements

### Validated

- ✓ WP Scaffold architecture (themes, mu-plugins, blocks) — existing
- ✓ 10up Framework module pattern — existing
- ✓ 10up Toolkit build system — existing
- ✓ Composer/npm workspace structure — existing

### Active

- [ ] `requirements/` directory structure with Domain → Epic → Feature hierarchy
- [ ] PRD file format (`.prd.md`) with standard sections: Title, Description, Dependencies, Status, Technical Approach, Acceptance Criteria, ADR
- [ ] PRD Status field (ternary: Todo, In Progress, Done) for agent execution tracking
- [ ] Mapping file linking PRDs ↔ Teamwork task IDs (bidirectional lookup)
- [ ] Agent-assisted PRD authoring (GSD-style questioning → structured PRD output)
- [ ] Agent-assisted triage (pull Teamwork backlog items → create/update PRDs)
- [ ] CI/CD: Sync PRD content to Teamwork tasks (GitHub Actions + GitLab CI)
- [ ] CI/CD: Generate static documentation site from requirements tree (GitHub Actions + GitLab CI)
- [ ] GSD integration at execution time (PRD as input context → code output → status update)

### Out of Scope

- Cross-project RAG/vector DB aggregation — future feature, explicitly deferred
- Bidirectional content sync (Teamwork → repo for content) — repo is source of truth
- Individual task-level sync to Teamwork — only feature-level PRDs sync
- Custom Teamwork API integration — use existing Teamwork MCP

## Context

**Codebase:**
This is the 10up WP Scaffold, the starting base for Fueled WordPress projects. Existing architecture is documented in `.planning/codebase/`. The scaffold includes theme scaffolds (traditional and block-based), a must-use plugin scaffold, and shared build tooling via 10up Toolkit.

**Workflow:**
- Teamwork is the PM tool; PMs track status, assignees, and comments there
- Both GitHub and GitLab are used across projects; CI/CD must support both
- Non-engineers create tickets in Teamwork backlogs that need triage into proper requirements
- Engineers/agents execute requirements and need fast status signals (Todo/In Progress/Done)

**Integration Points:**
- Teamwork MCP exists for querying task metadata (status, assignee, comments)
- GSD (get-shit-done) provides agent-assisted execution workflow
- Static site generators (Docusaurus, Fumadocs, etc.) can render markdown hierarchies

**Directory Structure:**
```
requirements/
├── information-architecture/        # Domain
│   ├── post-types/                  # Epic
│   │   └── cpt-event.prd.md         # Feature (PRD)
│   └── taxonomies/
│       └── tax-event-venue.prd.md
└── blocks/                          # Domain
    └── event-blocks/                # Epic
        ├── event-map-block.prd.md   # Feature (PRD)
        └── event-attendees-block.prd.md
```

**PRD Structure:**
```markdown
---
title: [Feature Name]
status: todo | in-progress | done
dependencies: []
---

# [Feature Name]

## Description
[Non-technical, human-readable description]

## Acceptance Criteria
[How to verify this is complete]

## Technical Approach
[Filled in during planning/execution, can start empty]

## Architectural Decision Record
[Why this requirement exists, how decisions evolved]
```

## Constraints

- **CI/CD Platform**: Must support both GitHub Actions and GitLab CI — different projects use different platforms
- **PM Tool**: Teamwork integration required — this is the established PM workflow
- **Sync Direction**: Content is one-way (repo → Teamwork) — repo is canonical source of truth
- **Metadata Access**: Via Teamwork MCP — no custom API integrations to maintain
- **Execution Layer**: GSD for implementation — PRDs define what, GSD figures out how

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mapping in separate file, not frontmatter | Cleaner PRD files; mapping is infrastructure, not content | — Pending |
| PRD Status separate from Teamwork status | Different audiences: agents need fast ternary, PMs need full SDLC | — Pending |
| Feature-level sync only | Tasks within PRDs are for developers; PMs care about feature completion | — Pending |
| GSD at execution time, not for PRD authoring | GSD excels at code execution; PRD authoring needs different workflow | — Pending |
| Static site generator TBD | Evaluate options during research; must respect directory hierarchy | — Pending |

---
*Last updated: 2026-01-21 after initialization*
