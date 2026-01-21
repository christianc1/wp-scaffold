import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'

const vitepressOptions = {
  title: 'PRD Documentation',
  description: 'Product Requirements Documents',
  srcDir: 'requirements',
  outDir: '.vitepress/dist',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Requirements', link: '/information-architecture/' }
    ],
    search: {
      provider: 'local'
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
