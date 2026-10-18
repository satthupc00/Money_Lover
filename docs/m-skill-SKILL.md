---
name: "m-skill"
description: "Bộ nhận diện + quy trình chuẩn cho mọi app Mondiro (Electron desktop, Android Z Fold 7): header, credit, màu, icon, layout, auto-update, cách giao file. Dùng khi tạo, sửa giao diện hoặc build app."
---

# Mondiro App Style

Người dùng (Mondiro) là artist 2D/3D, animator, concept artist, không biết lập trình. Mọi app làm cho Mondiro phải trông như cùng một bộ sản phẩm. Skill này là **nguồn chuẩn duy nhất** về brand. Khi dùng chung với `ui-ux-pro-max` hay `taste-skill`, brand ở đây luôn thắng; hai skill kia chỉ dùng cho UX rule và "gu" chi tiết.

Chuẩn tham chiếu: header của **Mondiro GifCap** / **Mondiro Spine Preview for Art** (thông số bên dưới lấy từ source thật).

---

## 0. Trước khi bắt đầu một app MỚI

1. **Hỏi tên app**: luôn hỏi người dùng tên app, kèm **1 tên đề xuất** do Claude tự đặt (ngắn, tiếng Anh, dạng "Mondiro <Tên>" hoặc "Mon <Tên>", xem §2). Dùng AskUserQuestion nếu có.
2. Nếu yêu cầu còn chỗ đắn đo (tính năng, platform, cách lưu file…) → hỏi lại, mỗi lần ít câu, có phương án đề xuất.
3. Nếu có cách làm tốt hơn yêu cầu → đề xuất + giải thích vì sao, để người dùng chọn.
4. **Luôn vẽ icon** cho app mới (xem §4).
5. Platform mặc định: desktop = **Electron (Windows 10)**; mobile = **Android, tối ưu Samsung Z Fold 7**.
6. Bối cảnh nghề: hay dùng **Spine 3.7.94** và **Cocos Creator 2.1.3** — app liên quan phải tương thích đúng các phiên bản này.

---

## 1. Design tokens (dark theme, mặc định cho mọi app)

```css
:root{
  --chrome:#1F2126;  /* nền cửa sổ, header, footer */
  --panel:#26292F;   /* sidebar, panel, input */
  --line:#363A42;    /* viền, divider */
  --hover:#2F333A;
  --stage:#2B2D31;   /* vùng canvas / preview */
  --text:#E8E9EC;
  --muted:#8D929C;
  --red:#E5383B;     /* màu thương hiệu: chữ Mondiro, nút chính, focus, chọn */
  --warn:#F2B84B;
  --selected-bg:#3A2426; /* nền item đang chọn (đỏ rất tối) */
}
html,body{margin:0;height:100%;background:var(--chrome);color:var(--text);
  font:13px/1.4 "Segoe UI",system-ui,sans-serif;overflow:hidden;user-select:none}
:focus-visible{outline:2px solid var(--red);outline-offset:1px}
```

- Font: **Segoe UI** (Windows), body 13px. Số liệu dùng `font-variant-numeric: tabular-nums`.
- Bo góc: nút/input 6px, panel nổi 8px, ô màu 5px.
- Spacing theo bội số 2/4px; padding header/footer `10px 14px` / `8px 14px`.
- Màu đỏ chỉ dùng cho nhấn mạnh (nút chính, trạng thái chọn, playhead, focus). Không tô đỏ diện rộng.
- Không dùng emoji làm icon; icon UI là SVG nét/khối đơn giản.

## 2. Header chuẩn Mondiro (desktop — BẮT BUỘC)

Góc trái trên cùng: **icon app** → bên phải là **"Mondiro"** (đỏ) + **tên app** (trắng), cùng size; dòng dưới là mô tả ngắn tính năng (1 dòng, tiếng Việt, ≤ ~45 ký tự). Kích thước **giống hệt giữa các app**.

**Hai dạng tên (chọn theo tên app):**
- Tên dạng **"Mondiro + tên app"** (vd Mondiro GifCap) → làm như cũ: `<span class="m">Mondiro</span> <span class="a">GifCap</span>`.
- Tên có chữ **"Mon"** (vd Mon Money Lover) → chữ **Mon** thay chỗ chữ Mondiro, **không** thêm "Mondiro" phía trước: `<span class="m">Mon</span> <span class="a">Money Lover</span>`.
- Rule màu giữ nguyên ở cả hai dạng: phần đầu (Mondiro / Mon) màu đỏ `--red`, phần còn lại màu trắng; cùng size, cùng font, cùng icon 34px, cùng dòng mô tả.

