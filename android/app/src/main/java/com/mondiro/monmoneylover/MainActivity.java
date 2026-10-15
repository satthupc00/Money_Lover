package com.mondiro.monmoneylover;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
        // Giữ cỡ chữ đúng thiết kế, tránh chữ bị phóng to theo cài đặt cỡ chữ của máy làm vỡ bố cục
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().getSettings().setTextZoom(100);
        }
    }
}
