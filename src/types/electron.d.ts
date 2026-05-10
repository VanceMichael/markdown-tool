export interface API {
  newFile: () => Promise<string | null>
  openFile: () => Promise<string | null>
  openWorkspace: () => Promise<string | null>
  saveAs: (content: string) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  addRecentFile: (filePath: string) => Promise<boolean>
  getRecentFiles: () => Promise<string[]>
  listWorkspaceFiles: (dirPath: string) => Promise<string[]>
  confirmClose: (hasUnsaved: boolean) => Promise<number>
  forceClose: () => Promise<boolean>
  onMenuNewFile: (callback: () => void) => void
  onMenuOpenFile: (callback: () => void) => void
  onMenuOpenWorkspace: (callback: () => void) => void
  onMenuSaveFile: (callback: () => void) => void
  onMenuSaveAs: (callback: () => void) => void
  onMenuOpenRecent: (callback: (filePath: string) => void) => void
  onMenuToggleTheme: (callback: () => void) => void
  onBeforeClose: (callback: () => void) => void
}

declare global {
  interface Window {
    api: API
  }
}

export {}
