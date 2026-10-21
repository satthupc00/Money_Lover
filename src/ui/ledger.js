// Sổ giao dịch: thẻ tổng (2 tab Chi / Thu) + danh sách theo ngày / tháng / năm
import { store, gById, groupIds, reorderTx } from '../store.js';
import { view, setView, ui } from '../state.js';
import { I } from '../icons.js';
import { fmt, vnd, esc, ymd, shortM, daysIn } from '../util.js';
import { tile } from './common.js';

export function range() {
  const c = view.cursor, y = c.getFullYear(), m = c.getMonth();
  if (view.period === 'day') { const d = ymd(c); return [d, d]; }
  if (view.period === 'year') return [`${y}-01-01`, `${y}-12-31`];
  return [ymd(new Date(y, m, 1)), ymd(new Date(y, m, daysIn(y, m)))];
}

export function periodLabel(short = false) {
  const c = view.cursor;
  if (view.period === 'day') {
    const today = ymd(), d = ymd(c);
    const y = new Date(); y.setDate(y.getDate() - 1);
    const rel = d === today ? 'Hôm nay' : d === ymd(y) ? 'Hôm qua' : '';
    return rel ? `${rel}, ${c.getDate()}/${c.getMonth() + 1}` : `${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][c.getDay()]}, ${c.getDate()}/${c.getMonth() + 1}/${c.getFullYear()}`;
  }
  if (view.period === 'year') return `Năm ${c.getFullYear()}`;
  return short ? `Tháng ${c.getMonth() + 1}/${c.getFullYear()}` : `Tháng ${c.getMonth() + 1} / ${c.getFullYear()}`;
}
const periodWord = () => (view.period === 'day' ? 'hôm đó' : view.period === 'year' ? `năm ${view.cursor.getFullYear()}` : `tháng ${view.cursor.getMonth() + 1}`);

// tháng mới nhất có giao dịch trong năm y (năm nay thì không vượt quá tháng hiện tại)
export function latestMonthIn(y) {
  const now = new Date(), pre = String(y);
  let last = '';
  for (const t of store.tx) if (t.date?.startsWith(pre) && t.date > last) last = t.date;
  const cap = y === now.getFullYear() ? now.getMonth() : 11;
  const m = last ? Math.min(+last.slice(5, 7) - 1, cap) : cap;
  return new Date(y, m, 1);
}

export function shiftPeriod(k) {
  const c = new Date(view.cursor);
  if (view.period === 'day') c.setDate(c.getDate() + k);
  else if (view.period === 'year') { setView({ cursor: latestMonthIn(c.getFullYear() + k) }); return; }
  else c.setMonth(c.getMonth() + k, 1);
  setView({ cursor: c });
}

export function periodTx() {
  const [a, b] = range();
  const ids = view.group ? new Set(groupIds(view.group)) : null;
  return store.tx.filter((t) => t.date >= a && t.date <= b && (!ids || ids.has(t.groupId)));
}

export function heroHtml() {
  const txs = periodTx();
  let inc = 0, exp = 0;
  for (const t of txs) { if (t.exclude) continue; t.type === 'inc' ? (inc += t.amount) : (exp += t.amount); }
  const k = view.heroKind, v = k === 'exp' ? exp : inc, rest = inc - exp;
  const pw = view.period === 'day' ? 'hôm đó' : periodWord();
  return `<div class="hero ${k === 'inc' ? 'inc' : ''}" data-tone="${k}" data-tone-key="hero">
    <span class="rem" title="Thu trừ chi ${pw}">Còn lại ${view.hideAmt ? '•••' : (rest < 0 ? '−' : '') + shortM(rest)}</span>
    <small>${k === 'exp' ? 'Chi tiêu' : 'Thu nhập'} ${pw}${view.group ? ' · ' + esc(gById(view.group)?.name) : ''}</small>
    <div class="balrow"><div class="bal num" ${view.hideAmt ? 'data-hidden="1"' : `data-bal="${v}"`}>${view.hideAmt ? '••••••• ₫' : vnd(v)}</div><button type="button" class="eye" data-hideamt aria-pressed="${view.hideAmt}" title="${view.hideAmt ? 'Hiện số tiền' : 'Ẩn số tiền'}" aria-label="${view.hideAmt ? 'Hiện số tiền' : 'Ẩn số tiền'}">${I(view.hideAmt ? 'eye-off' : 'eye')}</button></div>
    <div class="io" role="tablist" data-tabkey="hero"><span class="ind"></span><button type="button" role="tab" data-hero="exp" class="${k === 'exp' ? 'on' : ''}">Chi tiêu</button><button type="button" role="tab" data-hero="inc" class="${k === 'inc' ? 'on' : ''}">Thu nhập</button></div></div>`;
}

