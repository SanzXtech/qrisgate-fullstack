package com.sanzceo.qrisgate

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationListener"
    }

    @ReactMethod
    fun isPermissionGranted(promise: Promise) {
        val packageName = reactApplicationContext.packageName
        val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(reactApplicationContext)
        promise.resolve(enabledPackages.contains(packageName))
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun setWebhookSettings(webhookUrl: String, token: String?, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("qrisgate_prefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
            editor.putString("webhook_url", webhookUrl)
            if (token != null) {
                editor.putString("token", token)
            }
            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e)
        }
    }
}
