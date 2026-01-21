---
title: Event Map Block
status: draft
epic: Event Blocks
domain: Blocks
dependencies:
  - information-architecture/post-types/cpt-event.prd.md
---

# Event Map Block

## Description

A custom Gutenberg block that displays a map with markers for upcoming events. The Event Map Block queries event posts, extracts their location coordinates (from custom fields or geocoded addresses), and renders an interactive map using a JavaScript mapping library.

The block provides an engaging visual way for site visitors to discover events by geographic location. Users can click markers to see event details and navigate to individual event pages.

**Key Features:**
- Displays markers for all upcoming events within a configurable date range
- Supports filtering by event taxonomy (venue, category, tag)
- Configurable map center, zoom level, and display style
- Responsive design works on desktop and mobile
- Accessible fallback for users with screen readers (list of events with locations)

## Acceptance Criteria

- [ ] Block appears in inserter under "Events" category
- [ ] Block editor UI provides controls for:
  - Date range filter (upcoming, next 30 days, next 90 days, custom range)
  - Taxonomy filters (venue, category)
  - Map center point (latitude/longitude or auto-center)
  - Zoom level (1-20)
  - Map height (px or vh)
- [ ] Frontend displays interactive map with markers for filtered events
- [ ] Clicking marker shows event title, date, and link to event page
- [ ] Map library assets (JS/CSS) are enqueued only on pages using the block
- [ ] Block works with event location data from custom fields or term meta
- [ ] Accessible list view available as fallback/alternative display
- [ ] Block validates and saves settings correctly

## Technical Approach

**Scaffolding:**
Use `@wordpress/create-block` to scaffold initial block structure:

```bash
npx @wordpress/create-block event-map-block \
  --namespace tenup \
  --title "Event Map" \
  --category widgets
```

This generates block structure in `mu-plugins/10up-plugin/blocks/event-map-block/`.

**Block Registration:**
Register block in PHP (`blocks/event-map-block/index.php`):

```php
register_block_type(__DIR__ . '/build', [
    'render_callback' => 'render_event_map_block',
]);
```

**Attributes:**
Define block attributes in `block.json`:

```json
{
  "attributes": {
    "dateRange": {
      "type": "string",
      "default": "upcoming"
    },
    "venueFilter": {
      "type": "array",
      "default": []
    },
    "mapCenter": {
      "type": "object",
      "default": { "lat": 0, "lng": 0 }
    },
    "zoomLevel": {
      "type": "number",
      "default": 12
    },
    "mapHeight": {
      "type": "string",
      "default": "400px"
    }
  }
}
```

**Mapping Library:**
Use **Leaflet.js** for mapping (free, open-source, no API key required):
- Enqueue Leaflet CSS/JS only when block is present
- Use `wp_enqueue_script()` with `leaflet` handle
- CDN: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

**Data Flow:**
1. **Editor**: Block edit component renders controls using `@wordpress/components`
2. **Frontend**: PHP render callback queries events based on block attributes
3. **Render**: Output map container with `data-events` attribute containing JSON of event locations
4. **JavaScript**: Frontend script initializes Leaflet map from data attribute

**Query Events:**
In render callback, build `WP_Query` based on block attributes:

```php
$args = [
    'post_type' => 'event',
    'posts_per_page' => -1,
    'meta_query' => [
        [
            'key' => 'event_start_date',
            'value' => current_time('Y-m-d'),
            'compare' => '>=',
            'type' => 'DATE',
        ],
    ],
];

// Add tax_query if venue filter set
if (!empty($attributes['venueFilter'])) {
    $args['tax_query'] = [
        [
            'taxonomy' => 'event-venue',
            'field' => 'term_id',
            'terms' => $attributes['venueFilter'],
        ],
    ];
}

$events = new WP_Query($args);
```

**Geocoding:**
If events have addresses but no lat/lng coordinates:
- Use WordPress Transients API to cache geocoded results
- Integrate with Google Maps Geocoding API or OpenStreetMap Nominatim
- Store coordinates in post meta to avoid repeated API calls

**Accessibility:**
Provide alternative display mode (list view) for:
- Screen reader users
- Users who disable JavaScript
- Mobile users who prefer list navigation

Implement using block variation or toggle control.

## ADR

**Decision**: Use Leaflet.js instead of Google Maps

**Rationale:**
- **No API key required**: Simplifies setup, no billing/quota concerns
- **Open source**: Free for all use cases, no licensing restrictions
- **Lightweight**: Smaller bundle size than Google Maps (~38kb gzipped)
- **OSM integration**: Uses OpenStreetMap tiles (community-driven, free)
- **Customizable**: Easy to style and extend

**Alternatives Considered:**
1. **Google Maps API**: Requires API key, billing setup, usage limits; more complex for basic use case
2. **Mapbox**: Requires API key and account; free tier limited to 50k loads/month
3. **OpenLayers**: More powerful but heavier and more complex API

**Decision**: Render map on frontend via PHP callback (not block.json save)

**Rationale:**
- **Dynamic content**: Event data changes over time; saved HTML would be stale
- **Query efficiency**: Render callback can query fresh event data on page load
- **Filtering**: Block attributes can dynamically filter events without re-saving block
- **Standard pattern**: Aligns with WordPress best practices for dynamic blocks

**Trade-offs:**
- Slightly more server-side processing per page load (mitigated by caching)
- No static HTML in saved content (requires PHP rendering)

**Decision**: Enqueue map assets conditionally (only when block present)

**Rationale:**
- **Performance**: Don't load 38kb+ of Leaflet on pages without map
- **Best practice**: WordPress block asset loading pattern
- **User experience**: Faster page loads for non-map pages

**Implementation:**
Use `has_block()` check in enqueue callback:

```php
if (has_block('tenup/event-map')) {
    wp_enqueue_script('leaflet', ...);
    wp_enqueue_style('leaflet', ...);
}
```

**Decision**: Store location as lat/lng in event post meta

**Rationale:**
- **Performance**: Avoids geocoding on every page load
- **Reliability**: Geocoding APIs can fail or change; cached coords are stable
- **Offline development**: No external API calls needed after initial geocode
- **Accuracy**: Admin can verify/adjust coordinates if geocoding is incorrect

**Trade-offs:**
- Requires initial geocoding step (one-time per event)
- Duplicate data if address changes (must re-geocode)
