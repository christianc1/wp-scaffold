---
title: Event Custom Post Type
status: draft
epic: Post Types
domain: Information Architecture
dependencies: []
---

# Event Custom Post Type

## Description

A custom post type for managing events on the WordPress site. Events represent time-bound occurrences such as conferences, webinars, workshops, and community gatherings. The Event CPT provides a structured way to store event metadata including date/time, location, registration details, and related taxonomies.

Events will be displayed on archive pages, single event pages, and featured in various blocks throughout the site. The CPT integrates with the REST API to enable headless applications and third-party integrations.

## Acceptance Criteria

- [ ] Event post type is registered with slug `event` and supports title, editor, thumbnail, excerpt, and custom fields
- [ ] Events appear in admin menu with custom dashicon
- [ ] REST API endpoint `/wp-json/wp/v2/events` is accessible and returns event data
- [ ] Events support block editor (Gutenberg) for rich content editing
- [ ] Event metadata (date, time, location) can be stored via custom fields or ACF
- [ ] Public queries can filter events by date range and taxonomy terms
- [ ] Archive and single templates can be overridden in theme

## Technical Approach

**Registration:**
Register the CPT in `mu-plugins/10up-plugin/includes/post-types.php` using `register_post_type()` with the following configuration:

```php
register_post_type('event', [
    'labels' => [
        'name' => 'Events',
        'singular_name' => 'Event',
        // ... additional labels
    ],
    'public' => true,
    'has_archive' => true,
    'show_in_rest' => true,
    'rest_base' => 'events',
    'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
    'menu_icon' => 'dashicons-calendar-alt',
    'rewrite' => ['slug' => 'events'],
]);
```

**Meta Fields:**
Event metadata will be implemented using either:
- WordPress custom fields API with `register_post_meta()`
- Advanced Custom Fields (ACF) if project uses ACF for field management

Required metadata:
- Start date/time (datetime)
- End date/time (datetime)
- Location name (text)
- Location address (textarea)
- Registration URL (url)
- Event capacity (number)

**REST API:**
With `show_in_rest => true`, the events endpoint is automatically available. Custom meta fields should be registered with `show_in_rest => true` to expose them via API.

**Template Hierarchy:**
WordPress will look for:
- `single-event.php` for single event view
- `archive-event.php` for events archive
- Falls back to `single.php` and `archive.php` if custom templates don't exist

## ADR

**Decision**: Use custom post type instead of regular posts with category

**Rationale:**
- Events are fundamentally different content than blog posts (time-bound, location-based, registration-focused)
- CPT provides clean URL structure (`/events/event-name`)
- Separate post type prevents events from mixing with blog content in queries
- Enables custom fields and metadata specific to events without affecting posts
- Easier to apply different templates and archive logic

**Alternatives Considered:**
1. **Regular posts with "Events" category**: Rejected because it couples events with blog infrastructure, makes filtering more complex, and doesn't provide semantic URL structure
2. **Custom database table**: Over-engineering for WordPress context; CPT leverages existing post infrastructure, plugins, and APIs

**Decision**: Enable REST API by default

**Rationale:**
- Modern WordPress sites often need headless/decoupled capabilities
- Third-party integrations (mobile apps, calendar sync) benefit from API access
- Minimal overhead; can be disabled later if unused
- Enables block editor to function properly

**Trade-offs:**
- Public API exposure (mitigated by WordPress authentication and permission systems)
- Slightly increased attack surface (standard for modern WordPress)
