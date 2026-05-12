import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  listFiles: (folderPath: string) => ipcRenderer.invoke('file:list', folderPath),
  saveFile: (content: string, defaultPath?: string) => 
    ipcRenderer.invoke('dialog:saveFile', content, defaultPath),
  confirmClose: () => ipcRenderer.invoke('confirm:close'),
  closeApp: () => ipcRenderer.send('app:close'),
  setCurrentFile: (filePath: string | null) => 
    ipcRenderer.send('file:set-current', filePath),
  
  onMenuNew: (callback: () => void) => {
    ipcRenderer.on('menu-new', callback)
    return () => ipcRenderer.removeListener('menu-new', callback)
  },
  onMenuOpen: (callback: () => void) => {
    ipcRenderer.on('menu-open', callback)
    return () => ipcRenderer.removeListener('menu-open', callback)
  },
  onMenuOpenFolder: (callback: () => void) => {
    ipcRenderer.on('menu-open-folder', callback)
    return () => ipcRenderer.removeListener('menu-open-folder', callback)
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu-save', callback)
    return () => ipcRenderer.removeListener('menu-save', callback)
  },
  onMenuSaveAs: (callback: () => void) => {
    ipcRenderer.on('menu-save-as', callback)
    return () => ipcRenderer.removeListener('menu-save-as', callback)
  },
  onMenuOpenRecent: (callback: (filePath: string) => void) => {
    ipcRenderer.on('menu-open-recent', (_, filePath) => callback(filePath))
    return () => ipcRenderer.removeListener('menu-open-recent', callback)
  },
  onMenuToggleTheme: (callback: () => void) => {
    ipcRenderer.on('menu-toggle-theme', callback)
    return () => ipcRenderer.removeListener('menu-toggle-theme', callback)
  },
  onCheckUnsaved: (callback: () => void) => {
    ipcRenderer.on('check-unsaved', callback)
    return () => ipcRenderer.removeListener('check-unsaved', callback)
  }
})
