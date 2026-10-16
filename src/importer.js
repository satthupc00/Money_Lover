// Nhập dữ liệu xuất từ app Money Lover (CSV: ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report)
// Nhóm cũ được xếp vào nhóm cha của app mới theo bảng MAP. Nhập lại nhiều lần không bị trùng (id cố định theo dòng CSV).
import { store, gById, importData } from './store.js';
import { dkey } from './util.js';
import { DEFAULT_GROUPS } from './defaults.js';

const keyOf = (name) => dkey(String(name || '').trim().normalize('NFC')).replace(/\s+/g, ' ');
const LAYOUT = DEFAULT_GROUPS;
const BY_NAME = new Map(LAYOUT.map((g) => [keyOf(g.name), g]));
export const LAYOUT_IDS = new Set(LAYOUT.map((g) => g.id));

export function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0]) rows.push(row); row = []; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

// Đọc CSV -> kế hoạch nhập (chưa ghi gì)
export function planImport(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('File trống');
  const head = rows[0].map((x) => x.trim().toLowerCase());
  const col = (n) => head.indexOf(n);
  const iId = col('id'), iNote = col('note'), iAmt = col('amount'), iCat = col('category'), iDate = col('date'), iEx = col('exclude report');
  if (iAmt < 0 || iCat < 0 || iDate < 0) throw new Error('Không phải file xuất từ Money Lover (thiếu cột Amount / Category / Date)');
  const extra = new Map(); // nhóm cũ không có trong bảng: tạo nhóm cha cùng tên
  const stats = new Map();
  const tx = [];
  let min = '9999', max = '0000', bad = 0;
  const seen = new Map(); // giao dịch giống hệt nhau trong file: đánh số thứ tự để vẫn tách riêng
  for (const r of rows.slice(1)) {
    const amt = Math.round(parseFloat(String(r[iAmt]).replace(/[^\d.-]/g, '')));
    const m = String(r[iDate] || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!amt || !m) { bad++; continue; }
    const date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const type = amt > 0 ? 'inc' : 'exp';
    const cat = String(r[iCat] || '').trim() || 'Khác';
    let g = BY_NAME.get(keyOf(cat));
    if (!g || g.type !== type) {
      const id = 'ml_x' + hash(keyOf(cat) + type);
      g = extra.get(id) || { id, name: cat, icon: type === 'inc' ? 'e:1f45b' : 'e:1f9fe', color: 'brown', type, parent: null };
      extra.set(id, g);
    }
    const st = stats.get(cat) || { cat, target: g.id, n: 0, type };
    st.n++; stats.set(cat, st);
    // mã giao dịch không phụ thuộc số thứ tự dòng (cột Id đổi mỗi lần xuất file) -> nhập lại file mới không bị nhân đôi
    const note = String(r[iNote] || '').trim();
    const key = contentKey(date, type, Math.abs(amt), cat, note);
    const nth = (seen.get(key) || 0) + 1; seen.set(key, nth);
    const id = 'mk' + hash(key + '#' + nth);
    tx.push({ id, amount: Math.abs(amt), type, groupId: g.id, note, date, exclude: String(r[iEx]).toLowerCase() === 'true', cat, createdAt: Date.now() - tx.length, updatedAt: Date.now(), src: 'moneylover' });
    if (date < min) min = date;
    if (date > max) max = date;
  }
  // chỉ tạo nhóm còn thiếu; nhóm đã có giữ nguyên tên / icon / màu người dùng đã chỉnh
  const groups = [...LAYOUT, ...extra.values()].map((g, i) => ({ ...g, order: i })).filter((g) => !gById(g.id));
  const allGroups = [...LAYOUT, ...extra.values()];
  // nhóm sẽ xoá: nhóm trống (sau khi nhập) không thuộc cấu trúc Money Lover
  const used = new Set(tx.map((t) => t.groupId));
  const keep = new Set(allGroups.map((g) => g.id));
  const remove = store.groups.filter((g) => !keep.has(g.id) && !used.has(g.id));
  const removed = new Set(remove.map((g) => g.id));
  // nhóm còn giao dịch nhập tay mà nhóm cha bị xoá: chuyển vào nhóm cha cùng tên trong cấu trúc mới, không có thì thành nhóm cha
  const reparent = store.groups.filter((g) => !removed.has(g.id) && !keep.has(g.id) && g.parent && removed.has(g.parent)).map((g) => {
    const old = store.groups.find((x) => x.id === g.parent);
    const to = BY_NAME.get(keyOf(old?.name));
    return [g.id, to && !to.parent && to.type === g.type ? to.id : null];
  });
  // THAY THẾ: dữ liệu sau khi nhập = đúng nội dung file. Giao dịch cũ trùng nội dung thì giữ nguyên (đỡ ghi lên mây),
  // phần thừa (kể cả bản bị nhân đôi, giao dịch nhập tay) bị xoá.
  const pool = new Map();
  for (const t of store.tx) {
    const k = contentKey(t.date, t.type, t.amount, t.cat || gById(t.groupId)?.name || '', t.note || '');
    if (!pool.has(k)) pool.set(k, []);
    pool.get(k).push(t);
  }
  const write = [];
  let same = 0, added = 0;
  for (const t of tx) {
    const old = pool.get(contentKey(t.date, t.type, t.amount, t.cat, t.note))?.pop();
    if (!old) { write.push(t); added++; continue; }
    t.id = old.id;
    if (old.groupId === t.groupId && !!old.exclude === t.exclude) same++;
    else write.push({ ...old, groupId: t.groupId, exclude: t.exclude, cat: t.cat, updatedAt: Date.now() });
  }
  const del = [...pool.values()].flat().map((t) => t.id);
  const manual = [...pool.values()].flat().filter((t) => !t.cat).length;
  return { tx, write, del, manual, same, added, kept: tx.length - added, have: store.tx.length, groups, remove, reparent, stats: [...stats.values()].sort((a, b) => b.n - a.n), min, max, bad };
}
const contentKey = (date, type, amount, cat, note) => [date, type, Math.round(amount), keyOf(cat), String(note).trim()].join('|');

export function runImport(plan, clean = true) {
  importData(plan.groups, plan.write, clean ? plan.remove.map((g) => g.id) : [], clean ? plan.reparent : [], plan.del);
}

// tên hiển thị của nhóm đích (kể cả nhóm sắp tạo)
export function targetName(plan, id) {
  const g = plan.groups.find((x) => x.id === id) || gById(id);
  if (!g) return id;
  const p = g.parent ? (plan.groups.find((x) => x.id === g.parent) || gById(g.parent)) : null;
  return (p ? p.name + ' › ' : '') + g.name;
}
