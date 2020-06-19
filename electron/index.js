const { app, dialog, ipcMain, shell, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");

const fs = require("fs");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");
const chokidar = require("chokidar");
const Promise = require("bluebird");

let mainWindow;

const startUrl = isDev
  ? "http://localhost:3000"
  : url.format({
      pathname: path.join(__dirname, "..", "build", "index.html"),
      protocol: "file:",
      slashes: true,
    });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.loadURL(startUrl);
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  autoUpdater.checkForUpdatesAndNotify();
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// Opens a new browser window suitable for image/pdf capturing/printing
function captureWindow(width, height) {
  return new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    enableLargerThanScreen: true,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });
}

// Goes to path in the app, and saves a PDF to filePath
function createPDF(path, filePath) {
  return new Promise((resolve, reject) => {
    let win = captureWindow();

    win.webContents.on("did-stop-loading", () => {
      setTimeout(() => {
        win.webContents
          .printToPDF({
            marginsType: 0,
            scaleFactor: 100,
            printBackground: true,
          })
          .then((buffer) => {
            fs.writeFileSync(filePath, buffer);
            win.close();
            resolve(filePath);
          });
      }, 500);
    });

    if (path.includes("?")) {
      path = `${path}&print=true`;
    } else {
      path = `${path}?print=true`;
    }
    win.loadURL(`${startUrl}#${path}`);
  });
}

ipcMain.on("pdf", (event, path) => {
  dialog
    .showSaveDialog(mainWindow, {
      title: "Save PDF",
      filters: [
        {
          name: "PDF Document",
          extensions: ["pdf"],
        },
      ],
    })
    .then(({ filePath, canceled }) => {
      if (canceled) {
        return false;
      }

      createPDF(path, filePath).then(shell.openPath);
    });
});

// Goes to path in the app, and saves a PNG to filePath of width x height
function createScreenshot(path, filePath, width, height) {
  return new Promise((resolve, reject) => {
    let win = captureWindow(width, height);

    win.webContents.on("did-stop-loading", () => {
      setTimeout(() => {
        win.webContents.capturePage().then((image) => {
          let buffer = image.toPNG();
          fs.writeFileSync(filePath, buffer);
          win.close();
          resolve(filePath);
        });
      }, 500);
    });

    if (path.includes("?")) {
      path = `${path}&print=true`;
    } else {
      path = `${path}?print=true`;
    }
    win.loadURL(`${startUrl}#${path}`);
  });
}

ipcMain.on("screenshot", (event, path, width, height) => {
  dialog
    .showSaveDialog(mainWindow, {
      title: "Save Screenshot",
      filters: [
        {
          name: "PNG Image",
          extensions: ["png"],
        },
      ],
    })
    .then(({ filePath, canceled }) => {
      if (canceled) {
        return false;
      }

      createScreenshot(path, filePath, width, height).then(shell.openPath);
    });
});

ipcMain.on("i18n", (event, filename) => {
  const file = `${app.getAppPath()}/${isDev ? "public" : "build"}/${filename}`;
  fs.readFile(file, "utf8", (err, data) => {
    if (err) {
      event.returnValue = { err };
    } else {
      let result;

      try {
        result = JSON.parse(data);
      } catch (err) {
        event.returnValue = { err };
      }

      event.returnValue = { result };
    }
  });
});

// File watching when games are loaded
let watcher;
ipcMain.on("watch", (event, path, id, slug) => {
  if (path) {
    if (watcher) {
      watcher.close();
    }

    watcher = chokidar.watch(path);
    watcher.on("change", (path) => {
      let json = fs.readFileSync(path);

      try {
        let game = JSON.parse(json);
        game.id = id;
        game.slug = slug;
        mainWindow.webContents.send("watch", game);
      } catch (e) {
        console.error(e);
      }
    });
  } else {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
  }
});
