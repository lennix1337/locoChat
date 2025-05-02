const path = require('path');
const { app, BrowserWindow } = require('electron');

function createWindow() {
  // TDD Anchor: Test that a new BrowserWindow instance is created.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js') // Assuming a preload script might be needed later
    }
  });

  // TDD Anchor: Test that index.html is loaded correctly.
  win.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // TDD Anchor: Test that DevTools can be opened.
  // win.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// TDD Anchor: Test that createWindow is called when the app is ready.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    // TDD Anchor: Test that a new window is created on activate when no windows are open (macOS).
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// TDD Anchor: Test that the app quits when all windows are closed (non-macOS).
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// TDD Anchor: Test for any other necessary app lifecycle events.