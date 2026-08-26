package com.sanzceo.qrisgate

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import android.content.Context
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStream

class QRISNotificationListener : NotificationListenerService() {
    private val TAG = "QRISListener"

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        
        var source = packageName
        if (packageName.contains("dana")) source = "dana"
        else if (packageName.contains("gojek") || packageName.contains("gopay")) source = "gopay merchant"
        else if (packageName.contains("ovo")) source = "ovo"
        else if (packageName.contains("shopee")) source = "shopeepay"
        else if (packageName.contains("bca")) source = "bca merchant"
        else if (packageName.contains("linkaja")) source = "linkaja"

        var title = sbn.notification.extras.getString("android.title", "")
        var text = sbn.notification.extras.getString("android.text", "")
        if (title == null) title = ""
        if (text == null) text = ""
        
        Log.d(TAG, "Notification received: $title - $text")

        val lowerText = text.lowercase()
        val lowerTitle = title.lowercase()

        if (lowerText.contains("berhasil") || lowerTitle.contains("berhasil") || 
            lowerText.contains("sukses") || lowerTitle.contains("sukses") || 
            lowerText.contains("pembayaran masuk")) {
            
            var nominalStr = text.replace("[^0-9]".toRegex(), "")
            if (nominalStr.isEmpty()) {
                nominalStr = title.replace("[^0-9]".toRegex(), "")
            }
            if (nominalStr.isNotEmpty()) {
                sendToWebhook(nominalStr, source)
            }
        }
    }

    private fun sendToWebhook(nominal: String, source: String) {
        Thread {
            try {
                val prefs = getSharedPreferences("qrisgate_prefs", Context.MODE_PRIVATE)
                val webhookUrl = prefs.getString("webhook_url", "https://qris-backend-mu.vercel.app/api/webhook")
                
                if (webhookUrl.isNullOrEmpty()) return@Thread

                val url = URL(webhookUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true

                val jsonPayload = "{\"nominal\":\"$nominal\", \"source\":\"$source\"}"
                
                conn.outputStream.use { os ->
                    val input = jsonPayload.toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }
                
                Log.d(TAG, "Webhook response code: ${conn.responseCode}")
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Webhook error", e)
            }
        }.start()
    }
}
