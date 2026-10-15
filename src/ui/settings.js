// Cài đặt: tài khoản đồng bộ, nhắc nhở, khoá ứng dụng, cập nhật, dữ liệu
import { store, signIn, signUp, signOutUser, resetPassword } from '../store.js';
import { parseConfig, saveConfig, clearConfig, hasBuiltinConfig } from '../firebase.js';
import { getReminder, applyReminder } from '../reminder.js';
import { lockCfg, saveLockCfg, setCode, bioAvailable } from '../lock.js';
import { upd, checkUpdate, installUpdate } from '../updater.js';
import { isNative, isElectron, APP_VERSION } from '../platform.js';
import { I } from '../icons.js';
import { esc, ymd } from '../util.js';
import { dialog, toast, confirmBox } from './common.js';
import { gById } from '../store.js';

let bioOk = null;
let prefs = null;

const row = (icon, title, sub, right) => `<div class="set-row">${I(icon, 'ic')}<div class="t"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${right || ''}</div>`;
const syncText = () => ({ synced: 'Đã đồng bộ', pending: 'Đang đồng bộ…', error: 'Lỗi đồng bộ, sẽ thử lại', local: 'Chỉ lưu trên máy này' }[store.syncState] || '');

export function updLabel() {
  return { idle: 'Bấm để kiểm tra', checking: 'Đang kiểm tra…', latest: 'Bạn đang dùng bản mới nhất', available: `Có bản mới ${upd.version}`, downloading: `Đang tải ${Math.round(upd.progress || 0)}%`, ready: 'Đã tải xong, bấm để cài', error: upd.error || 'Không kiểm tra được' }[upd.status];
}

export function settingsHtml() {
  const r = getReminder(), lk = lockCfg();
  if (bioOk === null && isNative) bioAvailable().then((v) => { bioOk = v; document.dispatchEvent(new Event('mml:rerender')); });
  if (prefs === null && isElectron) window.mondiro.getPrefs().then((p) => { prefs = p; document.dispatchEvent(new Event('mml:rerender')); });
  let acc;
  if (!store.fbReady) acc = row('cloud', 'Chưa kết nối Firebase', 'Dữ liệu đang lưu trên máy này. Kết nối để đồng bộ PC và điện thoại.', '<button class="btn primary" type="button" data-fbsetup>Kết nối</button>');
  else if (!store.user) acc = `<div class="set-row" style="display:grid;gap:8px">
      <div style="display:flex;gap:12px;align-items:center">${I('cloud', 'ic')}<div class="t"><b>Đăng nhập để đồng bộ</b><small>Dùng cùng một tài khoản trên PC và điện thoại</small></div></div>
      <form class="two" data-login autocomplete="on"><input class="inp" type="email" name="email" placeholder="Email" autocomplete="username" required><input class="inp" type="password" name="pass" placeholder="Mật khẩu (từ 6 ký tự)" autocomplete="current-password" required minlength="6">
      <div class="actions" style="grid-column:1/-1;justify-content:flex-start"><button class="btn primary" type="submit" data-mode="in">Đăng nhập</button><button class="btn" type="submit" data-mode="up">Tạo tài khoản</button><button class="linkbtn" type="button" data-forgotpw>Quên mật khẩu?</button></div></form></div>`;
  else acc = row('cloud', esc(store.user.email), syncText(), '<button class="btn" type="button" data-logout>Đăng xuất</button>');
  const updBtn = upd.status === 'available' || upd.status === 'ready'
    ? `<button class="btn upd-av" type="button" data-install>${I('refresh-cw')}${upd.status === 'ready' ? 'Cài và mở lại' : isElectron ? 'Tải bản mới' : 'Tải về'}</button>`
    : `<button class="btn ${upd.status === 'checking' ? 'spin' : ''}" type="button" data-check>${I('refresh-cw')}Kiểm tra bản cập nhật</button>`;
  return `<div class="set-h">Tài khoản và đồng bộ</div><div class="set-group">${acc}
      ${store.fbReady && !hasBuiltinConfig() && !store.user ? '<button class="linkbtn" type="button" data-fbclear style="justify-self:start">Đổi dự án Firebase</button>' : ''}</div>
    <div class="set-h">Nhắc nhở</div><div class="set-group">
      ${row('bell', 'Nhắc nhập chi tiêu mỗi ngày', isNative || isElectron ? 'Hiện thông báo vào giờ đã chọn' : 'Chỉ hoạt động trên app PC và điện thoại', `<input class="inp time" type="time" value="${r.time}" data-rtime aria-label="Giờ nhắc"><input type="checkbox" class="switch" data-rtoggle ${r.enabled ? 'checked' : ''} aria-label="Bật nhắc nhở">`)}</div>
    <div class="set-h">Khoá ứng dụng</div><div class="set-group">
      ${row('lock-keyhole', 'Khoá khi mở app', isNative ? 'Hỏi mã PIN hoặc vân tay mỗi lần mở lại app' : 'Hỏi mã khoá mỗi lần mở lại app', `<input type="checkbox" class="switch" data-lktoggle ${lk.enabled !== false ? 'checked' : ''} aria-label="Bật khoá">`)}
      ${lk.enabled !== false && lk.hash ? row('key-round', isNative ? 'Đổi mã PIN' : 'Đổi mã khoá', 'Mã chỉ lưu trên máy này', '<button class="btn" type="button" data-chcode>Đổi mã</button>') : ''}
      ${isNative && bioOk && lk.enabled !== false ? row('fingerprint', 'Mở khoá bằng vân tay', '', `<input type="checkbox" class="switch" data-bio ${lk.bio ? 'checked' : ''} aria-label="Vân tay">`) : ''}</div>
    ${isElectron && prefs ? `<div class="set-h">Máy tính</div><div class="set-group">
      ${row('bell', 'Thu xuống khay khi bấm đóng', 'App chạy nền để vẫn nhắc được lúc 20:00', `<input type="checkbox" class="switch" data-pref="tray" ${prefs.tray ? 'checked' : ''} aria-label="Thu xuống khay">`)}
      ${row('laptop', 'Mở cùng Windows', '', `<input type="checkbox" class="switch" data-pref="autostart" ${prefs.autostart ? 'checked' : ''} aria-label="Mở cùng Windows">`)}</div>` : ''}
    <div class="set-h">Cập nhật</div><div class="set-group">
      ${row('refresh-cw', `Phiên bản ${APP_VERSION}`, updLabel(), updBtn)}</div>
    ${!isNative ? `<div class="set-h">Dữ liệu</div><div class="set-group">${row('receipt', 'Xuất file Excel (CSV)', `${store.tx.length} giao dịch`, '<button class="btn" type="button" data-csv>Xuất CSV</button>')}</div>` : ''}
    <div class="credit" style="text-align:center;padding:18px 0 6px">Created by Mondiro</div>`;
}

