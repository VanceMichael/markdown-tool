<template>
  <div class="app" :data-theme="theme">
    <div class="sidebar" v-show="sidebarVisible">
      <div class="sidebar-header">
        <span class="sidebar-title">工作区</span>
        <button class="icon-btn" @click="selectWorkspace" title="选择文件夹">
          📁
        </button>
      </div>
      <div class="workspace-info" v-if="workspacePath">
        <span class="workspace-path">{{ workspacePath }}</span>
      </div>
      <div class="file-list">
        <div
          v-for="file in workspaceFiles"
          :key="file"
          class="file-item"
          :class="{ active: currentFile === joinPath(workspacePath, file) }"
          @click="openWorkspaceFile(file)"
        >
          📄 {{ file }}
        </div>
        <div v-if="workspaceFiles.length === 0 && workspacePath" class="empty-hint">
          工作区无 Markdown 文件
        </div>
        <div v-if="!workspacePath" class="empty-hint">
          点击上方按钮选择工作区文件夹
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="toolbar">
        <button class="toolbar-btn" @click="toggleSidebar" title="切换侧边栏">
          ☰
        </button>
        <span class="file-info" v-if="currentFile">
          {{ currentFile }}
          <span v-if="hasUnsaved" class="unsaved-marker">•</span>
        </span>
        <span class="file-info" v-else>未命名文件</span>
        <div class="toolbar-spacer"></div>
        <button class="toolbar-btn" @click="newFile" title="新建">新建</button>
        <button class="toolbar-btn" @click="openFile" title="打开">打开</button>
        <button class="toolbar-btn" @click="saveFile" title="保存" :class="{ primary: hasUnsaved }">保存</button>
        <button class="toolbar-btn" @click="saveAs" title="另存为">另存为</button>
        <button class="toolbar-btn" @click="toggleTheme" :title="theme === 'light' ? '切换到深色' : '切换到浅色'">
          {{ theme === 'light' ? '🌙' : '☀️' }}
        </button>
      </div>

      <div class="editor-preview">
        <div class="editor-pane">
          <textarea
            ref="editorRef"
            v-model="content"
            class="editor"
            placeholder="在此输入 Markdown..."
            @keydown="handleKeyDown"
            @paste="handlePaste"
            spellcheck="false"
          ></textarea>
        </div>
        <div class="preview-pane">
          <div class="preview-content" v-html="renderedHtml" @click="handlePreviewClick"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

function pathJoin(...parts: (string | null)[]): string | null {
  const validParts = parts.filter((p): p is string => p !== null)
  return validParts.join('/').replace(/\/+/g, '/')
}

const theme = ref<'light' | 'dark'>('light')
const sidebarVisible = ref(true)
const content = ref('# 欢迎使用 Markdown Writer\n\n这是一个本地 Markdown 写作工具。\n\n## 功能\n\n- ✅ 双栏实时预览\n- ✅ GFM 表格支持\n- ✅ 代码高亮\n- ✅ 任务列表\n\n## 任务列表示例\n\n- [ ] 未完成任务\n- [x] 已完成任务\n\n## 代码块\n\n```javascript\nfunction hello() {\n  console.log("Hello, World!");\n}\n```\n\n```python\ndef hello():\n    print("Hello, World!")\n```\n\n## 表格\n\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| A | B | C |\n| 1 | 2 | 3 |')
const originalContent = ref('')
const currentFile = ref<string | null>(null)
const workspacePath = ref<string | null>(null)
const workspaceFiles = ref<string[]>([])
const editorRef = ref<HTMLTextAreaElement | null>(null)

const hasUnsaved = computed(() => content.value !== originalContent.value)

const renderedHtml = computed(() => {
  return renderMarkdown(content.value)
})