export const txRow = (t) => {
  const g = gById(t.groupId) || { name: 'Nhóm đã xoá', icon: 'receipt', color: 'brown' };
  const sub = [t.note, t.exclude ? 'không tính vào báo cáo' : ''].filter(Boolean).join(' · ');
  return `<button type="button" class="tx" data-tx="${t.id}">${tile(g, 44)}<div class="t"><div>${esc(g.name)}</div>${sub ? `<small>${esc(sub)}</small>` : ''}</div><div class="amt num ${t.type === 'inc' ? 'inc' : 'exp'}">${vnd(t.amount)}</div></button>`;
};

// trong 1 ngày: theo thứ tự người dùng đã kéo (pos); giao dịch mới chưa có pos nằm trên cùng, mới nhất trước
const sortTx = (a, b) => (b.date.localeCompare(a.date)) || ((a.pos ?? -1) - (b.pos ?? -1)) || ((b.createdAt || 0) - (a.createdAt || 0));

export function listHtml() {
  const txs = periodTx();
  if (view.period === 'year') return yearHtml(txs);
  if (!txs.length) {
    return `<div class="empty">${I('receipt')}<b>Chưa có giao dịch ${view.period === 'day' ? 'trong ngày này' : 'trong ' + periodWord()}</b><span>Bấm nút + để ghi khoản đầu tiên.</span></div>`;
  }
  const byDay = new Map();
  for (const t of txs.sort(sortTx)) { if (!byDay.has(t.date)) byDay.set(t.date, []); byDay.get(t.date).push(t); }
  let h = '';
  for (const [d, ts] of byDay) {
    const s = ts.reduce((a, t) => a + (t.exclude ? 0 : t.type === 'inc' ? t.amount : -t.amount), 0);
    const dt = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
    const today = ymd(), yd = new Date(); yd.setDate(yd.getDate() - 1);
    const rel = d === today ? 'Hôm nay' : d === ymd(yd) ? 'Hôm qua' : ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][dt.getDay()];
    h += `<section class="dayblk${dt.getDay() === 0 ? ' sun' : ''}"><header class="dayhd"><span class="dnum">${dt.getDate()}</span><span class="dmeta"><b>${rel}</b><small>tháng ${dt.getMonth() + 1} ${dt.getFullYear()}</small></span><span class="dsum num ${s > 0 ? 'inc' : s < 0 ? 'exp' : ''}">${vnd(s)}</span></header>${ts.map(txRow).join('')}</section>`;
  }
  return h;
}

function yearHtml(txs) {
  const y = view.cursor.getFullYear();
  const months = Array.from({ length: 12 }, () => ({ inc: 0, exp: 0 }));
  for (const t of txs) if (!t.exclude) months[+t.date.slice(5, 7) - 1][t.type] += t.amount;
  const max = Math.max(1, ...months.map((m) => m.exp));
  const now = new Date();
  const rows = months.map((m, i) => ({ ...m, i })).filter((m) => m.inc || m.exp || (y === now.getFullYear() && m.i <= now.getMonth())).reverse();
  if (!rows.length) return `<div class="empty">${I('receipt')}<b>Chưa có giao dịch năm ${y}</b></div>`;
  return rows.map((m) => `<button type="button" class="yr" data-month="${m.i}"><b>Tháng ${m.i + 1}</b><div class="track"><i style="width:${(m.exp / max * 100).toFixed(1)}%"></i></div><span class="r exp">${m.exp ? '−' + shortM(m.exp) : '–'}</span><span class="r inc">${m.inc ? '+' + shortM(m.inc) : '–'}</span></button>`).join('');
}

export function wireLedger(root, openTx) {
  root.querySelectorAll('[data-hero]').forEach((b) => (b.onclick = () => setView({ heroKind: b.dataset.hero })));
  root.querySelectorAll('[data-hideamt]').forEach((b) => (b.onclick = () => setView({ hideAmt: !view.hideAmt })));
  root.querySelectorAll('[data-tx]').forEach((b) => (b.onclick = () => openTx(store.tx.find((t) => t.id === b.dataset.tx))));
  root.querySelectorAll('[data-month]').forEach((b) => (b.onclick = () => setView({ period: 'month', cursor: new Date(view.cursor.getFullYear(), +b.dataset.month, 1) })));
  root.querySelectorAll('[data-period]').forEach((b) => (b.onclick = () => {
    const p = b.dataset.period;
    let cursor = view.cursor;
    if (p === 'day' && sameMonth(view.cursor, new Date())) cursor = new Date();
    // từ xem theo năm sang xem theo tháng: về tháng mới nhất của năm đó (không nhảy về tháng 1)
    else if (p === 'month' && view.period === 'year') cursor = latestMonthIn(view.cursor.getFullYear());
    setView({ period: p, cursor });
  }));
  root.querySelectorAll('[data-shift]').forEach((b) => (b.onclick = () => shiftPeriod(+b.dataset.shift)));
  root.querySelectorAll('[data-clear-group]').forEach((b) => (b.onclick = () => setView({ group: null })));
  wireReorder(root);
}

// ---------- giữ & kéo để đổi thứ tự giao dịch trong ngày ----------
const HOLD_MS = 380;
let swallowClick = false;
document.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);

