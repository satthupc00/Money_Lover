// Form thêm / sửa giao dịch, gọn kiểu Money Lover: các dòng Số tiền / Nhóm / Ghi chú / Ngày.
// Nhóm chỉ hiện khi bấm "Chọn nhóm"; bấm vào ngày là mở lịch. Điện thoại có bàn phím tính toán.
// Gợi ý dạng menu thả xuống: theo số tiền (khi đã nhập >= 3 lần) và theo ghi chú.
import { store, gById, tops, kids, addTx, updateTx, deleteTx } from '../store.js';
import { I } from '../icons.js';
import { esc, fmt, ymd, dkey, dmy, parseYmd, WD } from '../util.js';
import { tile, dialog, sheet, toast, confirmBox } from './common.js';

const WDL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const dateLabel = (s) => {
  const d = parseYmd(s), t = ymd(), y = new Date(); y.setDate(y.getDate() - 1);
  const rel = s === t ? 'Hôm nay' : s === ymd(y) ? 'Hôm qua' : WDL[d.getDay()];
  return `${rel}, ${dmy(s)}`;
};

function collect(ts, keyf) {
  const m = new Map();
  for (const t of ts) {
    const k = keyf(t);
    const e = m.get(k) || { t, c: 0 };
    e.c++;
    if (t.date > e.t.date || (t.date === e.t.date && (t.createdAt || 0) > (e.t.createdAt || 0))) e.t = t;
    m.set(k, e);
  }
  return [...m.values()].filter((e) => gById(e.t.groupId)).sort((a, b) => b.c - a.c || b.t.date.localeCompare(a.t.date));
}
function amtHits(v, type) {
  if (!v) return null;
  const ts = store.tx.filter((t) => t.amount === v && t.type === type);
  if (ts.length < 3) return null;
  const items = collect(ts, (t) => t.groupId + '|' + t.note).slice(0, 5);
  return items.length ? { total: ts.length, items } : null;
}
function noteHits(q, type) {
  q = dkey(q.trim());
  if (!q) return null;
  const items = collect(store.tx.filter((t) => t.type === type && t.note && dkey(t.note).includes(q)), (t) => t.groupId + '|' + t.note + '|' + t.amount).slice(0, 6);
  return items.length ? { items } : null;
}
const ddHtml = (head, items) => `<div class="dd" role="listbox">${items.map(({ t, c }, i) => {
  const g = gById(t.groupId);
  return `<button type="button" role="option" data-pick="${i}">${tile(g, 36)}<span class="t"><b>${esc(t.note || g.name)}</b><small>${esc(g.name)}${c > 1 ? ' · đã dùng ' + c + ' lần' : ''}</small></span><span class="meta"><b class="${t.type === 'inc' ? 'inc' : ''}">${fmt(t.amount)} ₫</b>${dmy(t.date)}</span></button>`;
}).join('')}</div>`;

// số tiền hay dùng gần đây (chip nhanh trên bàn phím)
function quickAmounts(type) {
  const c = new Map();
  const recent = store.tx.filter((t) => t.type === type).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 300);
  for (const t of recent) c.set(t.amount, (c.get(t.amount) || 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([v]) => v);
}

// ---- bàn phím tính toán: + − × ÷
const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => (b ? a / b : a) };
function evalExpr(e) {
  const tok = e.match(/\d+|[+−×÷]/g) || [];
  const nums = [], ops = [];
  for (const t of tok) (/\d/.test(t) ? nums : ops).push(/\d/.test(t) ? +t : t);
  if (!nums.length) return 0;
  // nhân chia trước
  const n2 = [nums[0]], o2 = [];
  ops.slice(0, nums.length - 1).forEach((o, i) => { if (o === '×' || o === '÷') n2.push(OPS[o](n2.pop(), nums[i + 1])); else { o2.push(o); n2.push(nums[i + 1]); } });
  return Math.round(o2.reduce((acc, o, i) => OPS[o](acc, n2[i + 1]), n2[0]));
}
const prettyExpr = (e) => e.replace(/\d+/g, (d) => (+d).toLocaleString('vi-VN')).replace(/([+−×÷])/g, ' $1 ');