function joinPath(dir: string | null, file: string): string | null {
  if (!dir) return null
  return pathJoin(dir, file)
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let inCodeBlock = false
  let codeLang = ''
  let codeContent = ''
  let taskListIndex = 0
  let inTaskList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const codeBlockMatch = line.match(/^```(\w*)\s*$/)

    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeLang = codeBlockMatch[1]
        codeContent = ''
      } else {
        const highlighted = codeLang && hljs.getLanguage(codeLang)
          ? hljs.highlight(codeContent, { language: codeLang }).value
          : hljs.highlightAuto(codeContent).value
        html += `<pre><code class="hljs language-${codeLang || 'text'}">${highlighted}</code></pre>\n`
        inCodeBlock = false
      }
      continue
    }

    if (inCodeBlock) {
      codeContent += line + '\n'
      continue
    }

    const taskMatch = line.match(/^(\s*)([-*])\s+\[([ x])\]\s+(.*)$/i)
    if (taskMatch) {
      if (!inTaskList) {
        html += '<ul class="task-list">\n'
        inTaskList = true
      }
      const indent = taskMatch[1]
      const checked = taskMatch[3].toLowerCase() === 'x'
      const text = taskMatch[4]
      html += `${indent}<li class="task-list-item"><input type="checkbox" data-task-index="${taskListIndex}" ${checked ? 'checked' : ''}> ${text}</li>\n`
      taskListIndex++
      continue
    } else if (inTaskList && !line.match(/^\s*([-*])\s+/)) {
      html += '</ul>\n'
      inTaskList = false
    }

    html += line + '\n'
  }

  if (inCodeBlock) {
    const highlighted = hljs.highlightAuto(codeContent).value
    html += `<pre><code class="hljs">${highlighted}</code></pre>\n`
  }

  if (inTaskList) {
    html += '</ul>\n'
  }

  marked.setOptions({
    gfm: true,
    breaks: true,
    tables: true
  })

  const result = marked.parse(html)
  return result as string
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

function getApi() {
  if (window.api) {
    return window.api
  }
  console.warn('window.api 未定义，使用模拟 API（仅用于开发调试）')
  return {
    newFile: async () => null,
    openFile: async () => null,
    openWorkspace: async () => null,
    saveAs: async () => null,
    readFile: async () => '',
    writeFile: async () => true,
    addRecentFile: async () => true,
    getRecentFiles: async () => [],
    listWorkspaceFiles: async () => [],
    confirmClose: async () => 1,
    forceClose: async () => true,
    onMenuNewFile: () => {},
    onMenuOpenFile: () => {},
    onMenuOpenWorkspace: () => {},
    onMenuSaveFile: () => {},
    onMenuSaveAs: () => {},
    onMenuOpenRecent: () => {},
    onMenuToggleTheme: () => {},
    onBeforeClose: () => {}
  }
}

const api = getApi()

async function newFile() {
  if (!await confirmDiscardChanges()) return
  currentFile.value = null
  content.value = ''
  originalContent.value = ''
}

async function openFile() {
  if (!await confirmDiscardChanges()) return
  const path = await api.openFile()
  if (path) {
    await loadFile(path)
  }
}

async function openWorkspaceFile(file: string) {
  if (!workspacePath.value) return
  if (!await confirmDiscardChanges()) return
  const fullPath = pathJoin(workspacePath.value, file)
  if (fullPath) {
    await loadFile(fullPath)
  }
}

async function loadFile(path: string) {
  try {
    const data = await api.readFile(path)
    currentFile.value = path
    content.value = data
    originalContent.value = data
    await api.addRecentFile(path)
  } catch (e) {
    console.error('Failed to load file:', e)
  }
}

async function saveFile() {
  if (!currentFile.value) {
    await saveAs()
    return
  }
  try {
    await api.writeFile(currentFile.value, content.value)
    originalContent.value = content.value
    await refreshWorkspaceFiles()
  } catch (e) {
    console.error('Failed to save:', e)
  }
}

async function saveAs() {
  const path = await api.saveAs(content.value)
  if (path) {
    currentFile.value = path
    originalContent.value = content.value
    await api.addRecentFile(path)
    await refreshWorkspaceFiles()
  }
}

async function selectWorkspace() {
  const path = await api.openWorkspace()
  if (path) {
    workspacePath.value = path
    refreshWorkspaceFiles()
  }
}

async function refreshWorkspaceFiles() {
  if (!workspacePath.value) return
  workspaceFiles.value = await api.listWorkspaceFiles(workspacePath.value)
}

async function confirmDiscardChanges(): Promise<boolean> {
  if (!hasUnsaved.value) return true
  const result = await api.confirmClose(true)
  if (result === 2) {
    await saveFile()
    return true
  }
  return result === 1
}

async function handleBeforeClose() {
  const result = await api.confirmClose(hasUnsaved.value)
  if (result === 2) {
    await saveFile()
    await api.forceClose()
  } else if (result === 1) {
    await api.forceClose()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  const textarea = editorRef.value
  if (!textarea) return
  
  if (e.key === 'Enter' && !e.shiftKey) {
    const start = textarea.selectionStart
    const lineStart = content.value.lastIndexOf('\n', start - 1) + 1
    const currentLine = content.value.substring(lineStart, start)
    
    const emptyListMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s*$/)
    if (emptyListMatch) {
      e.preventDefault()
      const before = content.value.substring(0, lineStart)
      const after = content.value.substring(start)
      content.value = before + after
      setTimeout(() => {
        if (editorRef.value) {
          editorRef.value.selectionStart = editorRef.value.selectionEnd = lineStart
        }
      }, 0)
      return
    }
    
    const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s+$/)
    if (listMatch) {
      e.preventDefault()
      const indent = listMatch[1]
      let bullet = listMatch[2]
      const numMatch = bullet.match(/^(\d+)\.$/)
      if (numMatch) {
        bullet = (parseInt(numMatch[1]) + 1) + '.'
      }
      const before = content.value.substring(0, start)
      const after = content.value.substring(start)
      content.value = before + '\n' + indent + bullet + ' ' + after
      const newPos = start + 1 + indent.length + bullet.length + 1
      setTimeout(() => {
        if (editorRef.value) {
          editorRef.value.selectionStart = editorRef.value.selectionEnd = newPos
        }
      }, 0)
    }
  }
}

function handlePaste(e: ClipboardEvent) {
  const textarea = editorRef.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  
  if (start === end) return
  
  const clipboardData = e.clipboardData
  if (!clipboardData) return
  
  const pastedText = clipboardData.getData('text')
  if (!pastedText) return
  
  const urlPattern = /^(https?:\/\/|www\.)/i
  if (urlPattern.test(pastedText)) {
    e.preventDefault()
    const selectedText = content.value.substring(start, end)
    const before = content.value.substring(0, start)
    const after = content.value.substring(end)
    content.value = before + '[' + selectedText + '](' + pastedText + ')' + after
    const newPos = start + selectedText.length + pastedText.length + 4
    setTimeout(() => {
      if (editorRef.value) {
        editorRef.value.selectionStart = editorRef.value.selectionEnd = newPos
      }
    }, 0)
  }
}

function handlePreviewClick(e: Event) {
  const target = e.target as HTMLInputElement
  if (target && target.type === 'checkbox') {
    const taskIndex = target.getAttribute('data-task-index')
    if (taskIndex !== null) {
      const index = parseInt(taskIndex, 10)
      if (!isNaN(index)) {
        e.preventDefault()
        e.stopPropagation()
        const newChecked = !target.checked
        updateTaskListCheckbox(index, newChecked)
      }
    }
  }
}

function updateTaskListCheckbox(index: number, checked: boolean) {
  const lines = content.value.split('\n')
  let taskCount = 0
  let inCodeBlock = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.match(/^\s*```/)) {
      inCodeBlock = !inCodeBlock
      continue
    }
    
    if (inCodeBlock) continue
    
    const taskMatch = line.match(/^(\s*)([-*])\s+\[([ x])\]\s+(.*)$/i)
    if (taskMatch) {
      if (taskCount === index) {
        const indent = taskMatch[1]
        const bullet = taskMatch[2]
        const rest = taskMatch[4]
        lines[i] = indent + bullet + ' [' + (checked ? 'x' : ' ') + '] ' + rest
        break
      }
      taskCount++
    }
  }
  
  content.value = lines.join('\n')
}

