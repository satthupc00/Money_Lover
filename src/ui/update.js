// Bảng thông báo có bản mới: nội dung bản mới, tiến độ tải, nút cài
import { upd, onUpd, installUpdate, checkUpdate } from '../updater.js';
import { isNative, isElectron, APP_VERSION } from '../platform.js';
import { I } from '../icons.js';
import { esc } from '../util.js';
import { dialog } from './common.js';

let box = null;

// markdown đơn giản của ghi chú phát hành -> HTML
function notesHtml(md) {
  // bỏ tiêu đề, dòng credit và mục "Tải về" (không cần khi xem trong app)
  let skip = false;
  const lines = String(md || '').split(/\r?\n/).filter((l) => {
    const t = l.trim();
    if (/^\*\*[^*]+\*\*$/.test(t)) skip = /^\*\*Tải về/.test(t);
    return !skip && !/^(Created by Mondiro|##\s)/.test(t);
  });
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>');
  let out = '', inList = false;
  for (const l of lines) {
    const t = l.trim();
    if (/^[-*]\s+/.test(t)) { if (!inList) { out += '<ul>'; inList = true; } out += `<li>${inline(t.replace(/^[-*]\s+/, ''))}</li>`; continue; }
    if (inList) { out += '</ul>'; inList = false; }
    if (t) out += `<p>${inline(t)}</p>`;
  }
  return out + (inList ? '</ul>' : '');
}

function body() {
  const s = upd.status;
  const btn = s === 'downloading'
    ? `<div class="upd-prog"><i style="width:${Math.max(3, upd.progress || 0)}%"></i><span>Đang tải ${Math.round(upd.progress || 0)}%</span></div>`
    : s === 'ready'
      ? `<button class="btn primary big" type="button" data-inst>${I('check')}${isElectron ? 'Cài và mở lại app' : 'Cài đặt'}</button>`
      : s === 'error'
        ? `<button class="btn primary big" type="button" data-inst>${I('refresh-cw')}Thử tải lại</button>`
        : `<button class="btn primary big" type="button" data-inst>${I('arrow-right')}Tải và cài đặt</button>`;
  return `<h3>${I('sparkles')}Có bản mới ${esc(upd.version)}</h3>
    <p>Bạn đang dùng bản ${APP_VERSION}. Dữ liệu được giữ nguyên khi cập nhật.</p>
    ${upd.notes ? `<div class="upd-notes">${notesHtml(upd.notes)}</div>` : ''}
    ${upd.needPerm && isNative ? '<div class="upd-warn">Android cần bạn cho phép cài app từ Mon Money Lover: bật <b>"Cho phép từ nguồn này"</b> rồi quay lại, app sẽ tự mở trình cài.</div>' : ''}
    ${s === 'error' ? `<div class="upd-warn">${esc(upd.error)}</div>` : ''}
    <div class="actions"><button class="btn" type="button" data-x>Để sau</button>${btn}</div>`;
}

export function openUpdateDialog() {
  if (box) return;
  box = dialog(body(), { wide: true, onClose: () => { box = null; } });
  wire();
}
function wire() {
  box?.el.querySelector('[data-inst]')?.addEventListener('click', () => { if (upd.status === 'error') upd.status = 'available'; installUpdate(); });
}
onUpd(() => {
  if (box) { box.el.innerHTML = body(); wire(); }
  else if (upd.asked && upd.status === 'available') { upd.asked = false; openUpdateDialog(); }
});

// bấm nút cập nhật ở đầu app / cài đặt
export function updateAction() {
  if (['available', 'downloading', 'ready'].includes(upd.status) || (upd.status === 'error' && upd.version)) openUpdateDialog();
  else checkUpdate(true);
}
