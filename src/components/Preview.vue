<script setup lang="ts">
import { computed, watch, nextTick, onMounted } from 'vue'
import { useEditorStore } from '../store/editor'
import { marked } from 'marked'
import hljs from 'highlight.js'

const store = useEditorStore()

const renderer = new marked.Renderer()

renderer.code = function (code: string, language: string | undefined) {
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext'
  const highlighted = hljs.highlight(code, { language: validLanguage }).value
  return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`
}

renderer.listitem = function (text: string, task: boolean, checked: boolean) {
  if (task) {
    const checkboxHtml = `<input type="checkbox" class="task-checkbox" ${checked ? 'checked' : ''} style="cursor: pointer; margin-right: 8px;">`
    return `<li class="task-list-item" style="list-style: none; display: flex; align-items: flex-start;">
      ${checkboxHtml}
      <span>${text}</span>
    </li>`
  }
  return `<li>${text}</li>`
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
  headerIds: true
})

const renderedContent = computed(() => {
  return marked(store.content) as string
})

function handleCheckboxChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.classList.contains('task-checkbox')) {
    const previewDiv = document.querySelector('.preview-content')
    if (!previewDiv) return
    
    const checkboxes = previewDiv.querySelectorAll('.task-checkbox')
    const checkboxIndex = Array.from(checkboxes).indexOf(target)
    
    if (checkboxIndex === -1) return
    
    const lines = store.content.split('\n')
    let taskCount = 0
    
    for (let i = 0; i < lines.length; i++) {
      const taskMatch = lines[i].match(/^(\s*)([-*]|\d+\.)(\s+)\[([ xX])\](\s+)/)
      if (taskMatch) {
        if (taskCount === checkboxIndex) {
          const newChecked = target.checked ? 'x' : ' '
          lines[i] = lines[i].replace(/\[([ xX])\]/, `[${newChecked}]`)
          store.setContent(lines.join('\n'))
          break
        }
        taskCount++
      }
    }
  }
}

function bindCheckboxes() {
  nextTick(() => {
    const previewDiv = document.querySelector('.preview-content')
    if (previewDiv) {
      const checkboxes = previewDiv.querySelectorAll('.task-checkbox')
      checkboxes.forEach(checkbox => {
        checkbox.removeEventListener('change', handleCheckboxChange)
        checkbox.addEventListener('change', handleCheckboxChange)
      })
    }
  })
}

watch(renderedContent, bindCheckboxes)

onMounted(() => {
  bindCheckboxes()
})
</script>

<template>
  <div class="preview-container">
    <div class="preview-header">
      <span class="header-label">预览</span>
    </div>
    <div 
      class="preview-content"
      v-html="renderedContent"
    />
  </div>
</template>

<style scoped>
.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.header-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.preview-content {
  flex: 1;
  padding: 20px 30px;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.preview-content :deep(li) {
  margin: 0.25em 0;
}

.preview-content :deep(.task-list-item) {
  margin-left: -2em;
  padding-left: 0;
}

.preview-content :deep(.task-list-item input[type="checkbox"]) {
  flex-shrink: 0;
  margin-top: 4px;
}

.preview-content :deep(h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 0.67em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-color);
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1em 0 0.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-color);
}

.preview-content :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.preview-content :deep(h4) {
  font-size: 1em;
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.preview-content :deep(h5) {
  font-size: 0.875em;
  font-weight: 600;
  margin: 1em 0 0.5em;
}

.preview-content :deep(h6) {
  font-size: 0.85em;
  font-weight: 600;
  margin: 1em 0 0.5em;
  color: var(--text-secondary);
}

.preview-content :deep(p) {
  margin: 1em 0;
}

.preview-content :deep(a) {
  color: var(--accent-color);
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(pre) {
  margin: 1em 0;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  background-color: var(--bg-secondary);
}

.preview-content :deep(code) {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

.preview-content :deep(:not(pre) > code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--bg-secondary);
  border-radius: 3px;
}

.preview-content :deep(blockquote) {
  margin: 1em 0;
  padding: 0 1em;
  border-left: 4px solid var(--border-color);
  color: var(--text-secondary);
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 6px 13px;
  border: 1px solid var(--border-color);
}

.preview-content :deep(th) {
  font-weight: 600;
  background-color: var(--bg-secondary);
}

.preview-content :deep(tr:nth-child(even)) {
  background-color: var(--bg-tertiary);
}

.preview-content :deep(hr) {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid var(--border-color);
}

.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
