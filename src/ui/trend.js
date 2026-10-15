// Biểu đồ xu hướng chi tiêu (đường cộng dồn chồng lên nhau) + phân bổ theo nhóm
import { store, gById, tops, groupIds } from '../store.js';
import { view } from '../state.js';
import { fmt, shortM, esc, daysIn } from '../util.js';
import { tile } from './common.js';
import { PAL } from '../defaults.js';

export const trendState = { g: 'all', show: { cur: true, prev: false, avg: true } };
const SER = { cur: ['Tháng này', '#E5383B'], prev: ['Tháng trước', '#F5A623'], avg: ['TB 3 tháng trước', '#C9B8AA'] };

// tổng chi theo ngày của tháng (y, m: 0-11)
function daily(y, m, ids) {
  const n = daysIn(y, m), arr = Array(n).fill(0), pre = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const set = ids ? new Set(ids) : null;
  for (const t of store.tx) {
    if (t.type !== 'exp' || !t.date?.startsWith(pre)) continue;
    if (set && !set.has(t.groupId)) continue;
    arr[+t.date.slice(8, 10) - 1] += t.amount;
  }
  return arr;
}
const cum = (a) => { let s = 0; return a.map((v) => (s += v)); };
const shift = (y, m, k) => { const d = new Date(y, m - k, 1); return [d.getFullYear(), d.getMonth()]; };

export function series(y, m, gid) {
  const ids = gid === 'all' ? null : groupIds(gid);
  const n = daysIn(y, m);
  const today = new Date();
  const isCur = today.getFullYear() === y && today.getMonth() === m;
  const future = new Date(y, m, 1) > today;
  const upto = future ? 0 : isCur ? today.getDate() : n;
  const cur = cum(daily(y, m, ids)).slice(0, upto);
  const past = [1, 2, 3].map((k) => { const [yy, mm] = shift(y, m, k); return cum(daily(yy, mm, ids)); });
  const at = (c, d) => c[Math.min(d, c.length) - 1] || 0;
  const prev = Array.from({ length: n }, (_, i) => at(past[0], i + 1));
  const avg = Array.from({ length: n }, (_, i) => (at(past[0], i + 1) + at(past[1], i + 1) + at(past[2], i + 1)) / 3);
  return { cur, prev, avg, n, upto };
}

function niceStep(max) {
  const raw = max / 3, p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= raw) return k * p;
  return 10 * p;
}

