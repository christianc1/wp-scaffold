import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

const vitepressOptions = {
  title: pkg.description || 'PRD Documentation',
  description: 'Product Requirements Documents',
  srcDir: 'requirements',
  outDir: '.vitepress/dist',

  markdown: {
    theme: 'one-dark-pro',
    lineNumbers: true
  },

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Requirements', link: '/information-architecture/' },
      { text: 'GitHub', link: 'https://github.com/org/repo' },
      { text: 'Teamwork', link: 'https://teamwork.com/project' }
    ],
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 }
          }
        },
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter) {
            const fm = env.frontmatter
            const metadata = [fm.domain, fm.epic, ...(fm.dependencies || [])].filter(Boolean).join(' ')
            return html + `<div style="display:none">${metadata}</div>`
          }
          return html
        }
      }
    }
  }
}

const sidebarOptions = {
  documentRootPath: '/requirements',
  useTitleFromFrontmatter: true,
  frontmatterTitleFieldName: 'title',
  collapsed: true,
  collapseDepth: 2,
  sortMenusByFrontmatterOrder: false,
  sortMenusOrderByDescending: false
}

export default defineConfig(
  withSidebar(vitepressOptions, sidebarOptions)
)
