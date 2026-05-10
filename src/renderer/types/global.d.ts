export {}

declare global {
  interface Window {
    electronAPI: {
      fsReadFile: (filePath: string) => Promise<{ ok: boolean; data?: string; error?: string }>
      fsWriteFile: (filePath: string, content: string) => Promise<{ ok: boolean; error?: string }>
      dialogOpenFile: () => Promise<string | null>
      dialogSaveFile: (defaultName?: string) => Promise<string | null>
      dialogOpenFolder: () => Promise<string | null>
      workspaceListFiles: (dirPath: string) => Promise<{ ok: boolean; files: { name: string; path: string }[]; error?: string }>
      workspaceGetSaved: () => Promise<string | null>
      recentFilesGet: () => Promise<string[]>
      recentFilesAdd: (filePath: string) => Promise<void>
      appQuit: () => Promise<void>
      pathBasename: (filePath: string) => Promise<string>

      onMenuNew: (cb: () => void) => void
      onMenuSave: (cb: () => void) => void
      onMenuSaveAs: (cb: () => void) => void
      onOpenFile: (cb: (_e: any, filePath: string) => void) => void
      onWindowCloseRequest: (cb: () => void) => void
    }
  }
}
