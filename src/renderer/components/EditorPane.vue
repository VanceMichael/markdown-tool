<template>
  <div class="editor-pane">
    <textarea
      ref="textareaRef"
      class="editor-textarea"
      :value="content"
      @input="onInput"
      @keydown="onKeyDown"
      @paste="onPaste"
      spellcheck="false"
      placeholder="开始书写 Markdown..."
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits<{
  'update:content': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:content', target.value)
}

function onKeyDown(e: KeyboardEvent) {
  const ta = textareaRef.value
  if (!ta) return

  const { selectionStart, selectionEnd, value } = ta

  if (e.key === 'Enter') {
    const beforeCursor = value.substring(0, selectionStart)
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
    const currentLine = beforeCursor.substring(currentLineStart)

    const listMatch = currentLine.match(/^(\s*)([-*+])\s/)
    if (listMatch) {
      if (currentLine.trim() === listMatch[2]) {
        e.preventDefault()
        const newValue = value.substring(0, currentLineStart) + value.substring(selectionStart)
        emit('update:content', newValue)
        nextTick(() => {
          ta.selectionStart = ta.selectionEnd = currentLineStart
        })
        return
      }
      e.preventDefault()
      const indent = listMatch[1]
      const marker = listMatch[2]
      const insertion = `\n${indent}${marker} `
      const newValue = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd)
      emit('update:content', newValue)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length
      })
      return
    }

    const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s/)
    if (orderedMatch) {
      if (currentLine.trim() === `${orderedMatch[2]}.`) {
        e.preventDefault()
        const newValue = value.substring(0, currentLineStart) + value.substring(selectionStart)
        emit('update:content', newValue)
        nextTick(() => {
          ta.selectionStart = ta.selectionEnd = currentLineStart
        })
        return
      }
      e.preventDefault()
      const indent = orderedMatch[1]
      const num = parseInt(orderedMatch[2]) + 1
      const insertion = `\n${indent}${num}. `
      const newValue = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd)
      emit('update:content', newValue)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length
      })
      return
    }
  }

  if (e.key === ' ' && selectionStart === selectionEnd) {
    const beforeCursor = value.substring(0, selectionStart)
    const currentLineStart = beforeCursor.lastIndexOf('\n') + 1
    const currentLine = beforeCursor.substring(currentLineStart)

    const headingMatch = currentLine.match(/^(#{1,6})$/)
    if (headingMatch) {
      e.preventDefault()
      const prefix = headingMatch[1] + ' '
      const newValue = value.substring(0, currentLineStart) + prefix + value.substring(selectionStart)
      emit('update:content', newValue)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = currentLineStart + prefix.length
      })
      return
    }

    const dashMatch = currentLine.match(/^(-{3,})$/)
    if (dashMatch) {
      e.preventDefault()
      const line = '─'.repeat(40)
      const newValue = value.substring(0, currentLineStart) + line + value.substring(selectionStart)
      emit('update:content', newValue)
      nextTick(() => {
        ta.selectionStart = ta.selectionEnd = currentLineStart + line.length
      })
      return
    }
  }
}

function onPaste(e: ClipboardEvent) {
  const ta = textareaRef.value
  if (!ta) return

  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  try {
    const url = new URL(pastedText)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      const { selectionStart, selectionEnd, value } = ta
      const selectedText = value.substring(selectionStart, selectionEnd)
      if (selectedText.length > 0) {
        e.preventDefault()
        const insertion = `[${selectedText}](${pastedText})`
        const newValue = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd)
        emit('update:content', newValue)
        nextTick(() => {
          ta.selectionStart = ta.selectionEnd = selectionStart + insertion.length
        })
      }
    }
  } catch {}
}

watch(() => props.content, () => {
  if (!textareaRef.value) return
  if (textareaRef.value.value !== props.content) {
    const { selectionStart, selectionEnd } = textareaRef.value
    textareaRef.value.value = props.content
    textareaRef.value.selectionStart = selectionStart
    textareaRef.value.selectionEnd = selectionEnd
  }
})
</script>

<style scoped>
.editor-pane {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-editor);
}

.editor-textarea {
  flex: 1;
  width: 100%;
  padding: 24px 28px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font-family: "SF Mono", "Fira Code", "JetBrains Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  tab-size: 2;
}

.editor-textarea::placeholder {
  color: var(--text-muted);
}
</style>
