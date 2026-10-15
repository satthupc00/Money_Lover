// Form thêm / sửa giao dịch. PC: hộp thoại có ô nhập số; điện thoại: bảng trượt có bàn phím số.
// Gợi ý dạng menu thả xuống: theo số tiền (khi đã nhập >= 3 lần) và theo ghi chú.
import { store, gById, tops, kids, addTx, updateTx, deleteTx } from '../store.js';
import { I } from '../icons.js';
import { esc, fmt, ymd, dkey, dmy } from '../util.js';
import { tile, dialog, sheet, toast, confirmBox } from './common.js';

const parseAmt = (s) => parseInt(String(s).replace(/\D/g, ''), 10) || 0;

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
function amtHits(v) {
  if (!v) return null;
  const ts = store.tx.filter((t) => t.amount === v);
  if (ts.length < 3) return null;
  const items = collect(ts, (t) => t.groupId + '|' + t.note).slice(0, 5);
  return items.length ? { total: ts.length, items } : null;
}
function noteHits(q) {
  q = dkey(q.trim());
  if (!q) return null;
  const items = collect(store.tx.filter((t) => t.note && dkey(t.note).includes(q)), (t) => t.groupId + '|' + t.note + '|' + t.amount).slice(0, 6);
  return items.length ? { items } : null;
}
const ddHtml = (head, items) => `<div class="dd" role="listbox"><div class="dd-h">${I('sparkles')}${head}</div>${items.map(({ t, c }, i) => {
  const g = gById(t.groupId);
  return `<button type="button" role="option" data-pick="${i}">${tile(g, 36)}<span class="t"><b>${esc(t.note || g.name)}</b><small>${esc(g.name)}${c > 1 ? ' · đã dùng ' + c + ' lần' : ''}</small></span><span class="meta"><b class="${t.type === 'inc' ? 'inc' : ''}">${fmt(t.amount)} ₫</b>${dmy(t.date)}</span></button>`;
}).join('')}</div>`;

function groupPicker(type, sel) {
  return tops(type).map((g) => [g, ...kids(g.id)]).flat().map((g) =>
    `<button type="button" data-g="${g.id}" class="${g.parent ? 'sub' : ''} ${g.id === sel ? 'on' : ''}" title="${esc(g.parent ? gById(g.parent).name + ' › ' + g.name : g.name)}">${tile(g, 44)}${esc(g.name)}</button>`).join('');
}

