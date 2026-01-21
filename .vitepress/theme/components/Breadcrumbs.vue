<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'

const { frontmatter } = useData()
const route = useRoute()

interface Breadcrumb {
  text: string
  link: string
}

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = [{ text: 'Home', link: '/' }]

  if (frontmatter.value.domain) {
    crumbs.push({
      text: frontmatter.value.domain,
      link: '#'
    })
  }

  if (frontmatter.value.epic) {
    crumbs.push({
      text: frontmatter.value.epic,
      link: '#'
    })
  }

  if (frontmatter.value.title) {
    crumbs.push({
      text: frontmatter.value.title,
      link: route.path
    })
  }

  return crumbs
})

const hasBreadcrumbs = computed(() => breadcrumbs.value.length > 1)
</script>

<template>
  <nav v-if="hasBreadcrumbs" class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li v-for="(crumb, index) in breadcrumbs" :key="crumb.link + index">
        <a v-if="index < breadcrumbs.length - 1" :href="crumb.link">
          {{ crumb.text }}
        </a>
        <span v-else class="current">{{ crumb.text }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="separator">></span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.breadcrumbs ol {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.breadcrumbs li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breadcrumbs a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.breadcrumbs a:hover {
  color: var(--vp-c-brand-2);
}

.breadcrumbs .current {
  color: var(--vp-c-text-1);
}

.separator {
  color: var(--vp-c-text-3);
}
</style>
