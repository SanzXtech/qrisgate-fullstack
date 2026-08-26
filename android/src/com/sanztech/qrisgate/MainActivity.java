package com.sanztech.qrisgate;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {

    private FrameLayout contentFrame;
    private LinearLayout navDashboard, navListener, navSettings;
    private TextView labelDashboard, labelListener, labelSettings;
    private int currentTab = 0;

    // View caches
    private View dashboardView, listenerView, settingsView;
    private DashboardController dashboardCtrl;
    private ListenerController listenerCtrl;
    private SettingsController settingsCtrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Set status bar color
        getWindow().setStatusBarColor(Color.parseColor("#1D4ED8"));

        contentFrame = findViewById(R.id.content_frame);
        navDashboard = findViewById(R.id.nav_dashboard);
        navListener = findViewById(R.id.nav_listener);
        navSettings = findViewById(R.id.nav_settings);
        labelDashboard = findViewById(R.id.label_dashboard);
        labelListener = findViewById(R.id.label_listener);
        labelSettings = findViewById(R.id.label_settings);

        navDashboard.setOnClickListener(v -> switchTab(0));
        navListener.setOnClickListener(v -> switchTab(1));
        navSettings.setOnClickListener(v -> switchTab(2));

        // Initialize views
        LayoutInflater inflater = LayoutInflater.from(this);
        dashboardView = inflater.inflate(R.layout.fragment_dashboard, contentFrame, false);
        listenerView = inflater.inflate(R.layout.fragment_listener, contentFrame, false);
        settingsView = inflater.inflate(R.layout.fragment_settings, contentFrame, false);

        // Init controllers
        dashboardCtrl = new DashboardController(this, dashboardView);
        listenerCtrl = new ListenerController(this, listenerView);
        settingsCtrl = new SettingsController(this, settingsView);

        switchTab(0);
    }

    private void switchTab(int tab) {
        currentTab = tab;
        contentFrame.removeAllViews();

        // Reset tab colors
        int active = Color.parseColor("#1D4ED8");
        int inactive = Color.parseColor("#94A3B8");

        labelDashboard.setTextColor(tab == 0 ? active : inactive);
        labelListener.setTextColor(tab == 1 ? active : inactive);
        labelSettings.setTextColor(tab == 2 ? active : inactive);

        switch (tab) {
            case 0:
                contentFrame.addView(dashboardView);
                dashboardCtrl.onResume();
                break;
            case 1:
                contentFrame.addView(listenerView);
                listenerCtrl.onResume();
                break;
            case 2:
                contentFrame.addView(settingsView);
                settingsCtrl.onResume();
                break;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (currentTab == 1) {
            listenerCtrl.onResume();
        }
    }

    public SharedPreferences getPrefs() {
        return getSharedPreferences("qrisgate_prefs", MODE_PRIVATE);
    }

    public String getServerUrl() {
        return getPrefs().getString("server_url", "");
    }

    public String getWebhookUrl() {
        return getPrefs().getString("webhook_url", "");
    }

    public String getApiKey() {
        return getPrefs().getString("api_key", "");
    }
}
