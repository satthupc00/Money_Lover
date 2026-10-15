import './styles.css';
import { initStore, subscribe } from './store.js';
import { onView, view, setView } from './state.js';
import { onUpd, checkUpdate } from './updater.js';
import { applyReminder, getReminder, onReminderTap } from './reminder.js';
import { runLock } from './lock.js';
import { isNative, isElectron } from './platform.js';
import { initScrollbars } from './ui/common.js';
import { render, layout, openAdd, shortcuts } from './ui/shell.js';
import { ls, debounce } from './util.js';

const root = document.getElementById('root');
document.body.classList.toggle('electron', isElectron);
document.body.classList.toggle('native', isNative);
initScrollbars();
initStore();

async function boot() {
  await runLock(root);
  const draw = () => render(root);
  draw();
  const later = debounce(draw, 30);
  subscribe(later);
  onView(draw);
  onUpd(later);
  document.addEventListener('mml:rerender', later);
  let mode = layout();
  addEventListener('resize', debounce(() => { if (layout() !== mode) { mode = layout(); draw(); } else root.querySelectorAll('.tabs').length && draw(); }, 120));
  shortcuts(root);

  // ngày đổi (app mở qua đêm): cập nhật "hôm nay"
  let today = new Date().toDateString();
  setInterval(() => { if (new Date().toDateString() !== today) { today = new Date().toDateString(); setView({ cursor: new Date() }); } }, 60000);

  // nhắc nhở: lần đầu xin quyền thông báo
  const first = !ls.get('mml.asked');
  ls.set('mml.asked', true);
  applyReminder(getReminder(), first);
  onReminderTap(() => { setView({ tab: 'ledger' }); openAdd(); });

  if (isNative) {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', () => {
      const ov = document.querySelector('#overlay > :last-child');
      if (ov) { ov.querySelector('[data-x]')?.click() || ov.click(); if (ov.isConnected) ov.remove(); return; }
      if (view.tab !== 'ledger') { setView({ tab: 'ledger' }); return; }
      App.minimizeApp();
    });
  }
  setTimeout(checkUpdate, 2500);
}
boot();