// vẽ vào el; tự vẽ lại khi đổi cỡ
export function mountTrend(el) {
  let sel = null;
  const draw = () => {
    const y = view.cursor.getFullYear(), m = view.cursor.getMonth();
    if (trendState.g !== 'all' && !gById(trendState.g)) trendState.g = 'all';
    const s = series(y, m, trendState.g), on = (k) => trendState.show[k];
    const W = Math.max(260, el.clientWidth || 400), H = Math.round(Math.min(300, Math.max(190, W * 0.58)));
    const d = Math.min(sel ?? (s.upto || s.n), s.n);
    const vals = [on('cur') ? s.cur[s.upto - 1] || 0 : 0, on('prev') ? s.prev[s.n - 1] : 0, on('avg') ? s.avg[s.n - 1] : 0];
    const max = Math.max(...vals, 100000) * 1.05, step = niceStep(max), top = Math.ceil(max / step) * step;
    const L = 6, R = 54, T = 10, B = 26, x = (i) => L + (i - 1) * (W - L - R) / (s.n - 1), yy = (v) => T + (H - T - B) * (1 - v / top);
    const path = (a) => a.map((v, i) => (i ? 'L' : 'M') + x(i + 1).toFixed(1) + ' ' + yy(v).toFixed(1)).join('');
    let g = '';
    for (let v = 0; v <= top + 1; v += step) g += `<line x1="${L}" x2="${W - R + 6}" y1="${yy(v)}" y2="${yy(v)}" stroke="#EAD7C5" stroke-dasharray="${v ? '5 5' : '0'}" stroke-width="${v ? 1.2 : 1.6}"/><text x="${W - R + 12}" y="${yy(v) + 4}">${v ? shortM(v) : '0'}</text>`;
    const mm = String(m + 1).padStart(2, '0'), dd = String(d).padStart(2, '0');
    const cv = d <= s.upto ? s.cur[d - 1] : null;
    const line = (a, col, w, dash) => a.length ? `<path d="${path(a)}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? 'stroke-dasharray="7 6"' : ''} stroke-linejoin="round" stroke-linecap="round"/>` : '';
    const dot = (v, col, r) => `<circle cx="${x(d)}" cy="${yy(v)}" r="${r}" fill="#fff" stroke="${col}" stroke-width="2.6"/>`;
    let verdict = '';
    const ref = on('avg') ? ['avg', 'trung bình 3 tháng trước'] : on('prev') ? ['prev', 'tháng trước'] : null;
    if (ref && s.upto) {
      const a = s.cur[s.upto - 1], b = s[ref[0]][s.upto - 1];
      if (b > 0) { const pc = (a - b) / b * 100; verdict = `<div class="verdict ${pc <= 0 ? 'good' : ''}">Đến ${s.upto}/${m + 1} bạn đã tiêu ${pc > 0 ? 'nhiều' : 'ít'} hơn ${Math.abs(pc).toFixed(0)}% so với ${ref[1]} cùng thời điểm.</div>`; }
    }
    const lab = trendState.g === 'all' ? '' : ` · ${esc(gById(trendState.g)?.name)}`;
    const chips = tops('exp');
    el.innerHTML = `<div class="trend-h"><h3>Xu hướng chi tiêu${lab}</h3></div>
      <div class="gchips">${['all', ...chips.map((c) => c.id)].map((id) => id === 'all'
        ? `<button type="button" class="chip txt ${trendState.g === 'all' ? 'on' : ''}" data-g="all">Tất cả</button>`
        : `<button type="button" class="chip ${trendState.g === id ? 'on' : ''}" data-g="${id}">${tile(gById(id), 24)}${esc(gById(id).name)}</button>`).join('')}</div>
      <div class="tip">${on('cur') ? `<div class="l1">${dd}/${mm}/${y}: ${cv != null ? `<b>${fmt(cv)}</b>` : '<span style="color:var(--dim)">chưa tới ngày này</span>'}</div>` : `<div class="l1">Ngày ${dd}/${mm}</div>`}
        ${on('prev') ? `<div class="l2"><i class="sw" style="background:${SER.prev[1]}"></i>Tháng trước: <b>${fmt(s.prev[d - 1])}</b></div>` : ''}
        ${on('avg') ? `<div class="l2"><i class="sw" style="background:${SER.avg[1]}"></i>TB 3 tháng trước: <b>${fmt(s.avg[d - 1])}</b></div>` : ''}</div>
      <svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ chi tiêu cộng dồn">
        <defs><linearGradient id="trArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5383B" stop-opacity=".28"/><stop offset="1" stop-color="#E5383B" stop-opacity="0"/></linearGradient></defs>${g}
        ${on('avg') ? line(s.avg, SER.avg[1], 3.2) : ''}${on('prev') ? line(s.prev, SER.prev[1], 2.8, 1) : ''}
        ${on('cur') && s.upto ? `<path d="${path(s.cur)}L${x(s.upto)} ${yy(0)}L${x(1)} ${yy(0)}Z" fill="url(#trArea)"/>` + line(s.cur, SER.cur[1], 3.4) : ''}
        <line x1="${x(d)}" x2="${x(d)}" y1="${T}" y2="${yy(0)}" stroke="#D9C6B5" stroke-width="1.4"/>
        ${on('avg') ? dot(s.avg[d - 1], SER.avg[1], 4.5) : ''}${on('prev') ? dot(s.prev[d - 1], SER.prev[1], 4.5) : ''}
        ${on('cur') && cv != null ? `<circle cx="${x(d)}" cy="${yy(cv)}" r="7" fill="#fff" stroke="#E5383B" stroke-width="3.2"/>` : ''}
        <text x="${x(1)}" y="${H - 6}" text-anchor="start">01/${mm}</text><text x="${x(s.n)}" y="${H - 6}" text-anchor="end">${s.n}/${mm}</text>
        <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
      <div class="tlegend">${Object.entries(SER).map(([k, [n, c]]) => `<label class="lchk" style="--c:${c}"><input type="checkbox" data-s="${k}" ${on(k) ? 'checked' : ''}>${n}</label>`).join('')}</div>
      ${verdict}`;
    const svg = el.querySelector('svg.tchart');
    const pick = (e) => { const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * (W / r.width); sel = Math.max(1, Math.min(s.n, Math.round((px - L) / ((W - L - R) / (s.n - 1))) + 1)); draw(); };
    svg.onpointermove = pick; svg.onpointerdown = pick;
    svg.onpointerleave = () => { sel = null; draw(); };
    el.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => { trendState.g = b.dataset.g; sel = null; draw(); }));
    el.querySelectorAll('[data-s]').forEach((b) => (b.onchange = () => { trendState.show[b.dataset.s] = b.checked; draw(); }));
    const gc = el.querySelector('.gchips .on');
    if (gc) gc.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  draw();
  if (el._ro) el._ro.disconnect();
  let lastW = el.clientWidth;
  el._ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - lastW) > 8) { lastW = el.clientWidth; draw(); } });
  el._ro.observe(el);
  el._redraw = draw;
}

