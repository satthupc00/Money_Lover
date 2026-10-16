// Kho dữ liệu: chế độ "local" (chỉ trên máy) hoặc "cloud" (Firestore, có offline)
import { DEFAULT_GROUPS, LEGACY, LUC2E } from './defaults.js';
import { ls, uid as newId } from './util.js';
import { fb, initFirebase } from './firebase.js';

const LS_DATA = 'mml.data.v1';
const subs = new Set();

export const store = {
  groups: [],
  tx: [],
  mode: 'local', // 'local' | 'cloud'
  user: null, // { uid, email }
  syncState: 'local', // 'local' | 'synced' | 'pending' | 'error'
  fbReady: false,
};

const emit = () => subs.forEach((f) => f());
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

// ---------- truy vấn ----------
export const gById = (id) => store.groups.find((g) => g.id === id);
export const kids = (id) => store.groups.filter((g) => g.parent === id).sort(byOrder);
export const tops = (type) => store.groups.filter((g) => !g.parent && g.type === type).sort(byOrder);
function byOrder(a, b) { return (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, 'vi'); }
export const groupIds = (id) => [id, ...kids(id).map((k) => k.id)];
export const txCount = (id) => store.tx.reduce((n, t) => n + (t.groupId === id ? 1 : 0), 0);

// ---------- local ----------
function loadLocal() {
  const d = ls.get(LS_DATA);
  if (d && Array.isArray(d.groups)) { store.groups = d.groups; store.tx = d.tx || []; }
  else { store.groups = DEFAULT_GROUPS.map((g) => ({ ...g })); store.tx = []; saveLocal(); ls.set(MIGR_KEY('local'), 1); ls.set(MIGR3_KEY('local'), 1); }
}

// Nâng cấp dữ liệu bản cũ: dùng cấu trúc nhóm Money Lover + bộ icon mới (chạy 1 lần cho mỗi kho dữ liệu)
const MIGR_KEY = (who) => 'mml.migr2.' + who;
function migrate(who) {
  if (ls.get(MIGR_KEY(who))) return;
  const ops = [];
  const have = new Set(store.groups.map((g) => g.id));
  for (const d of DEFAULT_GROUPS) {
    if (!have.has(d.id)) ops.push({ type: 'set', col: 'groups', id: d.id, data: strip(d) });
    else ops.push({ type: 'update', col: 'groups', id: d.id, data: { icon: d.icon, color: d.color, order: d.order } });
  }
  for (const t of store.tx) if (LEGACY[t.groupId]) ops.push({ type: 'update', col: 'tx', id: t.id, data: { groupId: LEGACY[t.groupId] } });
  for (const g of store.groups) {
    if (LEGACY[g.id]) ops.push({ type: 'delete', col: 'groups', id: g.id });
    else if (g.parent && LEGACY[g.parent]) {
      const np = DEFAULT_GROUPS.find((d) => d.id === LEGACY[g.parent]);
      ops.push({ type: 'update', col: 'groups', id: g.id, data: { parent: np ? (np.parent || np.id) : null } });
    }
  }
  ls.set(MIGR_KEY(who), 1);
  apply(ops);
}
// Bản 1.0.10: đổi icon nét sang icon 3D (nhóm mặc định lấy icon mới, nhóm tự tạo đổi theo icon tương ứng)
const MIGR3_KEY = (who) => 'mml.migr3.' + who;
function migrate3(who) {
  if (ls.get(MIGR3_KEY(who))) return;
  const ops = [];
  for (const g of store.groups) {
    if (String(g.icon || '').startsWith('e:')) continue;
    const d = DEFAULT_GROUPS.find((x) => x.id === g.id);
    const icon = d ? d.icon : LUC2E[g.icon] ? 'e:' + LUC2E[g.icon] : null;
    if (icon) ops.push({ type: 'update', col: 'groups', id: g.id, data: { icon } });
  }
  ls.set(MIGR3_KEY(who), 1);
  if (ops.length) apply(ops);
}
function saveLocal() { ls.set(LS_DATA, { groups: store.groups, tx: store.tx }); }

