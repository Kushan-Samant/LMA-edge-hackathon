const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    isFirstLaunch: () => ipcRenderer.invoke('get-first-launch'),
    googleOAuth: () => ipcRenderer.invoke('google-oauth')
});
