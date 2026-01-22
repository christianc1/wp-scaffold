#!/usr/bin/env node

import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { existsSync } from 'fs';

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

  // Filter to only mappings with valid task IDs
  const validMappings = data.mappings.filter((m) => {
    if (!m.teamworkTaskId) {
      console.log(`  Skipping unmapped PRD: ${m.prdPath}`);
      return false;
    }

    // Validate PRD file exists
    if (!existsSync(m.prdPath)) {
      console.log(`  Warning: PRD file not found: ${m.prdPath}`);
      return false;
    }

    return true;
  });

  return {
    ...data,
    mappings: validMappings,
  };
}

/**
 * Update mapping file with sync status
 */
async function updateMappingStatus(mappingData) {
  mappingData.lastUpdated = new Date().toISOString();
  await writeFile(MAPPING_FILE, JSON.stringify(mappingData, null, 2) + '\n', 'utf-8');
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
  const { TEAMWORK_API_TOKEN, TEAMWORK_SITE_NAME } = process.env;

  if (!TEAMWORK_API_TOKEN || !TEAMWORK_SITE_NAME) {
    console.error('ERROR: Missing required environment variables\n');
    console.error('Please create a .env file with:');
    console.error('  TEAMWORK_API_TOKEN=your-api-token');
    console.error('  TEAMWORK_SITE_NAME=yourcompany\n');
    console.error('See .env.example for details.\n');
    process.exit(1);
  }

  // Load mappings
  console.log('Loading mappings...');
  const mappingData = await loadMappings();

  if (mappingData.mappings.length === 0) {
    console.log('\nNo mappings with valid task IDs to sync.');
    console.log('Edit .planning/teamwork-mapping.json to add task IDs.\n');
    process.exit(0);
  }

  console.log(`Found ${mappingData.mappings.length} PRD(s) to sync.\n`);

  // Track results
  let successCount = 0;
  let errorCount = 0;

  // Process each mapping
  for (let i = 0; i < mappingData.mappings.length; i++) {
    const mapping = mappingData.mappings[i];
    const { prdPath, teamworkTaskId } = mapping;

    console.log(`[${i + 1}/${mappingData.mappings.length}] Syncing: ${prdPath}`);
    console.log(`  Task ID: ${teamworkTaskId}`);

    try {
      // Read PRD content
      const content = await readPRDContent(prdPath);

      // Update Teamwork task
      await updateTeamworkTask(teamworkTaskId, content);

      // Update mapping status
      mapping.status = 'synced';
      mapping.lastSynced = new Date().toISOString();

      console.log('  ✓ Success\n');
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}\n`);

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
