// Khung app: PC (>= 1000px), Fold mở (600-999px, 2 cột), điện thoại (< 600px, 1 cột)
import { store, tops, gById, groupIds } from '../store.js';
import { view, setView, ui } from '../state.js';
import { upd } from '../updater.js';
import { updateAction } from './update.js';
import { getReminder } from '../reminder.js';
import { isElectron, isNative } from '../platform.js';
import { I } from '../icons.js';
import { esc, shortM, dkey, ymd, vnd } from '../util.js';
import { tile, placeTabs, dialog, syncTones, toast } from './common.js';
import { heroHtml, listHtml, wireLedger, periodTabs, periodNav, groupFilterChip, range, txRow } from './ledger.js';
import { mountTrend, mountBreakdown } from './trend.js';
import { openTxForm } from './add.js';
import { groupsDeskHtml, wireGroupsDesk, groupsMobileHtml, wireGroupsMobile } from './groups.js';
import { settingsHtml, wireSettings, updLabel } from './settings.js';

let pressedTab = null;
export const layout = () => (innerWidth >= 1000 ? 'desk' : innerWidth >= 600 ? 'tab' : 'phone');
export const openTx = (tx) => openTxForm(tx, { compact: layout() !== 'desk', date: view.period === 'day' ? ymd(view.cursor) : undefined });
export const openAdd = () => openTx(null);

const latestBadge = () => (upd.status === 'latest' ? '<span class="latest" title="Đang dùng bản mới nhất">LATEST</span>' : '');
// chấm tròn đồng bộ (chuẩn chung các app Mondiro): xám = chỉ trên máy, vàng nhấp nháy = đang đồng bộ, xanh lá = đồng bộ xong, đỏ = lỗi
const syncDot = () => { const t = syncText() + (store.user?.email ? ' · ' + store.user.email : ''); return `<button type="button" class="syncdot ${store.syncState}" data-syncdot title="${esc(t)}" aria-label="Đồng bộ: ${esc(t)}"><i></i></button>`; };
const syncText = () => ({ synced: 'Đã đồng bộ', pending: 'Đang đồng bộ…', error: 'Lỗi đồng bộ', local: 'Chỉ lưu trên máy' }[store.syncState] || '');

function updButton(desk) {
  const av = upd.status === 'available' || upd.status === 'ready';
  const label = av ? (upd.status === 'ready' ? 'Cài bản mới' : `Có bản mới ${upd.version}`) : upd.status === 'downloading' ? `Đang tải ${Math.round(upd.progress)}%` : 'Kiểm tra bản cập nhật';
  const ok = upd.status === 'latest';
  // PC: chỉ icon (chữ LATEST đã nằm cạnh tên app); điện thoại: icon + chữ "latest"
  if (desk) return `<button class="icb updbtn ${av ? 'upd-av' : ''} ${ok ? 'ok' : ''} ${upd.status === 'checking' ? 'spin' : ''}" type="button" data-upd title="${esc(av ? label : updLabel())}" aria-label="${esc(av ? 'Kiểm tra cập nhật · ' + label.toLowerCase() : 'Kiểm tra bản cập nhật')}">${I('refresh-cw')}</button>`;
  return `<button class="icb updbtn ${av ? 'upd-av' : ''} ${ok ? 'ok' : ''} ${upd.status === 'checking' ? 'spin' : ''}" type="button" data-upd title="${esc(av ? label : ok ? 'Kiểm tra cập nhật · đang dùng bản mới nhất' : 'Kiểm tra bản cập nhật')}" aria-label="${esc(ok ? 'Kiểm tra cập nhật · đang dùng bản mới nhất' : av ? 'Kiểm tra cập nhật · ' + label.toLowerCase() : label)}">${I('refresh-cw')}${ok ? '<span class="lt">latest</span>' : ''}</button>`;
}

function miniTree() {
  const [a, b] = range();
  const sums = {};
  for (const t of store.tx) if (t.type === 'exp' && !t.exclude && t.date >= a && t.date <= b) sums[t.groupId] = (sums[t.groupId] || 0) + t.amount;
  const total = (id) => groupIds(id).reduce((s, i) => s + (sums[i] || 0), 0);
  return tops('exp').map((g) => {
    const v = total(g.id);
    return `<button type="button" class="li ${view.group === g.id ? 'on' : ''}" data-fg="${g.id}">${tile(g, 34)}<span>${esc(g.name)}</span><em>${v ? shortM(v) : '–'}</em></button>`;
  }).join('');
}

