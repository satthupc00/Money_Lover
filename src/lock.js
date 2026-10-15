// Khoá ứng dụng. Điện thoại: mã PIN 4 số + vân tay. PC / web: mã khoá dài tuỳ ý.
// Mã do người dùng tự đặt lần đầu, lưu dạng băm PBKDF2 trên từng máy (không lên GitHub / Firebase).
import { I } from './icons.js';
import { isNative, isElectron } from './platform.js';
import { ls, esc } from './util.js';
import { store, signIn } from './store.js';

const KEY = 'mml.lock';
export const lockCfg = () => ls.get(KEY, { enabled: true });
export const saveLockCfg = (c) => ls.set(KEY, c);
const usePin = isNative;

const enc = (s) => new TextEncoder().encode(s);
async function hash(code, salt) {
  const key = await crypto.subtle.importKey('raw', enc(code), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export async function setCode(code) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  const c = lockCfg();
  saveLockCfg({ ...c, enabled: true, salt, hash: await hash(code, salt) });
}
async function check(code) { const c = lockCfg(); return !!c.hash && (await hash(code, c.salt)) === c.hash; }

// Lưu ý: KHÔNG trả plugin Capacitor ra khỏi hàm async (await sẽ gọi .then trên plugin và treo mãi).
// Vì vậy plugin được bọc trong object { B }.
async function bio() {
  if (!isNative) return null;
  try { const m = await import('@aparajita/capacitor-biometric-auth'); return { B: m.BiometricAuth }; } catch { return null; }
}
// chặn treo: hết giờ thì dùng giá trị mặc định
const within = (p, ms, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
export async function bioAvailable() {
  const w = await bio();
  if (!w) return false;
  try { return !!(await within(w.B.checkBiometry(), 3000, { isAvailable: false })).isAvailable; } catch { return false; }
}
async function bioAuth() {
  const w = await bio();
  if (!w) return false;
  try {
    await w.B.authenticate({
      reason: 'Mở khoá Mon Money Lover', cancelTitle: 'Dùng mã PIN',
      androidTitle: 'Mở khoá Mon Money Lover', androidSubtitle: 'Chạm vân tay vào cảm biến', androidConfirmationRequired: false,
      allowDeviceCredential: false,
    });
    return true;
  } catch { return false; }
}

const shell = (inner) => `<div class="lockscreen">${isElectron ? '<div class="dragbar"></div>' : ''}<div class="lock">${inner}</div><span class="credit lock-credit">Created by Mondiro</span></div>`;
const head = (title, sub) => `<svg class="lg" aria-hidden="true"><use href="#logo"/></svg><h3>${title}</h3><p>${sub}</p>`;
const shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

// ---- bàn phím PIN 4 số
function pinPad(root, { title, sub, hint = '', extra = '', fp = false, onEnter }) {
  let v = '';
  root.innerHTML = shell(`${head(title, sub)}<div class="pin">${'<i></i>'.repeat(4)}</div><div class="err" role="alert"></div>
    <div class="pad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'fp', '0', 'del'].map((k) =>
      k === 'fp' ? (fp ? `<button type="button" class="ghost" data-fp title="Dùng vân tay">${I('fingerprint')}</button>` : '<span></span>')
      : k === 'del' ? `<button type="button" class="ghost" data-d="del" title="Xoá">${I('delete')}</button>`
      : `<button type="button" data-d="${k}">${k}</button>`).join('')}</div>${hint ? `<div class="hint">${hint}</div>` : ''}${extra}`);
  const dots = root.querySelector('.pin'), err = root.querySelector('.err');
  const draw = () => dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('f', i < v.length));
  const press = (k) => {
    if (k === 'del') { v = v.slice(0, -1); draw(); return; }
    if (v.length >= 4) return;
    v += k; err.textContent = ''; draw();
    if (v.length === 4) {
      const code = v;
      setTimeout(async () => {
        const r = await onEnter(code);
        if (r !== true) { shake(dots); err.textContent = r || 'Sai mã PIN, thử lại nhé'; v = ''; draw(); }
      }, 150);
    }
  };
  root.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => press(b.dataset.d)));
  const onKey = (e) => { if (!root.querySelector('.pad')) return document.removeEventListener('keydown', onKey); if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') press('del'); };
  document.addEventListener('keydown', onKey);
  return root;
}

// ---- ô nhập mã dài (PC)
function passForm(root, { title, sub, setup, extra = '', onSubmit }) {
  root.innerHTML = shell(`${head(title, sub)}
    <form class="pcform" autocomplete="off">
      <div class="pw"><input class="inp" type="password" id="lk1" placeholder="${setup ? 'Mã khoá mới' : 'Mã khoá'}" aria-label="Mã khoá" autofocus>
      <button type="button" class="icb" data-eye title="Hiện / ẩn mã">${I('eye')}</button></div>
      ${setup ? '<div class="pw"><input class="inp" type="password" id="lk2" placeholder="Nhập lại mã khoá" aria-label="Nhập lại mã khoá"></div>' : ''}
      <div class="err" role="alert"></div>
      <button class="btn primary big" type="submit">${setup ? 'Lưu mã và mở app' : 'Mở khoá'}${I('arrow-right')}</button>
    </form>${extra}`);
  const f = root.querySelector('form'), p1 = root.querySelector('#lk1'), p2 = root.querySelector('#lk2'), err = root.querySelector('.err');
  setTimeout(() => p1.focus(), 50);
  root.querySelector('[data-eye]').onclick = (e) => {
    const show = p1.type === 'password';
    [p1, p2].forEach((x) => x && (x.type = show ? 'text' : 'password'));
    e.currentTarget.innerHTML = I(show ? 'eye-off' : 'eye');
  };
  f.onsubmit = async (e) => {
    e.preventDefault();
    const r = await onSubmit(p1.value, p2?.value);
    if (r !== true) { err.textContent = r; shake(f); if (!setup) p1.value = ''; p1.focus(); }
  };
}

