package com.sanztech.qrisgate;

import android.app.Activity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import java.net.HttpURLConnection;
import java.net.URL;

public class SettingsController {
    private Activity activity;
    private View rootView;
    private EditText inputServerUrl, inputApiKey;
    private Button btnSaveServer, btnSaveApiKey, btnTestConnection;
    private TextView connectionStatus;

    public SettingsController(Activity activity, View rootView) {
        this.activity = activity;
        this.rootView = rootView;
        init();
    }

    private void init() {
        inputServerUrl = rootView.findViewById(R.id.input_server_url);
        inputApiKey = rootView.findViewById(R.id.input_api_key);
        btnSaveServer = rootView.findViewById(R.id.btn_save_server);
        btnSaveApiKey = rootView.findViewById(R.id.btn_save_apikey);
        btnTestConnection = rootView.findViewById(R.id.btn_test_connection);
        connectionStatus = rootView.findViewById(R.id.connection_status);

        // Load saved values
        String savedUrl = ((MainActivity) activity).getServerUrl();
        String savedKey = ((MainActivity) activity).getApiKey();
        if (!savedUrl.isEmpty()) inputServerUrl.setText(savedUrl);
        if (!savedKey.isEmpty()) inputApiKey.setText(savedKey);

        // Save server URL
        btnSaveServer.setOnClickListener(v -> {
            String url = inputServerUrl.getText().toString().trim();
            if (url.isEmpty()) {
                Toast.makeText(activity, "URL tidak boleh kosong!", Toast.LENGTH_SHORT).show();
                return;
            }
            // Remove trailing slash
            if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
            ((MainActivity) activity).getPrefs().edit()
                .putString("server_url", url)
                .apply();
            Toast.makeText(activity, "✅ Server URL tersimpan!", Toast.LENGTH_SHORT).show();
        });

        // Save API Key
        btnSaveApiKey.setOnClickListener(v -> {
            String key = inputApiKey.getText().toString().trim();
            if (key.isEmpty()) {
                Toast.makeText(activity, "API Key tidak boleh kosong!", Toast.LENGTH_SHORT).show();
                return;
            }
            ((MainActivity) activity).getPrefs().edit()
                .putString("api_key", key)
                .apply();
            Toast.makeText(activity, "✅ API Key tersimpan!", Toast.LENGTH_SHORT).show();
        });

        // Test connection
        btnTestConnection.setOnClickListener(v -> testConnection());
    }

    public void onResume() {
        // Refresh saved values
        String savedUrl = ((MainActivity) activity).getServerUrl();
        String savedKey = ((MainActivity) activity).getApiKey();
        if (!savedUrl.isEmpty()) inputServerUrl.setText(savedUrl);
        if (!savedKey.isEmpty()) inputApiKey.setText(savedKey);
    }

    private void testConnection() {
        String serverUrl = ((MainActivity) activity).getServerUrl();
        if (serverUrl.isEmpty()) {
            connectionStatus.setText("❌ Server URL belum diisi");
            connectionStatus.setTextColor(0xFFDC2626);
            return;
        }

        connectionStatus.setText("⏳ Menghubungkan...");
        connectionStatus.setTextColor(0xFFD97706);
        btnTestConnection.setEnabled(false);

        new Thread(() -> {
            try {
                URL url = new URL(serverUrl + "/api/dashboard");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                String apiKey = ((MainActivity) activity).getApiKey();
                if (!apiKey.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                }

                int code = conn.getResponseCode();
                conn.disconnect();

                activity.runOnUiThread(() -> {
                    btnTestConnection.setEnabled(true);
                    if (code == 200) {
                        connectionStatus.setText("✅ Terhubung ke server! (HTTP " + code + ")");
                        connectionStatus.setTextColor(0xFF16A34A);
                    } else {
                        connectionStatus.setText("⚠️ Server merespon HTTP " + code);
                        connectionStatus.setTextColor(0xFFD97706);
                    }
                });
            } catch (Exception e) {
                activity.runOnUiThread(() -> {
                    btnTestConnection.setEnabled(true);
                    connectionStatus.setText("❌ Gagal: " + e.getMessage());
                    connectionStatus.setTextColor(0xFFDC2626);
                });
            }
        }).start();
    }
}