onMounted(() => {
  console.log('App mounted, window.api:', !!window.api)
  api.onMenuNewFile(() => newFile())
  api.onMenuOpenFile(() => openFile())
  api.onMenuOpenWorkspace(() => selectWorkspace())
  api.onMenuSaveFile(() => saveFile())
  api.onMenuSaveAs(() => saveAs())
  api.onMenuOpenRecent((filePath) => {
    confirmDiscardChanges().then((ok) => {
      if (ok) loadFile(filePath)
    })
  })
  api.onMenuToggleTheme(() => toggleTheme())
  api.onBeforeClose(() => handleBeforeClose())
  nextTick(() => {
    activateTaskCheckboxes()
  })
})

watch(renderedHtml, () => {
  nextTick(() => {
    activateTaskCheckboxes()
  })
})

function activateTaskCheckboxes() {
  const checkboxes = document.querySelectorAll('.preview-content input[type="checkbox"]')
  checkboxes.forEach((checkbox) => {
    const input = checkbox as HTMLInputElement
    input.removeAttribute('disabled')
    input.readOnly = false
    input.style.cursor = 'pointer'
  })
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--bg-primary);
}

.sidebar {
  width: 250px;
  min-width: 200px;
  max-width: 400px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  font-weight: 600;
  font-size: 14px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-primary);
}

