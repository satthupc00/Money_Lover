package com.mondiro.monmoneylover;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// Tải APK bản mới vào bộ nhớ đệm của app rồi mở trình cài đặt của Android (không qua trình duyệt)
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private File apkFile() {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        return new File(dir, "update.apk");
    }

    @PluginMethod
    public void download(PluginCall call) {
        String url = call.getString("url");
        if (url == null) { call.reject("Thiếu đường dẫn tải"); return; }
        new Thread(() -> {
            HttpURLConnection c = null;
            try {
                // GitHub chuyển hướng sang máy chủ khác: tự theo tối đa 5 lần
                String u = url;
                for (int i = 0; i < 5; i++) {
                    c = (HttpURLConnection) new URL(u).openConnection();
                    c.setInstanceFollowRedirects(false);
                    c.setConnectTimeout(20000);
                    c.setReadTimeout(30000);
                    int code = c.getResponseCode();
                    if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
                        u = new URL(new URL(u), c.getHeaderField("Location")).toString();
                        c.disconnect();
                        continue;
                    }
                    if (code != 200) throw new Exception("Máy chủ trả về " + code);
                    break;
                }
                long total = c.getContentLengthLong();
                File out = apkFile();
                if (out.exists()) out.delete();
                try (InputStream in = c.getInputStream(); FileOutputStream fo = new FileOutputStream(out)) {
                    byte[] buf = new byte[64 * 1024];
                    long done = 0;
                    int n, last = -1;
                    while ((n = in.read(buf)) > 0) {
                        fo.write(buf, 0, n);
                        done += n;
                        if (total > 0) {
                            int pct = (int) (done * 100 / total);
                            if (pct != last) {
                                last = pct;
                                JSObject p = new JSObject();
                                p.put("percent", pct);
                                notifyListeners("progress", p);
                            }
                        }
                    }
                }
                JSObject r = new JSObject();
                r.put("size", out.length());
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Không tải được bản cập nhật: " + e.getMessage());
            } finally {
                if (c != null) c.disconnect();
            }
        }).start();
    }

    // hãng máy: dùng để nhắc tắt "Trình chặn tự động" trên Samsung
    @PluginMethod
    public void device(PluginCall call) {
        JSObject r = new JSObject();
        r.put("samsung", "samsung".equalsIgnoreCase(Build.MANUFACTURER));
        call.resolve(r);
    }

    // mở trang "Bảo mật và quyền riêng tư" (Samsung để Trình chặn tự động ở trang này); không mở được thì mở Cài đặt
    @PluginMethod
    public void openSecurity(PluginCall call) {
        String[] actions = { Settings.ACTION_SECURITY_SETTINGS, Settings.ACTION_SETTINGS };
        for (String a : actions) {
            try {
                Intent i = new Intent(a);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception e) { /* thử cách tiếp theo */ }
        }
        call.reject("Không mở được Cài đặt");
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                // lần đầu: mở trang cho phép cài ứng dụng từ app này
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(s);
                JSObject r = new JSObject();
                r.put("needPermission", true);
                call.resolve(r);
                return;
            }
            File f = apkFile();
            if (!f.exists()) { call.reject("Chưa tải bản cập nhật"); return; }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", f);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            JSObject r = new JSObject();
            r.put("needPermission", false);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Không mở được trình cài đặt: " + e.getMessage());
        }
    }
}