const NAV = [['ledger', 'list', 'Sổ giao dịch'], ['report', 'chart-line', 'Báo cáo'], ['groups', 'folder-tree', 'Quản lý nhóm'], ['settings', 'settings', 'Cài đặt']];

function deskHtml() {
  const r = getReminder();
  let main = '';
  if (view.tab === 'ledger') {
    main = `<div class="bar">${periodTabs()}${periodNav()}${groupFilterChip()}<div class="spacer"></div><button class="btn primary" type="button" data-add title="Thêm giao dịch (Ctrl+N)">${I('plus')}Thêm giao dịch</button></div>
      <div class="grid2"><div class="scroll list daylist rise" data-key="list">${heroHtml()}${listHtml()}</div>
      <div class="panel scroll right rise" data-key="right"><div class="trend"></div></div></div>`;
  } else if (view.tab === 'report') {
    main = `<div class="bar">${monthNav()}<div class="spacer"></div><button class="btn primary" type="button" data-add>${I('plus')}Thêm giao dịch</button></div>
      <div class="page report"><div class="panel scroll card rise" data-key="rep1"><div class="trend"></div></div>
      <div class="panel scroll card brkcard rise" data-key="rep2"></div></div>`;
  } else if (view.tab === 'groups') main = groupsDeskHtml();
  else main = `<div class="bar"><h2 style="margin:0;font-size:21.5px;font-weight:800">Cài đặt</h2></div><div class="page settings scroll" data-key="set"><div>${settingsHtml()}</div></div>`;
  return `<div class="shell-desk desk">
    <header class="top"><div class="brand"><svg class="brand-icon" aria-hidden="true"><use href="#logo"/></svg>
      <div><div class="brand-name"><span class="m">Mon</span> <span class="a">Money Lover</span> ${latestBadge()}</div></div></div>
      <div class="spacer"></div><div style="display:flex;gap:8px;align-items:center">
      ${syncDot()}
      <button class="btn" type="button" data-search title="Tìm giao dịch (Ctrl+F)">${I('search')}Tìm</button>${updButton(true)}
      <button class="avatar" type="button" data-tab="settings" title="${esc(store.user?.email || 'Cài đặt')}">${esc((store.user?.email || 'M')[0].toUpperCase())}</button></div></header>
    <div class="body"><aside class="side"><nav class="nav">${NAV.map(([k, ic, n]) => `<button type="button" class="li ${view.tab === k ? 'on' : ''}" data-tab="${k}">${I(ic)}${n}</button>`).join('')}</nav>
      ${view.tab === 'ledger' ? `<h4>Nhóm chi · ${view.period === 'year' ? 'năm ' + view.cursor.getFullYear() : view.period === 'day' ? 'ngày này' : 'tháng ' + (view.cursor.getMonth() + 1)}</h4><div class="mini scroll" data-key="mini">${miniTree()}</div>` : ''}</aside>
      <main class="main">${main}</main></div>
    <footer class="foot"><button type="button" data-tab="settings">${I('bell')}${r.enabled ? `Nhắc nhập chi tiêu ${r.time} mỗi ngày` : 'Đang tắt nhắc nhở'}</button>
      <span>${I('cloud')} ${store.mode === 'cloud' ? 'Đồng bộ · ' + store.tx.length.toLocaleString('vi-VN') + ' giao dịch' : 'Lưu trên máy · ' + store.tx.length.toLocaleString('vi-VN') + ' giao dịch'}</span>
      <span class="credit">Created by Mondiro</span></footer></div>`;
}

const monthLabel = () => `Tháng ${view.cursor.getMonth() + 1}/${view.cursor.getFullYear()}`;
const monthNav = () => `<div class="period"><button class="icb" type="button" data-mshift="-1" title="Tháng trước">${I('chevron-left')}</button><span>${monthLabel()}</span><button class="icb" type="button" data-mshift="1" title="Tháng sau">${I('chevron-right')}</button></div>`;

