// Kiểm tra bản cập nhật: Electron dùng electron-updater, Android/web đọc GitHub Releases
import { isElectron, isNative, APP_VERSION, REPO } from './platform.js';

export const upd = { status: 'idle', version: '', progress: 0, apkUrl: '', error: '' };
const subs = new Set();
export const onUpd = (f) => { subs.add(f); return () => subs.delete(f); };
const emit = () => subs.forEach((f) => f());
const set = (p) => { Object.assign(upd, p); emit(); };

export function newer(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number), pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) > (pb[i] || 0)) return true; if ((pa[i] || 0) < (pb[i] || 0)) return false; }
  return false;
}

if (isElectron) {
  window.mondiro.onUpdate((e) => {
    if (e.type === 'available') set({ status: 'available', version: e.version });
    else if (e.type === 'latest') set({ status: 'latest' });
    else if (e.type === 'progress') set({ status: 'downloading', progress: e.percent });
    else if (e.type === 'downloaded') set({ status: 'ready', version: e.version });
    else if (e.type === 'error') set({ status: 'error', error: e.message });
  });
}

export async function checkUpdate() {
  if (upd.status === 'checking' || upd.status === 'downloading') return;
  set({ status: 'checking', error: '' });
  if (isElectron) { window.mondiro.checkUpdate(); return; }
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (r.status === 404) { set({ status: 'latest' }); return; }
    if (!r.ok) throw new Error('GitHub trả về ' + r.status);
    const j = await r.json();
    const apk = (j.assets || []).find((a) => a.name.endsWith('.apk'));
    if (newer(j.tag_name, APP_VERSION)) set({ status: 'available', version: j.tag_name.replace(/^v/, ''), apkUrl: apk?.browser_download_url || j.html_url });
    else set({ status: 'latest' });
  } catch (e) {
    set({ status: 'error', error: 'Không kiểm tra được: ' + (e.message || e) });
  }
}

export async function installUpdate() {
  if (isElectron) {
    if (upd.status === 'ready') window.mondiro.installUpdate();
    else { set({ status: 'downloading', progress: 0 }); window.mondiro.downloadUpdate(); }
    return;
  }
  const url = upd.apkUrl || `https://github.com/${REPO}/releases/latest`;
  if (isNative) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else window.open(url, '_blank');
}
