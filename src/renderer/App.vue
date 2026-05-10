<template>
  <div class="app-root" :data-theme="store.theme">
    <ToolBar
      @new-file="newFile"
      @open-file="openFile()"
      @save-file="saveFile"
      @toggle-theme="toggleTheme"
      @open-workspace="openWorkspace"
    />
    <div class="main-area">
      <Sidebar
        :workspace-dir="store.workspaceDir"
        :workspace-files="store.workspaceFiles"
        :current-file-path="store.currentFile.filePath"
        @open-workspace="openWorkspace"
        @select-file="openFile($event)"
      />
      <div class="editor-preview-container">
        <EditorPane
          :content="store.currentFile.content"
          @update:content="updateContent"
        />
        <div class="resize-handle" @mousedown="startResize"></div>
        <PreviewPane
          :content="store.currentFile.content"
          :file-path="store.currentFile.filePath"
          @toggle-task="toggleTask"
        />
      </div>
    </div>
    <UnsavedDialog
      v-if="store.showUnsavedDialog"
      @save="saveAndProceed"
      @discard="discardAndProceed"
      @cancel="cancelDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useStore } from './store/index'
import ToolBar from './components/ToolBar.vue'
import Sidebar from './components/Sidebar.vue'
import EditorPane from './components/EditorPane.vue'
import PreviewPane from './components/PreviewPane.vue'
import UnsavedDialog from './components/UnsavedDialog.vue'

const {
  store,
  newFile,
  openFile,
  saveFile,
  saveFileAs,
  updateContent,
  toggleTheme,
  openWorkspace,
  initWorkspace,
  discardAndProceed,
  saveAndProceed,
  cancelDialog
} = useStore()

function toggleTask(lineIndex: number) {
  const lines = store.currentFile.content.split('\n')
  if (lineIndex < 0 || lineIndex >= lines.length) return
  const line = lines[lineIndex]
  if (line.includes('[ ]')) {
    lines[lineIndex] = line.replace('[ ]', '[x]')
  } else if (line.includes('[x]') || line.includes('[X]')) {
    lines[lineIndex] = line.replace(/\[x\]/i, '[ ]')
  }
  updateContent(lines.join('\n'))
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  const container = (e.target as HTMLElement).parentElement!
  const editorPane = container.querySelector('.editor-pane') as HTMLElement
  const startX = e.clientX
  const startWidth = editorPane.offsetWidth

  function onMouseMove(ev: MouseEvent) {
    const delta = ev.clientX - startX
    const newWidth = Math.max(200, Math.min(startWidth + delta, container.offsetWidth - 200))
    editorPane.style.flex = 'none'
    editorPane.style.width = newWidth + 'px'
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', store.theme)

  const api = window.electronAPI
  if (!api) return

  api.onMenuNew(() => newFile())
  api.onMenuSave(() => saveFile())
  api.onMenuSaveAs(() => saveFileAs())
  api.onOpenFile((_e, filePath) => openFile(filePath))
  api.onWindowCloseRequest(() => {
    if (store.currentFile.isDirty) {
      store.pendingAction = () => api.appQuit()
      store.showUnsavedDialog = true
    } else {
      api.appQuit()
    }
  })

  initWorkspace()
})

onUnmounted(() => {
  const api = window.electronAPI
  if (!api) return
  api.onMenuNew(() => {})
  api.onMenuSave(() => {})
  api.onMenuSaveAs(() => {})
  api.onOpenFile(() => {})
  api.onWindowCloseRequest(() => {})
})
</script>

<style scoped>
.app-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-preview-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.resize-handle {
  width: 5px;
  cursor: col-resize;
  background: var(--border);
  transition: background 0.15s;
  flex-shrink: 0;
}

.resize-handle:hover {
  background: var(--accent);
}
</style>
