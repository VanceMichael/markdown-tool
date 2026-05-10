import { reactive } from 'vue'

interface FileState {
  filePath: string | null
  content: string
  savedContent: string
  isDirty: boolean
}

interface AppState {
  currentFile: FileState
  workspaceDir: string | null
  workspaceFiles: { name: string; path: string }[]
  theme: 'light' | 'dark'
  showUnsavedDialog: boolean
  pendingAction: (() => void) | null
}

const store = reactive<AppState>({
  currentFile: {
    filePath: null,
    content: '',
    savedContent: '',
    isDirty: false
  },
  workspaceDir: null,
  workspaceFiles: [],
  theme: (localStorage.getItem('md-writer-theme') as 'light' | 'dark') || 'light',
  showUnsavedDialog: false,
  pendingAction: null
})

export function useStore() {
  const api = () => window.electronAPI

  function newFile() {
    if (store.currentFile.isDirty) {
      store.pendingAction = () => doNewFile()
      store.showUnsavedDialog = true
      return
    }
    doNewFile()
  }

  function doNewFile() {
    store.currentFile = { filePath: null, content: '', savedContent: '', isDirty: false }
    store.showUnsavedDialog = false
    store.pendingAction = null
  }

  async function openFile(filePath?: string) {
    if (store.currentFile.isDirty) {
      store.pendingAction = () => doOpenFile(filePath)
      store.showUnsavedDialog = true
      return
    }
    await doOpenFile(filePath)
  }

  async function doOpenFile(filePath?: string) {
    if (!api()) return
    const path = filePath || await api()!.dialogOpenFile()
    if (!path) return
    const result = await api()!.fsReadFile(path)
    if (result.ok && result.data !== undefined) {
      store.currentFile = {
        filePath: path,
        content: result.data,
        savedContent: result.data,
        isDirty: false
      }
      await api()!.recentFilesAdd(path)
    }
    store.showUnsavedDialog = false
    store.pendingAction = null
  }

  async function saveFile() {
    if (!api()) return
    if (!store.currentFile.filePath) {
      await saveFileAs()
      return
    }
    const result = await api()!.fsWriteFile(store.currentFile.filePath, store.currentFile.content)
    if (result.ok) {
      store.currentFile.savedContent = store.currentFile.content
      store.currentFile.isDirty = false
      await api()!.recentFilesAdd(store.currentFile.filePath!)
    }
  }

  async function saveFileAs() {
    if (!api()) return
    const defaultName = store.currentFile.filePath
      ? await api()!.pathBasename(store.currentFile.filePath)
      : 'untitled.md'
    const filePath = await api()!.dialogSaveFile(defaultName)
    if (!filePath) return
    const result = await api()!.fsWriteFile(filePath, store.currentFile.content)
    if (result.ok) {
      store.currentFile.filePath = filePath
      store.currentFile.savedContent = store.currentFile.content
      store.currentFile.isDirty = false
      await api()!.recentFilesAdd(filePath)
      refreshWorkspace()
    }
  }

  function updateContent(content: string) {
    store.currentFile.content = content
    store.currentFile.isDirty = content !== store.currentFile.savedContent
  }

  function toggleTheme() {
    store.theme = store.theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('md-writer-theme', store.theme)
    document.documentElement.setAttribute('data-theme', store.theme)
  }

  async function openWorkspace() {
    if (!api()) return
    const dir = await api()!.dialogOpenFolder()
    if (dir) {
      store.workspaceDir = dir
      await refreshWorkspace()
    }
  }

  async function refreshWorkspace() {
    if (!api() || !store.workspaceDir) return
    const result = await api()!.workspaceListFiles(store.workspaceDir)
    if (result.ok) {
      store.workspaceFiles = result.files
    }
  }

  async function initWorkspace() {
    if (!api()) return
    const saved = await api()!.workspaceGetSaved()
    if (saved) {
      store.workspaceDir = saved
      await refreshWorkspace()
    }
  }

  function discardAndProceed() {
    store.showUnsavedDialog = false
    if (store.pendingAction) {
      const action = store.pendingAction
      store.pendingAction = null
      action()
    }
  }

  function saveAndProceed() {
    saveFile().then(() => {
      store.showUnsavedDialog = false
      if (store.pendingAction) {
        const action = store.pendingAction
        store.pendingAction = null
        action()
      }
    })
  }

  function cancelDialog() {
    store.showUnsavedDialog = false
    store.pendingAction = null
  }

  return {
    store,
    newFile,
    openFile,
    doOpenFile,
    saveFile,
    saveFileAs,
    updateContent,
    toggleTheme,
    openWorkspace,
    refreshWorkspace,
    initWorkspace,
    discardAndProceed,
    saveAndProceed,
    cancelDialog
  }
}
