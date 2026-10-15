// Nhập dữ liệu xuất từ app Money Lover (CSV: ID,Note,Amount,Category,Account,Currency,Date,Event,Exclude Report)
// Nhóm cũ được xếp vào nhóm cha của app mới theo bảng MAP. Nhập lại nhiều lần không bị trùng (id cố định theo dòng CSV).
import { store, gById, importData } from './store.js';
import { dkey } from './util.js';
import { DEFAULT_GROUPS } from './defaults.js';

// tên nhóm cũ -> [id nhóm đích, tên, icon, màu, id nhóm cha]
// id bắt đầu bằng "g_" là nhóm có sẵn của app; còn lại tạo mới khi cần
const P = {
  k: ['mg_k', 'Chi cho K', 'heart', 'pink', null],
  work: ['mg_work', 'Công việc', 'briefcase', 'indigo', null],
  debt: ['mg_debt', 'Vay, trả nợ', 'hand-coins', 'brown', null],
  back: ['mg_back', 'Được trả lại', 'hand-coins', 'teal', null, 'inc'],
};
const MAP = {
  // Ăn uống
  'ăn uống': ['g_an'], 'ăn sáng': ['g_sang'],
  'ăn trưa': ['mg_antrua', 'Ăn trưa', 'sandwich', 'orange', 'g_an'],
  'ăn tối': ['mg_antoi', 'Ăn tối', 'drumstick', 'red', 'g_an'],
  'cafe sáng': ['g_cf', 'Cafe sáng'],
  'cafe trưa': ['mg_cafetrua', 'Cafe trưa', 'cup-soda', 'teal', 'g_an'],
  'nước dừa': ['mg_nuocdua', 'Nước dừa', 'cup-soda', 'green', 'g_an'],
  'ăn uống với nhà': ['mg_anvoinha', 'Ăn uống với nhà', 'users', 'honey', 'g_an'],
  'bao ăn ún': ['mg_baoan', 'Bao ăn uống', 'gift', 'pink', 'g_an'], 'ku an': ['mg_baoan'],
  'đồ ăn uống ở nhà': ['mg_nauan', 'Đồ ăn nấu ở nhà', 'salad', 'green', 'g_an'],
  'nguyên liệu nấu ăn': ['mg_nauan'], 'gia vị nấu ăn': ['mg_nauan'],
  'ăn vặt trong cty': ['mg_anvat', 'Ăn vặt', 'cookie', 'orange', 'g_an'], 'đồ ăn vặt': ['mg_anvat'],
  // K
  'chi phí cho k': ['mg_kchi', 'Chi phí cho K', 'heart', 'pink', 'mg_k'],
  'ăn uống với k': ['mg_kan', 'Ăn uống với K', 'utensils', 'red', 'mg_k'],
  'k phát sinh linh tinh': ['mg_klt', 'K phát sinh linh tinh', 'receipt', 'brown', 'mg_k'],
  'cho k mượn': ['mg_kmuon', 'Cho K mượn', 'hand-coins', 'teal', 'mg_k'],
  'k mua đồ': ['mg_kmua', 'K mua đồ', 'shopping-bag', 'purple', 'mg_k'],
  'k bệnh cái cổ': ['mg_kco', 'K bệnh cái cổ', 'stethoscope', 'pink', 'mg_k'],
  'k bệnh linh tinh': ['mg_kbenh', 'K bệnh linh tinh', 'pill', 'pink', 'mg_k'],
  'trả nợ cho k': ['mg_kno', 'Trả nợ cho K', 'banknote', 'green', 'mg_k'],
  'k học hành': ['mg_khoc', 'K học hành', 'graduation-cap', 'indigo', 'mg_k'],
  'về quê k': ['mg_kque', 'Về quê K', 'bus', 'blue', 'mg_k'], 'k và quê k': ['mg_kque'],
  'tiền thuê trọ cho k': ['mg_ktro', 'Tiền thuê trọ cho K', 'key-round', 'honey', 'mg_k'],
  'k cho ba': ['mg_kba', 'K cho ba', 'gift', 'orange', 'mg_k'],
  'lì xì bên k': ['mg_ktet', 'Tết, lì xì bên K', 'party-popper', 'red', 'mg_k'], 'tiền tết k': ['mg_ktet'],
  'phí tổng của k': ['mg_kphi', 'Phí tổng của K', 'wallet', 'brown', 'mg_k'],
  // Đi lại
  'đổ xăng': ['g_xang'],
  'bảo dưỡng xe': ['mg_baoduong', 'Bảo dưỡng xe', 'wrench', 'blue', 'g_di'],
  'gửi xe': ['mg_guixe', 'Gửi xe', 'key-round', 'teal', 'g_di'],
  // Nhà cửa
  'thuê nhà': ['mg_thuenha', 'Thuê nhà', 'key-round', 'honey', 'g_nha'],
  'tiền điện': ['g_dien'], 'tiền nước': ['g_nuoc'],
  'tiền internet': ['g_net'], 'tiền điện thoại, 3g': ['g_net'],
  'tiền truyền hình cáp': ['mg_cap', 'Truyền hình cáp', 'tv', 'indigo', 'g_nha'],
  'chi phí cố định cho nhà': ['mg_codinh', 'Chi phí cố định nhà', 'house', 'honey', 'g_nha'],
  'sửa nhà': ['mg_suanha', 'Sửa nhà', 'wrench', 'brown', 'g_nha'],
  'đồ dùng linh tinh trong nhà': ['mg_dodung', 'Đồ dùng trong nhà', 'sofa', 'orange', 'g_nha'],
  // Mua sắm
  'mua sắm': ['g_mua'], 'quần áo': ['g_ao'], 'phần mềm': ['g_art'],
  'đồ dùng cá nhân': ['mg_canhan', 'Đồ dùng cá nhân', 'shopping-cart', 'purple', 'g_mua'],
  'đồ điện tử': ['mg_dientu', 'Đồ điện tử', 'smartphone', 'blue', 'g_mua'],
  'linh kiện pc': ['mg_pc', 'Linh kiện PC', 'laptop', 'indigo', 'g_mua'],
  'decor pc': ['mg_decor', 'Decor PC', 'lamp', 'honey', 'g_mua'],
  'figure': ['mg_figure', 'Figure', 'gem', 'pink', 'g_mua'],
  'trả góp': ['mg_tragop', 'Trả góp', 'credit-card', 'brown', 'g_mua'],
  // Giải trí
  'xem phim': ['g_phim'],
  'game gủng': ['mg_game', 'Game', 'gamepad-2', 'teal', 'g_gt'],
  'youtube': ['mg_youtube', 'YouTube, dịch vụ', 'tv', 'red', 'g_gt'],
  'du lịch': ['mg_dulich', 'Du lịch', 'plane', 'blue', 'g_gt'],
  'vũng tàu': ['mg_vungtau', 'Vũng Tàu', 'umbrella', 'teal', 'g_gt'],
  'trung quốc': ['mg_tq', 'Trung Quốc', 'plane-takeoff', 'red', 'g_gt'],
  // Sức khoẻ
  'sức khỏe': ['g_sk'], 'sức khoẻ': ['g_sk'],
  'thể dục thể thao': ['mg_theduc', 'Thể dục thể thao', 'dumbbell', 'teal', 'g_sk'],
  'cắt tóc, gội đầu': ['mg_cattoc', 'Cắt tóc, gội đầu', 'scissors', 'purple', 'g_sk'],
  'chăm sóc cơ thể': ['mg_chamsoc', 'Chăm sóc cơ thể', 'flower-2', 'pink', 'g_sk'],
  'bảo hiểm': ['mg_baohiem', 'Bảo hiểm', 'heart', 'red', 'g_sk'],
  // Thú cưng, quà
  'bi bo': ['mg_bibo', 'Bi Bo', 'cat', 'orange', 'g_pet'],
  'tết': ['mg_tet', 'Tết', 'party-popper', 'red', 'g_qua'],
  // Công việc
  'outsource': ['mg_outsource', 'Outsource', 'pen-tool', 'indigo', 'mg_work'],
  'lương cm': ['mg_luongcm', 'Lương cM', 'banknote', 'green', 'mg_work'],
  'đồ linh tinh trong cty': ['mg_docty', 'Đồ linh tinh cty', 'briefcase', 'brown', 'mg_work'],
  // Vay, trả nợ
  'cho vay': ['mg_chovay', 'Cho vay', 'hand-coins', 'teal', 'mg_debt'],
  'trả nợ': ['mg_trano', 'Trả nợ', 'banknote', 'brown', 'mg_debt'],
  'ghi nợ an': ['mg_noan', 'Ghi nợ An', 'receipt', 'orange', 'mg_debt'],
  // Khác
  'các chi phí khác': ['g_khac'],
  'linh tinh': ['mg_linhtinh', 'Linh tinh', 'receipt', 'brown', 'g_khac'],
  'chi phí khác': ['mg_cpkhac', 'Chi phí khác', 'wallet', 'orange', 'g_khac'],
  // Thu nhập
  'lương': ['g_luong'], 'thu nhập khác': ['g_thukhac'], 'job': ['g_free', 'Job, freelance'],
  'thu lãi': ['mg_lai', 'Tiền lãi', 'piggy-bank', 'honey', null, 'inc'],
  'tiền cho thuê nhà': ['mg_chothue', 'Cho thuê nhà', 'house', 'green', null, 'inc'],
  'k trả lại': ['mg_ktra', 'K trả lại', 'hand-coins', 'pink', 'mg_back', 'inc'],
  'an trả lại': ['mg_antra', 'An trả lại', 'hand-coins', 'teal', 'mg_back', 'inc'],
  'k đưa giữ dùm': ['mg_kgiu', 'K đưa giữ dùm', 'wallet', 'pink', 'mg_back', 'inc'],
};

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
const keyOf = (name) => String(name || '').trim().toLowerCase().normalize('NFC');

