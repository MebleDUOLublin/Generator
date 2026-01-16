const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // It's recommended to turn off nodeIntegration for security reasons,
      // and use a preload script to expose specific Node.js APIs to the renderer process.
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Instead of loading a remote URL, we load the local index.html file.
  mainWindow.loadFile('index.html');

  // Open the DevTools for debugging (optional)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // On macOS, applications and their menu bar stay active until the user quits
  // explicitly with Cmd + Q. On other platforms, we quit the app.
  if (process.platform !== 'darwin') app.quit();
});
