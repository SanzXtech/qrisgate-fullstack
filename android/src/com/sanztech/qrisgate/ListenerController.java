package com.sanztech.qrisgate;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

public class ListenerController {
    private Activity activity;
    private View rootView;
    private TextView permissionStatus;
    private TextView logText;
    private TextView notifCount;
    private EditText inputWebhook;
    private Button btnPermission;
    private Button btnSaveWebhook;

    public ListenerController(Activity activity, View rootView) {
        this.activity = activity;
        this.rootView = rootView;
        init();
    }

    private void init() {
        permissionStatus = rootView.findViewById(R.id.permission_status);
        logText = rootView.findViewById(R.id.log_text);
        notifCount = rootView.findViewById(R.id.notif_count);
        inputWebhook = rootView.findViewById(R.id.input_webhook);
        btnPermission = rootView.findViewById(R.id.btn_permission);
        btnSaveWebhook = rootView.findViewById(R.id.btn_save_webhook);

        // Load saved webhook
        String savedWebhook = ((MainActivity) activity).getWebhookUrl();
        if (!savedWebhook.isEmpty()) {
            inputWebhook.setText(savedWebhook);
        }

        // Permission button
        btnPermission.setOnClickListener(v -> {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            activity.startActivity(intent);
        });

        // Save webhook button
        btnSaveWebhook.setOnClickListener(v -> {
            String url = inputWebhook.getText().toString().trim();
            if (url.isEmpty()) {
                Toast.makeText(activity, "URL webhook tidak boleh kosong!", Toast.LENGTH_SHORT).show();
                return;
            }
            ((MainActivity) activity).getPrefs().edit()
                .putString("webhook_url", url)
                .apply();
            Toast.makeText(activity, "✅ Webhook tersimpan!", Toast.LENGTH_SHORT).show();
            addLog("💾 Webhook disimpan: " + url);
        });
    }

    public void onResume() {
        checkPermission();
        updateLog();
    }

    private void checkPermission() {
        boolean granted = isNotificationListenerEnabled();
        if (granted) {
            permissionStatus.setText("✅ Izin Notification Access AKTIF");
            permissionStatus.setTextColor(0xFF16A34A); // success green
            btnPermission.setText("✅ Izin Sudah Diberikan");
            btnPermission.setBackgroundColor(0xFF16A34A);
        } else {
            permissionStatus.setText("❌ Izin belum diberikan");
            permissionStatus.setTextColor(0xFFDC2626); // danger red
            btnPermission.setText("🔓 Berikan Izin Notifikasi");
            btnPermission.setBackgroundColor(0xFF1D4ED8);
        }
    }

    private boolean isNotificationListenerEnabled() {
        String pkgName = activity.getPackageName();
        String flat = Settings.Secure.getString(activity.getContentResolver(),
                "enabled_notification_listeners");
        if (flat != null) {
            String[] names = flat.split(":");
            for (String name : names) {
                ComponentName cn = ComponentName.unflattenFromString(name);
                if (cn != null && cn.getPackageName().equals(pkgName)) {
                    return true;
                }
            }
        }
        return false;
    }

    private void updateLog() {
        String logs = ((MainActivity) activity).getPrefs().getString("listener_logs", "");
        int count = ((MainActivity) activity).getPrefs().getInt("notif_count", 0);
        if (!logs.isEmpty()) {
            logText.setText(logs);
        }
        notifCount.setText(count + " notif terdeteksi");
    }

    public void addLog(String msg) {
        String time = new java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault())
                .format(new java.util.Date());
        String entry = "[" + time + "] " + msg + "\n";
        String current = logText.getText().toString();
        if (current.equals("Menunggu notifikasi...")) {
            current = "";
        }
        String newLog = entry + current;
        // Keep last 50 lines
        String[] lines = newLog.split("\n");
        if (lines.length > 50) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 50; i++) {
                sb.append(lines[i]).append("\n");
            }
            newLog = sb.toString();
        }
        logText.setText(newLog);
    }
}