// phân bổ chi theo nhóm cha trong tháng, so với TB 3 tháng trước
export function breakdownHtml() {
  const y = view.cursor.getFullYear(), m = view.cursor.getMonth();
  const key = (yy, mm) => `${yy}-${String(mm + 1).padStart(2, '0')}`;
  const months = [0, 1, 2, 3].map((k) => { const d = new Date(y, m - k, 1); return key(d.getFullYear(), d.getMonth()); });
  const topOf = (gid) => { const g = gById(gid); return g ? (g.parent || g.id) : null; };
  const sums = {};
  for (const t of store.tx) {
    if (t.type !== 'exp') continue;
    const k = months.indexOf(t.date.slice(0, 7));
    if (k < 0) continue;
    const tg = topOf(t.groupId);
    if (!tg) continue;
    (sums[tg] ||= [0, 0, 0, 0])[k] += t.amount;
  }
  const rows = Object.entries(sums).map(([id, a]) => ({ id, cur: a[0], avg: (a[1] + a[2] + a[3]) / 3 })).filter((r) => r.cur > 0).sort((a, b) => b.cur - a.cur);
  if (!rows.length) return `<div class="empty"><b>Chưa có chi tiêu tháng này</b><span>Thêm giao dịch để xem phân bổ theo nhóm.</span></div>`;
  const max = rows[0].cur;
  return `<div class="brk">${rows.map((r) => {
    const g = gById(r.id), c = (PAL[g.color] || PAL.red)[0];
    const pc = r.avg > 0 ? (r.cur - r.avg) / r.avg * 100 : null;
    return `<button type="button" data-brk="${r.id}">${tile(g, 40)}<div><div class="nm"><span>${esc(g.name)}</span><b>${fmt(r.cur)}</b></div><div class="track"><i style="width:${(r.cur / max * 100).toFixed(1)}%;background:${c}"></i></div></div>
      <span class="d" style="color:${pc == null ? 'var(--dim)' : pc > 10 ? 'var(--red)' : pc < -5 ? 'var(--green)' : 'var(--muted)'}">${pc == null ? 'mới' : (pc > 0 ? '+' : '') + pc.toFixed(0) + '%'}</span></button>`;
  }).join('')}</div>`;
}

export function wireBreakdown(root) {
  root.querySelectorAll('[data-brk]').forEach((b) => (b.onclick = () => {
    trendState.g = b.dataset.brk;
    root.querySelectorAll('.trend').forEach((t) => t._redraw && t._redraw());
  }));
}
