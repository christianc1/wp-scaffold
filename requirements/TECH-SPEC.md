---
title: "Technical Specification"
order: 1
---

# Technical Specification

**Project:** Mayo Clinic Global Business Solutions
**Platform:** WordPress (10up scaffold)
**Created:** 2026-02-02 | **Last Updated:** 2026-02-02

---

## Document Purpose

This Technical Specification Document (TSD) defines the technical implementation approach for the project. It establishes platforms, frameworks, tools, and architectural considerations necessary for development.

**Prerequisite:** This document assumes familiarity with the [Requirements Index](index.md) which defines project scope.

---

## Big Picture Summary

| Aspect | Value |
|--------|-------|
| Platform | WordPress (10up scaffold) |
| Domains | 5 (Layout, Pages, Blocks, Forms, API Demo) |
| Compliance | None |
| Performance Tier | Standard (<3s load, hourly caching) |
| Launch Type | Flexible |

---

## Hosting & Infrastructure

| Item | Value |
|------|-------|
| Hosting Type | Cloud Platform |
| Provider | AWS |
| Infrastructure | TBD (EC2 + RDS, Lightsail, or ECS - client/DevOps to decide) |

### Environments

| Environment | Purpose | Access |
|-------------|---------|--------|
| Local | Development | Developer machines (10up Local or Docker) |
| Staging | UAT/QA | Mayo Clinic VPN/SSO required |
| Production | Live | Public |

**Note:** No shared development environment. Developers work locally, deploy to staging for review.

---

## Deployment & CI/CD

| Item | Value |
|------|-------|
| Deployment Method | Git-based |
| CI/CD Platform | N/A (git push triggers deploy) |
| Branching Strategy | GitHub Flow |

### GitHub Flow

```
feature/PRD-XX.X.XX-description
        │
        ▼
      trunk (main) ──────► staging ──────► production
```

- Feature branches created from `trunk`
- PRs reviewed and merged to `trunk`
- `trunk` auto-deploys to staging
- Production deploys via tag or manual promotion

### Build Process

The 10up scaffold includes build tooling. On deploy:

1. `npm install` — Install dependencies
2. `npm run build` — Compile assets (webpack)
3. `composer install --no-dev` — Install PHP dependencies

---

## Code Standards & Tooling

| Language | Standard/Tooling |
|----------|------------------|
| PHP | 10up PHP Standards (extends WPCS) |
| JavaScript | 10up-toolkit (ESLint + Webpack) |
| CSS | SCSS via 10up-toolkit |
| Static Analysis | PHPStan, TypeScript |

### Existing Tooling (10up Scaffold)

The scaffold provides via **10up-toolkit**:

- **PHPCS** — `composer run lint` (10up standards)
- **PHPStan** — `composer run phpstan`
- **ESLint** — Built into 10up-toolkit
- **Webpack** — Asset bundling via 10up-toolkit

### Standards Enforcement

```bash
# PHP linting
composer run lint

# PHP static analysis
composer run phpstan

# JavaScript/CSS build + lint
npm run build
```

**Pre-commit:** Consider adding husky/lint-staged for pre-commit hooks.

---

## Caching Strategy

| Layer | Approach | Notes |
|-------|----------|-------|
| Page Cache | CloudFront edge caching | Full page caching at CDN level |
| Object Cache | Redis (ElastiCache) | Database query caching |
| CDN | AWS CloudFront | Static assets + page cache |

### Cache Invalidation

- **Page cache:** Purge on content publish via CloudFront invalidation
- **Object cache:** Redis flush on deploy or content changes
- **Browser cache:** Versioned asset URLs (webpack handles this)

### Cache TTLs

| Content Type | TTL | Rationale |
|--------------|-----|-----------|
| Static assets | 1 year | Versioned filenames |
| HTML pages | 1 hour | Content freshness requirement |
| API responses | 5 minutes | API demo needs fresh data |

---

## Monitoring & Logging

| Type | Tool | Notes |
|------|------|-------|
| APM | TBD | May use CloudWatch or add New Relic/Datadog later |
| Error Tracking | CloudWatch Logs | AWS native logging |
| Uptime | UptimeRobot | External monitoring |

### CloudWatch Configuration

- **Log Groups:** Application logs, access logs, error logs
- **Alarms:** 5xx errors, high latency, resource utilization
- **Dashboards:** Key metrics visualization

### Recommended Future Additions

- Sentry for frontend error tracking (especially API Demo)
- New Relic or Datadog APM if performance issues arise

---

## Security Implementation

