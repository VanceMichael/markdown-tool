<script setup lang="ts">
import { useEditorStore } from '../store/editor'

const store = useEditorStore()

async function openFolder() {
  try {
    const folder = await window.electronAPI.openFolder()
    if (folder) {
      store.setWorkspace(folder.folderPath, folder.files)
    }
  } catch (error) {
    console.error('Open folder error:', error)
  }
}

async function openFile(filePath: string) {
  if (store.isModified) {
    const result = await window.electronAPI.confirmClose()
    if (result === 0) {
      await window.electronAPI.saveFile(store.content, store.currentFilePath || undefined)
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
}

function getFolderName() {
  if (!store.workspaceFolder) return ''
  return store.workspaceFolder.split(/[\\/]/).pop() || ''
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="header-title">工作区</span>
      <button class="open-folder-btn" @click="openFolder" title="打开文件夹">
        📁
      </button>
    </div>
    
    <div v-if="store.workspaceFolder" class="folder-info">
      <span class="folder-name">{{ getFolderName() }}</span>
    </div>

    <div class="file-list">
      <div
        v-for="file in store.workspaceFiles"
        :key="file.path"
        class="file-item"
        :class="{ active: file.path === store.currentFilePath }"
        @click="openFile(file.path)"
      >
        <span class="file-icon">📄</span>
        <span class="file-name">{{ file.name }}</span>
      </div>
      <div v-if="store.workspaceFiles.length === 0 && store.workspaceFolder" class="empty-state">
        该文件夹下没有 markdown 文件
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid var(--border-color);
}

.header-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.open-folder-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-primary);
}

.open-folder-btn:hover {
  background-color: var(--hover-bg);
}

.folder-info {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.folder-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
}

.file-item:hover {
  background-color: var(--hover-bg);
}

.file-item.active {
  background-color: var(--active-bg);
}

.file-icon {
  margin-right: 8px;
  font-size: 14px;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}
</style>
