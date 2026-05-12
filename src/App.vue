<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore } from './store/editor'
import Sidebar from './components/Sidebar.vue'
import Editor from './components/Editor.vue'
import Preview from './components/Preview.vue'

const store = useEditorStore()
const showFileMenu = ref(false)

async function handleNew() {
  if (store.isModified) {
    const result = await window.electronAPI.confirmClose()
    if (result === 0) {
      await handleSave()
    } else if (result === 2) {
      return
    }
  }
  store.newFile()
  showFileMenu.value = false
}

async function handleOpen() {
  if (store.isModified) {
    const result = await window.electronAPI.confirmClose()
    if (result === 0) {
      await handleSave()
    } else if (result === 2) {
      return
    }
  }
  const file = await window.electronAPI.openFile()
  if (file) {
    const fileName = file.filePath.split(/[\\/]/).pop() || 'untitled.md'
    store.setOriginalContent(file.content)
    store.setCurrentFile(file.filePath, fileName)
  }
  showFileMenu.value = false
}

async function handleOpenFolder() {
  const folder = await window.electronAPI.openFolder()
  if (folder) {
    store.setWorkspace(folder.folderPath, folder.files)
  }
  showFileMenu.value = false
}

async function handleSave() {
  const result = await window.electronAPI.saveFile(store.content, store.currentFilePath || undefined)
  if (result) {
    const fileName = result.split(/[\\/]/).pop() || 'untitled.md'
    store.originalContent = store.content
    store.setCurrentFile(result, fileName)
    if (store.workspaceFolder) {
      const files = await window.electronAPI.listFiles(store.workspaceFolder)
      store.updateWorkspaceFiles(files)
    }
  }
  showFileMenu.value = false
}

async function handleSaveAs() {
  const result = await window.electronAPI.saveFile(store.content, undefined)
  if (result) {
    const fileName = result.split(/[\\/]/).pop() || 'untitled.md'
    store.originalContent = store.content
    store.setCurrentFile(result, fileName)
    if (store.workspaceFolder) {
      const files = await window.electronAPI.listFiles(store.workspaceFolder)
      store.updateWorkspaceFiles(files)
    }
  }
  showFileMenu.value = false
}

async function handleOpenRecent(filePath: string) {
  if (store.isModified) {
    const result = await window.electronAPI.confirmClose()
    if (result === 0) {
      await handleSave()
    } else if (result === 2) {
      return
    }
  }
  const file = await window.electronAPI.readFile(filePath)
  if (file) {
    const fileName = file.filePath.split(/[\\/]/).pop() || 'untitled.md'
    store.setOriginalContent(file.content)
    store.setCurrentFile(file.filePath, fileName)
  }
  showFileMenu.value = false
}

async function handleCheckUnsaved() {
  if (store.isModified) {
    const result = await window.electronAPI.confirmClose()
    if (result === 0) {
      const saved = await window.electronAPI.saveFile(store.content, store.currentFilePath || undefined)
      if (saved) {
        window.electronAPI.closeApp()
      }
    } else if (result === 1) {
      window.electronAPI.closeApp()
    }
  } else {
    window.electronAPI.closeApp()
  }
}

function toggleFileMenu() {
  showFileMenu.value = !showFileMenu.value
}

function closeMenu() {
  showFileMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.menu-container')) {
      showFileMenu.value = false
    }
  })

  const cleanup = [
    window.electronAPI.onMenuNew(handleNew),
    window.electronAPI.onMenuOpen(handleOpen),
    window.electronAPI.onMenuOpenFolder(handleOpenFolder),
    window.electronAPI.onMenuSave(handleSave),
    window.electronAPI.onMenuSaveAs(handleSaveAs),
    window.electronAPI.onMenuOpenRecent(handleOpenRecent),
    window.electronAPI.onMenuToggleTheme(() => store.toggleTheme()),
    window.electronAPI.onCheckUnsaved(handleCheckUnsaved)
  ]
  onUnmounted(() => cleanup.forEach(fn => fn()))
})

watch(() => store.isDarkTheme, (isDark) => {
  document.documentElement.classList.toggle('light-theme', !isDark)
}, { immediate: true })
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <div class="main-content">
      <div class="toolbar">
        <div class="menu-container">
          <button 
            class="menu-button" 
            :class="{ active: showFileMenu }"
            @click.stop="toggleFileMenu"
          >
            文件
          </button>
          <div v-if="showFileMenu" class="dropdown-menu">
            <div class="menu-item" @click="handleNew">
              <span class="menu-label">新建</span>
              <span class="menu-shortcut">Cmd+N</span>
            </div>
            <div class="menu-item" @click="handleOpen">
              <span class="menu-label">打开</span>
              <span class="menu-shortcut">Cmd+O</span>
            </div>
            <div class="menu-item" @click="handleOpenFolder">
              <span class="menu-label">打开文件夹</span>
              <span class="menu-shortcut">Cmd+Shift+O</span>
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" @click="handleSave">
              <span class="menu-label">保存</span>
              <span class="menu-shortcut">Cmd+S</span>
            </div>
            <div class="menu-item" @click="handleSaveAs">
              <span class="menu-label">另存为</span>
              <span class="menu-shortcut">Cmd+Shift+S</span>
            </div>
          </div>
        </div>
        <div class="toolbar-spacer"></div>
        <span class="file-name">
          {{ store.currentFileName }}
          <span v-if="store.isModified" class="modified-dot">•</span>
        </span>
        <div class="toolbar-spacer"></div>
        <button 
          class="theme-toggle" 
          @click="store.toggleTheme()"
          :title="store.isDarkTheme ? '切换到浅色主题' : '切换到深色主题'"
        >
          {{ store.isDarkTheme ? '☀️' : '🌙' }}
        </button>
      </div>
      <div class="editor-preview-container" @click="closeMenu">
        <Editor />
        <Preview />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100%;
  width: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.menu-container {
  position: relative;
}

.menu-button {
  background: none;
  border: none;
  color: var(--text-primary);
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.menu-button:hover,
.menu-button.active {
  background-color: var(--hover-bg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 220px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
}

.menu-item:hover {
  background-color: var(--hover-bg);
}

.menu-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 20px;
}

.menu-separator {
  height: 1px;
  background-color: var(--border-color);
  margin: 4px 0;
}

.toolbar-spacer {
  flex: 1;
}

.file-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.modified-dot {
  color: var(--accent-color);
  margin-left: 4px;
}

.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 4px;
  color: var(--text-primary);
}

.theme-toggle:hover {
  background-color: var(--hover-bg);
}

.editor-preview-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
