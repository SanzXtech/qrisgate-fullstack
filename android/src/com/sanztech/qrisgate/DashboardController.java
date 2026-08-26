package com.sanztech.qrisgate;

import android.app.Activity;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;

public class DashboardController {
    private Activity activity;
    private View rootView;
    private WebView webView;
    private boolean loaded = false;

    public DashboardController(Activity activity, View rootView) {
        this.activity = activity;
        this.rootView = rootView;
        init();
    }

    private void init() {
        webView = rootView.findViewById(R.id.dashboard_webview);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
    }

    public void onResume() {
        String serverUrl = ((MainActivity) activity).getServerUrl();
        if (!serverUrl.isEmpty() && !loaded) {
            webView.loadUrl(serverUrl);
            loaded = true;
        } else if (serverUrl.isEmpty()) {
            webView.loadData(
                "<html><body style='display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#F8FAFC;margin:0;'>" +
                "<div style='text-align:center;color:#64748B;'>" +
                "<div style='font-size:48px;margin-bottom:16px;'>📊</div>" +
                "<h2 style='color:#0F172A;'>Dashboard</h2>" +
                "<p>Masukkan Server URL di tab Pengaturan<br>untuk melihat Dashboard</p>" +
                "</div></body></html>",
                "text/html", "UTF-8"
            );
        }
    }

    public void reload() {
        loaded = false;
        onResume();
    }
}
