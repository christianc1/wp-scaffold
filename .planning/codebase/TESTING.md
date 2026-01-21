# Testing Patterns

**Analysis Date:** 2026-01-21

## Test Framework

**Runner:**
- Jest (via 10up-toolkit wrapper)
- Version: Managed by `10up-toolkit` (^6.5.0)
- Environment: jsdom (installed as dev dependency)
  - Package: `jest-environment-jsdom` ^29.7.0
- Config: Implicit—configuration provided by 10up-toolkit, no explicit jest.config.js files in codebase

**Assertion Library:**
- Jest's built-in expect() assertions
- No separate assertion library detected

**Run Commands:**

```bash
npm run test                    # Run tests in current workspace
npm run test --workspaces      # Run tests in all workspaces from root
```

**Individual package commands:**
```bash
npm run test --workspaces --if-present  # Run tests in theme and plugin if they exist
```

**Specific workspace:**
```bash
npm run test -w=tenup-theme    # Run tests in theme workspace
npm run test -w=tenup-plugin   # Run tests in plugin workspace
```

**Test script configuration:**
Both theme and plugin use: `10up-toolkit test-unit-jest --passWithNoTests`
- `--passWithNoTests` flag allows test suite to pass when no tests are present (scaffold stage)

## Test File Organization

**Location:**
- Co-located with source files (next to component/module)
- Follows WordPress/Gutenberg conventions

**Naming:**
- Pattern: `ComponentName.test.js` or `module-name.test.js`
- Jest auto-discovers files matching `**/*.test.js` or `**/*.spec.js`

**Current State:**
- No test files currently in codebase
- `--passWithNoTests` flag in test scripts allows this during scaffolding phase
- Tests should be added alongside new features in themes and plugins

**Structure:**
Test files should follow this organization pattern:

```
/themes/10up-theme/
├── blocks/
│   └── example-block/
│       ├── index.js
│       ├── edit.js
│       ├── save.js
│       ├── block.json
│       ├── edit.test.js          # Co-located test
│       └── save.test.js
├── assets/js/
│   ├── block-editor/
│   │   ├── block-collection.js
│   │   └── block-collection.test.js
│   └── frontend/
│       ├── frontend.js
│       └── frontend.test.js

/mu-plugins/10up-plugin/
├── assets/js/
│   └── admin/
│       ├── admin.js
│       └── admin.test.js
```

## Test Structure

**Jest Configuration Context:**
- Provided by `10up-toolkit test-unit-jest` command
- Tests run with jsdom environment (DOM simulation for block editor testing)
- WordPress globals and utilities available in test environment

**Recommended Test Suite Pattern:**

For block components (`/themes/10up-theme/blocks/example-block/edit.test.js`):
```javascript
/**
 * WordPress dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ExampleBlockEdit from './edit';

describe('ExampleBlockEdit', () => {
	const defaultProps = {
		attributes: {
			title: 'Test Title',
		},
		setAttributes: jest.fn(),
		className: 'test-class',
	};

	it('renders the component', () => {
		render(<ExampleBlockEdit {...defaultProps} />);
		expect(screen.getByText('Test Title')).toBeInTheDocument();
	});

	it('calls setAttributes when title changes', () => {
		const setAttributes = jest.fn();
		render(<ExampleBlockEdit {...defaultProps} setAttributes={setAttributes} />);

		// Test interactions here
	});
});
```

For utility functions (`assets/js/utilities/helpers.test.js`):
```javascript
/**
 * Internal dependencies
 */
import { helperFunction } from './helpers';

describe('helperFunction', () => {
	it('returns expected result for valid input', () => {
		const result = helperFunction('input');
		expect(result).toBe('expected');
	});

	it('handles edge cases correctly', () => {
		const result = helperFunction('');
		expect(result).toEqual([]);
	});
});
```

**Patterns:**
- Setup: Define constants and mocks above test suite
- Describe blocks: Organize related tests with `describe()`
- Individual tests: Use `it()` for each test case
- Teardown: Jest automatically clears mocks between tests; use `beforeEach()` if needed

## Mocking

**Framework:**
- Jest's built-in mocking utilities (`jest.fn()`, `jest.mock()`)
- React Testing Library for component interaction testing (comes with 10up-toolkit)

**Patterns:**

Mock WordPress functions:
```javascript
jest.mock('@wordpress/i18n', () => ({
	__: (text) => text,
}));
```

Mock component callbacks:
```javascript
const mockSetAttributes = jest.fn();
const props = {
	attributes: { title: 'Test' },
	setAttributes: mockSetAttributes,
};
```

