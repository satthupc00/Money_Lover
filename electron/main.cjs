// Mondiro Mon Money Lover · app PC (Electron)
const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, protocol, net, nativeImage, shell, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { autoUpdater } = require('electron-updater');

const APP_ID = 'com.mondiro.monmoneylover';
const DIST = path.join(__dirname, '..', 'dist');
const ICON = path.join(__dirname, 'icon.png');
const PREFS = () => path.join(app.getPath('userData'), 'prefs.json');

let win = null, tray = null, quitting = false, toldTray = false;
let prefs = { tray: true, autostart: false, reminder: { enabled: true, time: '20:00' }, lastFired: '', bounds: null };
try { prefs = { ...prefs, ...JSON.parse(fs.readFileSync(PREFS(), 'utf8')) }; } catch { /* lần đầu */ }
const savePrefs = () => { try { fs.writeFileSync(PREFS(), JSON.stringify(prefs, null, 1)); } catch { /* bỏ qua */ } };

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => showWin());
app.setAppUserModelId(APP_ID);

function boundsOk(b) {
  if (!b) return false;
  return screen.getAllDisplays().some((d) => b.x >= d.workArea.x - 50 && b.y >= d.workArea.y - 50 && b.x + 200 <= d.workArea.x + d.workArea.width && b.y + 100 <= d.workArea.y + d.workArea.height);
}

function createWindow(hidden) {
  const b = boundsOk(prefs.bounds) ? prefs.bounds : { width: 1280, height: 820 };
  win = new BrowserWindow({
    ...b, minWidth: 1000, minHeight: 660, show: false, title: 'Mondiro Mon Money Lover', icon: ICON,
    backgroundColor: '#FFF6EC',
    titleBarStyle: 'hidden', titleBarOverlay: { color: '#3E2A22', symbolColor: '#FFFFFF', height: 58 },
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  if (prefs.maximized) win.maximize();
  win.loadURL('app://local/index.html');
  win.once('ready-to-show', () => { if (!hidden) win.show(); });
  const keep = () => { if (!win.isMaximized() && !win.isMinimized()) prefs.bounds = win.getBounds(); prefs.maximized = win.isMaximized(); savePrefs(); };
  win.on('resize', keep); win.on('move', keep);
  win.on('close', (e) => {
    if (!quitting && prefs.tray) {
      e.preventDefault(); win.hide();
      if (!toldTray) { toldTray = true; notify('Mon Money Lover vẫn chạy ở khay hệ thống', 'Để nhắc bạn ghi chi tiêu. Chuột phải vào icon ở khay để thoát.'); }
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}

function showWin() { if (!win) return; if (win.isMinimized()) win.restore(); win.show(); win.focus(); }
const send = (ch, data) => win && !win.isDestroyed() && win.webContents.send(ch, data);

function notify(title, body, onClick) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, icon: ICON, silent: false });
  if (onClick) n.on('click', onClick);
  n.show();
}

function makeTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip('Mondiro Mon Money Lover');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Mở Mon Money Lover', click: showWin },
    { label: 'Thêm giao dịch', click: () => { showWin(); send('open-add'); } },
    { type: 'separator' },
    { label: 'Thoát', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', showWin);
}

// nhắc nhập chi tiêu mỗi ngày
function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
setInterval(() => {
  const r = prefs.reminder;
  if (!r?.enabled) return;
  const d = new Date(), hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (hm >= r.time && prefs.lastFired !== today() && hm < addMin(r.time, 60)) {
    prefs.lastFired = today(); savePrefs();
    notify('Hôm nay bạn tiêu gì rồi?', 'Bấm để ghi lại chi tiêu hôm nay.', () => { showWin(); send('open-add'); });
  }
}, 20000);
function addMin(t, m) { const [h, mm] = t.split(':').map(Number); const x = h * 60 + mm + m; return `${String(Math.min(23, Math.floor(x / 60))).padStart(2, '0')}:${String(x >= 24 * 60 ? 59 : x % 60).padStart(2, '0')}`; }

// tự cập nhật từ GitHub Releases
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('update-available', (i) => send('update', { type: 'available', version: i.version, notes: typeof i.releaseNotes === 'string' ? i.releaseNotes.replace(/<[^>]+>/g, '\n').replace(/\n{2,}/g, '\n').trim() : '' }));
autoUpdater.on('update-not-available', () => send('update', { type: 'latest' }));
autoUpdater.on('download-progress', (p) => send('update', { type: 'progress', percent: p.percent }));
autoUpdater.on('update-downloaded', (i) => send('update', { type: 'downloaded', version: i.version }));
autoUpdater.on('error', (e) => send('update', { type: 'error', message: 'Không kiểm tra được bản cập nhật (' + (e?.message || e).toString().slice(0, 80) + ')' }));

ipcMain.on('update:check', () => {
  if (!app.isPackaged) { send('update', { type: 'latest' }); return; }
  autoUpdater.checkForUpdates().catch(() => {});
});
ipcMain.on('update:download', () => autoUpdater.downloadUpdate().catch(() => {}));
ipcMain.on('update:install', () => { quitting = true; autoUpdater.quitAndInstall(false, true); });
ipcMain.on('reminder:set', (_e, r) => { prefs.reminder = { enabled: !!r.enabled, time: r.time || '20:00' }; savePrefs(); });
ipcMain.handle('prefs:get', () => ({ tray: prefs.tray, autostart: prefs.autostart }));
ipcMain.handle('prefs:set', (_e, p) => {
  if ('tray' in p) prefs.tray = !!p.tray;
  if ('autostart' in p) { prefs.autostart = !!p.autostart; app.setLoginItemSettings({ openAtLogin: prefs.autostart, args: ['--hidden'] }); }
  savePrefs();
  return { tray: prefs.tray, autostart: prefs.autostart };
});

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let p = path.normalize(path.join(DIST, decodeURIComponent(u.pathname)));
    if (!p.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(DIST, 'index.html');
    return net.fetch(pathToFileURL(p).toString());
  });
  Menu.setApplicationMenu(null);
  makeTray();
  createWindow(process.argv.includes('--hidden'));
});
app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && !prefs.tray) app.quit(); });
