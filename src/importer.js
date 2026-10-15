// Nhập dữ liệu xuất từ app Money Lover (CSV: ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report)
// Nhóm cũ được xếp vào nhóm cha của app mới theo bảng MAP. Nhập lại nhiều lần không bị trùng (id cố định theo dòng CSV).
import { store, gById, importData } from './store.js';
import { dkey } from './util.js';

// Cấu trúc nhóm giống hệt app Money Lover cũ (thứ tự, tên, nhóm con).
// Mỗi dòng: [id, tên, icon, màu, kiểu]; dòng bắt đầu bằng ' ' (thụt vào) là nhóm con của nhóm cha ngay phía trên.
const STRUCT = `
an|Ăn uống|utensils|red
 an_sang|Ăn sáng|soup|red
 an_toi|Ăn tối|drumstick|red
 an_trua|Ăn trưa|sandwich|orange
 an_vatcty|ăn vặt trong cty|cookie|orange
 an_bao|Bao ăn ún|gift|pink
 an_cfsang|cafe sáng|coffee|brown
 an_cftrua|cafe trưa|cup-soda|teal
 an_nglieu|nguyên liệu nấu ăn|salad|green
 an_dua|nước dừa|cup-soda|green
 an_onha|đồ ăn uống ở nhà|soup|honey
anvk|ăn uống với K|utensils|pink
anvnha|Ăn uống với nhà|house|honey
baoduong|Bảo dưỡng xe|wrench|blue
baohiem|Bảo hiểm|heart-pulse|red
bibo|Bi Bo|cat|orange
cpkhac2|Các chi phí khác|receipt|brown
cattoc|Cắt tóc, gội đầu|scissors|purple
codinh|Chi phí cố định cho nhà|house|honey
 luongcm|Lương cM|banknote|green
 thuenha|Thuê nhà|key-round|honey
 internet|Tiền internet|wifi|indigo
 nuoc|Tiền Nước|droplet|blue
 cap|Tiền truyền hình cáp|tv|indigo
 dien|Tiền điện|zap|honey
 youtube|youtube|tv|red
cpkhac|Chi phí khác|wallet|orange
dichuyen|Di chuyển|bus|blue
canhan|Đồ dùng cá nhân|shopping-cart|purple
 chamsoc|chăm sóc cơ thể|flower-2|pink
 decor|Decor PC|lamp|honey
 dientu|Đồ điện tử|smartphone|blue
 docty|đồ linh tinh trong cty|briefcase|brown
 figure|Figure|gem|pink
 game|Game gủng|gamepad-2|teal
 pc|Linh kiện PC|laptop|indigo
 linhtinh|Linh tinh|receipt|brown
 phanmem|Phần mềm|palette|indigo
 quanao|Quần áo|shirt|pink
xang|Đổ xăng|fuel|blue
dulich|Du lịch|plane|blue
 tq|Trung Quốc|plane-takeoff|red
 vungtau|Vũng Tàu|umbrella|teal
noan|ghi nợ An|receipt|orange
guixe|gửi xe|key-round|teal
ktrano|K trả nợ|hand-coins|pink
 cdmuon|trả nợ cD mượn 20tr|banknote|pink
kuan|ku An|baby|teal
muasam|Mua sắm|shopping-bag|purple
outsource|Outsource|pen-tool|indigo
kphi|Phí tổng của K|heart|pink
 kchi|Chi phí cho K|heart|pink
 kmuon|cho K mượn|hand-coins|teal
 kco|K bệnh cái cổ|stethoscope|pink
 kbenh|K bệnh linh tinh|pill|pink
 kba|K cho ba|gift|orange
 khoc|K học hành|graduation-cap|indigo
 kmua|K mua đồ|shopping-bag|purple
 klt|K phát sinh linh tinh|receipt|brown
 kque|K và quê K|bus|blue
 ktro|tiền thuê trọ cho K|key-round|honey
 kno|trả nợ cho K|banknote|green
suanha|Sửa nhà|wrench|brown
suckhoe|Sức khỏe|heart-pulse|pink
tet|Tết|party-popper|red
 lixi|lì xì bên K|gift|red
 tetk|tiền tết K|coins|honey
theduc|Thể dục thể thao|dumbbell|teal
chuyendi|Tiền chuyển đi|banknote|brown
dt3g|Tiền điện thoại, 3G|phone|indigo
tragop|trả góp|credit-card|brown
tralai|Trả lãi|piggy-bank|honey
vequek|về quê K|bus|orange
phim|Xem phim|film|purple
dodung|Đồ dùng linh tinh trong nhà|sofa|orange
 anvat|đồ ăn vặt|cookie|orange
 giavi|Gia vị nấu ăn|flame|red
vayno|Vay, trả nợ|hand-coins|brown
 chovay|Cho vay|hand-coins|teal
 trano|Trả nợ|banknote|brown
luong|Lương|briefcase|green|inc
thukhac|Thu nhập khác|wallet|green|inc
job|Job|pen-tool|teal|inc
lai|Thu lãi|piggy-bank|honey|inc
chothue|tiền cho thuê nhà|house|green|inc
ktra|K trả lại|hand-coins|pink|inc
antra|An trả lại|hand-coins|teal|inc
kgiu|K đưa giữ dùm|wallet|pink|inc
`;
const keyOf = (name) => dkey(String(name || '').trim().normalize('NFC')).replace(/\s+/g, ' ');
const LAYOUT = (() => {
  const out = [];
  let parent = null;
  for (const line of STRUCT.split('\n')) {
    if (!line.trim()) continue;
    const child = line.startsWith(' ');
    const [id, name, icon, color, type = 'exp'] = line.trim().split('|');
    const g = { id: 'ml_' + id, name, icon, color, type, parent: child ? parent : null };
    if (!child) parent = g.id;
    out.push(g);
  }
  return out;
})();
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
      g = extra.get(id) || { id, name: cat, icon: type === 'inc' ? 'wallet' : 'receipt', color: 'brown', type, parent: null };
      extra.set(id, g);
    }
    const st = stats.get(cat) || { cat, target: g.id, n: 0, type };
    st.n++; stats.set(cat, st);
    const id = 'ml' + hash([r[iId], date, amt, cat, r[iNote]].join('|'));
    tx.push({ id, amount: Math.abs(amt), type, groupId: g.id, note: String(r[iNote] || '').trim(), date, exclude: String(r[iEx]).toLowerCase() === 'true', cat, createdAt: Date.now() - tx.length, updatedAt: Date.now(), src: 'moneylover' });
    if (date < min) min = date;
    if (date > max) max = date;
  }
  const groups = [...LAYOUT, ...extra.values()].map((g, i) => ({ ...g, order: i }));
  // nhóm sẽ xoá: nhóm trống (sau khi nhập) không thuộc cấu trúc Money Lover
  const used = new Set(tx.map((t) => t.groupId));
  const imported = new Set(tx.map((t) => t.id));
  for (const t of store.tx) if (!imported.has(t.id)) used.add(t.groupId);
  const keep = new Set(groups.map((g) => g.id));
  const remove = store.groups.filter((g) => !keep.has(g.id) && !used.has(g.id));
  const removed = new Set(remove.map((g) => g.id));
  // nhóm còn giao dịch nhập tay mà nhóm cha bị xoá: chuyển vào nhóm cha cùng tên trong cấu trúc mới, không có thì thành nhóm cha
  const reparent = store.groups.filter((g) => !removed.has(g.id) && !keep.has(g.id) && g.parent && removed.has(g.parent)).map((g) => {
    const old = store.groups.find((x) => x.id === g.parent);
    const to = BY_NAME.get(keyOf(old?.name));
    return [g.id, to && !to.parent && to.type === g.type ? to.id : null];
  });
  const existing = new Set(store.tx.map((t) => t.id));
  return { tx, groups, remove, reparent, stats: [...stats.values()].sort((a, b) => b.n - a.n), min, max, bad, dup: tx.filter((t) => existing.has(t.id)).length };
}

export function runImport(plan, clean = true) {
  importData(plan.groups, plan.tx, clean ? plan.remove.map((g) => g.id) : [], clean ? plan.reparent : []);
}

// tên hiển thị của nhóm đích (kể cả nhóm sắp tạo)
export function targetName(plan, id) {
  const g = plan.groups.find((x) => x.id === id) || gById(id);
  if (!g) return id;
  const p = g.parent ? (plan.groups.find((x) => x.id === g.parent) || gById(g.parent)) : null;
  return (p ? p.name + ' › ' : '') + g.name;
}
