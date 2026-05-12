import { app, BrowserWindow, ipcMain, dialog, Menu, MenuItemConstructorOptions } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null
let canClose = false

const RECENT_FILES_KEY = 'recentFiles'
const MAX_RECENT_FILES = 10
let recentFiles: string[] = []
let currentFilePath: string | null = null

function loadRecentFiles() {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      recentFiles = config[RECENT_FILES_KEY] || []
    } catch {
      recentFiles = []
    }
  }
}

function saveRecentFiles() {
  const configPath = path.join(app.getPath('userData'), 'config.json')
  const config = { [RECENT_FILES_KEY]: recentFiles }
  fs.writeFileSync(configPath, JSON.stringify(config))
}

function addRecentFile(filePath: string) {
  recentFiles = recentFiles.filter(f => f !== filePath)
  recentFiles.unshift(filePath)
  recentFiles = recentFiles.slice(0, MAX_RECENT_FILES)
  saveRecentFiles()
  updateApplicationMenu()
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('close', (e) => {
    if (!canClose && win) {
      win.webContents.send('check-unsaved')
      e.preventDefault()
    }
  })
}

function updateApplicationMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => win?.webContents.send('menu-new')
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => win?.webContents.send('menu-open')
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => win?.webContents.send('menu-open-folder')
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => win?.webContents.send('menu-save')
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        {
          label: '最近打开',
          submenu: recentFiles.length > 0
            ? recentFiles.map((filePath, index) => ({
                label: path.basename(filePath),
                accelerator: index < 10 ? `CmdOrCtrl+${index}` : undefined,
                click: () => win?.webContents.send('menu-open-recent', filePath)
              }))
            : [{ label: '无', enabled: false }]
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换主题',
          accelerator: 'CmdOrCtrl+T',
          click: () => win?.webContents.send('menu-toggle-theme')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  loadRecentFiles()
  createWindow()
  updateApplicationMenu()

  app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
      allWindows[0].focus()
    } else {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }]
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    addRecentFile(filePath)
    currentFilePath = filePath
    return { filePath, content }
  }
  return null
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0]
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
      .map(f => ({
        name: f,
        path: path.join(folderPath, f)
      }))
    return { folderPath, files }
  }
  return null
})

ipcMain.handle('file:read', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    addRecentFile(filePath)
    currentFilePath = filePath
    return { filePath, content }
  } catch {
    return null
  }
})

ipcMain.handle('file:list', async (_, folderPath: string) => {
  try {
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.md') || f.endsWith('.markdown'))
      .map(f => ({
        name: f,
        path: path.join(folderPath, f)
      }))
    return files
  } catch {
    return []
  }
})

ipcMain.handle('dialog:saveFile', async (_, content: string, defaultPath?: string) => {
  const filePath = defaultPath || currentFilePath
  if (filePath) {
    fs.writeFileSync(filePath, content)
    addRecentFile(filePath)
    currentFilePath = filePath
    return filePath
  }
  const result = await dialog.showSaveDialog({
    filters: [{ name: 'Markdown Files', extensions: ['md'] }],
    defaultPath: 'untitled.md'
  })
  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content)
    addRecentFile(result.filePath)
    currentFilePath = result.filePath
    return result.filePath
  }
  return null
})

ipcMain.handle('confirm:close', async () => {
  const result = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['保存', '不保存', '取消'],
    defaultId: 0,
    title: '确认',
    message: '文件有未保存的更改，是否保存？'
  })
  return result.response
})

ipcMain.on('app:close', () => {
  canClose = true
  app.quit()
})

ipcMain.on('file:set-current', (_, filePath: string | null) => {
  currentFilePath = filePath
})
