<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

const { frontmatter } = useData()

const hasDependencies = computed(() =>
  frontmatter.value.dependencies &&
  frontmatter.value.dependencies.length > 0
)

const formatDependencyLink = (dep: string) => {
  if (dep.startsWith('/')) return dep
  return `/requirements/${dep}`
}
</script>

<template>
  <div v-if="frontmatter.domain || frontmatter.epic || hasDependencies" class="prd-metadata">
    <div class="metadata-row">
      <span v-if="frontmatter.domain" class="metadata-item">
        <strong>Domain:</strong> {{ frontmatter.domain }}
      </span>
      <span v-if="frontmatter.epic" class="metadata-item">
        <strong>Epic:</strong> {{ frontmatter.epic }}
      </span>
    </div>

    <div v-if="hasDependencies" class="metadata-row dependencies">
      <strong>Dependencies:</strong>
      <ul>
        <li v-for="dep in frontmatter.dependencies" :key="dep">
          <a :href="formatDependencyLink(dep)">{{ dep }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.prd-metadata {
  background: var(--vp-c-bg-soft);
  border-left: 3px solid var(--vp-c-brand-1);
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.metadata-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 0.5rem;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-item {
  color: var(--vp-c-text-2);
}

.metadata-item strong {
  color: var(--vp-c-text-1);
  margin-right: 0.5rem;
}

.dependencies {
  flex-direction: column;
  gap: 0.5rem;
}

.dependencies ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dependencies li {
  display: inline;
}

.dependencies a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
}

.dependencies a:hover {
  color: var(--vp-c-brand-2);
  border-bottom-color: var(--vp-c-brand-2);
}

.dependencies a.dead-link {
  color: var(--vp-c-danger-1);
  text-decoration: line-through;
}
</style>
