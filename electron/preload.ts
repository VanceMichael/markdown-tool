import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  newFile: () => ipcRenderer.invoke('dialog-new-file'),
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  openWorkspace: () => ipcRenderer.invoke('dialog-open-workspace'),
  saveAs: (content: string) => ipcRenderer.invoke('dialog-save-as', content),
  readFile: (filePath: string) => ipcRenderer.invoke('file-read', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file-write', filePath, content),
  addRecentFile: (filePath: string) => ipcRenderer.invoke('file-add-recent', filePath),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  listWorkspaceFiles: (dirPath: string) => ipcRenderer.invoke('workspace-list-md', dirPath),
  confirmClose: (hasUnsaved: boolean) => ipcRenderer.invoke('confirm-close', hasUnsaved),
  forceClose: () => ipcRenderer.invoke('force-close'),
  onMenuNewFile: (callback: () => void) => {
    ipcRenderer.on('menu-new-file', callback)
  },
  onMenuOpenFile: (callback: () => void) => {
    ipcRenderer.on('menu-open-file', callback)
  },
  onMenuOpenWorkspace: (callback: () => void) => {
    ipcRenderer.on('menu-open-workspace', callback)
  },
  onMenuSaveFile: (callback: () => void) => {
    ipcRenderer.on('menu-save-file', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu-save-as', callback)
  },
  onMenuOpenRecent: (callback: (filePath: string) => void) => {
    ipcRenderer.on('menu-open-recent', (_e, filePath) => callback(filePath))
  },
  onMenuToggleTheme: (callback: () => void) => {
    ipcRenderer.on('menu-toggle-theme', callback)
  },
  onBeforeClose: (callback: () => void) => {
    ipcRenderer.on('before-close', callback)
  }
})
