// Trạng thái màn hình (không lưu lên mây)
import { ls } from './util.js';

const saved = ls.get('mml.view', {});
export const view = {
  tab: 'ledger', // ledger | report | groups | settings
  period: saved.period || 'month', // day | month | year
  cursor: new Date(),
  group: null, // lọc theo nhóm
  heroKind: 'exp',
  gmType: 'exp',
  hideAmt: !!saved.hideAmt, // ẩn số tổng trên thẻ Chi tiêu / Thu nhập
};
const subs = new Set();
export const onView = (f) => { subs.add(f); return () => subs.delete(f); };
export function setView(p) {
  Object.assign(view, p);
  ls.set('mml.view', { period: view.period, hideAmt: view.hideAmt });
  subs.forEach((f) => f());
}