const forgotLink = '<button type="button" class="linkbtn" data-forgot>Quên mã?</button>';

function wireForgot(root, restart) {
  const b = root.querySelector('[data-forgot]');
  if (!b) return;
  b.onclick = () => {
    const u = store.user;
    root.querySelector('.lock').innerHTML = u
      ? `${head('Đặt lại mã khoá', `Đăng nhập lại tài khoản <b>${esc(u.email)}</b> để đặt mã mới. Dữ liệu vẫn an toàn trên Firebase.`)}
        <form class="pcform"><input class="inp" type="password" id="fpw" placeholder="Mật khẩu tài khoản" aria-label="Mật khẩu tài khoản"><div class="err"></div>
        <button class="btn primary big" type="submit">Xác nhận</button><button class="linkbtn" type="button" data-back>Quay lại</button></form>`
      : `${head('Đặt lại mã khoá', 'Máy này chưa đăng nhập tài khoản đồng bộ, nên đặt lại mã sẽ <b>xoá dữ liệu chỉ lưu trên máy này</b>.')}
        <div class="pcform"><button class="btn danger big" type="button" data-wipe>Xoá dữ liệu trên máy và đặt mã mới</button><button class="linkbtn" type="button" data-back>Quay lại</button></div>`;
    root.querySelector('[data-back]').onclick = restart;
    const f = root.querySelector('form');
    if (f) f.onsubmit = async (e) => {
      e.preventDefault();
      try { await signIn(u.email, root.querySelector('#fpw').value); saveLockCfg({ enabled: true }); restart(); }
      catch { root.querySelector('.err').textContent = 'Sai mật khẩu hoặc mất mạng'; }
    };
    const w = root.querySelector('[data-wipe]');
    if (w) w.onclick = () => { ls.del('mml.data.v1'); saveLockCfg({ enabled: true }); location.reload(); };
  };
}

// Chạy màn khoá; trả về Promise khi đã mở khoá
export function runLock(root) {
  return new Promise((resolve) => {
    const done = () => { root.innerHTML = ''; resolve(); };
    const start = async () => {
      const c = lockCfg();
      if (c.enabled === false) return done();
      if (!c.hash) return setup();
      if (usePin && c.bio) { if (await within(bioAuth(), 60000, false)) return done(); }
      unlock();
    };
    const setup = () => {
      if (usePin) {
        pinPad(root, {
          title: 'Đặt mã PIN', sub: 'Lần đầu mở app trên máy này. Chọn 4 số bạn dễ nhớ.', hint: 'Mã chỉ lưu trên điện thoại này',
          onEnter: (a) => {
            setTimeout(() => pinPad(root, {
              title: 'Nhập lại mã PIN', sub: 'Để chắc là bạn không bấm nhầm.',
              onEnter: async (b) => {
                if (b !== a) return 'Hai lần nhập không khớp, nhập lại nhé';
                try { await setCode(a); } catch (e) { console.error(e); return 'Không lưu được mã, thử lại nhé'; }
                askBio().catch(done);
                return true;
              },
            }), 0);
            return true;
          },
        });
      } else {
        passForm(root, {
          title: 'Đặt mã khoá cho máy này', sub: 'Gõ mã tuỳ ý, càng dài càng an toàn (ít nhất 4 ký tự). Mã chỉ lưu trên máy này.', setup: true,
          onSubmit: async (a, b) => { if ((a || '').length < 4) return 'Mã cần ít nhất 4 ký tự'; if (a !== b) return 'Hai lần nhập không khớp'; await setCode(a); done(); return true; },
        });
      }
    };
    const askBio = async () => {
      root.querySelector('.err') && (root.querySelector('.err').textContent = '');
      if (!(await bioAvailable())) return done();
      root.innerHTML = shell(`<button type="button" class="fp" data-on title="Bật vân tay">${I('fingerprint')}</button><h3>Mở khoá bằng vân tay?</h3>
        <p>Từ lần sau chỉ cần chạm vân tay. Mã PIN vẫn dùng được khi vân tay không nhận.</p>
        <div class="pcform"><button class="btn primary big" type="button" data-on>${I('fingerprint')}Bật vân tay</button><button class="btn big" type="button" data-later>Để sau</button></div>`);
      root.querySelectorAll('[data-on]').forEach((b) => (b.onclick = async () => {
        if (await within(bioAuth(), 60000, false)) { saveLockCfg({ ...lockCfg(), bio: true }); }
        done();
      }));
      root.querySelector('[data-later]').onclick = done;
    };
    const unlock = () => {
      const c = lockCfg();
      if (usePin) {
        pinPad(root, {
          title: 'Nhập mã PIN', sub: c.bio ? 'Hoặc chạm biểu tượng vân tay' : 'Mon Money Lover đang khoá', fp: !!c.bio, extra: forgotLink,
          onEnter: async (v) => ((await check(v)) ? (done(), true) : 'Sai mã PIN, thử lại nhé'),
        });
        const f = root.querySelector('[data-fp]');
        if (f) f.onclick = async () => { if (await bioAuth()) done(); };
      } else {
        passForm(root, {
          title: 'Mon Money Lover đang khoá', sub: 'Gõ mã khoá rồi bấm Enter.', extra: forgotLink,
          onSubmit: async (v) => ((await check(v)) ? (done(), true) : 'Sai mã khoá, thử lại nhé'),
        });
      }
      wireForgot(root, start);
    };
    start();
  });
}
