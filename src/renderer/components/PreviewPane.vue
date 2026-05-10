<template>
  <div class="preview-pane" @click="handleClick">
    <div class="preview-content" v-html="renderedHtml"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Marked } from 'marked'
import hljs from 'highlight.js'
import '../styles/highlight.css'
import '../styles/preview.css'

const props = defineProps<{
  content: string
  filePath: string | null
}>()

const emit = defineEmits<{
  toggleTask: [lineIndex: number]
}>()

const taskLineMap: Record<number, number> = {}
let renderTaskIdx = 0

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    listitem(body: string, task: boolean, checked: boolean) {
      if (task) {
        const cleanBody = body.replace(/<input[^>]*type="checkbox"[^>]*>\s*/i, '')
        const idx = renderTaskIdx
        renderTaskIdx++
        const checkbox = `<input type="checkbox" ${checked ? 'checked' : ''} data-task="true" data-line="${idx}" />`
        return `<li class="task-list-item">${checkbox}${cleanBody}</li>\n`
      }
      return `<li>${body}</li>\n`
    }
  }
} as any)

marked.use({
  extensions: [
    {
      name: 'code',
      renderer({ text, lang }: { text: string; lang?: string }) {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
        const highlighted = hljs.highlight(text, { language }).value
        return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
      }
    }
  ]
} as any)

const renderedHtml = computed(() => {
  try {
    const source = props.content || ''
    const lines = source.split('\n')
    let mapIdx = 0
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*[-*+]\s+\[[ xX]\]/.test(lines[i])) {
        taskLineMap[mapIdx] = i
        mapIdx++
      }
    }
    renderTaskIdx = 0
    return marked.parse(source) as string
  } catch {
    return '<p>渲染出错</p>'
  }
})

function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' && target.getAttribute('data-task') === 'true') {
    const lineAttr = target.getAttribute('data-line')
    if (lineAttr === null) return
    const taskIdx = parseInt(lineAttr, 10)
    const lineIndex = taskLineMap[taskIdx]
    if (lineIndex !== undefined) {
      emit('toggleTask', lineIndex)
    }
  }
}
</script>

<style scoped>
.preview-pane {
  flex: 1;
  min-width: 200px;
  overflow-y: auto;
  background: var(--bg-preview);
  border-left: none;
}
</style>
