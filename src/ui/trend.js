// Biểu đồ xu hướng chi tiêu (đường cộng dồn chồng lên nhau) + phân bổ theo nhóm
import { store, gById, tops, kids, groupIds } from '../store.js';
import { view } from '../state.js';
import { fmt, shortM, esc, daysIn } from '../util.js';
import { I } from '../icons.js';
import { tile } from './common.js';
import { PAL } from '../defaults.js';

export const trendState = { g: 'all', show: { cur: true, prev: false, avg: true }, sel: null, key: '', menu: false };
// bấm ra ngoài thì đóng menu chọn nhóm
document.addEventListener('pointerdown', (e) => {
  if (trendState.menu && !e.target.closest('.gsel')) { trendState.menu = false; document.querySelectorAll('.trend').forEach((t) => t._redraw && t._redraw()); }
});
const SER = { cur: ['Tháng này', '#E5383B'], prev: ['Tháng trước', '#5B8DEF'], avg: ['TB 3 tháng', '#B3A396'] };

// tổng chi theo ngày của tháng (y, m: 0-11)
function daily(y, m, ids) {
  const n = daysIn(y, m), arr = Array(n).fill(0), pre = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const set = ids ? new Set(ids) : null;
  for (const t of store.tx) {
    if (t.type !== 'exp' || t.exclude || !t.date?.startsWith(pre)) continue;
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

// ---------- hiệu ứng khi bật / tắt đường, đổi nhóm ----------
const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function snapshot(el) {
  const svg = el.querySelector('svg.tchart');
  if (!svg) return null;
  const shape = {}, grid = {};
  svg.querySelectorAll('[data-k]').forEach((e) => (shape[e.dataset.k] = e.tagName === 'path' ? e.getAttribute('d') : +e.getAttribute('cy')));
  svg.querySelectorAll('.gl').forEach((e) => (grid[e.dataset.v] = +e.querySelector('line').getAttribute('y1')));
  return { shape, grid, oldY: svg._yy };
}
function morph(svg, b, yy) {
  svg._yy = yy;
  if (!b || still()) return;
  svg.querySelectorAll('[data-k]').forEach((e) => {
    const k = e.dataset.k, old = b.shape[k];
    if (e.tagName === 'path') {
      const now = e.getAttribute('d');
      if (old && old !== now && old.split(/[ML]/).length === now.split(/[ML]/).length) e.animate([{ d: `path("${old}")` }, { d: `path("${now}")` }], { duration: 560, easing: EASE });
      else if (!old && k === 'area') e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 200, easing: 'ease-out', fill: 'backwards' });
      else if (!old) e.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }], { duration: 750, easing: EASE });
    } else {
      const now = +e.getAttribute('cy');
      if (old != null && old !== now) e.animate([{ transform: `translateY(${old - now}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
      else if (old == null) e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 450, fill: 'backwards' });
    }
  });
  svg.querySelectorAll('.gl').forEach((e) => {
    const v = +e.dataset.v, now = +e.querySelector('line').getAttribute('y1');
    const from = b.grid[v] ?? (b.oldY ? b.oldY(v) : now);
    if (from !== now) e.animate([{ transform: `translateY(${from - now}px)`, opacity: b.grid[v] == null ? 0 : 1 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: EASE });
  });
}
function retract(svg, k) {
  const ln = svg.querySelector(`path[data-k="${k}"]`), dt = svg.querySelector(`[data-k="d${k}"]`);
  if (!ln || still()) return Promise.resolve();
  dt?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
  return ln.animate([{ strokeDasharray: '1 1', strokeDashoffset: 0 }, { strokeDasharray: '1 1', strokeDashoffset: 1 }], { duration: 360, easing: 'cubic-bezier(.55, 0, .7, .2)', fill: 'forwards' }).finished.catch(() => {});
}

// vẽ vào el; tự vẽ lại khi đổi cỡ
// trạng thái đang kéo trên biểu đồ: để ngoài draw() vì mỗi lần chọn điểm biểu đồ được vẽ lại
const drag = { on: false };
const stopDrag = () => { drag.on = false; };
document.addEventListener('pointerup', stopDrag);
document.addEventListener('pointercancel', stopDrag);

export function mountTrend(el) {
  const draw = (anim = false) => {
    const y = view.cursor.getFullYear(), m = view.cursor.getMonth();
    if (trendState.g !== 'all' && !gById(trendState.g)) trendState.g = 'all';
    const key = `${y}-${m}-${trendState.g}`;
    if (trendState.key !== key) { trendState.key = key; trendState.sel = null; }
    const sel = trendState.sel;
    const s = series(y, m, trendState.g), on = (k) => trendState.show[k];
    const W = Math.max(260, el.clientWidth || 400), H = Math.round(Math.min(300, Math.max(190, W * 0.58)));
    const d = Math.min(sel ?? (s.upto || s.n), s.n);
    const vals = [on('cur') ? s.cur[s.upto - 1] || 0 : 0, on('prev') ? s.prev[s.n - 1] : 0, on('avg') ? s.avg[s.n - 1] : 0];
    const max = Math.max(...vals, 100000) * 1.05, step = niceStep(max), top = Math.ceil(max / step) * step;
    const L = 6, R = 62, T = 10, B = 26, x = (i) => L + (i - 1) * (W - L - R) / (s.n - 1), yy = (v) => T + (H - T - B) * (1 - v / top);
    const path = (a) => a.map((v, i) => (i ? 'L' : 'M') + x(i + 1).toFixed(1) + ' ' + yy(v).toFixed(1)).join('');
    let g = '';
    for (let v = 0; v <= top + 1; v += step) g += `<g class="gl" data-v="${v}"><line x1="${L}" x2="${W - R + 6}" y1="${yy(v)}" y2="${yy(v)}" stroke="#EAD7C5" stroke-dasharray="${v ? '5 5' : '0'}" stroke-width="${v ? 1.2 : 1.6}"/><text x="${W - R + 12}" y="${yy(v) + 4}">${v ? shortM(v) : '0'}</text></g>`;
    const mm = String(m + 1).padStart(2, '0'), dd = String(d).padStart(2, '0');
    const cv = d <= s.upto ? s.cur[d - 1] : null;
    const line = (k, a, col, w, dash) => a.length ? `<path data-k="${k}" pathLength="1" d="${path(a)}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? 'stroke-dasharray="7 6"' : ''} stroke-linejoin="round" stroke-linecap="round"/>` : '';
    const dot = (k, v, col, r) => `<circle data-k="${k}" cx="${x(d)}" cy="${yy(v)}" r="${r}" fill="#fff" stroke="${col}" stroke-width="2.6"/>`;
    // câu so sánh luôn chiếm sẵn chỗ để biểu đồ không bị nhảy khi bật / tắt đường
    let verdict = '<div class="verdict idle">Bật Tháng trước hoặc TB 3 tháng để so sánh</div>';
    const ref = on('avg') ? ['avg', 'TB 3 tháng'] : on('prev') ? ['prev', 'tháng trước'] : null;
    if (ref && s.upto) {
      const a = s.cur[s.upto - 1], b = s[ref[0]][s.upto - 1];
      if (b > 0) { const pc = (a - b) / b * 100; verdict = `<div class="verdict ${pc <= 0 ? 'good' : ''}"><span>Đến ${s.upto}/${m + 1}: ${pc > 0 ? 'nhiều' : 'ít'} hơn <b>${Math.abs(pc).toFixed(0)}%</b> so với ${ref[1]} cùng kỳ</span></div>`; }
    } else if (!s.upto) verdict = '<div class="verdict idle">Tháng này chưa bắt đầu</div>';
    const cg = trendState.g === 'all' ? null : gById(trendState.g);
    const menu = trendState.menu ? `<div class="gmenu" role="listbox"><button type="button" data-g="all" class="${trendState.g === 'all' ? 'on' : ''}"><span class="allic">${I('layers')}</span>Tất cả nhóm</button>${tops('exp').flatMap((t) => [t, ...kids(t.id)]).map((g) => `<button type="button" data-g="${g.id}" class="${g.parent ? 'child' : ''} ${trendState.g === g.id ? 'on' : ''}">${tile(g, g.parent ? 26 : 30)}${esc(g.name)}</button>`).join('')}</div>` : '';
    const before = anim ? snapshot(el) : null;
    el.innerHTML = `<div class="trend-h"><h3>Xu hướng chi tiêu</h3>
        <div class="gsel"><button type="button" class="chip ${cg ? '' : 'txt'} on" data-gmenu aria-expanded="${trendState.menu}">${cg ? tile(cg, 24) : ''}${cg ? esc(cg.name) : 'Tất cả'}${I('chevron-down')}</button>${menu}</div></div>
      <div class="tip"><span class="td">${dd}/${mm}/${y}</span><b class="tv cur">${cv != null ? fmt(cv) : '–'}</b>
        <span class="tv prev ${on('prev') ? '' : 'off'}" title="Tháng trước">${fmt(s.prev[d - 1])}</span><span class="tv avg ${on('avg') ? '' : 'off'}" title="TB 3 tháng trước">${fmt(s.avg[d - 1])}</span></div>
      <svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Biểu đồ chi tiêu cộng dồn">
        <defs><linearGradient id="trArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E5383B" stop-opacity=".28"/><stop offset="1" stop-color="#E5383B" stop-opacity="0"/></linearGradient></defs>${g}
        ${on('avg') ? line('avg', s.avg, SER.avg[1], 1.8) : ''}${on('prev') ? line('prev', s.prev, SER.prev[1], 1.8) : ''}
        ${on('cur') && s.upto ? `<path data-k="area" d="${path(s.cur)}L${x(s.upto)} ${yy(0)}L${x(1)} ${yy(0)}Z" fill="url(#trArea)"/>` + line('cur', s.cur, SER.cur[1], 2.4) : ''}
        <line x1="${x(d)}" x2="${x(d)}" y1="${T}" y2="${yy(0)}" stroke="#D9C6B5" stroke-width="1.4"/>
        ${on('avg') ? dot('davg', s.avg[d - 1], SER.avg[1], 4.5) : ''}${on('prev') ? dot('dprev', s.prev[d - 1], SER.prev[1], 4.5) : ''}
        ${on('cur') && cv != null ? `<circle data-k="dcur" cx="${x(d)}" cy="${yy(cv)}" r="6" fill="#fff" stroke="#E5383B" stroke-width="2.6"/>` : ''}
        <text x="${x(1)}" y="${H - 6}" text-anchor="start">01/${mm}</text><text x="${x(s.n)}" y="${H - 6}" text-anchor="end">${s.n}/${mm}</text>
        <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
      <div class="tlegend two">${['prev', 'avg'].map((k) => `<label class="lchk" style="--c:${SER[k][1]}"><input type="checkbox" data-s="${k}" ${on(k) ? 'checked' : ''}><i class="box"></i>${SER[k][0]}</label>`).join('')}</div>
      ${verdict}`;
    const svg = el.querySelector('svg.tchart');
    morph(svg, before, (v) => yy(v));
    // chọn ngày trên biểu đồ: điểm được giữ lại sau khi thả tay
    const pick = (e) => { const r = svg.getBoundingClientRect(); const px = (e.clientX - r.left) * (W / r.width); const v = Math.max(1, Math.min(s.n, Math.round((px - L) / ((W - L - R) / (s.n - 1))) + 1)); if (v !== trendState.sel) { trendState.sel = v; draw(); } };
    // chỉ đổi điểm khi bấm / kéo; rê chuột không làm điểm chạy theo
    svg.onpointerdown = (e) => { drag.on = true; pick(e); };
    svg.onpointermove = (e) => { if (drag.on) pick(e); };
    el.querySelector('[data-gmenu]').onclick = (e) => { e.stopPropagation(); trendState.menu = !trendState.menu; draw(); };
    el.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => { const ch = trendState.g !== b.dataset.g; trendState.g = b.dataset.g; trendState.menu = false; draw(ch); }));
    el.querySelectorAll('[data-s]').forEach((b) => (b.onchange = () => {
      const k = b.dataset.s;
      if (b.checked) { trendState.show[k] = true; draw(true); return; }
      // tắt: rút đường lại rồi mới vẽ lại thang mới
      retract(svg, k).then(() => { trendState.show[k] = false; draw(true); });
    }));
    el.querySelector('.gmenu .on')?.scrollIntoView({ block: 'nearest' });
  };
  draw();
  if (el._ro) el._ro.disconnect();
  let lastW = el.clientWidth;
  // vẽ lại ở khung hình kế tiếp, tránh lỗi "ResizeObserver loop" khi gập / mở máy
  el._ro = new ResizeObserver(() => { if (Math.abs(el.clientWidth - lastW) > 8) { lastW = el.clientWidth; requestAnimationFrame(() => draw()); } });
  el._ro.observe(el);
  el._redraw = draw;
}

