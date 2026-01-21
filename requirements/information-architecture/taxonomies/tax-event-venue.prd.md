---
title: Event Venue Taxonomy
status: draft
epic: Taxonomies
domain: Information Architecture
dependencies:
  - information-architecture/post-types/cpt-event.prd.md
---

# Event Venue Taxonomy

## Description

A hierarchical taxonomy for categorizing events by venue. Venues represent physical or virtual locations where events take place, such as conference centers, community halls, online platforms, or specific buildings.

The Event Venue taxonomy enables:
- Filtering events by location in queries and archives
- Venue-specific archive pages showing all events at that venue
- Associating venue metadata (address, capacity, accessibility) with terms
- Building venue directories and maps

Venues are hierarchical to support parent/child relationships (e.g., "Building A" under "Campus Complex").

## Acceptance Criteria

- [ ] `event-venue` taxonomy is registered and associated with `event` post type
- [ ] Taxonomy is hierarchical (allows parent/child venue relationships)
- [ ] Venue terms appear in event editor sidebar with checkbox UI
- [ ] Venue taxonomy is exposed via REST API at `/wp-json/wp/v2/event-venue`
- [ ] Archive URLs like `/event-venue/downtown-center/` list all events at that venue
- [ ] Term metadata can be added for venue details (address, capacity, accessibility notes)
- [ ] Venue taxonomy can be queried in WP_Query and REST API filters

## Technical Approach

**Registration:**
Register the taxonomy in `mu-plugins/10up-plugin/includes/taxonomies.php` using `register_taxonomy()`:

```php
register_taxonomy('event-venue', 'event', [
    'labels' => [
        'name' => 'Event Venues',
        'singular_name' => 'Event Venue',
        'menu_name' => 'Venues',
        // ... additional labels
    ],
    'hierarchical' => true,
    'public' => true,
    'show_in_rest' => true,
    'rest_base' => 'event-venue',
    'rewrite' => ['slug' => 'event-venue'],
    'show_admin_column' => true,
]);
```

**Term Meta:**
If venue metadata is needed (address, capacity, etc.), use WordPress term meta API:

```php
register_term_meta('event-venue', 'address', [
    'type' => 'string',
    'single' => true,
    'show_in_rest' => true,
]);

register_term_meta('event-venue', 'capacity', [
    'type' => 'integer',
    'single' => true,
    'show_in_rest' => true,
]);
```

**Querying:**
Events can be queried by venue using `tax_query`:

```php
$args = [
    'post_type' => 'event',
    'tax_query' => [
        [
            'taxonomy' => 'event-venue',
            'field' => 'slug',
            'terms' => 'downtown-center',
        ],
    ],
];
$events = new WP_Query($args);
```

**REST API:**
REST API endpoints automatically available:
- `GET /wp-json/wp/v2/event-venue` - List all venues
- `GET /wp-json/wp/v2/events?event-venue=123` - Filter events by venue ID

**Template Hierarchy:**
WordPress will look for:
- `taxonomy-event-venue.php` for venue archives
- `taxonomy-event-venue-{slug}.php` for specific venue
- Falls back to `taxonomy.php` or `archive.php`

## ADR

**Decision**: Use hierarchical taxonomy instead of flat taxonomy

**Rationale:**
- Venues often have parent/child relationships (rooms within buildings, buildings within campuses)
- Hierarchical structure matches real-world venue organization
- Enables grouping and filtering at different levels (all events in "Downtown District" parent term)
- UI provides familiar folder-like interface in admin
- No significant performance cost for hierarchy vs flat

**Alternatives Considered:**
1. **Flat taxonomy**: Simpler but loses organizational structure; difficult to represent "Room 101 in Building A"
2. **Multiple taxonomies (venue-building, venue-room)**: Over-complex, hard to query across levels
3. **Custom meta fields on events**: Loses benefits of taxonomy (archives, filtering UI, term pages)

**Decision**: Associate only with Event post type (not posts/pages)

**Rationale:**
- Venues are semantically tied to events; other post types don't need venue categorization
- Keeps admin UI clean (venue taxonomy only appears for event posts)
- Reduces query complexity and index size
- Can be extended to other post types later if needed

**Decision**: Enable REST API exposure

**Rationale:**
- Consistent with Event CPT decision (both need API access together)
- Required for headless/decoupled frontends to filter events by venue
- Enables third-party integrations (map plugins, calendar apps)
- Term metadata (address, capacity) useful for API consumers building venue directories

**Trade-offs:**
- Public API exposure of venue list (generally not sensitive data)
- Minimal performance overhead