export function wireSettings(root) {
  const $ = (s) => root.querySelector(s);
  $('[data-fbsetup]') && ($('[data-fbsetup]').onclick = fbSetup);
  $('[data-fbclear]') && ($('[data-fbclear]').onclick = async () => { if (await confirmBox('Đổi dự án Firebase?', 'App sẽ mở lại để nhập cấu hình mới.', 'Đổi')) { clearConfig(); location.reload(); } });
  const lf = $('[data-login]');
  if (lf) {
    let mode = 'in';
    lf.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => { mode = b.dataset.mode; }));
    lf.onsubmit = async (e) => {
      e.preventDefault();
      const email = lf.email.value.trim(), pass = lf.pass.value;
      try {
        if (mode === 'up') await signUp(email, pass); else await signIn(email, pass);
        toast(mode === 'up' ? 'Đã tạo tài khoản và bật đồng bộ' : 'Đã đăng nhập, đang đồng bộ');
      } catch (err) { toast(authErr(err)); }
    };
    $('[data-forgotpw]').onclick = async () => {
      const email = lf.email.value.trim();
      if (!email) { toast('Nhập email trước đã'); lf.email.focus(); return; }
      try { await resetPassword(email); toast('Đã gửi email đặt lại mật khẩu'); } catch (err) { toast(authErr(err)); }
    };
  }
  $('[data-logout]') && ($('[data-logout]').onclick = async () => { if (await confirmBox('Đăng xuất?', 'Dữ liệu vẫn nằm trên tài khoản. Máy này sẽ trở về dữ liệu chỉ lưu trên máy.', 'Đăng xuất')) { await signOutUser(); toast('Đã đăng xuất'); } });
  const rt = $('[data-rtime]'), rg = $('[data-rtoggle]');
  const saveR = async (ask) => { const ok = await applyReminder({ enabled: rg.checked, time: rt.value || '20:00' }, ask); if (rg.checked && !ok && isNative) toast('Hãy cho phép app gửi thông báo trong Cài đặt Android'); };
  rt.onchange = () => saveR(false);
  rg.onchange = () => saveR(true);
  $('[data-lktoggle]').onchange = async (e) => {
    if (!e.target.checked) {
      if (await confirmBox('Tắt khoá?', 'Ai cầm máy cũng mở được app.', 'Tắt khoá', true)) { saveLockCfg({ ...lockCfg(), enabled: false }); toast('Đã tắt khoá'); }
      else e.target.checked = true;
    } else {
      const c = lockCfg();
      if (c.hash) { saveLockCfg({ ...c, enabled: true }); toast('Đã bật khoá'); }
      else changeCode(true);
    }
    document.dispatchEvent(new Event('mml:rerender'));
  };
  $('[data-chcode]') && ($('[data-chcode]').onclick = () => changeCode(false));
  $('[data-bio]') && ($('[data-bio]').onchange = (e) => { saveLockCfg({ ...lockCfg(), bio: e.target.checked }); toast(e.target.checked ? 'Đã bật vân tay' : 'Đã tắt vân tay'); });
  root.querySelectorAll('[data-pref]').forEach((b) => (b.onchange = async () => { prefs = await window.mondiro.setPrefs({ [b.dataset.pref]: b.checked }); }));
  $('[data-check]') && ($('[data-check]').onclick = checkUpdate);
  $('[data-install]') && ($('[data-install]').onclick = installUpdate);
  $('[data-csv]') && ($('[data-csv]').onclick = exportCsv);
}

