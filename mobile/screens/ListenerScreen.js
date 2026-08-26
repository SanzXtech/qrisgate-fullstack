import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, TextInput, Alert, Vibration, Platform, Linking, NativeModules } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS, FONTS, RADIUS, BASE_URL, formatRupiah } from '../config';

const { NotificationListener } = NativeModules;

// ========================================
// PRE-CONFIGURED E-WALLET DEFINITIONS
// User TIDAK perlu setup apapun. Tinggal toggle ON/OFF.
// ========================================
const EWALLET_PRESETS = [
  {
    id: 'gopay',
    name: 'GoPay',
    packageId: 'com.gojek.app',
    color: '#00AA13',
    bgColor: '#E8F5E9',
    icon: '🟢',
    description: 'Gojek / GoPay',
    regex: /Rp\s?([\d.,]+)/,
    testNotif: 'Pembayaran diterima! Rp 50.000 masuk ke GoPay Anda dari QRIS',
  },
  {
    id: 'dana',
    name: 'DANA',
    packageId: 'id.dana',
    color: '#108EE9',
    bgColor: '#E3F2FD',
    icon: '🔵',
    description: 'DANA Indonesia',
    regex: /Rp\s?([\d.,]+)/,
    testNotif: 'Anda menerima transfer Rp 75.000 via DANA',
  },
  {
    id: 'ovo',
    name: 'OVO',
    packageId: 'ovo.id',
    color: '#4C3494',
    bgColor: '#EDE7F6',
    icon: '🟣',
    description: 'OVO Cash',
    regex: /Rp\s?([\d.,]+)/,
    testNotif: 'Uang masuk Rp 100.000 ke saldo OVO Anda',
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    packageId: 'com.shopee.id',
    color: '#EE4D2D',
    bgColor: '#FBE9E7',
    icon: '🟠',
    description: 'Shopee / ShopeePay',
    regex: /Rp\s?([\d.,]+)/,
    testNotif: 'ShopeePay: Pembayaran QRIS Rp 25.000 berhasil diterima',
  },
  {
    id: 'linkaja',
    name: 'LinkAja',
    packageId: 'com.telkom.mwallet',
    color: '#E4002B',
    bgColor: '#FFEBEE',
    icon: '🔴',
    description: 'LinkAja by Telkomsel',
    regex: /Rp\s?([\d.,]+)/,
    testNotif: 'LinkAja: Dana masuk Rp 30.000 dari pembayaran QRIS',
  },
];

