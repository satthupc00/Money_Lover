// Tông màu app: "warm" (ấm áp, mặc định) hoặc "gray" (trắng xám giống Money Lover). Lưu trên máy.
import { ls } from './util.js';

export const THEMES = [['warm', 'Ấm áp'], ['gray', 'Trắng xám']];
export const getTheme = () => (ls.get('mml.theme') === 'gray' ? 'gray' : 'warm');

export function applyTheme(t = getTheme()) {
  const root = document.documentElement;
  if (t === 'gray') root.dataset.theme = 'gray'; else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'gray' ? '#24262B' : '#3E2A22');
  window.mondiro?.setTheme?.(t);
}
export function setTheme(t) { ls.set('mml.theme', t); applyTheme(t); }