// ---- chọn nhóm
export function pickGroup(type, current, compact) {
  return new Promise((resolve) => {
    const list = () => tops(type).map((g) => [g, ...kids(g.id)]).flat();
    const html = `<h3 class="pg-h">${I('folder-tree')}Chọn nhóm ${type === 'inc' ? 'thu' : 'chi'}</h3>
      <input class="inp" id="gq" placeholder="Tìm nhóm" autocomplete="off"><div class="pick gpicklist"></div>
      ${compact ? '' : '<div class="actions"><button class="btn" type="button" data-x>Huỷ</button></div>'}`;
    let done = false;
    const box = compact ? sheet(html, { cls: 'tall', onClose: () => !done && resolve(null) }) : dialog(html, { onClose: () => !done && resolve(null) });
    const out = box.el.querySelector('.gpicklist'), q = box.el.querySelector('#gq');
    const draw = () => {
      const s = dkey(q.value.trim());
      const rows = list().filter((g) => !s || dkey(g.name).includes(s) || (g.parent && dkey(gById(g.parent)?.name).includes(s)));
      out.innerHTML = rows.map((g) => `<button type="button" class="${g.parent && !s ? 'child' : ''} ${g.id === current ? 'on' : ''}" data-t="${g.id}">${tile(g, g.parent ? 34 : 40)}<span>${esc(g.name)}${s && g.parent ? `<small> · ${esc(gById(g.parent).name)}</small>` : ''}</span>${g.id === current ? I('check') : ''}</button>`).join('') || '<p>Không có nhóm nào khớp.</p>';
      out.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { done = true; resolve(b.dataset.t); box.close(); }));
    };
    q.oninput = draw; draw();
    out.querySelector('.on')?.scrollIntoView({ block: 'center' });
    if (!compact) setTimeout(() => q.focus(), 50);
  });
}

