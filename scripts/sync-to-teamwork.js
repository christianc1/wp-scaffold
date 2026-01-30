#!/usr/bin/env node

import 'dotenv/config';
import { readFile, writeFile, readdir } from 'fs/promises';
import matter from 'gray-matter';
import { existsSync } from 'fs';
import path from 'path';

// Configuration constants
const REQUIREMENTS_DIR = 'requirements';

const MAPPING_FILE = '.planning/teamwork-mapping.json';
const RATE_LIMIT_DELAY = 400; // ms (150 req/min = ~400ms between)
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

/**
 * Fetch with timeout using AbortController
 *
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} The fetch response
 */
async function fetchWithTimeout(url, options = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeout);
		return response;
	} catch (error) {
		clearTimeout(timeout);
		throw error;
	}
}

/**
 * Fetch with retry logic for 5xx and 429 errors
 *
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retries
 * @returns {Promise<Response>} The fetch response
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
	let lastError;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			// eslint-disable-next-line no-await-in-loop
			const response = await fetchWithTimeout(url, options);

			// Success - return response
			if (response.ok) {
				return response;
			}

			// Client errors (4xx) - don't retry
			if (response.status >= 400 && response.status < 500 && response.status !== 429) {
				return response;
			}

			// Server errors (5xx) or rate limit (429) - retry
			if (response.status >= 500 || response.status === 429) {
				lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

				if (attempt < retries) {
					// Use Retry-After header if present, else exponential backoff
					let delay;
					const retryAfter = response.headers.get('Retry-After');
					if (retryAfter) {
						delay = parseInt(retryAfter, 10) * 1000;
					} else {
						delay = 2 ** attempt * 1000;
					}

					// eslint-disable-next-line no-console
					console.log(`  Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
					// eslint-disable-next-line no-await-in-loop, no-promise-executor-return
					await new Promise((resolve) => setTimeout(resolve, delay));
					// eslint-disable-next-line no-continue
					continue;
				}
			}

			return response;
		} catch (error) {
			lastError = error;
			if (attempt < retries) {
				const delay = 2 ** attempt * 1000;
				// eslint-disable-next-line no-console
				console.log(
					`  Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`,
				);
				// eslint-disable-next-line no-await-in-loop, no-promise-executor-return
				await new Promise((resolve) => setTimeout(resolve, delay));
				// eslint-disable-next-line no-continue
				continue;
			}
		}
	}

	throw lastError;
}

/**
 * Update a Teamwork task description via PATCH
 *
 * @param {string} taskId - The task ID
 * @param {string} content - The content to update
 * @returns {Promise<Response>} The fetch response
 */
async function updateTeamworkTask(taskId, content) {
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasks/${taskId}.json`;
	const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

	const options = {
		method: 'PATCH',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			description: content,
			descriptionContentType: 'TEXT',
		}),
	};

	const response = await fetchWithRetry(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	return response;
}

/**
 * Get all tasklists for a project
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<Array>} Array of tasklists
 */
async function getTeamworkTasklists(projectId) {
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/projects/${projectId}/tasklists.json`;
	const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

	const options = {
		method: 'GET',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
		},
	};

	const response = await fetchWithRetry(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data = await response.json();
	// API returns { tasklists: [...] }
	return data.tasklists || [];
}

/**
 * Create a new Teamwork tasklist via POST
 *
 * @param {string} projectId - The project ID
 * @param {string} name - The tasklist name
 * @returns {Promise<object>} The created tasklist
 */
async function createTeamworkTasklist(projectId, name) {
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	// V1 API required for POST - V3 only supports GET for tasklists
	const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/${projectId}/tasklists.json`;
	const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			tasklist: {
				name,
			},
		}),
	};

	const response = await fetchWithRetry(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data = await response.json();
	// V1 API returns { TASKLISTID: "1234", STATUS: "OK" }
	return { id: data.TASKLISTID };
}

/**
 * Create a new Teamwork subtask via POST (task with parentTaskId)
 *
 * @param {string} tasklistId - The tasklist ID
 * @param {string} parentTaskId - The parent task ID
 * @param {string} name - The task name
 * @param {string} content - The task content
 * @returns {Promise<object>} The created task
 */
async function createTeamworkSubtask(tasklistId, parentTaskId, name, content) {
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasklists/${tasklistId}/tasks.json`;
	const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			task: {
				name,
				description: content,
				descriptionContentType: 'TEXT',
				parentTaskId,
			},
		}),
	};

	const response = await fetchWithRetry(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data = await response.json();
	// API returns { task: { id: 12345, ... } }
	return data.task;
}

