import { I } from '../icons.js';
import { PAL } from '../defaults.js';
import { esc } from '../util.js';

// icon 3D (Fluent Emoji 3D của Microsoft, giấy phép MIT)
const EMOJI = import.meta.glob('../assets/emoji/*.webp', { eager: true, query: '?url', import: 'default' });
export const emojiSrc = (code) => EMOJI[`../assets/emoji/${code}.webp`] || EMOJI['../assets/emoji/1f9fe.webp'];
export const emo = (code, cls = '') => `<img class="emo ${cls}" src="${emojiSrc(code)}" alt="" draggable="false" decoding="async">`;

export const tile = (g, s = 40) => {
  const ic = g?.icon || 'e:1f9fe';
  if (ic.startsWith('e:')) return `<span class="tile e3" style="width:${s}px;height:${s}px">${emo(ic.slice(2))}</span>`;
  // nhóm cũ còn icon nét (lucide)
  const p = PAL[g?.color] || PAL.red;
  return `<span class="tile" style="width:${s}px;height:${s}px;--fg-t:${p[0]};--bg-t:${p[1]}">${I(ic)}</span>`;
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
const tabPos = {};
export function placeTabs(root) {
  root.querySelectorAll('.tabs, .io').forEach((t, i) => {
    const ind = t.querySelector('.ind'), on = t.querySelector('button.on');
    if (!ind || !on) return;
    const key = t.dataset.tabkey || 'tabs' + i, to = [on.offsetLeft, on.offsetWidth], from = tabPos[key];
    if (from && (from[0] !== to[0] || from[1] !== to[1])) {
      ind.style.transition = 'none';
      ind.style.left = from[0] + 'px'; ind.style.width = from[1] + 'px';
      void ind.offsetWidth;
      ind.style.transition = '';
      // thanh trượt co giãn nhẹ theo quán tính
      ind.classList.remove('go'); void ind.offsetWidth; ind.classList.add('go');
    }
    ind.style.left = to[0] + 'px'; ind.style.width = to[1] + 'px';
    tabPos[key] = to;
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