export function openTxForm(tx, { compact = false, date } = {}) {
  const st = tx
    ? { type: tx.type, expr: String(tx.amount), note: tx.note || '', groupId: tx.groupId, date: tx.date }
    : { type: 'exp', expr: '', note: '', groupId: '', date: date || ymd() };
  const amount = () => evalExpr(st.expr);
  const title = tx ? 'Sửa giao dịch' : 'Thêm giao dịch';
  const body = `
    <div class="tf-head">${compact ? '<button type="button" class="icb" data-x title="Đóng" aria-label="Đóng">' + I('x') + '</button>' : ''}<h3>${title}</h3><div class="spacer"></div>${tx ? `<button type="button" class="icb" data-del title="Xoá giao dịch" aria-label="Xoá giao dịch">${I('trash-2')}</button>` : ''}</div>
    <div class="seg2" role="tablist"><button type="button" data-type="exp">Khoản chi</button><button type="button" data-type="inc">Khoản thu</button></div>
    <div class="tf">
      <div class="tf-row ddwrap"><span class="tf-ic cur">VND</span>
        ${compact ? '<div class="tf-amt" data-amtview aria-live="polite"></div>' : '<input id="txAmt" class="tf-amt" inputmode="numeric" placeholder="0" autocomplete="off">'}
        <div data-dd-amt></div></div>
      <button type="button" class="tf-row tf-btn" data-pickgroup><span class="tf-gic" data-gicon></span><span class="tf-lbl" data-glabel></span>${I('chevron-right', 'tf-chev')}</button>
      <div class="tf-row ddwrap"><span class="tf-ic">${I('notebook-pen')}</span><input id="txNote" class="tf-input" placeholder="Thêm ghi chú" autocomplete="off" maxlength="120"><div data-dd-note></div></div>
      <div class="tf-row"><span class="tf-ic">${I('calendar-clock')}</span>
        <button type="button" class="icb" data-dshift="-1" title="Ngày trước" aria-label="Ngày trước">${I('chevron-left')}</button>
        <span class="tf-date"><span data-dlabel></span><input type="date" id="txDate" aria-label="Chọn ngày"></span>
        <button type="button" class="icb" data-dshift="1" title="Ngày sau" aria-label="Ngày sau">${I('chevron-right')}</button></div>
    </div>
    ${compact
      ? `<div class="quick noscroll" data-quick></div>
        <div class="keypad calc">${['C', '÷', '×', 'del', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', 'ok', '0', '000', '='].map((k) => k === 'ok' ? '<button type="button" class="ok" data-save>Lưu</button>' : k === 'del' ? `<button type="button" class="op" data-k="del" title="Xoá số" aria-label="Xoá số">${I('delete')}</button>` : `<button type="button" data-k="${k}" class="${/[C÷×−+=]/.test(k) ? 'op' : ''}">${k}</button>`).join('')}</div>`
      : `<div class="actions"><button class="btn" type="button" data-x>Huỷ</button><button class="btn primary" type="button" data-save>Lưu (Enter)</button></div>`}`;

  const box = compact ? sheet(body, { cls: 'txsheet' }) : dialog(body, { wide: true });
  const el = box.el;
  const amtIn = el.querySelector('#txAmt'), amtView = el.querySelector('[data-amtview]');
  const note = el.querySelector('#txNote'), dateIn = el.querySelector('#txDate');
  const dA = el.querySelector('[data-dd-amt]'), dN = el.querySelector('[data-dd-note]');
  let hits = null, hi = -1;
  note.value = st.note;

  const drawType = () => {
    el.querySelectorAll('[data-type]').forEach((b) => { b.classList.toggle('on', b.dataset.type === st.type); b.classList.toggle('inc', b.dataset.type === 'inc'); });
    el.classList.toggle('is-inc', st.type === 'inc');
    const q = el.querySelector('[data-quick]');
    if (q) q.innerHTML = quickAmounts(st.type).map((v) => `<button type="button" class="chip txt" data-qa="${v}">${fmt(v)}</button>`).join('');
  };
  const drawGroup = () => {
    const g = gById(st.groupId);
    el.querySelector('[data-gicon]').innerHTML = g ? tile(g, 40) : '<span class="tf-empty"></span>';
    const p = g?.parent ? gById(g.parent) : null;
    el.querySelector('[data-glabel]').innerHTML = g ? `<b>${esc(g.name)}</b>${p ? `<small>${esc(p.name)}</small>` : ''}` : '<span class="ph">Chọn nhóm</span>';
  };
  const drawAmt = () => {
    if (amtIn) { const v = amount(); if (document.activeElement !== amtIn || !v) amtIn.value = v ? v.toLocaleString('vi-VN') : ''; return; }
    amtView.innerHTML = st.expr ? prettyExpr(st.expr) : '0';
  };
  const drawDate = () => { el.querySelector('[data-dlabel]').textContent = dateLabel(st.date); dateIn.value = st.date; };
  const close = () => { dA.innerHTML = ''; dN.innerHTML = ''; hits = null; hi = -1; };
  const showA = () => { dN.innerHTML = ''; const v = /[+−×÷]/.test(st.expr) ? 0 : amount(); const r = amtHits(v, st.type); hits = r?.items || null; hi = -1; dA.innerHTML = r ? ddHtml(`Số tiền này bạn đã nhập ${r.total} lần`, r.items) : ''; };
  const showN = () => { dA.innerHTML = ''; const r = noteHits(note.value, st.type); hits = r?.items || null; hi = -1; dN.innerHTML = r ? ddHtml('Ghi chú bạn đã dùng', r.items) : ''; };
  const pick = (i, fromNote) => {
    const t = hits?.[i]?.t;
    if (!t) return;
    st.note = t.note; note.value = t.note;
    st.type = t.type; st.groupId = t.groupId;
    if (fromNote || !amount()) st.expr = String(t.amount);
    close(); drawType(); drawGroup(); drawAmt();
  };
  const chooseGroup = async () => {
    close();
    const id = await pickGroup(st.type, st.groupId, compact);
    if (id) { st.groupId = id; drawGroup(); }
  };

  el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) { pick(+p.dataset.pick, !!p.closest('[data-dd-note]')); return; }
    const ty = e.target.closest('[data-type]');
    if (ty) { if (st.type !== ty.dataset.type) { close(); st.type = ty.dataset.type; const g = gById(st.groupId); if (g && g.type !== st.type) st.groupId = ''; drawType(); drawGroup(); } return; }
    if (e.target.closest('[data-pickgroup]')) { chooseGroup(); return; }
    const ds = e.target.closest('[data-dshift]');
    if (ds) { const d = parseYmd(st.date); d.setDate(d.getDate() + +ds.dataset.dshift); st.date = ymd(d); drawDate(); return; }
    const qa = e.target.closest('[data-qa]');
    if (qa) { st.expr = qa.dataset.qa; drawAmt(); showA(); return; }
    const k = e.target.closest('[data-k]');
    if (k) { key(k.dataset.k); return; }
    if (!e.target.closest('.dd, #txAmt, #txNote, [data-amtview]')) close();
  });
  const key = (k) => {
    let x = st.expr;
    if (k === 'del') x = x.slice(0, -1);
    else if (k === 'C') x = '';
    else if (k === '=') x = String(amount() || '');
    else if (/[+−×÷]/.test(k)) { if (!x) return; x = /[+−×÷]$/.test(x) ? x.slice(0, -1) + k : x + k; }
    else { const last = x.match(/\d*$/)[0]; if (last.length >= 12) return; x = (last === '0' ? x.slice(0, -1) : x) + k; if (/(^|[+−×÷])0+\d/.test(x)) x = x.replace(/(^|[+−×÷])0+(\d)/g, '$1$2'); }
    st.expr = x; drawAmt(); showA();
  };
  if (amtIn) {
    amtIn.addEventListener('input', () => { st.expr = String(parseInt(amtIn.value.replace(/\D/g, ''), 10) || ''); amtIn.value = st.expr ? (+st.expr).toLocaleString('vi-VN') : ''; showA(); });
    amtIn.addEventListener('focus', showA);
  }
  note.addEventListener('input', () => { st.note = note.value; showN(); });
  note.addEventListener('focus', () => { if (note.value) showN(); else close(); });
  // bấm vào chữ ngày là mở lịch
  const openCal = () => { try { dateIn.showPicker(); } catch { dateIn.focus(); dateIn.click(); } };
  el.querySelector('.tf-date').addEventListener('click', (e) => { if (e.target !== dateIn) openCal(); });
  dateIn.addEventListener('click', (e) => { e.preventDefault(); openCal(); });
  dateIn.addEventListener('change', () => { if (dateIn.value) { st.date = dateIn.value; drawDate(); } });
  el.addEventListener('keydown', (e) => {
    const dd = el.querySelector('.dd');
    if (dd && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const n = dd.querySelectorAll('[data-pick]').length;
      hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      dd.querySelectorAll('[data-pick]').forEach((b, i) => b.classList.toggle('hi', i === hi));
      return;
    }
    if (e.key === 'Escape' && dd) { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (dd && hi >= 0) { pick(hi, !!dd.closest('[data-dd-note]')); return; }
      save();
      return;
    }
    if (!amtIn && document.activeElement !== note) {
      const map = { '/': '÷', '*': '×', '-': '−', '+': '+', Backspace: 'del', '=': '=' };
      if (/^\d$/.test(e.key)) key(e.key); else if (map[e.key]) { e.preventDefault(); key(map[e.key]); }
    }
  });

  const save = () => {
    const v = amount();
    st.note = note.value.trim();
    if (v <= 0) {
      toast('Hãy nhập số tiền');
      const t = amtIn || amtView; t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); amtIn?.focus();
      return;
    }
    if (!st.groupId || !gById(st.groupId)) { toast('Hãy chọn nhóm'); chooseGroup(); return; }
    const data = { amount: v, type: st.type, groupId: st.groupId, note: st.note, date: st.date };
    if (tx) { updateTx(tx.id, data); toast('Đã lưu thay đổi'); }
    else {
      const id = addTx(data);
      toast(`Đã ghi ${st.type === 'inc' ? '+' : '−'}${fmt(v)} ₫ · ${gById(st.groupId).name}`, { label: 'Hoàn tác', run: () => deleteTx(id) });
    }
    box.close();
  };
  el.querySelectorAll('[data-save]').forEach((b) => (b.onclick = save));
  const del = el.querySelector('[data-del]');
  if (del) del.onclick = async () => {
    if (await confirmBox('Xoá giao dịch?', `${esc(tx.note || gById(tx.groupId)?.name || '')} · ${fmt(tx.amount)} ₫`, 'Xoá', true)) {
      const copy = { ...tx };
      deleteTx(tx.id); box.close();
      toast('Đã xoá giao dịch', { label: 'Hoàn tác', run: () => addTx(copy) });
    }
  };

  drawType(); drawGroup(); drawAmt(); drawDate();
  if (amtIn) setTimeout(() => amtIn.focus(), 60);
  return box;
}
export { WD };