.icon-btn:hover {
  background: var(--hover-bg);
}

.workspace-info {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
}

.workspace-path {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.file-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
}

.file-item:hover {
  background: var(--hover-bg);
}

.file-item.active {
  background: var(--active-bg);
  color: var(--accent-color);
}

.empty-hint {
  padding: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
  flex-shrink: 0;
}

.toolbar-btn {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-btn:hover {
  background: var(--hover-bg);
}

.toolbar-btn.primary {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.toolbar-btn.primary:hover {
  opacity: 0.9;
}

.file-info {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.unsaved-marker {
  color: #f85149;
  margin-left: 4px;
  font-weight: bold;
}

.toolbar-spacer {
  flex: 1;
}

.editor-preview {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.editor-pane {
  flex: 1;
  display: flex;
  min-width: 0;
}

.preview-pane {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  min-width: 0;
}

.editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 24px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.preview-content {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.6;
  color: var(--text-primary);
}

.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

.preview-content :deep(h1) { font-size: 2em; }
.preview-content :deep(h2) { font-size: 1.5em; }
.preview-content :deep(h3) { font-size: 1.25em; }
.preview-content :deep(h4) { font-size: 1em; }

.preview-content :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content :deep(ul),
.preview-content :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.preview-content :deep(li) {
  margin-top: 4px;
}

.preview-content :deep(li input[type="checkbox"]) {
  margin-right: 8px;
  cursor: pointer;
}

.preview-content :deep(code) {
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 85%;
}

.preview-content :deep(pre) {
  background: var(--bg-tertiary);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.preview-content :deep(pre code) {
  background: none;
  padding: 0;
}

.preview-content :deep(blockquote) {
  margin: 0 0 16px;
  padding: 0 1em;
  color: var(--text-secondary);
  border-left: 4px solid var(--border-color);
}

.preview-content :deep(table) {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 6px 13px;
  border: 1px solid var(--border-color);
}

.preview-content :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
}

.preview-content :deep(tr:nth-child(2n)) {
  background: var(--bg-secondary);
}

.preview-content :deep(a) {
  color: var(--accent-color);
  text-decoration: none;
}

.preview-content :deep(a:hover) {
  text-decoration: underline;
}

.preview-content :deep(hr) {
  height: 1px;
  background: var(--border-color);
  border: none;
  margin: 24px 0;
}

[data-theme="dark"] :deep(.hljs) {
  background: #0d1117;
  color: #c9d1d9;
}

[data-theme="dark"] :deep(.hljs-keyword),
[data-theme="dark"] :deep(.hljs-meta) {
  color: #ff7b72;
}

[data-theme="dark"] :deep(.hljs-string),
[data-theme="dark"] :deep(.hljs-attr) {
  color: #a5d6ff;
}

[data-theme="dark"] :deep(.hljs-number),
[data-theme="dark"] :deep(.hljs-literal) {
  color: #79c0ff;
}

[data-theme="dark"] :deep(.hljs-comment) {
  color: #8b949e;
  font-style: italic;
}

[data-theme="dark"] :deep(.hljs-title),
[data-theme="dark"] :deep(.hljs-function) {
  color: #d2a8ff;
}

[data-theme="dark"] :deep(.hljs-built_in),
[data-theme="dark"] :deep(.hljs-class) {
  color: #ffa657;
}

[data-theme="dark"] :deep(.hljs-variable) {
  color: #ffa198;
}
</style>
