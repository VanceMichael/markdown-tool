import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  fsReadFile: (filePath: string) => ipcRenderer.invoke('fs-read-file', filePath),
  fsWriteFile: (filePath: string, content: string) => ipcRenderer.invoke('fs-write-file', filePath, content),
  dialogOpenFile: () => ipcRenderer.invoke('dialog-open-file'),
  dialogSaveFile: (defaultName?: string) => ipcRenderer.invoke('dialog-save-file', defaultName),
  dialogOpenFolder: () => ipcRenderer.invoke('dialog-open-folder'),
  workspaceListFiles: (dirPath: string) => ipcRenderer.invoke('workspace-list-files', dirPath),
  workspaceGetSaved: () => ipcRenderer.invoke('workspace-get-saved'),
  recentFilesGet: () => ipcRenderer.invoke('recent-files-get'),
  recentFilesAdd: (filePath: string) => ipcRenderer.invoke('recent-files-add', filePath),
  appQuit: () => ipcRenderer.invoke('app-quit'),
  pathBasename: (filePath: string) => ipcRenderer.invoke('path-basename', filePath),

  onMenuNew: (cb: () => void) => ipcRenderer.on('menu-new', cb),
  onMenuSave: (cb: () => void) => ipcRenderer.on('menu-save', cb),
  onMenuSaveAs: (cb: () => void) => ipcRenderer.on('menu-save-as', cb),
  onOpenFile: (cb: (_e: any, filePath: string) => void) => ipcRenderer.on('open-file', cb),
  onWindowCloseRequest: (cb: () => void) => ipcRenderer.on('window-close-request', cb)
})
