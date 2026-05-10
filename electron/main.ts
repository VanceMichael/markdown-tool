import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { writeFile, readFile, readdir, lstat } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1'

const RECENT_FILES_KEY = 'recentFiles'
const MAX_RECENT_FILES = 10

let mainWindow: BrowserWindow | null = null
let appSettings: any = {
  recentFiles: [],
  theme: 'light'
}

function loadSettings() {
  try {
    const userDataPath = app.getPath('userData')
    const settingsPath = join(userDataPath, 'settings.json')
    const data = readFile(settingsPath, 'utf-8')
    data.then((d) => {
      appSettings = JSON.parse(d)
    }).catch(() => {
      console.log('No settings found, using defaults')
    })
  } catch (e) {
    console.log('No settings found, using defaults')
  }
}

function saveSettings() {
  try {
    const userDataPath = app.getPath('userData')
    const settingsPath = join(userDataPath, 'settings.json')
    writeFile(settingsPath, JSON.stringify(appSettings, null, 2)).catch((e) => {
      console.error('Failed to save settings:', e)
    })
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

function getRecentFiles(): string[] {
  return appSettings[RECENT_FILES_KEY] || []
}

function addRecentFile(filePath: string) {
  let recent = getRecentFiles()
  recent = recent.filter(f => f !== filePath)
  recent.unshift(filePath)
  recent = recent.slice(0, MAX_RECENT_FILES)
  appSettings[RECENT_FILES_KEY] = recent
  saveSettings()
  buildMenu()
}

function clearRecentFiles() {
  appSettings[RECENT_FILES_KEY] = []
  saveSettings()
  buildMenu()
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (mainWindow) {
      mainWindow.webContents.send('before-close')
      e.preventDefault()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-file')
            }
          }
        },
        {
          label: '打开',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-file')
            }
          }
        },
        {
          label: '打开文件夹作为工作区',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-open-workspace')
            }
          }
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-file')
            }
          }
        },
        {
          label: '另存为',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-save-as')
            }
          }
        },
        { type: 'separator' },
        {
          label: '最近打开的文件',
          submenu: [
            ...getRecentFiles().map((file, index) => ({
              label: file,
              click: () => {
                if (mainWindow) {
                  mainWindow.webContents.send('menu-open-recent', file)
                }
              }
            })),
            { type: 'separator' },
            {
              label: '清除最近文件列表',
              click: () => clearRecentFiles()
            }
          ]
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
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-toggle-theme')
            }
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: 'Markdown Writer',
              detail: '一个简单的本地 Markdown 写作工具'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  loadSettings()
  createWindow()
  buildMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('dialog-new-file', async () => {
  const result = await dialog.showSaveDialog({
    title: '新建文件',
    filters: [{ name: 'Markdown 文件', extensions: ['md'] }],
    defaultPath: 'untitled.md'
  })
  if (!result.canceled && result.filePath) {
    await writeFile(result.filePath, '')
    return result.filePath
  }
  return null
})

ipcMain.handle('dialog-open-file', async () => {
  const result = await dialog.showOpenDialog({
    title: '打开文件',
    filters: [{ name: 'Markdown 文件', extensions: ['md', 'markdown'] }],
    properties: ['openFile']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('dialog-open-workspace', async () => {
  const result = await dialog.showOpenDialog({
    title: '选择工作区文件夹',
    properties: ['openDirectory']
  })
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('dialog-save-as', async (_event, content: string) => {
  const result = await dialog.showSaveDialog({
    title: '另存为',
    filters: [{ name: 'Markdown 文件', extensions: ['md'] }],
    defaultPath: 'untitled.md'
  })
  if (!result.canceled && result.filePath) {
    await writeFile(result.filePath, content)
    return result.filePath
  }
  return null
})

ipcMain.handle('file-read', async (_event, filePath: string) => {
  const content = await readFile(filePath, 'utf-8')
  return content
})

ipcMain.handle('file-write', async (_event, filePath: string, content: string) => {
  await writeFile(filePath, content)
  return true
})

ipcMain.handle('file-add-recent', async (_event, filePath: string) => {
  addRecentFile(filePath)
  return true
})

ipcMain.handle('get-recent-files', async () => {
  return getRecentFiles()
})

ipcMain.handle('workspace-list-md', async (_event, dirPath: string) => {
  const files = await readdir(dirPath)
  const mdFiles: string[] = []
  for (const file of files) {
    const fullPath = join(dirPath, file)
    const stats = await lstat(fullPath)
    if (stats.isFile() && /\.(md|markdown)$/i.test(file)) {
      mdFiles.push(file)
    }
  }
  mdFiles.sort()
  return mdFiles
})

ipcMain.handle('confirm-close', async (_event, hasUnsaved: boolean) => {
  if (hasUnsaved) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: '未保存的更改',
      message: '您有未保存的更改，确定要关闭吗？',
      buttons: ['取消', '不保存并关闭', '保存'],
      defaultId: 0,
      cancelId: 0
    })
    return result.response
  }
  return 1
})

ipcMain.handle('force-close', async () => {
  if (mainWindow) {
    mainWindow.destroy()
  }
  return true
})
