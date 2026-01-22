#!/usr/bin/env node

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { existsSync } from 'fs';
import path from 'path';

// Configuration constants
const MAPPING_FILE = '.planning/teamwork-mapping.json';
const RATE_LIMIT_DELAY = 400; // ms (150 req/min = ~400ms between)
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

/**
 * Fetch with timeout using AbortController
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
 */
async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
            delay = Math.pow(2, attempt) * 1000;
          }

          console.log(`  Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`  Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  throw lastError;
}

/**
 * Update a Teamwork task description via PATCH
 */
async function updateTeamworkTask(taskId, content) {
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasks/${taskId}.json`;
  const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

  const options = {
    method: 'PATCH',
    headers: {
      'Authorization': `Basic ${auth}`,
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
 */
async function getTeamworkTasklists(projectId) {
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/projects/${projectId}/tasklists.json`;
  const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
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
 */
async function createTeamworkTasklist(projectId, name) {
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/projects/${projectId}/tasklists.json`;
  const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasklist: {
        name: name,
      },
    }),
  };

  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  // API returns { tasklist: { id: 12345, ... } }
  return data.tasklist;
}

/**
 * Create a new Teamwork subtask via POST (task with parentTaskId)
 */
async function createTeamworkSubtask(tasklistId, parentTaskId, name, content) {
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasklists/${tasklistId}/tasks.json`;
  const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: {
        name: name,
        description: content,
        descriptionContentType: 'TEXT',
        parentTaskId: parentTaskId,
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
 */
async function createTeamworkTask(tasklistId, name, content) {
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  const url = `https://${TEAMWORK_SITE_NAME}.teamwork.com/projects/api/v3/tasklists/${tasklistId}/tasks.json`;
  const auth = Buffer.from(`${TEAMWORK_API_TOKEN}:xxx`).toString('base64');

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: {
        name: name,
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
 */
async function loadMappings() {
  if (!existsSync(MAPPING_FILE)) {
    throw new Error(`Mapping file not found: ${MAPPING_FILE}`);
  }

  const content = await readFile(MAPPING_FILE, 'utf-8');
  const data = JSON.parse(content);

  // Validate PRD files exist for all mappings
  for (const mapping of data.mappings) {
    if (!existsSync(mapping.prdPath)) {
      console.log(`  Warning: PRD file not found: ${mapping.prdPath}`);
      mapping._skipReason = 'file_not_found';
    }
  }

  return data;
}

/**
 * Update mapping file with sync status
 */
async function updateMappingStatus(mappingData) {
  // Clean up internal fields before saving
  const cleanMappings = mappingData.mappings.map((m) => {
    const { _skipReason, ...clean } = m;
    return clean;
  });

  const output = {
    ...mappingData,
    mappings: cleanMappings,
    lastUpdated: new Date().toISOString(),
  };

  await writeFile(MAPPING_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
}

/**
 * Sleep for rate limiting
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('\n========================================');
  console.log('  Teamwork PRD Sync Tool');
  console.log('========================================\n');

  // Validate environment
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME, TEAMWORK_TASKLIST_ID } = process.env;

  if (!TEAMWORK_API_TOKEN || !TEAMWORK_SITE_NAME) {
    console.error('ERROR: Missing required environment variables\n');
    console.error('Please create a .env file with:');
    console.error('  TEAMWORK_API_TOKEN=your-api-token');
    console.error('  TEAMWORK_SITE_NAME=yourcompany\n');
    console.error('See .env.example for details.\n');
    process.exit(1);
  }

  // Check if task creation is enabled
  const canCreateTasks = Boolean(TEAMWORK_TASKLIST_ID);

  if (!canCreateTasks) {
    console.log('Note: TEAMWORK_TASKLIST_ID not set - will only update existing tasks\n');
  } else {
    console.log(`Task creation enabled (tasklist: ${TEAMWORK_TASKLIST_ID})\n`);
  }

  // Load mappings
  console.log('Loading mappings...');
  const mappingData = await loadMappings();

  if (mappingData.mappings.length === 0) {
    console.log('\nNo PRD mappings found.');
    console.log('Edit .planning/teamwork-mapping.json to add PRD mappings.\n');
    process.exit(0);
  }

  console.log(`Found ${mappingData.mappings.length} PRD(s) to process.\n`);

  // Track results
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Process each mapping
  for (let i = 0; i < mappingData.mappings.length; i++) {
    const mapping = mappingData.mappings[i];
    const { prdPath, teamworkTaskId } = mapping;

    // Skip if file not found
    if (mapping._skipReason === 'file_not_found') {
      console.log(`[${i + 1}/${mappingData.mappings.length}] Skipping (file not found): ${prdPath}\n`);
      skippedCount++;
      continue;
    }

    // Skip unmapped PRDs if we can't create tasks
    if (!teamworkTaskId && !canCreateTasks) {
      console.log(`[${i + 1}/${mappingData.mappings.length}] Skipping unmapped PRD: ${prdPath}`);
      console.log('  (Set TEAMWORK_TASKLIST_ID to enable task creation)\n');
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${mappingData.mappings.length}] Processing: ${prdPath}`);

    try {
      // Read PRD content
      const content = await readPRDContent(prdPath);
      const prdData = matter(await readFile(prdPath, 'utf-8'));
      const taskName = prdData.data.title || path.basename(prdPath, '.prd.md');

      if (!teamworkTaskId) {
        // CREATE new task
        console.log(`  Creating new task in tasklist ${TEAMWORK_TASKLIST_ID}...`);
        const task = await createTeamworkTask(TEAMWORK_TASKLIST_ID, taskName, content);
        mapping.teamworkTaskId = task.id;
        mapping.status = 'synced';
        mapping.lastSynced = new Date().toISOString();
        console.log(`  Created task ID: ${task.id}`);
        console.log('  Success\n');
        successCount++;
      } else {
        // UPDATE existing task
        console.log(`  Updating task ${teamworkTaskId}...`);
        await updateTeamworkTask(teamworkTaskId, content);
        mapping.status = 'synced';
        mapping.lastSynced = new Date().toISOString();
        console.log('  Success\n');
        successCount++;
      }
    } catch (error) {
      console.error(`  Failed: ${error.message}\n`);

      // Update mapping status
      mapping.status = 'error';
      mapping.lastSynced = new Date().toISOString();

      errorCount++;
    }

    // Rate limiting (except after last request)
    if (i < mappingData.mappings.length - 1) {
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  // Write updated mapping file
  await updateMappingStatus(mappingData);

  // Print summary
  console.log('========================================');
  console.log('  Sync Complete');
  console.log('========================================');
  console.log(`Success: ${successCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Errors:  ${errorCount}\n`);

  // Exit with error code if any failures
  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run main with error handling
main().catch((error) => {
  console.error('\nFATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
