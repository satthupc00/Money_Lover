const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mondiro', {
  checkUpdate: () => ipcRenderer.send('update:check'),
  downloadUpdate: () => ipcRenderer.send('update:download'),
  installUpdate: () => ipcRenderer.send('update:install'),
  onUpdate: (cb) => ipcRenderer.on('update', (_e, d) => cb(d)),
  setReminder: (r) => ipcRenderer.send('reminder:set', r),
  onOpenAdd: (cb) => ipcRenderer.on('open-add', () => cb()),
  getPrefs: () => ipcRenderer.invoke('prefs:get'),
  setPrefs: (p) => ipcRenderer.invoke('prefs:set', p),
});
