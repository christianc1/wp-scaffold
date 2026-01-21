import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Layout slots ready for Plan 02 components
      // 'doc-top': () => [h(Breadcrumbs), h(PrdMetadata)]
    })
  }
} satisfies Theme
