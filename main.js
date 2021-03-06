const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const dataStore = require('./renderer/dataStore')
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

const myStorage = new dataStore({
  'name': 'Music Data'
});

//查看本机缓存位置
const STORE_PATH = app.getPath('userData')
console.log(STORE_PATH)

class AppWindow extends BrowserWindow {
  constructor(config, fileLocation) {
    const basicConfig = {
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    };

    const finalConfig = Object.assign(basicConfig, config);
    super(finalConfig);
    this.loadFile(fileLocation);
    this.once("ready-to-show", () => {
      this.show();
    });
  }
}

app.on("ready", () => {
  const mainWindow = new AppWindow({}, "./renderer/index.html");
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.send('getTracks', myStorage.getTracks())
  })

  ipcMain.on("add-music-window", () => {
    const addWindow = new AppWindow(
      {
        width: 500,
        height: 500,
        parent: mainWindow,
      },
      "./renderer/add.html"
    );
  });

  ipcMain.on('add-tracks', (event,tracks) => {
    const updatedTracks = myStorage.addTracks(tracks).getTracks()
    mainWindow.send('getTracks', updatedTracks)
  })

  ipcMain.on('delete-track', (event,id) => {
    const updatedTracks = myStorage.deleteTrack(id).getTracks()
    mainWindow.send('getTracks', updatedTracks)
  })

  ipcMain.on("open-music-files", (event) => {
    dialog
      .showOpenDialog({
        properties: ["openFile", "multiSelections"],
        filters: [
          {
            name: "music",
            extensions: ["mp3"],
          },
        ],
      })
      .then((files) => {
        if (files) {
          event.sender.send("selected-files", files.filePaths);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  });
});
