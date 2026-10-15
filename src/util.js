export const fmt = (n) => Math.round(Math.abs(n || 0)).toLocaleString('vi-VN');
export const vnd = (n) => fmt(n) + ' ₫';
export const shortM = (n) => {
  n = Math.abs(n || 0);
  if (n >= 1e9) return (n / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
  if (n >= 1e6) return (n / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tr';
  if (n >= 1e3) return Math.round(n / 1e3) + 'k';
  return String(Math.round(n));
};
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 20);
// bỏ dấu để tìm kiếm: "Trà" -> "tra"
export const dkey = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();

// ngày dạng "YYYY-MM-DD" theo giờ máy
export const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const dmy = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
export const daysIn = (y, m) => new Date(y, m + 1, 0).getDate(); // m: 0-11
export const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export const dayLabel = (s) => { const d = parseYmd(s); return `${WD[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`; };
export const monthKey = (s) => s.slice(0, 7);

export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

export const ls = {
  get(k, def = null) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bộ nhớ đầy hoặc bị chặn */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};
