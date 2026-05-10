<template>
  <div class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog">
      <div class="dialog-title">未保存的更改</div>
      <div class="dialog-message">当前文件有未保存的更改，是否保存？</div>
      <div class="dialog-actions">
        <button class="dialog-btn btn-save" @click="$emit('save')">保存</button>
        <button class="dialog-btn btn-discard" @click="$emit('discard')">不保存</button>
        <button class="dialog-btn btn-cancel" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  save: []
  discard: []
  cancel: []
}>()
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--dialog-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  min-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text);
}

.dialog-message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.btn-save {
  background: var(--accent);
  color: white;
}

.btn-save:hover {
  background: var(--accent-hover);
}

.btn-discard {
  background: var(--btn-danger);
  color: white;
}

.btn-discard:hover {
  background: var(--btn-danger-hover);
}

.btn-cancel {
  background: var(--hover);
  color: var(--text);
}

.btn-cancel:hover {
  background: var(--active);
}
</style>