// Đọc CSV -> kế hoạch nhập (chưa ghi gì)
export function planImport(text) {
  const rows = parseCsv(text);
  if (!rows.length) throw new Error('File trống');
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (n) => head.indexOf(n);
  const iId = col('id'), iNote = col('note'), iAmt = col('amount'), iCat = col('category'), iDate = col('date'), iEx = col('exclude report');
  if (iAmt < 0 || iCat < 0 || iDate < 0) throw new Error('Không phải file xuất từ Money Lover (thiếu cột Amount / Category / Date)');
  const groups = new Map(); // id -> group mới cần tạo
  const renames = new Map(); // id có sẵn -> tên mới
  const stats = new Map(); // tên cũ -> {target, n, type}
  const tx = [];
  // bảo đảm nhóm (và nhóm cha) tồn tại: nhóm có sẵn bị xoá thì tạo lại, nhóm mới thì thêm vào kế hoạch
  const ensureId = (id, type) => {
    if (!id || gById(id) || groups.has(id)) return;
    const d = DEFAULT_GROUPS.find((g) => g.id === id);
    if (d) { ensureId(d.parent, type); groups.set(id, { ...d }); return; }
    const ps = Object.values(P).find((p) => p[0] === id);
    if (ps) groups.set(id, { id, name: ps[1], icon: ps[2], color: ps[3], type: ps[5] || type, parent: null });
  };
  const ensure = (spec, type) => {
    const [id, name, icon, color, parent, t] = spec;
    const gtype = t || type;
    if (id.startsWith('g_')) {
      ensureId(id, gtype);
      const cur = gById(id) || groups.get(id);
      if (name && cur && cur.name !== name) renames.set(id, name);
      return id;
    }
    ensureId(parent, gtype);
    if (!groups.has(id) && !gById(id)) groups.set(id, { id, name, icon, color, type: gtype, parent: parent || null });
    return id;
  };
  let min = '9999', max = '0000', bad = 0;
  for (const r of rows.slice(1)) {
    const amt = Math.round(parseFloat(String(r[iAmt]).replace(/[^\d.-]/g, '')));
    const m = String(r[iDate] || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!amt || !m) { bad++; continue; }
    const date = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const type = amt > 0 ? 'inc' : 'exp';
    const cat = String(r[iCat] || '').trim() || 'Khác';
    let spec = MAP[keyOf(cat)];
    if (spec && spec.length === 1) { // trỏ tới nhóm đã khai báo ở dòng khác hoặc nhóm có sẵn
      const ref = Object.values(MAP).find((s) => s[0] === spec[0] && s.length > 1);
      spec = ref || spec;
    }
    if (!spec) spec = ['mg_' + hash(dkey(cat) + type), cat, type === 'inc' ? 'wallet' : 'receipt', 'brown', type === 'inc' ? 'g_thukhac' : 'g_khac'];
    const gid = ensure(spec, type);
    const st = stats.get(cat) || { cat, target: gid, n: 0, type };
    st.n++; stats.set(cat, st);
    const id = 'ml' + hash([r[iId], date, amt, cat, r[iNote]].join('|'));
    tx.push({ id, amount: Math.abs(amt), type, groupId: gid, note: String(r[iNote] || '').trim(), date, exclude: String(r[iEx]).toLowerCase() === 'true', createdAt: Date.now() - tx.length, updatedAt: Date.now(), src: 'moneylover' });
    if (date < min) min = date; if (date > max) max = date;
  }
  const existing = new Set(store.tx.map((t) => t.id));
  return { tx, groups: [...groups.values()], renames, stats: [...stats.values()].sort((a, b) => b.n - a.n), min, max, bad, dup: tx.filter((t) => existing.has(t.id)).length };
}

export function runImport(plan) {
  importData(plan.groups, plan.tx, plan.renames);
}

// tên hiển thị của nhóm đích (kể cả nhóm sắp tạo)
export function targetName(plan, id) {
  const g = plan.groups.find((x) => x.id === id) || gById(id);
  if (!g) return id;
  const nm = plan.renames.get(id) || g.name;
  const p = g.parent ? (plan.groups.find((x) => x.id === g.parent) || gById(g.parent)) : null;
  return (p ? (plan.renames.get(p.id) || p.name) + ' › ' : '') + nm;
}