Assert mock was called:
```javascript
expect(mockSetAttributes).toHaveBeenCalledWith({ title: 'New Title' });
```

**What to Mock:**
- External WordPress dependencies (safely)
- Callback functions from parent components
- API calls and async operations
- Browser APIs when testing in jsdom

**What NOT to Mock:**
- Components you're testing (test the real implementation)
- Pure utility functions
- Redux stores (if used)
- Block registration functions (use real WordPress utilities)

## Fixtures and Factories

**Test Data:**

Block attribute fixtures:
```javascript
const mockBlockAttributes = {
	title: 'Sample Title',
	content: 'Sample content',
	alignment: 'center',
};

const mockBlockProps = {
	className: 'wp-block-example',
	attributes: mockBlockAttributes,
	setAttributes: jest.fn(),
};
```

Factory pattern for complex test data:
```javascript
const createMockBlockProps = (overrides = {}) => ({
	attributes: { title: 'Default' },
	setAttributes: jest.fn(),
	className: 'wp-block-example',
	...overrides,
});

// Usage
const props = createMockBlockProps({ attributes: { title: 'Custom' } });
```

**Location:**
- Keep fixtures in same test file for simple cases
- Create `__fixtures__` or `__mocks__` directories for shared test data
- Pattern: `/tests/__fixtures__/blockAttributes.js`

## Coverage

**Requirements:**
- Not enforced in current setup
- Recommended: Aim for 80%+ coverage on critical paths

**View Coverage:**
```bash
npm run test -- --coverage          # Generate coverage report
npm run test -- --coverage --watch  # Watch mode with coverage
```

**Coverage Output:**
- Reports generated to `coverage/` directory
- HTML report viewable in browser: `coverage/lcov-report/index.html`

## Test Types

**Unit Tests:**
- Scope: Individual components and utilities
- Approach: Test component behavior with different props, test utility functions with various inputs
- Location: Co-located with source files
- Example: `edit.test.js` tests `ExampleBlockEdit` component behavior
- Use React Testing Library for component tests

**Integration Tests:**
- Scope: Block behavior within editor, component interaction
- Approach: Test how blocks interact with WordPress APIs, block editor features
- Location: Can be in test directory or co-located
- Example: Test block registration and rendering within editor context
- Test interactions between edit and save components

**E2E Tests:**
- Framework: Not configured in current setup
- Recommendation: Consider `@wordpress/e2e-test-utils` for future WordPress-specific E2E testing
- Not currently used in scaffold

## Common Patterns

**Async Testing:**

Testing async functions and effects:
```javascript
it('handles async data loading', async () => {
	const { getByText } = render(<MyComponent />);

	// Wait for async operation
	const element = await screen.findByText('Loaded');
	expect(element).toBeInTheDocument();
});
```

Testing promises:
```javascript
it('resolves with correct data', () => {
	return myAsyncFunction().then(result => {
		expect(result).toEqual(expectedValue);
	});
});
```

**Error Testing:**

Testing error states and error handling:
```javascript
it('handles errors gracefully', () => {
	const errorFunction = jest.fn().mockRejectedValue(new Error('API Error'));

	return expect(errorFunction()).rejects.toThrow('API Error');
});
```

Testing error boundaries or error states in components:
```javascript
it('displays error message on failure', async () => {
	const mockSetAttributes = jest.fn();

	render(<MyComponent setAttributes={mockSetAttributes} />);

	// Trigger error condition
	const errorEl = await screen.findByText('Error');
	expect(errorEl).toBeVisible();
});
```

## Workspace Testing

**Root Level:**
- Run tests across all workspaces from root:
```bash
npm run test --workspaces --if-present
```

**Individual Workspaces:**
- Theme tests: `npm run test -w=tenup-theme`
- Plugin tests: `npm run test -w=tenup-plugin`

**Test Results:**
- Each workspace reports its own test results
- `--passWithNoTests` prevents build failures when tests don't exist
- As features are added, test files should be created alongside

## Current Test Status

**No test files currently exist in the scaffold.**

The test infrastructure is ready to use:
- Jest configured via 10up-toolkit
- jsdom environment available for DOM testing
- React Testing Library available for component testing
- WordPress testing utilities available via @wordpress packages

**To add tests:**
1. Create `.test.js` files next to source files
2. Write tests using Jest and React Testing Library patterns
3. Run `npm run test` to execute

---

*Testing analysis: 2026-01-21*
