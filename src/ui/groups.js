// Quản lý nhóm: kéo thả đổi nhóm cha, chuyển, gộp, tạo / sửa nhóm với thư viện icon
import { store, gById, tops, kids, txCount, addGroup, updateGroup, moveGroup, mergeGroups, deleteGroup, canMove } from '../store.js';
import { view, setView } from '../state.js';
import { PAL, LIB } from '../defaults.js';
import { I } from '../icons.js';
import { esc } from '../util.js';
import { tile, dialog, sheet, toast, confirmBox } from './common.js';

const blank = (type) => ({ id: null, name: '', icon: type === 'inc' ? 'wallet' : 'cookie', color: type === 'inc' ? 'green' : 'orange', parent: '', type });
const gs = { selected: new Set(), ed: blank('exp'), libTab: 'Ăn uống' };

// ---------- hộp chọn nhóm đích ----------
function pickTarget(compact, title, text, filter, onPick) {
  const items = tops(view.gmType).flatMap((g) => [g, ...kids(g.id)]).filter(filter);
  const html = `<h3>${title}</h3>${text ? `<p>${text}</p>` : ''}<div class="pick">${items.map((g) => `<button type="button" class="${g.parent ? 'child' : ''}" data-t="${g.id}">${tile(g, 34)}${esc(g.name)}</button>`).join('') || '<p>Không có nhóm phù hợp.</p>'}</div>
    ${compact ? '' : '<div class="actions"><button class="btn" type="button" data-x>Huỷ</button></div>'}`;
  const box = compact ? sheet(html) : dialog(html);
  box.el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { box.close(); onPick(b.dataset.t); }));
}

function doMove(id, target) {
  const err = canMove(id, target);
  if (err) { toast(err); return; }
  const g = gById(id);
  moveGroup(id, target);
  toast(target ? `Đã chuyển "${g.name}" vào "${gById(target).name}"` : `"${g.name}" giờ là nhóm cha`);
}
async function doMerge(ids, target) {
  const t = gById(target);
  const names = ids.filter((i) => i !== target).map((i) => `"${gById(i)?.name}"`).join(', ');
  const n = ids.filter((i) => i !== target).reduce((a, i) => a + txCount(i), 0);
  if (!(await confirmBox('Gộp nhóm?', `${esc(names)} sẽ gộp vào <b>"${esc(t.name)}"</b>. ${n} giao dịch sẽ chuyển sang. Các nhóm bị gộp sẽ bị xoá.`, 'Gộp nhóm'))) return;
  mergeGroups(ids, target);
  gs.selected.clear();
  toast(`Đã gộp vào "${t.name}" · ${n} giao dịch chuyển sang`);
}

export function moveFlow(id, compact) {
  const g = gById(id);
  if (kids(id).length) { toast(`"${g.name}" đang có nhóm con, hãy chuyển các nhóm con đi trước`); return; }
  pickTarget(compact, `Chuyển "${esc(g.name)}" tới…`, 'Chọn nhóm cha mới.', (x) => !x.parent && x.id !== id && x.id !== g.parent && x.type === g.type, (t) => doMove(id, t));
}
export function mergeFlow(id, compact) {
  const g = gById(id);
  pickTarget(compact, `Gộp "${esc(g.name)}" vào…`, `${txCount(id)} giao dịch${kids(id).length ? ' và ' + kids(id).length + ' nhóm con' : ''} sẽ chuyển sang nhóm bạn chọn.`,
    (x) => x.id !== id && x.parent !== id && x.type === g.type, (t) => doMerge([id], t));
}
async function deleteFlow(id) {
  const g = gById(id);
  const err = (txCount(id) || kids(id).length) ? deleteGroup(id) : '';
  if (err) { toast(err); return; }
  if (await confirmBox('Xoá nhóm?', `Xoá nhóm "${esc(g.name)}"? Nhóm này chưa có giao dịch nào.`, 'Xoá', true)) { deleteGroup(id); toast(`Đã xoá "${g.name}"`); }
}