function wireReorder(root) {
  root.querySelectorAll('.dayblk').forEach((blk) => {
    const rows = [...blk.querySelectorAll(':scope > .tx')];
    if (rows.length < 2) return;
    rows.forEach((row) => {
      row.addEventListener('pointerdown', (e) => holdToDrag(e, blk, row));
      row.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  });
}

function holdToDrag(e, blk, row) {
  if (e.button !== 0 || !e.isPrimary) return;
  const x0 = e.clientX, y0 = e.clientY;
  const early = (ev) => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) stop(); };
  const stop = () => { clearTimeout(timer); removeEventListener('pointermove', early); removeEventListener('pointerup', stop); removeEventListener('pointercancel', stop); };
  const timer = setTimeout(() => { stop(); begin(); }, HOLD_MS);
  addEventListener('pointermove', early); addEventListener('pointerup', stop); addEventListener('pointercancel', stop);

  function begin() {
    if (!row.isConnected) return; // màn hình vừa được vẽ lại trong lúc giữ
    ui.hold = true;
    const rows = [...blk.querySelectorAll(':scope > .tx')];
    const from = rows.indexOf(row);
    const sc = blk.closest('.scroll') || document.scrollingElement;
    const st0 = sc.scrollTop;
    const slots = rows.map((r) => { const b = r.getBoundingClientRect(); return { top: b.top + st0, h: b.height }; });
    const h = slots[from].h + (rows[1] ? slots[1].top - slots[0].top - slots[0].h : 0);
    let to = from, lastY = y0, raf = 0;
    navigator.vibrate?.(12);
    blk.classList.add('reordering'); row.classList.add('lifting');
    const place = () => {
      const dy = lastY - y0 + (sc.scrollTop - st0);
      row.style.transform = `translateY(${dy}px)`;
      const mid = slots[from].top + slots[from].h / 2 + dy;
      // vị trí thả: vượt qua điểm giữa của dòng bên dưới / bên trên thì đổi chỗ
      const midOf = (i) => slots[i].top + slots[i].h / 2;
      to = from;
      for (let i = from + 1; i < slots.length && mid > midOf(i); i++) to = i;
      if (to === from) for (let i = from - 1; i >= 0 && mid < midOf(i); i--) to = i;
      rows.forEach((r, i) => {
        if (r === row) return;
        const shift = from < to && i > from && i <= to ? -h : to < from && i >= to && i < from ? h : 0;
        r.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    };
    // kéo sát mép trên / dưới thì tự cuộn
    const edge = () => {
      const b = sc === document.scrollingElement ? { top: 0, bottom: innerHeight } : sc.getBoundingClientRect();
      const v = lastY < b.top + 60 ? -8 : lastY > b.bottom - 60 ? 8 : 0;
      if (v) { sc.scrollTop += v; place(); }
      raf = requestAnimationFrame(edge);
    };
    raf = requestAnimationFrame(edge);
    const move = (ev) => { lastY = ev.clientY; place(); };
    const block = (ev) => ev.preventDefault(); // giữ ngón tay kéo, không cho trang cuộn
    const end = (commit) => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', cancel);
      removeEventListener('touchmove', block); removeEventListener('keydown', esc, true);
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 400);
      const target = commit ? to : from;
      const off = target === from ? 0 : slots[target].top - slots[from].top + (target > from ? slots[target].h - slots[from].h : 0);
      row.classList.add('settling'); row.style.transform = `translateY(${off}px)`;
      if (!commit) rows.forEach((r) => { if (r !== row) r.style.transform = ''; });
      setTimeout(() => {
        blk.classList.remove('reordering'); row.classList.remove('lifting', 'settling');
        ui.hold = false;
        const later = ui.pending; ui.pending = null;
        if (commit && to !== from) {
          const ids = rows.map((r) => r.dataset.tx);
          ids.splice(to, 0, ids.splice(from, 1)[0]);
          reorderTx(ids);
        } else { rows.forEach((r) => { r.style.transform = ''; }); later?.(); }
      }, 180);
    };
    const up = () => end(true), cancel = () => end(false);
    const esc = (ev) => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); end(false); } };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', cancel);
    addEventListener('touchmove', block, { passive: false }); addEventListener('keydown', esc, true);
    place();
  }
}
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const periodTabs = () => `<div class="tabs" data-tabkey="period">${[['day', 'Ngày'], ['month', 'Tháng'], ['year', 'Năm']].map(([k, n]) => `<button type="button" data-period="${k}" class="${view.period === k ? 'on' : ''}">${n}</button>`).join('')}<span class="ind"></span></div>`;
export const periodNav = () => `<div class="period"><button class="icb" type="button" data-shift="-1" title="Kỳ trước (←)">${I('chevron-left')}</button><span>${periodLabel()}</span><button class="icb" type="button" data-shift="1" title="Kỳ sau (→)">${I('chevron-right')}</button></div>`;
export const groupFilterChip = () => view.group ? `<button type="button" class="chip on" data-clear-group title="Bỏ lọc">${tile(gById(view.group), 24)}${esc(gById(view.group)?.name)} ${I('x')}</button>` : '';
export { fmt };
