import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FileInfo } from '@/types/electron-api'

export const useEditorStore = defineStore('editor', () => {
  const content = ref('')
  const originalContent = ref('')
  const currentFilePath = ref<string | null>(null)
  const currentFileName = ref<string>('untitled.md')
  const workspaceFolder = ref<string | null>(null)
  const workspaceFiles = ref<FileInfo[]>([])
  const isDarkTheme = ref(true)

  const isModified = computed(() => content.value !== originalContent.value)

  function setContent(newContent: string) {
    content.value = newContent
  }

  function setOriginalContent(newContent: string) {
    originalContent.value = newContent
    content.value = newContent
  }

  function setCurrentFile(filePath: string | null, fileName: string = 'untitled.md') {
    currentFilePath.value = filePath
    currentFileName.value = fileName
    window.electronAPI?.setCurrentFile(filePath)
  }

  function setWorkspace(folderPath: string, files: FileInfo[]) {
    workspaceFolder.value = folderPath
    workspaceFiles.value = files
  }

  function updateWorkspaceFiles(files: FileInfo[]) {
    workspaceFiles.value = files
  }

  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value
  }

  function newFile() {
    setOriginalContent('')
    setCurrentFile(null, 'untitled.md')
  }

  return {
    content,
    originalContent,
    currentFilePath,
    currentFileName,
    workspaceFolder,
    workspaceFiles,
    isDarkTheme,
    isModified,
    setContent,
    setOriginalContent,
    setCurrentFile,
    setWorkspace,
    updateWorkspaceFiles,
    toggleTheme,
    newFile
  }
})