// ---------- khởi động ----------
let unwatch = null;
export function initStore() {
  loadLocal();
  migrate('local'); migrate3('local');
  store.fbReady = initFirebase();
  if (store.fbReady) {
    fb.onUser(async (u) => {
      if (unwatch) { unwatch(); unwatch = null; }
      if (!u) { store.user = null; store.mode = 'local'; store.syncState = 'local'; loadLocal(); emit(); return; }
      store.user = { uid: u.uid, email: u.email };
      store.mode = 'cloud';
      store.syncState = 'pending';
      emit();
      try {
        if (await fb.isEmpty(u.uid)) await seedCloud(u.uid);
      } catch (e) { console.warn('seed', e); }
      let gotG = false, gotT = false;
      const ready = () => { if (gotG && gotT) { migrate(u.uid); migrate3(u.uid); } };
      unwatch = fb.watch(u.uid,
        (gs) => { store.groups = gs; store.syncState = 'synced'; gotG = true; ready(); emit(); },
        (ts) => { store.tx = ts; store.syncState = 'synced'; gotT = true; ready(); emit(); },
        (e) => { console.error(e); store.syncState = 'error'; emit(); });
    });
  }
  emit();
}

// tài khoản mới: đưa dữ liệu đang có trên máy lên (hoặc nhóm mặc định)
async function seedCloud(u) {
  const local = ls.get(LS_DATA);
  const groups = local?.groups?.length ? local.groups : DEFAULT_GROUPS.map((g) => ({ ...g }));
  const tx = local?.tx || [];
  const ops = [
    ...groups.map((g) => ({ type: 'set', col: 'groups', id: g.id, data: strip(g) })),
    ...tx.map((t) => ({ type: 'set', col: 'tx', id: t.id, data: strip(t) })),
  ];
  await fb.batch(u, ops);
}
const strip = (o) => { const { id, ...rest } = o; return rest; };

// ---------- ghi ----------
// Ghi Firestore không chờ (offline vẫn ghi vào bộ nhớ đệm, có mạng sẽ tự đẩy lên)
function cloud(p) { store.syncState = 'pending'; emit(); p.catch((e) => { console.error(e); store.syncState = 'error'; emit(); }); }

function apply(ops) {
  // ops: [{type, col:'groups'|'tx', id, data}]
  if (store.mode === 'cloud' && store.user) { cloud(fb.batch(store.user.uid, ops)); return; }
  for (const o of ops) {
    const arr = o.col === 'groups' ? store.groups : store.tx;
    const i = arr.findIndex((x) => x.id === o.id);
    if (o.type === 'set') { if (i >= 0) arr[i] = { ...o.data, id: o.id }; else arr.push({ ...o.data, id: o.id }); }
    else if (o.type === 'update') { if (i >= 0) arr[i] = { ...arr[i], ...o.data }; }
    else if (i >= 0) arr.splice(i, 1);
  }
  saveLocal();
  emit();
}

const now = () => Date.now();

export function addTx({ amount, type, groupId, note, date }) {
  const id = newId();
  apply([{ type: 'set', col: 'tx', id, data: { amount: Math.round(amount), type, groupId, note: note || '', date, createdAt: now(), updatedAt: now() } }]);
  return id;
}
export function updateTx(id, patch) { apply([{ type: 'update', col: 'tx', id, data: { ...patch, updatedAt: now() } }]); }
export function deleteTx(id) { apply([{ type: 'delete', col: 'tx', id }]); }

export function addGroup({ name, icon, color, type, parent }) {
  const id = 'g' + newId().slice(0, 12);
  const order = Math.max(0, ...store.groups.map((g) => g.order ?? 0)) + 1;
  apply([{ type: 'set', col: 'groups', id, data: { name, icon, color, type, parent: parent || null, order } }]);
  return id;
}
export function updateGroup(id, patch) { apply([{ type: 'update', col: 'groups', id, data: patch }]); }

