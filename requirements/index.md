# Product Requirements Documentation

This documentation contains Product Requirements Documents (PRDs) for the WordPress project, organized by domain and epic.

## Documentation Structure

Requirements are organized in a three-level hierarchy:

- **Domain**: High-level area of functionality (e.g., Information Architecture, Blocks, REST API)
- **Epic**: Related group of features within a domain (e.g., Post Types, Taxonomies, Event Blocks)
- **Feature**: Individual PRD describing a specific feature or component

## Domains

### Information Architecture

Defines the content model for the WordPress site, including custom post types and taxonomies.

- [Post Types](/information-architecture/post-types/)
- [Taxonomies](/information-architecture/taxonomies/)

### Blocks

Custom Gutenberg blocks for content editing and display.

- [Event Blocks](/blocks/event-blocks/)

## PRD Format

Each PRD follows a standard structure:

- **Description**: Overview of the feature and its purpose
- **Acceptance Criteria**: Specific, testable requirements that define done
- **Technical Approach**: Implementation details, architecture decisions, dependencies
- **ADR (Architecture Decision Record)**: Key decisions made and their rationale

## Status Definitions

- **draft**: Initial planning, requirements gathering
- **ready**: Requirements approved, ready for implementation
- **in-progress**: Actively being developed
- **done**: Implemented and verified
- **blocked**: Cannot proceed due to dependency or blocker