```html
<header class="top">
  <div class="brand">
    <img class="brand-icon" src="build/icon.png" alt="">
    <div class="brand-text">
      <div class="brand-name"><span class="m">Mondiro</span> <span class="a">Tên App</span></div>
      <div class="brand-desc">Mô tả ngắn gọn tính năng chính</div>
    </div>
  </div>
  <div class="file-info" id="fileInfo"></div>   <!-- tuỳ app, có thể bỏ -->
  <div class="tools"><!-- nút chính bên phải --></div>
</header>
```

```css
.top{display:flex;align-items:center;gap:16px;padding:10px 14px;border-bottom:1px solid var(--line);flex:0 0 auto}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.brand-icon{width:34px;height:34px;flex:0 0 auto}
.brand-name{font-size:17px;font-weight:700;line-height:1.15;white-space:nowrap}
.brand-name .m{color:var(--red)} .brand-name .a{color:#fff}
.brand-desc{font-size:11.5px;color:var(--muted);margin-top:2px}
.tools{display:flex;gap:8px}
```

- `<title>` và `BrowserWindow.title` = đúng tên hiển thị trên header ("Mondiro Tên App" hoặc "Mon Tên App"). `backgroundColor:'#1F2126'` để không chớp trắng khi mở.
- Ghi chú tên: luôn là **Mondiro** (không phải "Mondrio"). Dòng "Created by Mondiro" (§3) giữ nguyên ở mọi app, kể cả app dạng "Mon".

## 2b. Góc trên: chấm đồng bộ + nút kiểm tra cập nhật (BẮT BUỘC, desktop + Android)

**Chấm tròn đồng bộ** — mọi app có đồng bộ (Firebase, cloud…) dùng **1 chấm tròn** ở **góc phải trên**, không ghi chữ "Đã đồng bộ" dài dòng:
- Chấm 12px, có quầng mờ 4px cùng màu. Màu theo trạng thái: **xám** `#A6A9B0` = chỉ lưu trên máy / chưa đăng nhập; **vàng nhấp nháy** `#F5A623` = đang đồng bộ; **xanh lá** = đồng bộ xong (`#1FA463` trên nền sáng, `#3DDC8A` trên header tối); **đỏ** `#E5383B` = lỗi.
- Chấm là nút 38px: `title`/tooltip ghi trạng thái (+ email tài khoản); chạm vào hiện toast trạng thái. Đổi màu có transition .3s; có reduced-motion tắt nhấp nháy.
```html
<button type="button" class="syncdot synced" title="Đã đồng bộ · email" aria-label="Đồng bộ: Đã đồng bộ"><i></i></button>
```
```css
.syncdot{width:38px;height:38px;border:0;background:none;border-radius:50%;display:grid;place-items:center;cursor:pointer}
.syncdot i{width:12px;height:12px;border-radius:50%;background:#A6A9B0;box-shadow:0 0 0 4px rgba(166,169,176,.2);transition:background-color .3s,box-shadow .3s}
.syncdot.synced i{background:#1FA463;box-shadow:0 0 0 4px rgba(31,164,99,.18)}
.syncdot.pending i{background:#F5A623;animation:syncPulse 1s ease-in-out infinite}
.syncdot.error i{background:#E5383B}
@keyframes syncPulse{50%{transform:scale(.7);opacity:.6}}
```

**Nút kiểm tra cập nhật** — icon **mũi tên xoay** (lucide `refresh-cw`), tách riêng với chấm đồng bộ:
- Đang kiểm tra: icon xoay. Có bản mới: icon xanh lá nhấp nháy (pulse). Đã là bản mới nhất: icon **xanh lá** + chữ **"latest"** xanh lá ngay cạnh icon.
- Desktop: vẫn có badge "LATEST" xanh lá cạnh tên app trên header (§2) và nút "Kiểm tra bản cập nhật" có chữ.
- Thứ tự góc phải trên: `[chấm đồng bộ] [các nút khác, vd Tìm] [cập nhật]`.

## 3. "Created by Mondiro" (BẮT BUỘC mọi app)

- Desktop: góc phải footer/status bar: `.credit{color:#6B707A;font-size:11px;white-space:nowrap}`.
- Android: góc dưới (phải) màn hình chính, 10–11sp, màu muted, không che nội dung, nằm trong safe area.
- App dạng shell nhiều tool (vd Toolbox): đặt 1 lần ở shell, không lặp trong từng tool.

## 4. Icon app

