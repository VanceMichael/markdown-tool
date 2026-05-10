<template>
  <div class="sidebar" :class="{ collapsed: !workspaceDir }">
    <div class="sidebar-header">
      <span class="sidebar-title">工作区</span>
      <button class="sidebar-action" @click="$emit('openWorkspace')" title="打开文件夹">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4a1 1 0 011-1h3.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.5"/><path d="M7 9h2v2H7z" fill="currentColor"/></svg>
      </button>
    </div>
    <div v-if="workspaceDir" class="sidebar-content">
      <div class="workspace-path" :title="workspaceDir">{{ workspaceName }}</div>
      <div class="file-list">
        <button
          v-for="file in workspaceFiles"
          :key="file.path"
          class="file-item"
          :class="{ active: file.path === currentFilePath }"
          @click="$emit('selectFile', file.path)"
          :title="file.path"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 1h5.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V14a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" stroke-width="1.2"/><path d="M6 7h4M6 9.5h3" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
          <span class="file-name">{{ file.name }}</span>
        </button>
        <div v-if="workspaceFiles.length === 0" class="empty-hint">
          此文件夹没有 Markdown 文件
        </div>
      </div>
    </div>
    <div v-else class="sidebar-empty">
      <button class="open-folder-btn" @click="$emit('openWorkspace')">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><path d="M2 4a1 1 0 011-1h3.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.2"/></svg>
        <span>打开文件夹</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  workspaceDir: string | null
  workspaceFiles: { name: string; path: string }[]
  currentFilePath: string | null
}>()

defineEmits<{
  openWorkspace: []
  selectFile: [path: string]
}>()

const workspaceName = computed(() => {
  if (!props.workspaceDir) return ''
  const parts = props.workspaceDir.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || props.workspaceDir
})
</script>

<style scoped>
.sidebar {
  width: 200px;
  min-width: 160px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 160px;
}

.sidebar-header {
  padding: 10px 12px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
}

.sidebar-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--text-muted);
  transition: all 0.15s;
}

.sidebar-action:hover {
  background: var(--hover);
  color: var(--text);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.workspace-path {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid var(--border);
}

.file-list {
  padding: 4px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  text-align: left;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.1s;
  border-left: 2px solid transparent;
}

.file-item:hover {
  background: var(--hover);
  color: var(--text);
}

.file-item.active {
  background: var(--active);
  color: var(--text);
  border-left-color: var(--accent);
}

.file-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-hint {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.sidebar-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.open-folder-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 8px;
  color: var(--text-muted);
  transition: all 0.15s;
  font-size: 12px;
}

.open-folder-btn:hover {
  background: var(--hover);
  color: var(--text);
}
</style>
