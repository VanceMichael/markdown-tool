<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="app-title">MD Writer</span>
      <div class="toolbar-actions">
        <button class="toolbar-btn" @click="$emit('newFile')" title="新建 (Ctrl+N)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6L9 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 1v5h5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 9h4M8 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <button class="toolbar-btn" @click="$emit('openFile')" title="打开 (Ctrl+O)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3a1 1 0 011-1h3.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H13a1 1 0 011 1v7a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button class="toolbar-btn" @click="$emit('saveFile')" title="保存 (Ctrl+S)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.5 14.5h-9a1 1 0 01-1-1v-11a1 1 0 011-1h7.586a1 1 0 01.707.293l1.414 1.414a1 1 0 01.293.707V13.5a1 1 0 01-1 1z" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 14.5V9.5h5v5M5.5 1.5v3h4v-3" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
      </div>
    </div>
    <div class="toolbar-right">
      <button class="toolbar-btn" @click="$emit('toggleTheme')" :title="isDark ? '切换浅色' : '切换深色'">
        <svg v-if="isDark" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5A5.5 5.5 0 116.5 2.5a4.5 4.5 0 007 7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../store/index'

const { store } = useStore()
const isDark = computed(() => store.theme === 'dark')

defineEmits<{
  newFile: []
  openFile: []
  saveFile: []
  toggleTheme: []
  openWorkspace: []
}>()
</script>

<style scoped>
.toolbar {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-toolbar);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.toolbar-actions {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.toolbar-right {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.toolbar-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: var(--hover);
  color: var(--text);
}
</style>
