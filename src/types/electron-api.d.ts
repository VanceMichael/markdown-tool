export interface FileInfo {
  name: string
  path: string
}

export interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>
  openFolder: () => Promise<{ folderPath: string; files: FileInfo[] } | null>
  readFile: (filePath: string) => Promise<{ filePath: string; content: string } | null>
  listFiles: (folderPath: string) => Promise<FileInfo[]>
  saveFile: (content: string, defaultPath?: string) => Promise<string | null>
  confirmClose: () => Promise<number>
  closeApp: () => void
  setCurrentFile: (filePath: string | null) => void

  onMenuNew: (callback: () => void) => () => void
  onMenuOpen: (callback: () => void) => () => void
  onMenuOpenFolder: (callback: () => void) => () => void
  onMenuSave: (callback: () => void) => () => void
  onMenuSaveAs: (callback: () => void) => () => void
  onMenuOpenRecent: (callback: (filePath: string) => void) => () => void
  onMenuToggleTheme: (callback: () => void) => () => void
  onCheckUnsaved: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