// trả về '' nếu được, hoặc lý do không được
export function canMove(id, parent) {
  const g = gById(id);
  if (!g) return 'Không tìm thấy nhóm';
  if (!parent) return g.parent ? '' : 'Nhóm này đã là nhóm cha';
  const p = gById(parent);
  if (id === parent) return 'Không thể thả vào chính nó';
  if (!p) return 'Không tìm thấy nhóm cha';
  if (p.parent) return 'Chỉ có 2 cấp: không thể thả vào nhóm con';
  if (kids(id).length) return `"${g.name}" đang có nhóm con, hãy chuyển các nhóm con đi trước`;
  if (p.type !== g.type) return 'Không thể trộn nhóm chi với nhóm thu';
  if (g.parent === parent) return `"${g.name}" đã nằm trong "${p.name}"`;
  return '';
}
export function moveGroup(id, parent) { apply([{ type: 'update', col: 'groups', id, data: { parent: parent || null } }]); }

// gộp các nhóm ids vào target: giao dịch và nhóm con chuyển sang target
export function mergeGroups(ids, target) {
  const t = gById(target);
  if (!t) return 0;
  const ops = [];
  let moved = 0;
  for (const id of ids) {
    if (id === target) continue;
    for (const x of store.tx) if (x.groupId === id) { ops.push({ type: 'update', col: 'tx', id: x.id, data: { groupId: target } }); moved++; }
    for (const k of kids(id)) if (k.id !== target) ops.push({ type: 'update', col: 'groups', id: k.id, data: { parent: t.parent || t.id } });
    ops.push({ type: 'delete', col: 'groups', id });
  }
  if (t.parent && ids.includes(t.parent)) ops.push({ type: 'update', col: 'groups', id: t.id, data: { parent: null } });
  apply(ops);
  return moved;
}
export function deleteGroup(id) {
  if (txCount(id)) return 'Nhóm còn giao dịch. Hãy dùng "Gộp" để chuyển giao dịch sang nhóm khác.';
  if (kids(id).length) return 'Nhóm còn nhóm con. Hãy chuyển hoặc xoá các nhóm con trước.';
  apply([{ type: 'delete', col: 'groups', id }]);
  return '';
}

// nhập hàng loạt (từ file CSV): ghi đè theo id nên nhập lại không bị trùng
export function importData(groups, tx, removeIds = [], reparent = [], delTx = []) {
  const ops = [
    ...delTx.map((id) => ({ type: 'delete', col: 'tx', id })),
    ...groups.map((g) => ({ type: 'set', col: 'groups', id: g.id, data: { name: g.name, icon: g.icon, color: g.color, type: g.type, parent: g.parent || null, order: g.order ?? 0 } })),
    ...tx.map((t) => ({ type: 'set', col: 'tx', id: t.id, data: strip(t) })),
    ...reparent.map(([id, parent]) => ({ type: 'update', col: 'groups', id, data: { parent } })),
    ...removeIds.map((id) => ({ type: 'delete', col: 'groups', id })),
  ];
  if (store.mode === 'cloud' && store.user) { cloud(fb.batch(store.user.uid, ops)); return; }
  if (delTx.length) { const dt = new Set(delTx); store.tx = store.tx.filter((t) => !dt.has(t.id)); }
  const gi = new Map(store.groups.map((g, i) => [g.id, i]));
  const ti = new Map(store.tx.map((t, i) => [t.id, i]));
  for (const o of ops) {
    if (o.type === 'delete') continue;
    const arr = o.col === 'groups' ? store.groups : store.tx, idx = o.col === 'groups' ? gi : ti;
    const i = idx.get(o.id);
    if (o.type === 'update') { if (i != null) arr[i] = { ...arr[i], ...o.data }; continue; }
    const row = { ...o.data, id: o.id };
    if (i != null) arr[i] = row; else { idx.set(o.id, arr.length); arr.push(row); }
  }
  const del = new Set(removeIds);
  if (del.size) store.groups = store.groups.filter((g) => !del.has(g.id));
  saveLocal();
  emit();
}

// ---------- tài khoản ----------
export async function signIn(email, pass) { await fb.signIn(email, pass); }
export async function signUp(email, pass) { await fb.signUp(email, pass); }
export async function signOutUser() { await fb.signOut(); }
export const resetPassword = (email) => fb.resetPass(email);