| Measure | Implementation |
|---------|----------------|
| Encryption in Transit | TLS everywhere (HTTPS enforced) |
| Encryption at Rest | AWS default encryption |
| WAF | TBD (recommend AWS WAF) |
| Secrets Management | AWS Secrets Manager or SSM Parameter Store |

### Security Checklist

- [ ] SSL certificate provisioned (ACM)
- [ ] HTTPS redirect configured
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] WordPress hardening (disable XML-RPC, limit login attempts)
- [ ] AWS security groups configured
- [ ] IAM roles with least privilege

### WordPress Security

- Disable XML-RPC (unless needed)
- Limit login attempts
- Two-factor authentication for admin users
- Regular security updates via 10up scaffold tooling

---

## Migration Implementation

| Item | Value |
|------|-------|
| Source System | https://gbs.mayoclinic.org/ |
| Migration Type | Manual |
| Content Types | Pages (~13) |
| Tooling | Manual recreation |

**Approach:** Content will be manually recreated using the new block patterns and page templates. No automated migration scripts required.

**Process:**
1. Content inventory from existing site
2. Map content to new page templates/patterns
3. Manual content entry in new WordPress
4. QA review against existing site
5. Redirect mapping (old URLs → new URLs)

---

## Integration Implementation

### CRM: Microsoft Dynamics 365

**Data Flow:** Push (form submissions → Dynamics)

**Technical Approach:**
- Primary: Gravity Forms with Dynamics 365 add-on (if available)
- Fallback: Custom integration - form submissions re-POSTed to Dynamics PowerWebForm endpoint
- Endpoint: `https://pocloudcentral.crm.powerobjects.net/PowerWebForm/PowerWebFormData.aspx`

**Implementation Notes:**
- Investigate existing Gravity Forms Dynamics add-ons
- If no suitable add-on exists, build simple PHP integration:
  - Hook into Gravity Forms submission
  - Format data for PowerWebForm endpoint
  - POST to Dynamics endpoint
  - Handle success/failure responses

### Analytics: Google Analytics 4

**Data Flow:** Client-side tracking

**Technical Approach:**
- Google Tag Manager container
- GA4 configuration tag
- Custom events for:
  - Form submissions
  - API Demo interactions
  - CTA clicks
  - Scroll depth

**Implementation:**
1. GTM container snippet in theme header
2. GA4 tag configured in GTM
3. DataLayer events pushed from JavaScript
4. Event tracking for conversion goals

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | AWS | Client infrastructure, Microsoft Dynamics integration |
| Theme | Hybrid (10up scaffold) | Existing codebase, proven approach |
| Blocks | Core + Patterns | No custom block development, faster delivery |
| Object Cache | Redis | Standard for WordPress at scale |
| CDN | CloudFront | Native AWS integration |
| Forms | Gravity Forms | Complex forms, Dynamics integration potential |
| Analytics | GTM + GA4 | Industry standard, flexible |

---

## Development Environment

### Local Setup (10up)

The 10up scaffold supports:

- **10up Local** — Recommended for 10up projects
- **Docker** — Alternative containerized environment
- **Local by Flywheel** — Alternative local development

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Asset compilation |
| PHP | 8.1+ | WordPress runtime |
| Composer | 2.x | PHP dependencies |
| MySQL | 8.0+ | Database |

### Getting Started

```bash
# Clone repository
git clone [repo-url]
cd mayo-gbs

# Install dependencies
npm install
composer install

# Build assets
npm run build

# Watch for changes (development)
npm run watch
```

---

## Open Questions

| Question | Status | Owner |
|----------|--------|-------|
| AWS infrastructure approach (EC2/Lightsail/ECS) | TBD | Client/DevOps |
| WAF selection (AWS WAF recommended) | TBD | Client/DevOps |
| APM tool selection | TBD | Team |
| Gravity Forms Dynamics add-on availability | Research needed | Dev team |

---

## Appendix: AWS Architecture (Recommended)

```
                    ┌─────────────┐
                    │  Route 53   │
                    │    (DNS)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ CloudFront  │
                    │    (CDN)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │
                    │ (optional)  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼──────┐
       │   EC2/ECS   │          │   EC2/ECS   │
       │ (WordPress) │          │ (WordPress) │
       └──────┬──────┘          └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────▼──────┐          ┌──────▼──────┐
       │     RDS     │          │ ElastiCache │
       │   (MySQL)   │          │   (Redis)   │
       └─────────────┘          └─────────────┘
```

---

_Generated by Fueled | Last updated: 2026-02-02_