// ---------- Chi theo nhóm: vòng tròn tỷ lệ + danh sách, bấm để xem nhóm con ----------
const DONUT = ['#E5383B', '#F5A623', '#3A7BEA', '#13A386', '#8A4FE0', '#E5487A', '#B06A2C', '#1FA463', '#5B4FE0', '#E07B12'];
const OTHER = '#D8C8BA';
const open = new Set();
let legAll = false;

function monthSums() {
  const y = view.cursor.getFullYear(), m = view.cursor.getMonth();
  const pre = `${y}-${String(m + 1).padStart(2, '0')}`;
  const byGroup = {};
  let total = 0;
  for (const t of store.tx) {
    if (t.type !== 'exp' || t.exclude || !t.date.startsWith(pre)) continue;
    byGroup[t.groupId] = (byGroup[t.groupId] || 0) + t.amount;
    total += t.amount;
  }
  const rows = [];
  const seen = new Set();
  for (const gid of Object.keys(byGroup)) {
    const g = gById(gid);
    const top = g ? (g.parent ? gById(g.parent) || g : g) : null;
    const id = top ? top.id : '?';
    if (seen.has(id)) continue;
    seen.add(id);
    const ids = top ? groupIds(top.id) : [gid];
    const children = ids.map((cid) => ({ id: cid, v: byGroup[cid] || 0 })).filter((c) => c.v > 0).sort((a, b) => b.v - a.v);
    rows.push({ id, g: top, v: children.reduce((a, c) => a + c.v, 0), children });
  }
  rows.sort((a, b) => b.v - a.v);
  rows.forEach((r, i) => (r.color = i < DONUT.length ? DONUT[i] : OTHER));
  return { rows, total };
}

