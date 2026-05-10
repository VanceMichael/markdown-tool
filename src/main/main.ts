import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

let mainWindow: BrowserWindow | null = null

const RECENT_FILES_KEY = 'recentFiles'
const MAX_RECENT = 10
let recentFiles: string[] = []

const recentFilePath = path.join(app.getPath('userData'), 'recent-files.json')
const workspacePath = path.join(app.getPath('userData'), 'workspace.json')

function loadRecentFiles(): string[] {
  try {
    if (fs.existsSync(recentFilePath)) {
      return JSON.parse(fs.readFileSync(recentFilePath, 'utf-8'))
    }
  } catch {}
  return []
}

function saveRecentFiles(files: string[]) {
  fs.writeFileSync(recentFilePath, JSON.stringify(files), 'utf-8')
}

function addRecentFile(filePath: string) {
  const normalized = path.resolve(filePath)
  recentFiles = recentFiles.filter(f => path.resolve(f) !== normalized)
  recentFiles.unshift(normalized)
  if (recentFiles.length > MAX_RECENT) recentFiles = recentFiles.slice(0, MAX_RECENT)
  saveRecentFiles(recentFiles)
  rebuildMenu()
}

function loadWorkspace(): string | null {
  try {
    if (fs.existsSync(workspacePath)) {
      return JSON.parse(fs.readFileSync(workspacePath, 'utf-8')).path
    }
  } catch {}
  return null
}

function saveWorkspace(dir: string) {
  fs.writeFileSync(workspacePath, JSON.stringify({ path: dir }), 'utf-8')
}

function rebuildMenu() {
  const recentMenuItems = recentFiles.length > 0
    ? recentFiles.map(f => ({
        label: path.basename(f),
        sublabel: path.dirname(f),
        click: () => {
          mainWindow?.webContents.send('open-file', f)
          addRecentFile(f)
        }
      }))
    : [{ label: '(无最近文件)', enabled: false }]

  const template: any[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu-new')
        },
        {
          label: '打开...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            const result = dialog.showOpenDialogSync(mainWindow!, {
              filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
              properties: ['openFile']
            })
            if (result && result[0]) {
              mainWindow?.webContents.send('open-file', result[0])
              addRecentFile(result[0])
            }
          }
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu-save')
        },
        {
          label: '另存为...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        { label: '最近打开的文件', submenu: recentMenuItems },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5180')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'))
  }

  mainWindow.on('close', (e) => {
    mainWindow?.webContents.send('window-close-request')
    e.preventDefault()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  recentFiles = loadRecentFiles()
  rebuildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('fs-read-file', async (_e, filePath: string) => {
  try {
    return { ok: true, data: fs.readFileSync(filePath, 'utf-8') }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('fs-write-file', async (_e, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('dialog-open-file', async () => {
  const result = dialog.showOpenDialogSync(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    properties: ['openFile']
  })
  if (result && result[0]) {
    addRecentFile(result[0])
    return result[0]
  }
  return null
})

ipcMain.handle('dialog-save-file', async (_e, defaultName?: string) => {
  const result = dialog.showSaveDialogSync(mainWindow!, {
    defaultPath: defaultName || 'untitled.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  return result || null
})

ipcMain.handle('dialog-open-folder', async () => {
  const result = dialog.showOpenDialogSync(mainWindow!, {
    properties: ['openDirectory']
  })
  if (result && result[0]) {
    saveWorkspace(result[0])
    return result[0]
  }
  return null
})

ipcMain.handle('workspace-list-files', async (_e, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const files = entries
      .filter(e => e.isFile() && /\.(md|markdown)$/i.test(e.name))
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return { ok: true, files }
  } catch (err: any) {
    return { ok: false, error: err.message, files: [] }
  }
})

ipcMain.handle('workspace-get-saved', async () => {
  return loadWorkspace()
})

ipcMain.handle('recent-files-get', async () => {
  return recentFiles
})

ipcMain.handle('recent-files-add', async (_e, filePath: string) => {
  addRecentFile(filePath)
})

ipcMain.handle('app-quit', () => {
  mainWindow?.removeAllListeners('close')
  mainWindow?.close()
  app.quit()
})

ipcMain.handle('path-basename', (_e, filePath: string) => {
  return path.basename(filePath)
})
