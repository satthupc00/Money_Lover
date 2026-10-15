// Sổ giao dịch: thẻ tổng (2 tab Chi / Thu) + danh sách theo ngày / tháng / năm
import { store, gById, groupIds } from '../store.js';
import { view, setView } from '../state.js';
import { I } from '../icons.js';
import { fmt, vnd, esc, ymd, dayLabel, shortM, daysIn } from '../util.js';
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

export function shiftPeriod(k) {
  const c = new Date(view.cursor);
  if (view.period === 'day') c.setDate(c.getDate() + k);
  else if (view.period === 'year') c.setFullYear(c.getFullYear() + k, 0, 1);
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
  return `<div class="hero ${k === 'inc' ? 'inc' : ''}">
    <span class="rem" title="Thu trừ chi ${pw}">Còn lại ${rest < 0 ? '−' : ''}${shortM(rest)}</span>
    <small>${k === 'exp' ? 'Chi tiêu' : 'Thu nhập'} ${pw}${view.group ? ' · ' + esc(gById(view.group)?.name) : ''}</small>
    <div class="bal">${v ? (k === 'exp' ? '−' : '+') : ''}${vnd(v)}</div>
    <div class="io" role="tablist"><button type="button" role="tab" data-hero="exp" class="${k === 'exp' ? 'on' : ''}">Chi tiêu</button><button type="button" role="tab" data-hero="inc" class="${k === 'inc' ? 'on' : ''}">Thu nhập</button></div></div>`;
}

export const txRow = (t) => {
  const g = gById(t.groupId) || { name: 'Nhóm đã xoá', icon: 'receipt', color: 'brown' };
  const p = g.parent ? gById(g.parent) : null;
  return `<button type="button" class="tx" data-tx="${t.id}">${tile(g, 44)}<div class="t"><div>${esc(t.note || g.name)}</div><small>${p ? esc(p.name) + ' › ' : ''}${esc(g.name)}${t.exclude ? ' · không tính vào báo cáo' : ''}</small></div><div class="amt ${t.type === 'inc' ? 'inc' : ''}">${t.type === 'inc' ? '+' : '−'}${vnd(t.amount)}</div></button>`;
};

const sortTx = (a, b) => (b.date.localeCompare(a.date)) || ((b.createdAt || 0) - (a.createdAt || 0));

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
    h += `<div class="day"><b>${dayLabel(d)}</b><span class="${s > 0 ? 'inc' : ''}">${s > 0 ? '+' : s < 0 ? '−' : ''}${vnd(s)}</span></div>` + ts.map(txRow).join('');
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
  root.querySelectorAll('[data-tx]').forEach((b) => (b.onclick = () => openTx(store.tx.find((t) => t.id === b.dataset.tx))));
  root.querySelectorAll('[data-month]').forEach((b) => (b.onclick = () => setView({ period: 'month', cursor: new Date(view.cursor.getFullYear(), +b.dataset.month, 1) })));
  root.querySelectorAll('[data-period]').forEach((b) => (b.onclick = () => setView({ period: b.dataset.period, cursor: b.dataset.period === 'day' && sameMonth(view.cursor, new Date()) ? new Date() : view.cursor })));
  root.querySelectorAll('[data-shift]').forEach((b) => (b.onclick = () => shiftPeriod(+b.dataset.shift)));
  root.querySelectorAll('[data-clear-group]').forEach((b) => (b.onclick = () => setView({ group: null })));
}
const sameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const periodTabs = () => `<div class="tabs">${[['day', 'Ngày'], ['month', 'Tháng'], ['year', 'Năm']].map(([k, n]) => `<button type="button" data-period="${k}" class="${view.period === k ? 'on' : ''}">${n}</button>`).join('')}<span class="ind"></span></div>`;
export const periodNav = () => `<div class="period"><button class="icb" type="button" data-shift="-1" title="Kỳ trước (←)">${I('chevron-left')}</button><span>${periodLabel()}</span><button class="icb" type="button" data-shift="1" title="Kỳ sau (→)">${I('chevron-right')}</button></div>`;
export const groupFilterChip = () => view.group ? `<button type="button" class="chip on" data-clear-group title="Bỏ lọc">${tile(gById(view.group), 24)}${esc(gById(view.group)?.name)} ${I('x')}</button>` : '';
export { fmt };