function authErr(e) {
  const c = e?.code || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found')) return 'Sai email hoặc mật khẩu';
  if (c.includes('email-already-in-use')) return 'Email này đã có tài khoản, hãy bấm Đăng nhập';
  if (c.includes('weak-password')) return 'Mật khẩu cần ít nhất 6 ký tự';
  if (c.includes('invalid-email')) return 'Email chưa đúng';
  if (c.includes('network')) return 'Mất mạng, thử lại sau';
  if (c.includes('operation-not-allowed')) return 'Chưa bật đăng nhập Email/Password trong Firebase';
  return 'Lỗi: ' + (e?.message || e);
}

function fbSetup() {
  const d = dialog(`<h3>${I('cloud')}Kết nối Firebase</h3>
    <p>Mở Firebase console → Project settings → Your apps → Web app, copy đoạn <b>firebaseConfig</b> rồi dán vào đây. Chỉ cần làm 1 lần trên mỗi máy.</p>
    <textarea class="inp" rows="8" id="fbcfg" placeholder="const firebaseConfig = { apiKey: '...', projectId: '...', appId: '...' }"></textarea>
    <div class="err"></div><div class="actions"><button class="btn" type="button" data-x>Huỷ</button><button class="btn primary" type="button" data-ok>Lưu và mở lại app</button></div>`, { wide: true });
  d.el.querySelector('[data-ok]').onclick = () => {
    const cfg = parseConfig(d.el.querySelector('#fbcfg').value);
    if (!cfg) { d.el.querySelector('.err').textContent = 'Chưa đọc được apiKey, projectId, appId. Hãy copy đủ cả đoạn.'; return; }
    saveConfig(cfg);
    location.reload();
  };
}

function changeCode(enabling) {
  const pin = isNative;
  const attrs = pin ? 'inputmode="numeric" maxlength="4" pattern="[0-9]*"' : '';
  const c = lockCfg();
  const d = dialog(`<h3>${I('key-round')}${enabling ? 'Đặt mã khoá' : pin ? 'Đổi mã PIN' : 'Đổi mã khoá'}</h3>
    ${!enabling && c.hash ? `<input class="inp" type="password" id="c0" placeholder="Mã hiện tại" ${attrs}>` : ''}
    <input class="inp" type="password" id="c1" placeholder="${pin ? 'Mã PIN mới (4 số)' : 'Mã khoá mới (ít nhất 4 ký tự)'}" ${attrs}>
    <input class="inp" type="password" id="c2" placeholder="Nhập lại mã mới" ${attrs}>
    <div class="err"></div><div class="actions"><button class="btn" type="button" data-x>Huỷ</button><button class="btn primary" type="button" data-ok>Lưu mã</button></div>`, { onClose: () => document.dispatchEvent(new Event('mml:rerender')) });
  const err = d.el.querySelector('.err');
  d.el.querySelector('[data-ok]').onclick = async () => {
    const v0 = d.el.querySelector('#c0')?.value, v1 = d.el.querySelector('#c1').value, v2 = d.el.querySelector('#c2').value;
    if (v0 !== undefined && !(await verify(v0))) { err.textContent = 'Mã hiện tại chưa đúng'; return; }
    if (pin ? !/^\d{4}$/.test(v1) : v1.length < 4) { err.textContent = pin ? 'Mã PIN gồm 4 số' : 'Mã cần ít nhất 4 ký tự'; return; }
    if (v1 !== v2) { err.textContent = 'Hai lần nhập không khớp'; return; }
    await setCode(v1);
    toast('Đã lưu mã khoá mới');
    d.close();
  };
}
async function verify(code) {
  const c = lockCfg();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(c.salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('') === c.hash;
}

function exportCsv() {
  const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const rows = [['Ngày', 'Loại', 'Số tiền', 'Nhóm cha', 'Nhóm', 'Ghi chú']];
  for (const t of [...store.tx].sort((a, b) => a.date.localeCompare(b.date))) {
    const g = gById(t.groupId), p = g?.parent ? gById(g.parent) : null;
    rows.push([t.date, t.type === 'inc' ? 'Thu' : 'Chi', t.amount, p?.name || '', g?.name || '', t.note]);
  }
  const csv = '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `MonMoneyLover-${ymd()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