/**
 * Create a new Teamwork task via POST
 *
 * @param {string} tasklistId - The tasklist ID
 * @param {string} name - The task name
 * @param {string} content - The task content
 * @returns {Promise<object>} The created task
 */
async function createTeamworkTask(tasklistId, name, content) {
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasklists/${tasklistId}/tasks.json`;
	const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			task: {
				name,
				description: content,
				descriptionContentType: 'TEXT',
			},
		}),
	};

	const response = await fetchWithRetry(url, options);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`HTTP ${response.status}: ${errorText}`);
	}

	const data = await response.json();
	// API returns { task: { id: 12345, ... } }
	return data.task;
}

/**
 * Read and format PRD content with frontmatter
 *
 * @param {string} prdPath - The path to the PRD file
 * @returns {Promise<string>} The formatted PRD content
 */
async function readPRDContent(prdPath) {
	const content = await readFile(prdPath, 'utf-8');
	const { data, content: body } = matter(content);

	// Format with frontmatter visible at top
	const formatted = `# ${data.title || 'Untitled'}

**Status:** ${data.status || 'unknown'}
**Epic:** ${data.epic || 'none'}
**Domain:** ${data.domain || 'none'}

${body}`;

	return formatted;
}

/**
 * Load mappings from JSON file
 *
 * @returns {Promise<object>} The mapping data
 */
async function loadMappings() {
	if (!existsSync(MAPPING_FILE)) {
		throw new Error(`Mapping file not found: ${MAPPING_FILE}`);
	}

	const content = await readFile(MAPPING_FILE, 'utf-8');
	const data = JSON.parse(content);

	// Check mapping version
	const version = data.version || '1.0';

	if (version === '2.0') {
		// Hierarchical mappings - validate PRD paths exist
		for (const domainSlug of Object.keys(data.domains || {})) {
			const domain = data.domains[domainSlug];
			for (const epicSlug of Object.keys(domain.epics || {})) {
				const epic = domain.epics[epicSlug];
				for (const prdSlug of Object.keys(epic.prds || {})) {
					const prd = epic.prds[prdSlug];
					if (!existsSync(prd.path)) {
						// eslint-disable-next-line no-console
						console.log(`  Warning: PRD file not found: ${prd.path}`);
						prd._skipReason = 'file_not_found';
					}
				}
			}
		}
	} else {
		// Legacy flat mappings - validate PRD files exist
		for (const mapping of data.mappings || []) {
			if (!existsSync(mapping.prdPath)) {
				// eslint-disable-next-line no-console
				console.log(`  Warning: PRD file not found: ${mapping.prdPath}`);
				mapping._skipReason = 'file_not_found';
			}
		}
	}

	return data;
}

/**
 * Update mapping file with sync status
 *
 * @param {object} mappingData - The mapping data to update
 * @returns {Promise<void>}
 */
async function updateMappingStatus(mappingData) {
	const version = mappingData.version || '1.0';

	if (version === '2.0') {
		// Hierarchical mappings - clean up internal fields
		const output = { ...mappingData };
		for (const domainSlug of Object.keys(output.domains || {})) {
			const domain = output.domains[domainSlug];
			for (const epicSlug of Object.keys(domain.epics || {})) {
				const epic = domain.epics[epicSlug];
				for (const prdSlug of Object.keys(epic.prds || {})) {
					const prd = epic.prds[prdSlug];
					delete prd._skipReason;
				}
			}
		}
		output.lastUpdated = new Date().toISOString();
		await writeFile(MAPPING_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
	} else {
		// Legacy flat mappings - clean up internal fields
		const cleanMappings = (mappingData.mappings || []).map((m) => {
			const { _skipReason, ...clean } = m;
			return clean;
		});

		const output = {
			...mappingData,
			mappings: cleanMappings,
			lastUpdated: new Date().toISOString(),
		};

		await writeFile(MAPPING_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');
	}
}

/**
 * Sleep for rate limiting
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
	// eslint-disable-next-line no-promise-executor-return
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process legacy flat mappings (version 1.0)
 *
 * @param {object} mappingData - The mapping data
 * @returns {Promise<object>} Results object with success, errors, and skipped counts
 */
async function syncLegacyMappings(mappingData) {
	const { TEAMWORK_TASKLIST_ID } = process.env;
	const canCreateTasks = Boolean(TEAMWORK_TASKLIST_ID);

	if (!canCreateTasks) {
		// eslint-disable-next-line no-console
		console.log('Note: TEAMWORK_TASKLIST_ID not set - will only update existing tasks\n');
	} else {
		// eslint-disable-next-line no-console
		console.log(`Task creation enabled (tasklist: ${TEAMWORK_TASKLIST_ID})\n`);
	}

	const mappings = mappingData.mappings || [];
	if (mappings.length === 0) {
		// eslint-disable-next-line no-console
		console.log('\nNo PRD mappings found.');
		// eslint-disable-next-line no-console
		console.log('Edit .planning/teamwork-mapping.json to add PRD mappings.\n');
		return { success: 0, errors: 0, skipped: 0 };
	}

	// eslint-disable-next-line no-console
	console.log(`Found ${mappings.length} PRD(s) to process.\n`);

	let successCount = 0;
	let errorCount = 0;
	let skippedCount = 0;

	// eslint-disable-next-line no-await-in-loop
	for (let i = 0; i < mappings.length; i++) {
		const mapping = mappings[i];
		const { prdPath, teamworkTaskId } = mapping;

		if (mapping._skipReason === 'file_not_found') {
			// eslint-disable-next-line no-console
			console.log(`[${i + 1}/${mappings.length}] Skipping (file not found): ${prdPath}\n`);
			skippedCount++;
			// eslint-disable-next-line no-continue
			continue;
		}

		if (!teamworkTaskId && !canCreateTasks) {
			// eslint-disable-next-line no-console
			console.log(
				`[${i + 1}/${mappings.length}] Skipping unmapped PRD: ${prdPath}\n  (Set TEAMWORK_TASKLIST_ID to enable task creation)\n`,
			);
			skippedCount++;
			// eslint-disable-next-line no-continue
			continue;
		}

		// eslint-disable-next-line no-console
		console.log(`[${i + 1}/${mappings.length}] Processing: ${prdPath}`);

		try {
			// eslint-disable-next-line no-await-in-loop
			const content = await readPRDContent(prdPath);
			// eslint-disable-next-line no-await-in-loop
			const prdData = matter(await readFile(prdPath, 'utf-8'));
			const taskName = prdData.data.title || path.basename(prdPath, '.prd.md');

			if (!teamworkTaskId) {
				// eslint-disable-next-line no-console
				console.log(`  Creating new task in tasklist ${TEAMWORK_TASKLIST_ID}...`);
				// eslint-disable-next-line no-await-in-loop
				const task = await createTeamworkTask(TEAMWORK_TASKLIST_ID, taskName, content);
				mapping.teamworkTaskId = task.id;
				mapping.status = 'synced';
				mapping.lastSynced = new Date().toISOString();
				// eslint-disable-next-line no-console
				console.log(`  Created task ID: ${task.id}`);
				// eslint-disable-next-line no-console
				console.log('  Success\n');
				successCount++;
			} else {
				// eslint-disable-next-line no-console
				console.log(`  Updating task ${teamworkTaskId}...`);
				// eslint-disable-next-line no-await-in-loop
				await updateTeamworkTask(teamworkTaskId, content);
				mapping.status = 'synced';
				mapping.lastSynced = new Date().toISOString();
				// eslint-disable-next-line no-console
				console.log('  Success\n');
				successCount++;
			}

			// Save after each successful operation
			// eslint-disable-next-line no-await-in-loop
			await updateMappingStatus(mappingData);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(`  Failed: ${error.message}\n`);
			mapping.status = 'error';
			mapping.lastSynced = new Date().toISOString();
			// eslint-disable-next-line no-await-in-loop
			await updateMappingStatus(mappingData);
			errorCount++;
		}

		if (i < mappings.length - 1) {
			// eslint-disable-next-line no-await-in-loop
			await sleep(RATE_LIMIT_DELAY);
		}
	}

	return { success: successCount, errors: errorCount, skipped: skippedCount };
}

/**
 * Process hierarchical mappings (version 2.0)
 *
 * @param {object} mappingData - The mapping data
 * @returns {Promise<object>} Results object with success, errors, and skipped counts
 */
async function syncHierarchicalMappings(mappingData) {
	const { TEAMWORK_PROJECT_ID } = process.env;
	const projectId = mappingData.projectId || TEAMWORK_PROJECT_ID;

	if (!projectId) {
		// eslint-disable-next-line no-console
		console.error('ERROR: TEAMWORK_PROJECT_ID required for hierarchical sync\n');
		// eslint-disable-next-line no-console
		console.error('Set TEAMWORK_PROJECT_ID in .env or projectId in mapping file.\n');
		process.exit(1);
	}

	// eslint-disable-next-line no-console
	console.log(`Hierarchical sync mode (project: ${projectId})\n`);

	// Get existing tasklists for deduplication
	let existingTasklists = [];
	try {
		// eslint-disable-next-line no-console
		console.log('Fetching existing tasklists...');
		existingTasklists = await getTeamworkTasklists(projectId);
		// eslint-disable-next-line no-console
		console.log(`Found ${existingTasklists.length} existing tasklist(s)\n`);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log(`  Warning: Could not fetch tasklists: ${error.message}`);
		// eslint-disable-next-line no-console
		console.log('  Will create new tasklists without deduplication\n');
	}

	let successCount = 0;
	let errorCount = 0;
	let skippedCount = 0;

	const domains = mappingData.domains || {};
	const domainSlugs = Object.keys(domains);

	if (domainSlugs.length === 0) {
		// eslint-disable-next-line no-console
		console.log('\nNo domains found in mapping.');
		// eslint-disable-next-line no-console
		console.log('Run with --discover to populate from requirements/ directory.\n');
		return { success: 0, errors: 0, skipped: 0 };
	}

	for (const domainSlug of domainSlugs) {
		const domain = domains[domainSlug];
		// eslint-disable-next-line no-console
		console.log(`\nProcessing domain: ${domain.name}`);

		// Create/get tasklist for domain
		if (!domain.teamworkTasklistId) {
			// Check if tasklist already exists by name
			const existing = existingTasklists.find(
				(tl) => tl.name.toLowerCase() === domain.name.toLowerCase(),
			);

			if (existing) {
				domain.teamworkTasklistId = existing.id;
				domain.status = 'synced';
				// eslint-disable-next-line no-console
				console.log(`  Found existing tasklist: ${existing.id}`);
				// eslint-disable-next-line no-await-in-loop
				await updateMappingStatus(mappingData);
			} else {
				try {
					// eslint-disable-next-line no-console
					console.log(`  Creating tasklist: ${domain.name}...`);
					// eslint-disable-next-line no-await-in-loop
					await sleep(RATE_LIMIT_DELAY);
					// eslint-disable-next-line no-await-in-loop
					const tasklist = await createTeamworkTasklist(projectId, domain.name);
					domain.teamworkTasklistId = tasklist.id;
					domain.status = 'synced';
					// eslint-disable-next-line no-console
					console.log(`  Created tasklist ID: ${tasklist.id}`);
					// eslint-disable-next-line no-await-in-loop
					await updateMappingStatus(mappingData);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(`  Failed to create tasklist: ${error.message}`);
					domain.status = 'error';
					// eslint-disable-next-line no-await-in-loop
					await updateMappingStatus(mappingData);
					errorCount++;
					// eslint-disable-next-line no-continue
					continue; // Skip this domain's epics and PRDs
				}
			}
		} else {
			// eslint-disable-next-line no-console
			console.log(`  Using tasklist: ${domain.teamworkTasklistId}`);
		}

		const tasklistId = domain.teamworkTasklistId;
		const epics = domain.epics || {};
		const epicSlugs = Object.keys(epics);

		for (const epicSlug of epicSlugs) {
			const epic = epics[epicSlug];
			// eslint-disable-next-line no-console
			console.log(`  Processing epic: ${epic.name}`);

			// Create parent task for epic
			if (!epic.teamworkTaskId) {
				try {
					// eslint-disable-next-line no-console
					console.log(`    Creating parent task: ${epic.name}...`);
					// eslint-disable-next-line no-await-in-loop
					await sleep(RATE_LIMIT_DELAY);
					const epicDescription = `Epic: ${epic.name}\nPath: ${epic.path}`;
					// eslint-disable-next-line no-await-in-loop
					const task = await createTeamworkTask(tasklistId, epic.name, epicDescription);
					epic.teamworkTaskId = task.id;
					epic.status = 'synced';
					// eslint-disable-next-line no-console
					console.log(`    Created task ID: ${task.id}`);
					// eslint-disable-next-line no-await-in-loop
					await updateMappingStatus(mappingData);
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(`    Failed to create epic task: ${error.message}`);
					epic.status = 'error';
					// eslint-disable-next-line no-await-in-loop
					await updateMappingStatus(mappingData);
					errorCount++;
					// eslint-disable-next-line no-continue
					continue; // Skip this epic's PRDs
				}
			} else {
				// eslint-disable-next-line no-console
				console.log(`    Using parent task: ${epic.teamworkTaskId}`);
			}

			const parentTaskId = epic.teamworkTaskId;
			const prds = epic.prds || {};
			const prdSlugs = Object.keys(prds);
			let prdIndex = 0;

			// eslint-disable-next-line no-await-in-loop
			for (const prdSlug of prdSlugs) {
				const prd = prds[prdSlug];
				prdIndex++;

				if (prd._skipReason === 'file_not_found') {
					// eslint-disable-next-line no-console
					console.log(
						`    [${prdIndex}/${prdSlugs.length}] Skipping (file not found): ${prd.name}`,
					);
					skippedCount++;
					// eslint-disable-next-line no-continue
					continue;
				}

				try {
					// eslint-disable-next-line no-await-in-loop
					const content = await readPRDContent(prd.path);

					if (!prd.teamworkTaskId) {
						// Create subtask
						// eslint-disable-next-line no-console
						console.log(
							`    [${prdIndex}/${prdSlugs.length}] Creating subtask: ${prd.name}`,
						);
						// eslint-disable-next-line no-await-in-loop
						await sleep(RATE_LIMIT_DELAY);
						// eslint-disable-next-line no-await-in-loop
						const subtask = await createTeamworkSubtask(
							tasklistId,
							parentTaskId,
							prd.name,
							content,
						);
						prd.teamworkTaskId = subtask.id;
						prd.status = 'synced';
						prd.lastSynced = new Date().toISOString();
						// eslint-disable-next-line no-console
						console.log(`    Success - subtask ID: ${subtask.id}`);
						// eslint-disable-next-line no-await-in-loop
						await updateMappingStatus(mappingData);
						successCount++;
					} else {
						// Update existing subtask
						// eslint-disable-next-line no-console
						console.log(
							`    [${prdIndex}/${prdSlugs.length}] Updating subtask: ${prd.name}`,
						);
						// eslint-disable-next-line no-await-in-loop
						await sleep(RATE_LIMIT_DELAY);
						// eslint-disable-next-line no-await-in-loop
						await updateTeamworkTask(prd.teamworkTaskId, content);
						prd.status = 'synced';
						prd.lastSynced = new Date().toISOString();
						// eslint-disable-next-line no-console
						console.log(`    Success`);
						// eslint-disable-next-line no-await-in-loop
						await updateMappingStatus(mappingData);
						successCount++;
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error(`    Failed: ${error.message}`);
					prd.status = 'error';
					prd.lastSynced = new Date().toISOString();
					// eslint-disable-next-line no-await-in-loop
					await updateMappingStatus(mappingData);
					errorCount++;
				}
			}
		}
	}

	return { success: successCount, errors: errorCount, skipped: skippedCount };
}

/**
 * Convert slug to human-readable name
 *
 * @param {string} slug - The slug to convert
 * @returns {string} The humanized name
 */
function humanize(slug) {
	return slug
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Get title from index.md or PRD frontmatter
 *
 * @param {string} filePath - The file path
 * @returns {Promise<string|null>} The title or null
 */
async function getTitleFromFile(filePath) {
	try {
		if (!existsSync(filePath)) {
			return null;
		}
		const content = await readFile(filePath, 'utf-8');
		const { data } = matter(content);
		return data.title || null;
	} catch {
		return null;
	}
}

/**
 * Discover requirements structure and build/update mapping file
 *
 * @returns {Promise<void>}
 */
async function discoverRequirements() {
	// eslint-disable-next-line no-console
	console.log('\n========================================');
	// eslint-disable-next-line no-console
	console.log('  Teamwork PRD Sync - Discovery Mode');
	// eslint-disable-next-line no-console
	console.log('========================================\n');

	// eslint-disable-next-line no-console
	console.log('Discovering requirements structure...\n');

	// Load existing mapping if present (to preserve Teamwork IDs)
	let existingMapping = { domains: {}, legacyMappings: [] };
	if (existsSync(MAPPING_FILE)) {
		try {
			const content = await readFile(MAPPING_FILE, 'utf-8');
			existingMapping = JSON.parse(content);
			// eslint-disable-next-line no-console
			console.log('Found existing mapping file - will preserve Teamwork IDs\n');
		} catch (error) {
			// eslint-disable-next-line no-console
			console.log('Warning: Could not parse existing mapping file\n');
		}
	}

	// Build new mapping structure
	const newMapping = {
		version: '2.0',
		description: 'Hierarchical mapping of requirements structure to Teamwork entities',
		projectId: existingMapping.projectId || null,
		lastUpdated: new Date().toISOString(),
		domains: {},
		legacyMappings: existingMapping.legacyMappings || [],
	};

	// Check if requirements directory exists
	if (!existsSync(REQUIREMENTS_DIR)) {
		// eslint-disable-next-line no-console
		console.error(`ERROR: Requirements directory not found: ${REQUIREMENTS_DIR}\n`);
		process.exit(1);
	}

	// Scan requirements directory for domains
	const domainEntries = await readdir(REQUIREMENTS_DIR, { withFileTypes: true });
	const domainFolders = domainEntries.filter(
		(entry) => entry.isDirectory() && !entry.name.startsWith('.'),
	);

	let domainCount = 0;
	let epicCount = 0;
	let prdCount = 0;

	// eslint-disable-next-line no-await-in-loop
	for (const domainEntry of domainFolders) {
		const domainSlug = domainEntry.name;
		const domainPath = path.join(REQUIREMENTS_DIR, domainSlug);
		const domainIndexPath = path.join(domainPath, 'index.md');

		// Get domain name from index.md or humanize slug
		// eslint-disable-next-line no-await-in-loop
		const domainTitle = (await getTitleFromFile(domainIndexPath)) || humanize(domainSlug);

		// Preserve existing Teamwork IDs
		const existingDomain = existingMapping.domains?.[domainSlug] || {};

		const domain = {
			name: domainTitle,
			path: domainPath,
			teamworkTasklistId: existingDomain.teamworkTasklistId || null,
			status: existingDomain.teamworkTasklistId ? 'synced' : 'unmapped',
			epics: {},
		};

		// Scan domain directory for epics (subdirectories)
		// eslint-disable-next-line no-await-in-loop
		const epicEntries = await readdir(domainPath, { withFileTypes: true });
		const epicFolders = epicEntries.filter(
			(entry) => entry.isDirectory() && !entry.name.startsWith('.'),
		);

		let domainPrdCount = 0;

		// eslint-disable-next-line no-await-in-loop
		for (const epicEntry of epicFolders) {
			const epicSlug = epicEntry.name;
			const epicPath = path.join(domainPath, epicSlug);
			const epicIndexPath = path.join(epicPath, 'index.md');

			// Get epic name from index.md or humanize slug
			// eslint-disable-next-line no-await-in-loop
			const epicTitle = (await getTitleFromFile(epicIndexPath)) || humanize(epicSlug);

			// Preserve existing Teamwork IDs
			const existingEpic = existingDomain.epics?.[epicSlug] || {};

			const epic = {
				name: epicTitle,
				path: epicPath,
				teamworkTaskId: existingEpic.teamworkTaskId || null,
				status: existingEpic.teamworkTaskId ? 'synced' : 'unmapped',
				prds: {},
			};

			// Scan epic directory for PRD files (*.prd.md)
			// eslint-disable-next-line no-await-in-loop
			const prdEntries = await readdir(epicPath, { withFileTypes: true });
			const prdFiles = prdEntries.filter(
				(entry) => entry.isFile() && entry.name.endsWith('.prd.md'),
			);

			// eslint-disable-next-line no-await-in-loop
			for (const prdEntry of prdFiles) {
				const prdFilename = prdEntry.name;
				const prdSlug = prdFilename.replace('.prd.md', '');
				const prdPath = path.join(epicPath, prdFilename);

				// Get PRD name from frontmatter
				// eslint-disable-next-line no-await-in-loop
				const prdTitle = (await getTitleFromFile(prdPath)) || humanize(prdSlug);

				// Preserve existing Teamwork IDs and sync status
				const existingPrd = existingEpic.prds?.[prdSlug] || {};

				epic.prds[prdSlug] = {
					name: prdTitle,
					path: prdPath,
					teamworkTaskId: existingPrd.teamworkTaskId || null,
					status: existingPrd.teamworkTaskId
						? existingPrd.status || 'synced'
						: 'unmapped',
					lastSynced: existingPrd.lastSynced || null,
				};

				prdCount++;
				domainPrdCount++;
			}

			if (Object.keys(epic.prds).length > 0) {
				domain.epics[epicSlug] = epic;
				epicCount++;
			}
		}

		if (Object.keys(domain.epics).length > 0) {
			newMapping.domains[domainSlug] = domain;
			domainCount++;
			// eslint-disable-next-line no-console
			console.log(
				`  - ${domainTitle} (${Object.keys(domain.epics).length} epic(s), ${domainPrdCount} PRD(s))`,
			);
		}
	}

	// Write mapping file
	await writeFile(MAPPING_FILE, `${JSON.stringify(newMapping, null, 2)}\n`, 'utf-8');

	// eslint-disable-next-line no-console
	console.log(`\nFound ${domainCount} domain(s), ${epicCount} epic(s), ${prdCount} PRD(s)`);
	// eslint-disable-next-line no-console
	console.log(`\nUpdated ${MAPPING_FILE}\n`);
}

/**
 * Main execution
 *
 * @returns {Promise<void>}
 */
async function main() {
	// eslint-disable-next-line no-console
	console.log('\n========================================');
	// eslint-disable-next-line no-console
	console.log('  Teamwork PRD Sync Tool');
	// eslint-disable-next-line no-console
	console.log('========================================\n');

	// Validate environment
	const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

	if (!TEAMWORK_API_TOKEN || !TEAMWORK_SITE_NAME) {
		// eslint-disable-next-line no-console
		console.error('ERROR: Missing required environment variables\n');
		// eslint-disable-next-line no-console
		console.error('Please create a .env file with:');
		// eslint-disable-next-line no-console
		console.error('  TEAMWORK_API_TOKEN=your-api-token');
		// eslint-disable-next-line no-console
		console.error('  TEAMWORK_SITE_NAME=yourcompany\n');
		// eslint-disable-next-line no-console
		console.error('See .env.example for details.\n');
		process.exit(1);
	}

	// Load mappings
	// eslint-disable-next-line no-console
	console.log('Loading mappings...');
	const mappingData = await loadMappings();
	const version = mappingData.version || '1.0';

	// eslint-disable-next-line no-console
	console.log(`Mapping version: ${version}\n`);

	let results;

	if (version === '2.0') {
		// Hierarchical sync
		results = await syncHierarchicalMappings(mappingData);
	} else {
		// Legacy flat sync
		results = await syncLegacyMappings(mappingData);
	}

	// Print summary
	// eslint-disable-next-line no-console
	console.log('\n========================================');
	// eslint-disable-next-line no-console
	console.log('  Sync Complete');
	// eslint-disable-next-line no-console
	console.log('========================================');
	// eslint-disable-next-line no-console
	console.log(`Success: ${results.success}`);
	// eslint-disable-next-line no-console
	console.log(`Skipped: ${results.skipped}`);
	// eslint-disable-next-line no-console
	console.log(`Errors:  ${results.errors}\n`);

	if (results.errors > 0) {
		process.exit(1);
	}
}

// Check for --discover flag
const args = process.argv.slice(2);
const isDiscoverMode = args.includes('--discover');

// Run appropriate mode with error handling
if (isDiscoverMode) {
	discoverRequirements().catch((error) => {
		// eslint-disable-next-line no-console
		console.error('\nFATAL ERROR:', error.message);
		// eslint-disable-next-line no-console
		console.error(error.stack);
		process.exit(1);
	});
} else {
	main().catch((error) => {
		// eslint-disable-next-line no-console
		console.error('\nFATAL ERROR:', error.message);
		// eslint-disable-next-line no-console
		console.error(error.stack);
		process.exit(1);
	});
}
