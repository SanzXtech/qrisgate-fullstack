package com.sanztech.qrisgate;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d("QRISGate", "Boot completed - NotificationListener will auto-start");
            // NotificationListenerService restarts automatically on boot
            // if the user has granted notification access permission
        }
    }
}