function donutSvg(rows, total) {
  const R = 70, r = 46, C = 90;
  let a = -Math.PI / 2, segs = '';
  const pt = (rad, ang) => `${(C + rad * Math.cos(ang)).toFixed(2)} ${(C + rad * Math.sin(ang)).toFixed(2)}`;
  for (const row of rows) {
    const frac = row.v / total;
    if (frac <= 0) continue;
    const b = a + Math.min(frac, 0.9999) * Math.PI * 2, large = b - a > Math.PI ? 1 : 0;
    segs += `<path data-seg="${row.id}" d="M${pt(R, a)} A${R} ${R} 0 ${large} 1 ${pt(R, b)} L${pt(r, b)} A${r} ${r} 0 ${large} 0 ${pt(r, a)}Z" fill="${row.color}" stroke="#fff" stroke-width="2" class="${open.has(row.id) ? 'on' : ''}"><title>${esc(row.g?.name || '')}: ${(frac * 100).toFixed(1)}%</title></path>`;
    a = b;
  }
  return `<svg class="donut" viewBox="0 0 180 180" role="img" aria-label="Tỷ lệ chi theo nhóm">${segs}
    <text x="90" y="84" text-anchor="middle" class="dl">Tổng chi</text><text x="90" y="104" text-anchor="middle" class="dv">${shortM(total)}</text></svg>`;
}