function mobileHtml(mode) {
  const BN = [['ledger', 'list', 'Sổ'], ['report', 'chart-line', 'Báo cáo'], null, ['groups', 'folder-tree', 'Nhóm'], ['settings', 'settings', 'Cài đặt']];
  const ledgerCol = `${heroHtml()}${periodTabs()}<div class="mperiod">${periodNav()}${groupFilterChip()}</div><div class="daylist">${listHtml()}</div>`;
  const reportCards = `<div class="panel card"><div class="trend"></div></div><div class="panel card brkcard"></div>`;
  let body;
  if (view.tab === 'ledger' && mode === 'tab') body = `<div class="inner-grid"><div class="scroll" data-key="l">${ledgerCol}</div><div class="scroll" data-key="r">${reportCards}</div></div>`;
  else if (view.tab === 'ledger') body = `<div class="p-body scroll" data-key="p">${ledgerCol}</div>`;
  else if (view.tab === 'report') body = `<div class="p-body scroll" data-key="p"><div class="mperiod">${monthNav()}</div>${reportCards}</div>`;
  else if (view.tab === 'groups') body = `<div class="p-body scroll" data-key="p">${groupsMobileHtml()}</div>`;
  else body = `<div class="p-body scroll" data-key="p" style="${mode === 'tab' ? 'max-width:720px;margin:0 auto;width:100%' : ''}">${settingsHtml()}</div>`;
  return `<div class="shell-m ${mode}">
    <div class="p-top">${syncDot()}<button class="icb" type="button" data-search title="Tìm giao dịch" aria-label="Tìm giao dịch">${I('search')}</button>${updButton(false)}</div>
    ${body}
    <div class="credit p-credit">Created by Mondiro</div>
    <nav class="bnav">${BN.map((b) => b ? `<button type="button" class="${view.tab === b[0] ? 'on' : ''}" data-tab="${b[0]}">${I(b[1])}${b[2]}</button>` : `<button type="button" class="fab" data-add title="Thêm giao dịch" aria-label="Thêm giao dịch">${I('plus')}</button>`).join('')}</nav></div>`;
}

function searchBox() {
  const compact = layout() !== 'desk';
  const d = dialog(`<h3>${I('search')}Tìm giao dịch</h3><input class="inp" id="q" placeholder="Gõ ghi chú, tên nhóm hoặc số tiền" autocomplete="off"><div class="pick" id="qr" style="max-height:${compact ? '60vh' : '420px'}"></div>`, { wide: true });
  const q = d.el.querySelector('#q'), out = d.el.querySelector('#qr');
  const run = () => {
    const s = dkey(q.value.trim()), num = q.value.replace(/\D/g, '');
    if (!s) { out.innerHTML = '<p>Kết quả sẽ hiện ở đây.</p>'; return; }
    const res = store.tx.filter((t) => dkey(t.note).includes(s) || dkey(gById(t.groupId)?.name).includes(s) || (num.length >= 3 && String(t.amount).includes(num)))
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
    out.innerHTML = res.length ? res.map((t) => `<div><div class="lbl" style="padding:4px 8px 0">${t.date.split('-').reverse().join('/')}</div>${txRow(t)}</div>`).join('') : '<p>Không tìm thấy giao dịch nào.</p>';
    out.querySelectorAll('[data-tx]').forEach((b) => (b.onclick = () => { d.close(); openTx(store.tx.find((t) => t.id === b.dataset.tx)); }));
  };
  q.oninput = run; run();
  setTimeout(() => q.focus(), 50);
}

