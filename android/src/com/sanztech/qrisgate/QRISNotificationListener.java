package com.sanztech.qrisgate;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import android.content.SharedPreferences;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class QRISNotificationListener extends NotificationListenerService {
    private static final String TAG = "QRISListener";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String packageName = sbn.getPackageName();

        // Map package to readable source name
        String source = packageName;
        if (packageName.contains("dana")) source = "DANA";
        else if (packageName.contains("gojek") || packageName.contains("gopay")) source = "GoPay";
        else if (packageName.contains("ovo")) source = "OVO";
        else if (packageName.contains("shopee")) source = "ShopeePay";
        else if (packageName.contains("bca")) source = "BCA";
        else if (packageName.contains("linkaja")) source = "LinkAja";
        else if (packageName.contains("bri")) source = "BRI";
        else if (packageName.contains("mandiri")) source = "Mandiri";
        else if (packageName.contains("bni")) source = "BNI";

        String title = "";
        String text = "";
        try {
            title = sbn.getNotification().extras.getString("android.title", "");
            text = sbn.getNotification().extras.getString("android.text", "");
        } catch (Exception e) {
            Log.e(TAG, "Error reading notification", e);
        }
        if (title == null) title = "";
        if (text == null) text = "";

        Log.d(TAG, "Notif from " + source + ": " + title + " - " + text);
        addLog("📩 " + source + ": " + title + " - " + text);

        // Check for payment keywords
        String combined = (title + " " + text).toLowerCase();
        if (combined.contains("berhasil") || combined.contains("sukses") ||
            combined.contains("pembayaran masuk") || combined.contains("diterima") ||
            combined.contains("transfer masuk") || combined.contains("uang masuk")) {

            // Extract nominal (all digits from text)
            String nominalStr = text.replaceAll("[^0-9]", "");
            if (nominalStr.isEmpty()) {
                nominalStr = title.replaceAll("[^0-9]", "");
            }

            if (!nominalStr.isEmpty()) {
                addLog("💰 Pembayaran terdeteksi! Rp " + formatRupiah(nominalStr) + " dari " + source);
                incrementNotifCount();
                sendToWebhook(nominalStr, source, title + " - " + text);
            }
        }
    }

    private void sendToWebhook(String nominal, String source, String rawText) {
        new Thread(() -> {
            try {
                SharedPreferences prefs = getSharedPreferences("qrisgate_prefs", MODE_PRIVATE);
                String webhookUrl = prefs.getString("webhook_url", "");
                String apiKey = prefs.getString("api_key", "");

                if (webhookUrl.isEmpty()) {
                    addLog("⚠️ Webhook URL belum diset!");
                    return;
                }

                URL url = new URL(webhookUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                if (!apiKey.isEmpty()) {
                    conn.setRequestProperty("x-api-key", apiKey);
                    conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                }
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);
                conn.setDoOutput(true);

                // Escape special characters in JSON values
                String safeSource = source.replace("\"", "\\\"");
                String safeRaw = rawText.replace("\"", "\\\"").replace("\n", "\\n");

                String json = "{\"nominal\":\"" + nominal + "\"," +
                              "\"source\":\"" + safeSource + "\"," +
                              "\"raw_text\":\"" + safeRaw + "\"}";

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(json.getBytes("UTF-8"));
                }

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Webhook response: " + responseCode);
                addLog("✅ Webhook terkirim (HTTP " + responseCode + ")");
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Webhook error", e);
                addLog("❌ Webhook gagal: " + e.getMessage());
            }
        }).start();
    }

    private void addLog(String msg) {
        try {
            SharedPreferences prefs = getSharedPreferences("qrisgate_prefs", MODE_PRIVATE);
            String time = new SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(new Date());
            String entry = "[" + time + "] " + msg + "\n";
            String existing = prefs.getString("listener_logs", "");
            String newLogs = entry + existing;

            // Keep only last 2000 chars
            if (newLogs.length() > 2000) {
                newLogs = newLogs.substring(0, 2000);
            }

            prefs.edit().putString("listener_logs", newLogs).apply();
        } catch (Exception e) {
            Log.e(TAG, "Log error", e);
        }
    }

    private void incrementNotifCount() {
        SharedPreferences prefs = getSharedPreferences("qrisgate_prefs", MODE_PRIVATE);
        int count = prefs.getInt("notif_count", 0);
        prefs.edit().putInt("notif_count", count + 1).apply();
    }

    private String formatRupiah(String num) {
        try {
            long n = Long.parseLong(num);
            return String.format(Locale.getDefault(), "%,d", n).replace(',', '.');
        } catch (Exception e) {
            return num;
        }
    }
}
