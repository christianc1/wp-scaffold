import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import PrdMetadata from './components/PrdMetadata.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-top': () => [h(Breadcrumbs), h(PrdMetadata)]
    })
  }
} satisfies Theme