// ---------- form tạo / sửa ----------
function editorHtml(compact) {
  const ed = gs.ed;
  const parents = tops(ed.type).filter((g) => g.id !== ed.id);
  return `<h3>${ed.id ? 'Sửa nhóm' : 'Tạo nhóm mới'}</h3>
    <div class="prevrow">${tile(ed, 58)}<div style="min-width:0"><div style="font-weight:900;font-size:16px" data-prevname>${esc(ed.name || 'Tên nhóm')}</div><small style="color:var(--muted);font-weight:800">${ed.parent && gById(ed.parent) ? 'Nhóm con của ' + esc(gById(ed.parent).name) : 'Nhóm cha'} · ${ed.type === 'inc' ? 'nhóm thu' : 'nhóm chi'}</small></div></div>
    <div class="two"><div class="field"><label for="edName">Tên nhóm</label><input id="edName" class="inp" value="${esc(ed.name)}" maxlength="40" autocomplete="off"></div>
      <div class="field"><label for="edPar">Thuộc nhóm cha</label><select id="edPar" class="inp"><option value="">(Không, là nhóm cha)</option>${parents.map((p) => `<option value="${p.id}" ${ed.parent === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div></div>
    <div class="field"><span class="lbl">Màu</span><div class="swatches">${Object.keys(PAL).map((k) => `<button type="button" data-c="${k}" class="${ed.color === k ? 'on' : ''}" style="background:${PAL[k][0]}" aria-label="Màu ${k}"></button>`).join('')}</div></div>
    <div class="field"><span class="lbl">Thư viện icon</span><div class="libtabs">${Object.keys(LIB).map((k) => `<button type="button" data-lt="${k}" class="${gs.libTab === k ? 'on' : ''}">${k}</button>`).join('')}</div></div>
    <div class="lib" style="${compact ? 'max-height:220px' : ''}">${LIB[gs.libTab].map((n) => `<button type="button" data-ic="${n}" class="${ed.icon === n ? 'on' : ''}" title="${n}">${I(n)}</button>`).join('')}</div>
    <div class="actions">${ed.id ? '<button class="btn" type="button" data-cancel>Huỷ sửa</button>' : compact ? '<button class="btn" type="button" data-x>Huỷ</button>' : ''}<button class="btn primary" type="button" data-save>${I(ed.id ? 'check' : 'plus')}${ed.id ? 'Lưu thay đổi' : 'Tạo nhóm'}</button></div>`;
}
function wireEditor(el, compact, rerender, done) {
  el.querySelector('#edName').oninput = (e) => { gs.ed.name = e.target.value; el.querySelector('[data-prevname]').textContent = gs.ed.name || 'Tên nhóm'; };
  el.querySelector('#edPar').onchange = (e) => { gs.ed.parent = e.target.value; rerender(); };
  el.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { gs.ed.color = b.dataset.c; rerender(); }));
  el.querySelectorAll('[data-lt]').forEach((b) => (b.onclick = () => { gs.libTab = b.dataset.lt; rerender(); }));
  el.querySelectorAll('[data-ic]').forEach((b) => (b.onclick = () => { gs.ed.icon = b.dataset.ic; rerender(); }));
  const c = el.querySelector('[data-cancel]');
  if (c) c.onclick = () => { gs.ed = blank(view.gmType); done(false); };
  el.querySelector('[data-save]').onclick = () => {
    const ed = gs.ed, name = ed.name.trim();
    if (!name) { toast('Hãy đặt tên cho nhóm'); el.querySelector('#edName').focus(); return; }
    if (ed.id) {
      if (ed.parent && kids(ed.id).length) { toast('Nhóm đang có nhóm con nên không thể làm nhóm con'); return; }
      updateGroup(ed.id, { name, icon: ed.icon, color: ed.color, parent: ed.parent || null });
      toast(`Đã lưu "${name}"`);
    } else {
      gs.lastCreated = addGroup({ name, icon: ed.icon, color: ed.color, type: ed.type, parent: ed.parent || null });
      toast(`Đã tạo nhóm "${name}"`);
    }
    gs.ed = blank(view.gmType);
    done(true);
  };
}
function editInto(id) {
  const g = gById(id);
  gs.ed = { id, name: g.name, icon: g.icon, color: g.color, parent: g.parent || '', type: g.type };
  gs.libTab = Object.keys(LIB).find((k) => LIB[k].includes(g.icon)) || gs.libTab;
}

const typeTabs = () => `<div class="tabs" data-tabkey="gmtype">${[['exp', 'Nhóm chi'], ['inc', 'Nhóm thu']].map(([k, n]) => `<button type="button" data-gmtype="${k}" class="${view.gmType === k ? 'on' : ''}">${n}</button>`).join('')}<span class="ind"></span></div>`;
const setType = (t) => {
  if (t === view.gmType) return;
  gs.selected.clear(); if (!gs.ed.id) gs.ed = blank(t);
  document.body.dataset.swipe = t === 'inc' ? 'next' : 'prev';
  setView({ gmType: t });
  setTimeout(() => delete document.body.dataset.swipe, 400);
};

// ---------- PC ----------
export function groupsDeskHtml() {
  if (gs.ed.type !== view.gmType && !gs.ed.id) gs.ed = blank(view.gmType);
  const row = (g, child) => `<div class="grow${child ? ' child' : ''}" draggable="true" data-id="${g.id}" data-drop="${g.id}">
    <input type="checkbox" ${gs.selected.has(g.id) ? 'checked' : ''} aria-label="Chọn ${esc(g.name)}" data-sel="${g.id}">${I('grip-vertical', 'grip')}${tile(g, child ? 38 : 46)}
    <div class="nm"><b>${esc(g.name)}</b><small>${txCount(g.id)} giao dịch${!child && kids(g.id).length ? ' · ' + kids(g.id).length + ' nhóm con' : ''}</small></div>
    <div class="acts"><button type="button" data-act="move" title="Chuyển sang nhóm cha khác">${I('folder-input')}Chuyển</button><button type="button" data-act="merge" title="Gộp vào nhóm khác">${I('merge')}Gộp</button><button type="button" data-act="edit" title="Sửa tên, icon, màu">${I('pencil')}Sửa</button><button type="button" data-act="del" title="Xoá nhóm">${I('trash-2')}</button></div></div>`;
  const n = [...gs.selected].filter(gById).length;
  return `<div class="bar">${typeTabs()}<span class="lbl" style="font-size:13px">Kéo một nhóm thả lên nhóm khác để biến nó thành nhóm con</span><div class="spacer"></div>
      <button class="btn" type="button" data-mergesel ${n < 2 ? 'disabled' : ''}>${I('merge')}Gộp ${n >= 2 ? n + ' ' : ''}nhóm đã chọn</button></div>
    <div class="gm"><div class="panel gm-list scroll" data-key="gmlist"><div class="dropTop" data-drop="__top">Thả vào đây để biến thành nhóm cha</div>
      ${tops(view.gmType).map((g) => `<div class="gcard">${row(g)}${kids(g.id).map((k) => row(k, 1)).join('')}</div>`).join('')}</div>
      <div class="panel editor" data-editor>${editorHtml(false)}</div></div>`;
}
export function wireGroupsDesk(root, rerender) {
  root.querySelectorAll('[data-gmtype]').forEach((b) => (b.onclick = () => setType(b.dataset.gmtype)));
  const list = root.querySelector('.gm-list');
  const edEl = root.querySelector('[data-editor]');
  const redrawEd = () => { edEl.innerHTML = editorHtml(false); wireEditor(edEl, false, redrawEd, () => rerender()); };
  wireEditor(edEl, false, redrawEd, () => rerender());
  list.addEventListener('change', (e) => { const cb = e.target.closest('[data-sel]'); if (cb) { cb.checked ? gs.selected.add(cb.dataset.sel) : gs.selected.delete(cb.dataset.sel); rerender(); } });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.closest('.grow').dataset.id;
    if (b.dataset.act === 'edit') { editInto(id); redrawEd(); }
    else if (b.dataset.act === 'move') {
      const g = gById(id);
      if (g.parent) {
        pickTarget(false, `Chuyển "${esc(g.name)}" tới…`, 'Chọn nhóm cha mới, hoặc để nó thành nhóm cha.', (x) => !x.parent && x.id !== g.parent && x.id !== id && x.type === g.type, (t) => doMove(id, t));
        const pk = document.querySelector('#overlay .pick');
        if (pk) { pk.insertAdjacentHTML('afterbegin', `<button type="button" data-top>${I('corner-down-right')}Biến thành nhóm cha</button>`); pk.querySelector('[data-top]').onclick = () => { document.querySelector('#overlay .scrim:last-child')?.remove(); doMove(id, null); }; }
      } else moveFlow(id, false);
    } else if (b.dataset.act === 'merge') mergeFlow(id, false);
    else if (b.dataset.act === 'del') deleteFlow(id);
  });
  const ms = root.querySelector('[data-mergesel]');
  if (ms) ms.onclick = () => {
    const ids = [...gs.selected].filter(gById);
    const box = dialog(`<h3>Gộp ${ids.length} nhóm</h3><p>Giữ lại tên và icon của nhóm nào?</p><div class="pick">${ids.map((i) => `<button type="button" data-t="${i}">${tile(gById(i), 34)}${esc(gById(i).name)}<span style="color:var(--muted);font-weight:700;margin-left:auto">${txCount(i)} giao dịch</span></button>`).join('')}</div><div class="actions"><button class="btn" type="button" data-x>Huỷ</button></div>`);
    box.el.querySelectorAll('[data-t]').forEach((x) => (x.onclick = () => { box.close(); doMerge(ids, x.dataset.t); }));
  };
  // kéo thả
  let dragId = null;
  list.addEventListener('dragstart', (e) => { const r = e.target.closest('.grow'); if (!r) return; dragId = r.dataset.id; r.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch { /* bỏ qua */ } });
  list.addEventListener('dragend', () => { dragId = null; list.querySelectorAll('.dragging,.over').forEach((x) => x.classList.remove('dragging', 'over')); });
  list.addEventListener('dragover', (e) => { const t = e.target.closest('[data-drop]'); if (!t || !dragId) return; e.preventDefault(); list.querySelectorAll('.over').forEach((x) => x !== t && x.classList.remove('over')); t.classList.add('over'); });
  list.addEventListener('dragleave', (e) => { const t = e.target.closest('[data-drop]'); if (t && !t.contains(e.relatedTarget)) t.classList.remove('over'); });
  list.addEventListener('drop', (e) => { const t = e.target.closest('[data-drop]'); if (!t || !dragId) return; e.preventDefault(); const id = dragId; dragId = null; doMove(id, t.dataset.drop === '__top' ? null : t.dataset.drop); });
}

// ---------- điện thoại ----------
export function groupsMobileHtml() {
  const row = (g, child) => `<button type="button" class="tx" data-gact="${g.id}" style="${child ? 'padding-left:28px' : ''}">${tile(g, child ? 40 : 48)}<div class="t"><div>${esc(g.name)}</div><small>${txCount(g.id)} giao dịch${!child && kids(g.id).length ? ' · ' + kids(g.id).length + ' nhóm con' : ''}</small></div>${I('ellipsis')}</button>`;
  return `<div style="display:flex;gap:8px;align-items:center">${typeTabs()}<div class="spacer"></div><button class="btn primary" type="button" data-newgroup>${I('plus')}Tạo nhóm</button></div>
    <div class="lbl" style="padding:0 4px">Chạm vào nhóm để chuyển, gộp, sửa</div>
    ${tops(view.gmType).map((g) => `<div class="plist">${row(g)}${kids(g.id).map((k) => row(k, 1)).join('')}</div>`).join('')}`;
}
// mở form tạo / sửa nhóm. opts: { type, compact, onDone(idMới) } — dùng cả khi đang nhập giao dịch
export function openEditorSheet(id, opts = {}) {
  const compact = opts.compact ?? true;
  if (id) editInto(id); else gs.ed = blank(opts.type || view.gmType);
  gs.lastCreated = null;
  const html = '<div data-editor style="display:flex;flex-direction:column;gap:12px"></div>';
  let finished = false;
  const onClose = () => { if (!finished && opts.onDone) opts.onDone(null); };
  const box = compact ? sheet(html, { cls: 'tall', onClose }) : dialog(html, { wide: true, onClose });
  const el = box.el.querySelector('[data-editor]');
  const redraw = () => { el.innerHTML = editorHtml(compact); wireEditor(el, compact, redraw, (saved) => { finished = true; box.close(); if (opts.onDone) opts.onDone(saved ? gs.lastCreated : null); }); };
  redraw();
}
export function wireGroupsMobile(root) {
  root.querySelectorAll('[data-gmtype]').forEach((b) => (b.onclick = () => setType(b.dataset.gmtype)));
  const nb = root.querySelector('[data-newgroup]');
  if (nb) nb.onclick = () => openEditorSheet(null);
  root.querySelectorAll('[data-gact]').forEach((b) => (b.onclick = () => {
    const id = b.dataset.gact, g = gById(id);
    const box = sheet(`<div class="asheet"><div style="display:flex;align-items:center;gap:12px;padding:4px 12px 8px">${tile(g, 44)}<div><div style="font-weight:900">${esc(g.name)}</div><small style="color:var(--muted);font-weight:700">${g.parent ? 'Nhóm con của ' + esc(gById(g.parent)?.name) : 'Nhóm cha'} · ${txCount(id)} giao dịch</small></div></div>
      <button type="button" class="act" data-a="move">${I('folder-input')}Chuyển sang nhóm cha khác</button>
      ${g.parent ? `<button type="button" class="act" data-a="top">${I('corner-down-right')}Biến thành nhóm cha</button>` : ''}
      <button type="button" class="act" data-a="merge">${I('merge')}Gộp vào nhóm khác</button>
      <button type="button" class="act" data-a="edit">${I('pencil')}Đổi tên, icon, màu</button>
      <button type="button" class="act" data-a="del" style="color:var(--red)">${I('trash-2')}Xoá nhóm</button></div>`);
    box.el.querySelectorAll('[data-a]').forEach((a) => (a.onclick = () => {
      box.close();
      const k = a.dataset.a;
      if (k === 'move') moveFlow(id, true);
      else if (k === 'top') doMove(id, null);
      else if (k === 'merge') mergeFlow(id, true);
      else if (k === 'edit') openEditorSheet(id);
      else deleteFlow(id);
    }));
  }));
}
export { store };