export default function ListenerScreen({ token, settings }) {
  const [apiKey, setApiKey] = useState(settings?.apiKey || '');
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activeWallets, setActiveWallets] = useState({});
  const [testResults, setTestResults] = useState({}); // { gopay: 'success' | 'fail' | 'testing' }
  const [logs, setLogs] = useState([]);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    checkPermission();
    if (NotificationListener && apiKey) {
        NotificationListener.setWebhookSettings(`${BASE_URL}/api/webhook`, apiKey);
    }
  }, [apiKey]);

  const checkPermission = async () => {
    if (Platform.OS === 'android' && NotificationListener) {
        try {
            const granted = await NotificationListener.isPermissionGranted();
            setPermissionGranted(granted);
        } catch (e) {
            console.log(e);
        }
    }
  };

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [{ time, msg, id: Date.now() }, ...prev].slice(0, 100));
  };

  // ========================================
  // STEP 1: Connect to server via API Key
  // ========================================
  const connectToServer = async () => {
    if (!apiKey.trim()) {
      Alert.alert('API Key Kosong', 'Masukkan API Key dari halaman Integrasi & Setup di web dashboard Anda.');
      return;
    }

    addLog('🔄 Menghubungkan ke server...');

    try {
      const res = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsConnected(true);
        addLog('✅ Terhubung ke server QRISGate!');
        Vibration.vibrate(100);
        if (NotificationListener) {
           NotificationListener.setWebhookSettings(`${BASE_URL}/api/webhook`, apiKey);
        }
      } else {
        setIsConnected(false);
        addLog('❌ Server menolak koneksi. Periksa API Key.');
      }
    } catch (e) {
      setIsConnected(false);
      addLog('❌ Tidak bisa menjangkau server. Periksa koneksi internet.');
    }
  };

  // ========================================
  // STEP 2: Request Notification Permission
  // ========================================
  const requestNotifPermission = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Izin Notifikasi Diperlukan',
        'Untuk membaca notifikasi E-Wallet, Anda perlu mengaktifkan "Notification Access" untuk aplikasi QRISGate di Pengaturan Android.\n\nTanpa izin ini, aplikasi tidak bisa mendeteksi pembayaran masuk.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Buka Pengaturan',
            onPress: () => {
              if (NotificationListener) {
                  NotificationListener.requestPermission();
              } else {
                  Linking.openSettings();
              }
              setTimeout(checkPermission, 3000);
              addLog('⏳ Menunggu izin Notification Access...');
            },
          },
        ]
      );
    } else {
      setPermissionGranted(true);
      addLog('✅ Izin notifikasi aktif');
    }
  };

  // ========================================
  // STEP 3: Toggle E-Wallet
  // ========================================
  const toggleWallet = (id) => {
    setActiveWallets((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      const wallet = EWALLET_PRESETS.find((w) => w.id === id);
      if (newState[id]) {
        addLog(`✅ ${wallet.name} AKTIF — Mendengarkan notifikasi dari ${wallet.packageId}`);
      } else {
        addLog(`⏸️ ${wallet.name} NONAKTIF`);
        setTestResults((prev) => ({ ...prev, [id]: null }));
      }
      return newState;
    });
  };

  // ========================================
  // STEP 4: TEST — Simulasi baca notifikasi
  // Langsung test TANPA perlu nunggu notif asli
  // ========================================
  const testWallet = async (wallet) => {
    if (!isConnected) {
      Alert.alert('Belum Terhubung', 'Hubungkan ke server dulu dengan memasukkan API Key.');
      return;
    }

    setTestResults((prev) => ({ ...prev, [wallet.id]: 'testing' }));
    addLog(`🧪 TEST ${wallet.name}: Mengirim notifikasi simulasi...`);
    Vibration.vibrate(150);

    // Step 4a: Extract nominal from test notification
    const match = wallet.testNotif.match(wallet.regex);
    if (!match) {
      setTestResults((prev) => ({ ...prev, [wallet.id]: 'fail' }));
      addLog(`❌ TEST ${wallet.name}: Gagal membaca nominal dari notifikasi`);
      return;
    }

    const nominal = parseInt(match[1].replace(/[.,]/g, ''));
    addLog(`📩 TEST ${wallet.name}: Notifikasi terdeteksi — "${wallet.testNotif}"`);
    addLog(`💰 TEST ${wallet.name}: Nominal terbaca = Rp ${formatRupiah(nominal)}`);

    // Step 4b: TTS
    if (voiceEnabled) {
      Speech.speak(`Pembayaran masuk dari ${wallet.name} sebesar ${formatRupiah(nominal)} rupiah`, {
        language: 'id-ID',
        rate: 0.9,
        pitch: 1.0,
      });
    }

    // Step 4c: Kirim ke webhook (sama persis seperti notif asli)
    try {
      const res = await fetch(`${BASE_URL}/api/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          source: wallet.name,
          nominal: nominal,
          raw_text: wallet.testNotif,
          package: wallet.packageId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setTestResults((prev) => ({ ...prev, [wallet.id]: 'success' }));
        addLog(`✅ TEST ${wallet.name}: Webhook BERHASIL — ${result.message}`);
        addLog(`🎉 TEST ${wallet.name}: Cek web dashboard, transaksi baru seharusnya muncul!`);
      } else {
        setTestResults((prev) => ({ ...prev, [wallet.id]: 'fail' }));
        addLog(`❌ TEST ${wallet.name}: Webhook GAGAL — ${result.message || result.error}`);
      }
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [wallet.id]: 'fail' }));
      addLog(`❌ TEST ${wallet.name}: Koneksi webhook gagal — ${e.message}`);
    }
  };

  // ========================================
  // RENDER
  // ========================================
  const activeCount = Object.values(activeWallets).filter(Boolean).length;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎧 Auto-Sync</Text>
        <Text style={styles.subtitle}>Deteksi notifikasi E-Wallet otomatis</Text>
      </View>

      {/* ========== STEP 1: API KEY CONNECTION ========== */}
      <View style={styles.stepCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP 1</Text>
        </View>
        <Text style={styles.cardTitle}>Hubungkan ke Dashboard</Text>
        <Text style={styles.cardDesc}>Masukkan API Key dari halaman "Integrasi & Setup" di web dashboard Anda.</Text>

        <View style={styles.apiKeyRow}>
          <TextInput
            style={styles.apiKeyInput}
            placeholder="qris_xxxxxxxxxxxx"
            placeholderTextColor={COLORS.text4}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            secureTextEntry={!showApiKey}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowApiKey(!showApiKey)}>
            <Text>{showApiKey ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.connectBtn, isConnected && styles.connectedBtn]}
          onPress={connectToServer}
        >
          <Text style={styles.connectBtnText}>
            {isConnected ? '✅ Terhubung' : '🔗 Hubungkan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========== STEP 2: PERMISSION ========== */}
      <View style={styles.stepCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP 2</Text>
        </View>
        <Text style={styles.cardTitle}>Izin Baca Notifikasi</Text>
        <Text style={styles.cardDesc}>Agar bisa membaca notifikasi dari GoPay, DANA, dll, aplikasi butuh izin "Notification Access".</Text>

        <TouchableOpacity
          style={[styles.permBtn, permissionGranted && styles.permGrantedBtn]}
          onPress={requestNotifPermission}
        >
          <Text style={[styles.permBtnText, permissionGranted && { color: COLORS.success }]}>
            {permissionGranted ? '✅ Izin Diberikan' : '🔓 Berikan Izin'}
          </Text>
        </TouchableOpacity>

        {/* TTS Toggle */}
        <View style={styles.ttsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ttsLabel}>🔊 Suara Robot (TTS)</Text>
            <Text style={styles.ttsDesc}>Bacakan "Pembayaran masuk Rp xxx" saat terdeteksi</Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ true: '#F59E0B', false: COLORS.border }}
            thumbColor="white"
          />
        </View>
      </View>

      {/* ========== STEP 3: SELECT E-WALLETS ========== */}
      <View style={styles.stepCard}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>STEP 3</Text>
        </View>
        <Text style={styles.cardTitle}>Pilih E-Wallet</Text>
        <Text style={styles.cardDesc}>
          Toggle ON untuk mendeteksi notifikasi dari aplikasi tersebut. {activeCount > 0 ? `${activeCount} aktif.` : 'Belum ada yang aktif.'}
        </Text>

        {EWALLET_PRESETS.map((wallet) => {
          const isActive = !!activeWallets[wallet.id];
          const testStatus = testResults[wallet.id];

          return (
            <View key={wallet.id} style={[styles.walletCard, isActive && { borderColor: wallet.color, borderWidth: 2 }]}>
              {/* Wallet Info + Toggle */}
              <View style={styles.walletTop}>
                <View style={[styles.walletIcon, { backgroundColor: wallet.bgColor }]}>
                  <Text style={{ fontSize: 22 }}>{wallet.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletPkg}>{wallet.description}</Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={() => toggleWallet(wallet.id)}
                  trackColor={{ true: wallet.color, false: COLORS.border }}
                  thumbColor="white"
                />
              </View>

              {/* Test Button (only when active) */}
              {isActive && (
                <View style={styles.testSection}>
                  <TouchableOpacity
                    style={[
                      styles.testBtn,
                      testStatus === 'success' && styles.testBtnSuccess,
                      testStatus === 'fail' && styles.testBtnFail,
                      testStatus === 'testing' && styles.testBtnTesting,
                    ]}
                    onPress={() => testWallet(wallet)}
                    disabled={testStatus === 'testing'}
                  >
                    <Text
                      style={[
                        styles.testBtnText,
                        testStatus === 'success' && { color: COLORS.success },
                        testStatus === 'fail' && { color: COLORS.danger },
                      ]}
                    >
                      {testStatus === 'testing'
                        ? '⏳ Menguji...'
                        : testStatus === 'success'
                        ? '✅ Test Berhasil!'
                        : testStatus === 'fail'
                        ? '❌ Test Gagal — Coba Lagi'
                        : `🧪 Test Baca Notifikasi ${wallet.name}`}
                    </Text>
                  </TouchableOpacity>

                  {testStatus === 'success' && (
                    <Text style={styles.testHint}>Notifikasi terbaca & terkirim ke web dashboard ✓</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ========== ACTIVITY LOG ========== */}
      <View style={styles.logSection}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>📋 Log Aktivitas</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text style={styles.logClear}>Bersihkan</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.logBox}>
          {logs.length === 0 ? (
            <Text style={styles.logEmpty}>Belum ada aktivitas.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logTime}>{log.time}</Text>
                <Text style={styles.logMsg}>{log.msg}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: { marginTop: 60, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.text3 },

  // Step Card
  stepCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 22, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  stepBadge: { backgroundColor: COLORS.primary, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 12 },
  stepBadgeText: { color: 'white', fontSize: 10, fontWeight: FONTS.bold, letterSpacing: 1 },
  cardTitle: { fontSize: 17, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: COLORS.text3, lineHeight: 20, marginBottom: 18 },

  // API Key
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  apiKeyInput: { flex: 1, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontWeight: FONTS.medium, color: COLORS.text, backgroundColor: COLORS.bg },
  eyeBtn: { width: 44, height: 44, borderRadius: RADIUS.input, backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  connectBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: RADIUS.button, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  connectedBtn: { backgroundColor: COLORS.success },
  connectBtnText: { color: 'white', fontSize: 15, fontWeight: FONTS.bold },

  // Permission
  permBtn: { backgroundColor: COLORS.bg, paddingVertical: 14, borderRadius: RADIUS.button, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 14 },
  permGrantedBtn: { borderColor: COLORS.success, backgroundColor: COLORS.successBg },
  permBtnText: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.text },

  // TTS
  ttsRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.border },
  ttsLabel: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.text },
  ttsDesc: { fontSize: 11, color: COLORS.text3, marginTop: 2 },

  // Wallet Cards
  walletCard: { backgroundColor: COLORS.bg, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1.5, borderColor: COLORS.border },
  walletTop: { flexDirection: 'row', alignItems: 'center' },
  walletIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  walletName: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.text },
  walletPkg: { fontSize: 12, color: COLORS.text3, marginTop: 1 },

  // Test
  testSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  testBtn: { paddingVertical: 13, borderRadius: RADIUS.button, alignItems: 'center', backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  testBtnSuccess: { backgroundColor: COLORS.successBg, borderColor: '#BBF7D0' },
  testBtnFail: { backgroundColor: COLORS.dangerBg, borderColor: '#FECACA' },
  testBtnTesting: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', opacity: 0.7 },
  testBtnText: { fontSize: 14, fontWeight: FONTS.bold, color: '#92400E' },
  testHint: { fontSize: 11, color: COLORS.success, textAlign: 'center', marginTop: 8, fontWeight: FONTS.semibold },

  // Log
  logSection: { marginTop: 8 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logTitle: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.text },
  logClear: { fontSize: 12, fontWeight: FONTS.semibold, color: COLORS.danger },
  logBox: { backgroundColor: '#0F172A', borderRadius: RADIUS.card, padding: 16, minHeight: 120 },
  logEmpty: { color: '#475569', fontSize: 13, fontStyle: 'italic' },
  logRow: { flexDirection: 'row', marginBottom: 8 },
  logTime: { color: '#64748B', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginRight: 8, minWidth: 65 },
  logMsg: { color: '#4ADE80', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1, lineHeight: 16 },
});
