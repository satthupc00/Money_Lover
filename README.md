# Mondiro Mon Money Lover

Ghi chi tiêu, thu nhập · đồng bộ PC và điện thoại. Created by Mondiro.

## Cài đặt

Vào trang [Releases](https://github.com/satthupc00/Money_Lover/releases/latest) và tải:

- **Điện thoại Android (Z Fold 7):** `MonMoneyLover-x.y.z.apk`. Mở file để cài. Lần đầu Android sẽ hỏi cho phép cài app từ trình duyệt, bấm Cho phép.
- **Máy tính Windows:** `MonMoneyLover-Setup-x.y.z.exe`. Nếu Windows hiện "Windows protected your PC", bấm *More info* → *Run anyway* (app chưa mua chứng chỉ ký số).

Lần đầu mở app, bạn tự đặt mã khoá (điện thoại: PIN 4 số, rồi bật vân tay; PC: mã dài tuỳ ý). Mã chỉ lưu trên từng máy.

## Bật đồng bộ PC ↔ điện thoại (Firebase, miễn phí)

1. Vào <https://console.firebase.google.com>, bấm **Create a project**, đặt tên (vd `mon-money-lover`), tắt Google Analytics cho gọn.
2. Menu trái **Build → Authentication → Get started → Email/Password → Enable → Save**.
3. Menu trái **Build → Firestore Database → Create database** → chọn vùng `asia-southeast1` → **Start in production mode**.
4. Trong Firestore, tab **Rules**, dán nội dung file [`firestore.rules`](firestore.rules) rồi bấm **Publish**.
5. Bấm bánh răng ⚙ → **Project settings** → kéo xuống **Your apps** → bấm biểu tượng **</>** (Web) → đặt tên → **Register app**. Copy đoạn `firebaseConfig = { ... }`.
6. Gửi đoạn đó cho Claude để gắn sẵn vào bản sau, **hoặc** tự dán: trong app vào **Cài đặt → Kết nối Firebase**.
7. Trong **Cài đặt**, bấm **Tạo tài khoản** (lần đầu) hoặc **Đăng nhập** bằng cùng email trên cả PC và điện thoại.

Dữ liệu đã ghi trên máy trước khi đăng nhập sẽ được đưa lên tài khoản ở lần đăng nhập đầu tiên.

## Dành cho người phát triển

```bash
npm install            # cài thư viện
npm run dev            # chạy bản web để thử giao diện
npm run build:preview  # gom thành 1 file HTML ở dist-preview/
npm run electron       # chạy app PC (cần tải Electron)
npm run android:sync   # build web rồi chép vào dự án Android (android/)
```

Phát hành bản mới: tăng `version` trong `package.json`, sửa `RELEASE_NOTES.md`, rồi push. GitHub Actions sẽ build APK + file cài Windows và tự đăng bản `vX.Y.Z` lên Releases nếu version đó chưa có; app tự phát hiện bản mới qua nút "Kiểm tra bản cập nhật".

Cấu trúc:

| Thư mục | Nội dung |
|---|---|
| `src/` | Giao diện + logic (dùng chung cho PC, Android, web) |
| `electron/` | Phần riêng của app PC: cửa sổ, khay hệ thống, nhắc 20:00, tự cập nhật |
| `android/` | Dự án Android (Capacitor) |
| `build/` | Icon gốc `icon.svg` và icon xuất ra |
| `design/` | Bản phác layout |