export function openTxForm(tx, { compact = false, date } = {}) {
  const st = tx
    ? { type: tx.type, amount: tx.amount, note: tx.note || '', groupId: tx.groupId, date: tx.date }
    : { type: 'exp', amount: 0, note: '', groupId: '', date: date || ymd() };
  const title = tx ? 'Sửa giao dịch' : 'Thêm giao dịch';
  const body = `
    ${compact ? (tx ? `<div style="display:flex;align-items:center"><h3 style="margin:0;font-size:16px;font-weight:900;flex:1">${title}</h3><button type="button" class="icb" data-del title="Xoá giao dịch">${I('trash-2')}</button></div>` : '') : `<h3>${title}</h3>`}
    <div class="seg2" role="tablist"><button type="button" data-type="exp">Chi tiêu</button><button type="button" data-type="inc">Thu nhập</button></div>
    ${compact
      ? `<div class="ddwrap"><div class="amtview" data-amtview aria-live="polite"></div><div data-dd-amt></div></div>`
      : `<div class="field"><label for="txAmt">Số tiền</label><div class="ddwrap"><input id="txAmt" class="inp big" inputmode="numeric" placeholder="0 ₫" autocomplete="off"><div data-dd-amt></div></div></div>`}
    <div class="${compact ? '' : 'two'}" style="${compact ? 'display:grid;grid-template-columns:1fr 150px;gap:8px' : ''}">
      <div class="field">${compact ? '' : '<label for="txNote">Ghi chú</label>'}<div class="ddwrap"><input id="txNote" class="inp" placeholder="Ghi chú (vd: cf sáng)" autocomplete="off" maxlength="120"><div data-dd-note></div></div></div>
      <div class="field">${compact ? '' : '<label for="txDate">Ngày</label>'}<input id="txDate" class="inp" type="date" aria-label="Ngày"></div>
    </div>
    <div class="field">${compact ? '' : '<span class="lbl">Nhóm</span>'}<div class="gpick" data-gpick></div></div>
    ${compact
      ? `<div class="keypad">${['1', '2', '3', 'del', '4', '5', '6', '000', '7', '8', '9', 'ok', 'C', '0', '00'].map((k) => k === 'ok' ? '<button type="button" class="ok" data-save>Lưu</button>' : k === 'del' ? `<button type="button" data-k="del" title="Xoá số">${I('delete')}</button>` : `<button type="button" data-k="${k}" class="${k.length > 1 ? 'sm' : ''}">${k}</button>`).join('')}</div>`
      : `<div class="actions">${tx ? `<button class="btn danger" type="button" data-del style="margin-right:auto">${I('trash-2')}Xoá</button>` : ''}<button class="btn" type="button" data-x>Huỷ</button><button class="btn primary" type="button" data-save>Lưu (Enter)</button></div>`}`;

  const box = compact ? sheet(body) : dialog(body, { wide: true });
  const el = box.el;
  const amtIn = el.querySelector('#txAmt'), amtView = el.querySelector('[data-amtview]');
  const note = el.querySelector('#txNote'), dateIn = el.querySelector('#txDate');
  const dA = el.querySelector('[data-dd-amt]'), dN = el.querySelector('[data-dd-note]');
  let hits = null, hi = -1;
  note.value = st.note;
  dateIn.value = st.date;

  const drawType = () => {
    el.querySelectorAll('[data-type]').forEach((b) => { b.classList.toggle('on', b.dataset.type === st.type); b.classList.toggle('inc', b.dataset.type === 'inc'); });
    const gp = el.querySelector('[data-gpick]');
    gp.innerHTML = groupPicker(st.type, st.groupId);
    const on = gp.querySelector('.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
    const ok = el.querySelector('.keypad .ok');
    if (ok) ok.classList.toggle('inc', st.type === 'inc');
  };
  const drawAmt = () => {
    const s = st.amount ? st.amount.toLocaleString('vi-VN') : '';
    if (amtIn) { if (parseAmt(amtIn.value) !== st.amount || !st.amount) amtIn.value = s; }
    else amtView.innerHTML = `<span class="${st.type === 'inc' ? 'inc' : st.amount ? 'exp' : ''}">${s || '0'} ₫</span>`;
  };
  const close = () => { dA.innerHTML = ''; dN.innerHTML = ''; hits = null; hi = -1; };
  const showA = () => { dN.innerHTML = ''; const r = amtHits(st.amount); hits = r?.items || null; hi = -1; dA.innerHTML = r ? ddHtml(`Số tiền này bạn đã nhập ${r.total} lần`, r.items) : ''; };
  const showN = () => { dA.innerHTML = ''; const r = noteHits(note.value); hits = r?.items || null; hi = -1; dN.innerHTML = r ? ddHtml('Ghi chú bạn đã dùng', r.items) : ''; };
  const pick = (i, fromNote) => {
    const t = hits?.[i]?.t;
    if (!t) return;
    st.note = t.note; note.value = t.note;
    st.type = t.type; st.groupId = t.groupId;
    if (fromNote || !st.amount) st.amount = t.amount;
    close(); drawType(); drawAmt();
  };

  el.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pick]');
    if (p) { pick(+p.dataset.pick, !!p.closest('[data-dd-note]')); return; }
    const ty = e.target.closest('[data-type]');
    if (ty) { if (st.type !== ty.dataset.type) { st.type = ty.dataset.type; const g = gById(st.groupId); if (g && g.type !== st.type) st.groupId = ''; drawType(); drawAmt(); } return; }
    const g = e.target.closest('[data-g]');
    if (g) { st.groupId = g.dataset.g; el.querySelectorAll('[data-gpick] button').forEach((b) => b.classList.toggle('on', b === g)); close(); return; }
    const k = e.target.closest('[data-k]');
    if (k) {
      const v = String(st.amount || '');
      const n = k.dataset.k === 'del' ? v.slice(0, -1) : k.dataset.k === 'C' ? '' : (v + k.dataset.k).replace(/^0+/, '').slice(0, 13);
      st.amount = parseAmt(n); drawAmt(); showA(); return;
    }
    if (!e.target.closest('.dd, #txAmt, #txNote, [data-amtview]')) close();
  });
  if (amtIn) {
    amtIn.addEventListener('input', () => { st.amount = parseAmt(amtIn.value); amtIn.value = st.amount ? st.amount.toLocaleString('vi-VN') : ''; showA(); });
    amtIn.addEventListener('focus', showA);
  }
  note.addEventListener('input', () => { st.note = note.value; showN(); });
  note.addEventListener('focus', () => { if (note.value) showN(); else close(); });
  dateIn.addEventListener('change', () => { st.date = dateIn.value || st.date; });
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
    }
    if (!amtIn && /^\d$/.test(e.key) && document.activeElement !== note && document.activeElement !== dateIn) {
      st.amount = parseAmt(String(st.amount || '') + e.key); drawAmt(); showA();
    }
  });

  const save = () => {
    st.note = note.value.trim();
    st.date = dateIn.value || st.date;
    if (!st.amount) { toast('Hãy nhập số tiền'); (amtIn || amtView).classList.remove('shake'); void (amtIn || amtView).offsetWidth; (amtIn || amtView).classList.add('shake'); amtIn?.focus(); return; }
    if (!st.groupId || !gById(st.groupId)) { toast('Hãy chọn nhóm'); return; }
    const data = { amount: st.amount, type: st.type, groupId: st.groupId, note: st.note, date: st.date };
    if (tx) { updateTx(tx.id, data); toast('Đã lưu thay đổi'); }
    else {
      const id = addTx(data);
      toast(`Đã ghi ${st.type === 'inc' ? '+' : '−'}${fmt(st.amount)} ₫ · ${gById(st.groupId).name}`, { label: 'Hoàn tác', run: () => deleteTx(id) });
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

  drawType(); drawAmt();
  if (amtIn) setTimeout(() => amtIn.focus(), 60);
  return box;
}