export function render(root) {
  if (ui.hold) { ui.pending = () => render(root); return; }
  const mode = layout();
  const keep = {};
  root.querySelectorAll('[data-key]').forEach((e) => (keep[e.dataset.key] = e.scrollTop));
  document.body.classList.toggle('desk', mode === 'desk');
  root.innerHTML = mode === 'desk' ? deskHtml() : mobileHtml(mode);
  root.querySelectorAll('[data-key]').forEach((e) => { if (keep[e.dataset.key]) e.scrollTop = keep[e.dataset.key]; });
  root.querySelectorAll('.rise').forEach((e) => { if (render.done) e.classList.remove('rise'); });
  render.done = true;
  placeTabs(root);
  syncTones(root);
  // đổi màn hình: nội dung hiện ra nhẹ từ dưới lên
  if (render.tab && render.tab !== view.tab) root.querySelector('.shell-m .p-body, .shell-m .inner-grid, .shell-desk .main')?.classList.add('screen-in');
  render.tab = view.tab;
  countBal(root);

  root.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { pressedTab = b.closest('.bnav') ? b.dataset.tab : null; setView({ tab: b.dataset.tab }); }));
  if (pressedTab) { const nb = root.querySelector(`.bnav [data-tab="${pressedTab}"]`); pressedTab = null; if (nb) { nb.classList.add('bounce'); setTimeout(() => nb.classList.remove('bounce'), 450); } }
  root.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => {
    if (b.classList.contains('fab')) { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); setTimeout(openAdd, 140); }
    else openAdd();
  }));
  swipePeriods(root);
  root.querySelectorAll('[data-search]').forEach((b) => (b.onclick = searchBox));
  root.querySelectorAll('[data-syncdot]').forEach((b) => (b.onclick = () => toast(store.syncState === 'local' ? 'Chỉ lưu trên máy này · đăng nhập trong Cài đặt để đồng bộ' : b.title)));
  root.querySelectorAll('[data-upd]').forEach((b) => (b.onclick = updateAction));
  root.querySelectorAll('[data-fg]').forEach((b) => (b.onclick = () => setView({ group: view.group === b.dataset.fg ? null : b.dataset.fg })));
  root.querySelectorAll('[data-mshift]').forEach((b) => (b.onclick = () => { const c = new Date(view.cursor); c.setMonth(c.getMonth() + +b.dataset.mshift, 1); setView({ cursor: c }); }));
  wireLedger(root, openTx);
  root.querySelectorAll('.trend').forEach((t) => mountTrend(t));
  root.querySelectorAll('.brkcard').forEach((b) => mountBreakdown(b));
  if (view.tab === 'groups') (mode === 'desk' ? wireGroupsDesk(root, () => render(root)) : wireGroupsMobile(root));
  if (view.tab === 'settings') wireSettings(root);
}

// số tổng trên thẻ Chi tiêu / Thu nhập chạy mượt tới giá trị mới thay vì nháy lại
const balAnim = { shown: null, raf: 0 };
function countBal(root) {
  const el = root.querySelector('.hero .bal');
  cancelAnimationFrame(balAnim.raf);
  if (!el || el.dataset.hidden) { balAnim.shown = null; return; }
  const to = +el.dataset.bal, from = balAnim.shown;
  if (from == null || from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) { balAnim.shown = to; return; }
  const t0 = performance.now(), dur = 480;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    balAnim.shown = Math.round(from + (to - from) * e);
    el.textContent = vnd(balAnim.shown);
    if (p < 1) balAnim.raf = requestAnimationFrame(step);
  };
  el.textContent = vnd(from);
  balAnim.raf = requestAnimationFrame(step);
}

export function shortcuts(root) {
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('#overlay > *, .lockscreen')) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); openAdd(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); searchBox(); }
    else if (!typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (view.tab === 'ledger' || view.tab === 'report')) {
      root.querySelector(view.tab === 'ledger' ? `[data-shift="${e.key === 'ArrowLeft' ? -1 : 1}"]` : `[data-mshift="${e.key === 'ArrowLeft' ? -1 : 1}"]`)?.click();
    }
  });
}
export { isElectron, isNative };

// vuốt mạnh sang trái / phải trên sổ giao dịch hoặc báo cáo để xem kỳ sau / kỳ trước
function swipePeriods(root) {
  const zones = root.querySelectorAll('.shell-m .p-body, .shell-m .inner-grid > div:first-child, .shell-desk .list');
  zones.forEach((z) => {
    if (!['ledger', 'report', 'groups'].includes(view.tab)) return;
    let x0 = 0, y0 = 0, t0 = 0, active = false;
    z.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1 || e.target.closest('svg.tchart, .gmenu, .quick, input')) { active = false; return; }
      active = true; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
    }, { passive: true });
    z.addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0, dt = Date.now() - t0;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 600) return;
      const k = dx < 0 ? 1 : -1;
      if (view.tab === 'groups') {
        // vuốt để đổi qua lại nhóm chi / nhóm thu
        const next = k > 0 ? 'inc' : 'exp';
        if (next === view.gmType) return;
        document.body.dataset.swipe = k > 0 ? 'next' : 'prev';
        setView({ gmType: next });
        setTimeout(() => delete document.body.dataset.swipe, 400);
        return;
      }
      const sel = view.tab === 'report' ? `[data-mshift="${k}"]` : `[data-shift="${k}"]`;
      const btn = root.querySelector(sel);
      if (!btn) return;
      document.body.dataset.swipe = k > 0 ? 'next' : 'prev';
      btn.click();
      setTimeout(() => delete document.body.dataset.swipe, 400);
    }, { passive: true });
  });
}