export function mountBreakdown(el) {
  const draw = () => {
    const { rows, total } = monthSums();
    const ml = `Tháng ${view.cursor.getMonth() + 1}/${view.cursor.getFullYear()}`;
    if (!rows.length) { el.innerHTML = `<h3>Chi theo nhóm</h3><div class="empty"><b>Chưa có chi tiêu ${ml.toLowerCase()}</b><span>Thêm giao dịch để xem phân bổ theo nhóm.</span></div>`; return; }
    const max = rows[0].v;
    el.innerHTML = `<h3>Chi theo nhóm</h3><div class="sub">${ml} · bấm vào nhóm để xem nhóm con</div>
      <div class="donutwrap">${donutSvg(rows, total)}<div class="dleg ${legAll ? 'all' : ''}">${(legAll ? rows : rows.slice(0, 6)).map((r) => `<span><i style="background:${r.color}"></i><em>${esc(r.g?.name || '?')}</em><b>${(r.v / total * 100).toFixed(r.v / total < 0.01 ? 1 : 0)}%</b></span>`).join('')}${rows.length > 6 ? `<button type="button" class="more" data-legall>${legAll ? I('chevron-up') + 'Thu gọn' : `+${rows.length - 6} nhóm khác` + I('chevron-down')}</button>` : ''}</div></div>
      <div class="brk">${rows.map((r) => {
        const isOpen = open.has(r.id);
        const hasKids = r.children.length > 1 || (r.children[0] && r.children[0].id !== r.id);
        return `<div class="brkrow ${isOpen ? 'open' : ''}"><button type="button" data-brk="${r.id}" aria-expanded="${isOpen}">${tile(r.g, 40)}<div><div class="nm"><span>${esc(r.g?.name || 'Nhóm đã xoá')}</span><b>${fmt(r.v)}</b></div><div class="track"><i style="width:${(r.v / max * 100).toFixed(1)}%;background:${r.color}"></i></div></div>${hasKids ? I('chevron-down', 'brkchev') : '<span></span>'}</button>
          ${hasKids ? `<div class="fold"><div><div class="brkkids">${r.children.map((c) => { const cg = gById(c.id); return `<div class="brkkid">${tile(cg, 30)}<span>${esc(c.id === r.id ? r.g.name + ' (chung)' : cg?.name || '?')}</span><b>${fmt(c.v)}</b></div>`; }).join('')}<div class="brkkid sum"><span>Tổng nhóm trong tháng</span><b>${fmt(r.v)}</b></div></div></div></div>` : ''}</div>`;
      }).join('')}</div>`;
    // mở / thu nhóm con ngay trên chỗ, không vẽ lại để có hiệu ứng trượt
    const toggle = (id) => {
      const on = !open.has(id);
      on ? open.add(id) : open.delete(id);
      const b = el.querySelector(`[data-brk="${id}"]`);
      b?.closest('.brkrow').classList.toggle('open', on);
      b?.setAttribute('aria-expanded', on);
      el.querySelector(`[data-seg="${id}"]`)?.classList.toggle('on', on);
    };
    el.querySelectorAll('[data-brk]').forEach((b) => (b.onclick = () => toggle(b.dataset.brk)));
    const la = el.querySelector('[data-legall]');
    if (la) la.onclick = () => { legAll = !legAll; draw(); };
    el.querySelectorAll('[data-seg]').forEach((p) => (p.onclick = () => { if (!open.has(p.dataset.seg)) toggle(p.dataset.seg); el.querySelector(`[data-brk="${p.dataset.seg}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }));
  };
  draw();
  el._redraw = draw;
}
