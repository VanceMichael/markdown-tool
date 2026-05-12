<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useEditorStore } from '../store/editor'

const store = useEditorStore()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function handleInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  store.setContent(target.value)
}

function handleKeydown(e: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = store.content

  if (e.key === ' ' && !e.shiftKey) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.slice(lineStart, start)

    if (currentLine.match(/^#{1,6}$/)) {
      e.preventDefault()
      const before = value.slice(0, lineStart)
      const after = value.slice(start)
      const newContent = before + currentLine + ' ' + after
      store.setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = lineStart + currentLine.length + 1
      }, 0)
      return
    }

    if (currentLine === '-' || currentLine === '*') {
      e.preventDefault()
      const before = value.slice(0, lineStart)
      const after = value.slice(start)
      const newContent = before + currentLine + ' ' + after
      store.setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = lineStart + currentLine.length + 1
      }, 0)
      return
    }

    if (currentLine.match(/^\d+\.$/)) {
      e.preventDefault()
      const before = value.slice(0, lineStart)
      const after = value.slice(start)
      const newContent = before + currentLine + ' ' + after
      store.setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = lineStart + currentLine.length + 1
      }, 0)
      return
    }
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const currentLine = value.slice(lineStart, start)

    const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)(\s+)\[([ xX])\](\s+)/)
    if (listMatch) {
      e.preventDefault()
      const indent = listMatch[1]
      const marker = listMatch[2].match(/^\d+$/) ? (parseInt(listMatch[2]) + 1) + '.' : listMatch[2]
      const space1 = listMatch[3]
      const checkbox = listMatch[4] === ' ' ? '[ ]' : '[x]'
      const space2 = listMatch[5]
      const before = value.slice(0, end)
      const after = value.slice(end)
      const newLine = '\n' + indent + marker + space1 + checkbox + space2
      store.setContent(before + newLine + after)
      setTimeout(() => {
        const newPos = end + newLine.length
        textarea.selectionStart = textarea.selectionEnd = newPos
      }, 0)
      return
    }

    const simpleListMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s+/)
    if (simpleListMatch && currentLine.trim().length > simpleListMatch[0].trim().length) {
      e.preventDefault()
      const indent = simpleListMatch[1]
      const marker = simpleListMatch[2].match(/^\d+$/) ? (parseInt(simpleListMatch[2]) + 1) + '.' : simpleListMatch[2]
      const before = value.slice(0, end)
      const after = value.slice(end)
      const newLine = '\n' + indent + marker + ' '
      store.setContent(before + newLine + after)
      setTimeout(() => {
        const newPos = end + newLine.length
        textarea.selectionStart = textarea.selectionEnd = newPos
      }, 0)
      return
    }
  }
}

async function handlePaste(e: ClipboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return

  const clipboardData = e.clipboardData
  if (!clipboardData) return

  const pastedText = clipboardData.getData('text')
  const urlRegex = /^(https?:\/\/[^\s]+)$/

  if (urlRegex.test(pastedText)) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (start !== end) {
      e.preventDefault()
      const selectedText = store.content.slice(start, end)
      const before = store.content.slice(0, start)
      const after = store.content.slice(end)
      const newContent = before + `[${selectedText}](${pastedText})` + after
      store.setContent(newContent)
      setTimeout(() => {
        const newPos = start + selectedText.length + pastedText.length + 4
        textarea.selectionStart = textarea.selectionEnd = newPos
      }, 0)
    }
  }
}

watch(() => store.content, (newContent) => {
  if (textareaRef.value && textareaRef.value.value !== newContent) {
    textareaRef.value.value = newContent
  }
})

onMounted(() => {
  if (textareaRef.value) {
    textareaRef.value.value = store.content
  }
})
</script>

<template>
  <div class="editor-container">
    <div class="editor-header">
      <span class="header-label">编辑</span>
    </div>
    <textarea
      ref="textareaRef"
      class="editor-textarea"
      :value="store.content"
      @input="handleInput"
      @keydown="handleKeydown"
      @paste="handlePaste"
      spellcheck="false"
    />
  </div>
</template>

<style scoped>
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  overflow: hidden;
}

.editor-header {
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

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 20px;
  border: none;
  outline: none;
  resize: none;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  tab-size: 2;
}

.editor-textarea::selection {
  background-color: var(--accent-color);
  color: white;
}
</style>
