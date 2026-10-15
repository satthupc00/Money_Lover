import { I } from '../icons.js';
import { PAL } from '../defaults.js';
import { esc } from '../util.js';

export const tile = (g, s = 40) => {
  const p = PAL[g?.color] || PAL.red;
  return `<span class="tile" style="width:${s}px;height:${s}px;--fg-t:${p[0]};--bg-t:${p[1]}">${I(g?.icon || 'receipt')}</span>`;
};

const overlay = () => document.getElementById('overlay');

// Hộp thoại giữa màn hình (PC) — trả về {el, close}
export function dialog(html, { wide = false, onClose } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'scrim';
  wrap.innerHTML = `<div class="dlg${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  overlay().appendChild(wrap);
  const close = () => { wrap.remove(); document.removeEventListener('keydown', key, true); onClose && onClose(); };
  const key = (e) => { if (e.key === 'Escape' && overlay().lastElementChild === wrap) { e.preventDefault(); close(); } };
  document.addEventListener('keydown', key, true);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) wrap._down = true; });
  wrap.addEventListener('click', (e) => { if (e.target === wrap && wrap._down) close(); wrap._down = false; if (e.target.closest('[data-x]')) close(); });
  return { el: wrap.firstElementChild, close };
}

// Bảng trượt từ dưới lên (điện thoại)
export function sheet(html, { onClose, cls = '' } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'sheet-scrim';
  wrap.innerHTML = `<div class="sheet ${cls}" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  overlay().appendChild(wrap);
  const close = () => { wrap.remove(); document.removeEventListener('keydown', key, true); onClose && onClose(); };
  const key = (e) => { if (e.key === 'Escape' && overlay().lastElementChild === wrap) { e.preventDefault(); close(); } };
  document.addEventListener('keydown', key, true);
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-x]')) close(); });
  return { el: wrap.firstElementChild, close };
}

let toastT;
export function toast(msg, action) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.remove(); action.run(); };
  document.body.appendChild(t);
  clearTimeout(toastT);
  toastT = setTimeout(() => t.remove(), action ? 6000 : 2800);
}

export function confirmBox(title, text, okLabel = 'Đồng ý', danger = false) {
  return new Promise((res) => {
    const d = dialog(`<h3>${esc(title)}</h3><p>${text}</p><div class="actions"><button class="btn" type="button" data-no>Huỷ</button><button class="btn ${danger ? 'danger' : 'primary'}" type="button" data-ok>${esc(okLabel)}</button></div>`, { onClose: () => res(false) });
    d.el.querySelector('[data-no]').onclick = () => d.close();
    d.el.querySelector('[data-ok]').onclick = () => { res(true); d.close(); };
  });
}

// tabs có thanh trượt: đặt vị trí .ind theo nút đang chọn
export function placeTabs(root) {
  root.querySelectorAll('.tabs').forEach((t) => {
    const ind = t.querySelector('.ind'), on = t.querySelector('button.on');
    if (ind && on) { ind.style.left = on.offsetLeft + 'px'; ind.style.width = on.offsetWidth + 'px'; }
  });
}

// thanh cuộn chỉ hiện khi đang cuộn
export function initScrollbars() {
  const timers = new WeakMap();
  document.addEventListener('scroll', (e) => {
    const el = e.target === document ? document.documentElement : e.target;
    if (!(el instanceof Element)) return;
    el.classList.add('is-scrolling');
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), 900));
  }, true);
}