Luôn dùng skill logo-design (anthropic-skills:logo-design) mỗi khi vẽ mới hoặc vẽ lại icon/logo cho app Mondiro: gọi skill đó trước rồi làm theo quy trình của nó (brief → 3 concept → dừng cho người dùng chọn → mới làm bộ hoàn chỉnh), dùng các script của nó để audit SVG và xem thử các cỡ. Các quy tắc brand ở mục này (không khung, nhấn đỏ, màu…) luôn được ưu tiên hơn gợi ý chung của logo-design.

**Phong cách mặc định: có khối 3D, màu rực rỡ** (người dùng yêu cầu). Icon phải **phù hợp với app**, nhìn vào là đoán được app làm gì, và vẽ theo kiểu khối nổi:
- Mỗi mảng có gradient sáng → tối (linear/radial) để ra khối; vật tròn dùng radialGradient tâm lệch trên-trái.
- Có **độ dày**: lớp cạnh/đáy tối hơn lệch xuống 8–18px dưới mặt chính (đồng xu, nút, thẻ, cột).
- Có **highlight**: vệt/ellipse trắng opacity .3–.7 ở góc trên-trái; có **bóng đổ** ellipse đen opacity ~.28 dưới chân.
- Màu bão hoà, tươi (vd xanh dương #3D9BFF→#1747B8, vàng #FFE680→#E8930A, tím #7B5CFF→#4B2BD6, xanh ngọc #22C3A6, đỏ #FF7E80→#A3161A). Không dùng tông xám bệt cho mảng chính.
- Vẫn giữ 1 điểm nhấn đỏ Mondiro và vẫn đọc rõ ở 16px (gradient/bóng không được làm mờ hình chính).
Tham chiếu: icon **Mondiro Spine Preview** (chuỗi bone + nút play đỏ, gradient + bóng đổ) và **Money Tracking / Mon Money Lover** (dùng chung logo ví nhỏ ôm đồng xu, có mầm cây, không khung nền).

- Motif trung tâm: 1 biểu tượng nói đúng chức năng app (bone Spine, ảnh, khung phim, đồng hồ, xu…). Giữ ít khối lớn, không vụn.
- Desktop: KHÔNG có khung/nền bọc (không squircle, không ô vuông nền). Motif tự đứng một mình và chiếm gần hết canvas (lề ≤ ~4% mỗi cạnh) để khi nằm cạnh icon app khác trên taskbar/desktop thì không bị nhỏ hơn. Vì không có nền, motif phải tự đọc được trên cả taskbar tối lẫn sáng: dùng mảng màu đậm/trung tính, hoặc viền outline #1F2126 quanh mảng sáng (kem trên nền trắng sẽ chìm).
Để các app nhìn cùng một bộ: 1 điểm nhấn đỏ #E5383B trên motif. Nếu app cần màu khác cho đúng tinh thần thì được đổi, nhưng hỏi người dùng trước.
Kiểm tra bằng mockup taskbar Windows (nền tối và sáng, cỡ 24/32px) đặt cạnh vài icon app khác: icon phải to ngang các icon kia.
- Màu gợi ý: dùng bảng màu rực ở trên; nét outline `#1F2126` chỉ khi cần tách mảng sáng khỏi nền sáng.
- Phải đọc được ở 16px: thử thu nhỏ 16/32/64px, bỏ chi tiết vụn. Gradient/bóng chỉ để tạo khối, không làm mờ hình chính.
- Vẽ bằng SVG (viewBox 512, lưu kèm `build/icon.svg`), rồi xuất:
  - Electron: `build/icon.png` 512×512 + `build/icon.ico` (16, 24, 32, 48, 64, 128, 256).
  - Android: adaptive icon — foreground 108dp với motif nằm trong vùng an toàn 66dp, background màu `#262930`; kèm monochrome layer cho themed icon.
  (Riêng Android vẫn cần background vì launcher tự cắt hình theo mask.)
- Cho người dùng xem preview icon (nền tối, nền sáng và cỡ nhỏ) trước khi chốt.

## 5. Layout & UX chuẩn

**Desktop (Electron)**
- Bố cục: header → body (sidebar trái ~250px `--panel` + vùng chính `--stage`) → footer/status bar (có credit).
- Nhớ kích thước/vị trí cửa sổ giữa các lần mở (lưu settings). App kiểu tool nhỏ có thể khoá kích thước nếu người dùng muốn.
- Kéo thả file: viền nét đứt đỏ `2px dashed var(--red)` + nền `rgba(229,56,59,.08)` + chữ "Thả để mở".
- Empty state: tiêu đề 20px + 1 dòng hướng dẫn + danh sách phím tắt dạng `<kbd>`.
- Toast: góc dưới giữa, viền trái đỏ 3px, tự ẩn.
- Mọi nút có tooltip `title` kèm phím tắt. Ưu tiên phím tắt cho thao tác lặp (Space play/pause, F fit, Ctrl+O mở).
- Text giao diện tiếng Việt có dấu, ngắn gọn, động từ trước ("Mở file json", "Xuất GIF").
- Không hiện đường dẫn dài làm vỡ layout — cắt bằng ellipsis hoặc ẩn.

**Android — Samsung Galaxy Z Fold 7**
- **Không có header logo + tên app** (để dành diện tích cho nội dung). Đầu màn hình chỉ là **1 hàng mỏng** (padding trên = safe-area + 2px), các icon nhỏ 38px dồn về **góc phải**: chấm đồng bộ → nút phụ (Tìm…) → nút cập nhật (§2b). Tên app chỉ còn ở launcher / màn hình khoá.
- Hai màn hình: **màn ngoài ~6.5" (2520×1080, ~21:9, dài hẹp)** và **màn trong ~8" (2184×1968, gần vuông)**.
- Thiết kế responsive theo window size class: màn ngoài = compact (1 cột), màn trong = medium/expanded (2 cột hoặc list-detail).
- Xử lý gập/mở không mất trạng thái (`configChanges` hoặc lưu state đúng cách), không khoá orientation.
- Touch target ≥ 48dp, chừa safe area/cutout, hỗ trợ dark theme (mặc định dark theo token ở §1).

## 6. Auto-update (app nằm trên GitHub repo — BẮT BUỘC)

GitHub username: `satthupc00`.
- **Electron**: `electron-builder` + `electron-updater`, `publish: { provider: "github", owner: "satthupc00", repo: "<repo>" }`. Khi mở app kiểm tra bản mới → hiện thông báo trong app (không popup hệ thống thô) → 1 click tải + cài lại. Tăng `version` trong package.json mỗi bản phát hành.
- **Android**: kiểm tra GitHub Releases mới nhất (so `versionCode`/tag) → thông báo → tải APK → mở trình cài (`REQUEST_INSTALL_PACKAGES`, FileProvider). Repo private thì cần token hoặc kênh phát hành public — hỏi người dùng trước.
- Có GitHub Actions build tự động khi push nếu phù hợp.

## 7. Giao file cho người dùng

- **Có thư mục máy tính được kết nối** → ghi/commit thẳng từng file source vào thư mục đó (giữ cấu trúc), **không** gửi zip.
- **Android, không có thư mục kết nối** → gửi **file preview (HTML chạy được) ở ngoài** + **zip source** bên trong.
- Luôn nói rõ file nằm ở thư mục nào, chạy/thử thế nào bằng các bước đơn giản cho người không biết code.

## 9. Animation cho control (BẮT BUỘC mọi app desktop)

Mọi control phải có phản hồi chuyển động nhẹ, nhanh, đồng bộ giữa các app. Chuẩn tham chiếu: **Mondiro Spine Preview** (bản layout mới).

**Nguyên tắc**
- Ngắn: hover/màu 120ms, transform/bóng 220ms. Không animation nào > 450ms (trừ pulse chờ bấm).
- Easing: `--ease-out: cubic-bezier(.22,1,.36,1)` cho di chuyển; `--ease-spring: cubic-bezier(.34,1.56,.64,1)` cho dấu tick/pop.
- Chỉ animate `transform`, `opacity`, màu, `box-shadow` (không animate width/height/top của layout).
- Màu nhấn khi hover/chọn/focus luôn là `--red`.
- Bắt buộc có `@media (prefers-reduced-motion: reduce)` tắt animation.

**Token**
```css
:root{
  --ease-out:cubic-bezier(.22,1,.36,1);
  --ease-spring:cubic-bezier(.34,1.56,.64,1);
  --t-fast:.12s; --t-med:.22s;
}
button,select,input,.chip,.list-item{
  transition:background-color var(--t-fast) ease,border-color var(--t-fast) ease,color var(--t-fast) ease,
    box-shadow var(--t-med) var(--ease-out),transform var(--t-med) var(--ease-out),opacity var(--t-fast) ease}
button:not(:disabled):active{transform:scale(.95);transition-duration:.06s}
```

**Bảng hành vi**

| Control | Hover | Bấm / chọn |
|---|---|---|
| Nút chính (đỏ) | nhấc lên 1px, sáng hơn (`#F04447`), bóng đỏ `0 6px 16px rgba(229,56,59,.35)`, 1 vệt sáng quét ngang (sheen 0.6s) | lún xuống `scale(.97)` |
| Nút phụ / icon / text-btn | viền đỏ, nhấc 1px | `scale(.95)` |
| Tab | chữ sáng lên | **thanh đỏ 2px trượt** sang tab mới (left/width, 220ms ease-out, đặt bằng JS) |
| Chip (anim, tag) | viền đỏ, nhấc 1px | nền `--selected-bg` + viền đỏ, pop `scale(.9→1)` spring |
| Item trong list | trượt phải 3px + vạch đỏ 3px bên trái (inset shadow) | giữ vạch đỏ + nền `--selected-bg` |
| Checkbox | viền đỏ | hộp tô đỏ, dấu ✓ **pop** `scale(0→1)` spring (vẽ bằng `::after`, `appearance:none`) |
| Toggle dạng nút (Loop…) | viền đỏ | dấu ✓ pop spring, nền `rgba(229,56,59,.12)` |
| Slider (range) | thumb trắng phóng `1.25` + quầng đỏ 4px | khi kéo `1.4` + quầng 6px; phần track đã kéo tô đỏ (`--fill`, cập nhật bằng JS mỗi frame để theo cả giá trị đổi từ code) |
| Input / select | viền sáng hơn | focus: viền đỏ + quầng `0 0 0 3px rgba(229,56,59,.18)` |
| Panel khi mở app | — | hiện dần + trượt lên 8px (`fx-rise` .45s), lệch nhau 60ms |
| Dialog / modal | — | pop-in `translateY(10px) scale(.96) → none` spring .32s, nền mờ fade .2s |
| Nút "có bản cập nhật" | — | pulse xanh nhẹ lặp lại cho tới khi bấm |

**Mẫu code checkbox + slider**
```css
input[type=checkbox]{appearance:none;width:16px;height:16px;margin:0;border:1.5px solid #5A5F69;border-radius:4px;
  background:var(--panel);display:inline-grid;place-content:center;cursor:pointer}
input[type=checkbox]::after{content:'';width:9px;height:5px;border:2px solid #fff;border-top:0;border-right:0;
  transform:translateY(-1px) rotate(-45deg) scale(0);transition:transform var(--t-med) var(--ease-spring)}
input[type=checkbox]:checked{background:var(--red);border-color:var(--red)}
input[type=checkbox]:checked::after{transform:translateY(-1px) rotate(-45deg) scale(1)}

input[type=range]{-webkit-appearance:none;appearance:none;height:16px;background:transparent}
input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:4px;
  background:linear-gradient(to right,var(--red) var(--fill,0%),#474C55 var(--fill,0%))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;
  background:#fff;transition:transform var(--t-med) var(--ease-spring),box-shadow var(--t-med) var(--ease-out)}
input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.25);box-shadow:0 0 0 4px rgba(229,56,59,.25)}
```
```js
// tô phần đã kéo của mọi slider (kể cả khi giá trị đổi từ code)
(function tick(){document.querySelectorAll('input[type=range]').forEach(r=>{
  const p=((r.value-(r.min||0))/((r.max||100)-(r.min||0)))*100;r.style.setProperty('--fill',p+'%')});
  requestAnimationFrame(tick)})();
```

**Android (Compose)**: cùng tinh thần, gồm ripple đỏ nhạt, `animateFloatAsState` cho scale khi bấm (0.95, spring), chuyển tab có indicator trượt, checkbox/switch dùng animation mặc định của Material 3 tô màu `#E5383B`.

## 8. Checklist trước khi giao

- [ ] Desktop: header đúng §2 (icon 34px, "Mondiro" hoặc "Mon" đỏ 17px bold + phần tên còn lại trắng, mô tả 11.5px muted). Android: không header logo/tên, chỉ hàng icon mỏng góc phải.
- [ ] Góc phải trên đúng §2b: chấm đồng bộ (xanh lá khi xong) + nút cập nhật mũi tên xoay (xanh lá + "latest" khi là bản mới nhất).
- [ ] Có "Created by Mondiro".
- [ ] Có icon mới (app mới) hợp với app, đủ size .png/.ico (+ .svg gốc) hoặc adaptive icon.
- [ ] Dùng đúng token màu §1, không màu lạ ngoài bảng.
- [ ] Hover / active / focus-visible / disabled cho mọi control, animation đúng §9 (có reduced-motion).
- [ ] Empty state + drag-drop feedback + tooltip phím tắt.
- [ ] Android: thử cả màn ngoài và màn trong Z Fold 7.
- [ ] Repo GitHub: đã có auto-update.
- [ ] Giao file đúng §7.