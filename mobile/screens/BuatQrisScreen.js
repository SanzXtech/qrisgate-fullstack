import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, BASE_URL, formatRupiah } from '../config';

export default function BuatQrisScreen({ token, settings }) {
  const [nominal, setNominal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCreate = async () => {
    const amount = parseInt(nominal.replace(/\D/g, ''));
    if (!amount || amount < 100) {
      Alert.alert('Error', 'Masukkan nominal minimal Rp 100');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/qris/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nominal: amount }),
      });
      const data = await res.json();
      if (data.transaction) {
        setResult(data.transaction);
      } else {
        Alert.alert('Gagal', data.error || 'Tidak bisa membuat QRIS');
      }
    } catch (e) {
      Alert.alert('Error', 'Koneksi ke server gagal');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Buat QRIS Baru</Text>
        <Text style={styles.subtitle}>Masukkan nominal pelanggan, scan QR lalu bayar</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nominal Pembayaran</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.prefix}>Rp</Text>
          <TextInput
            style={styles.input}
            placeholder="50000"
            placeholderTextColor={COLORS.text4}
            keyboardType="numeric"
            value={nominal}
            onChangeText={setNominal}
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickRow}>
          {[10000, 25000, 50000, 100000].map((amt) => (
            <TouchableOpacity key={amt} style={styles.quickBtn} onPress={() => setNominal(String(amt))}>
              <Text style={styles.quickBtnText}>{formatRupiah(amt)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createBtnText}>⚡ Generate QRIS</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Result Card */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>QRIS Berhasil Dibuat!</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>ID Transaksi</Text>
            <Text style={styles.resultValue}>{result.id}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Nominal</Text>
            <Text style={styles.resultValue}>Rp {formatRupiah(result.nominal)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Kode Unik</Text>
            <Text style={[styles.resultValue, { color: COLORS.primary }]}>+{result.unique}</Text>
          </View>
          <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.resultLabel}>Total Bayar</Text>
            <Text style={[styles.resultValue, { color: COLORS.success, fontSize: 18 }]}>
              Rp {formatRupiah(result.total)}
            </Text>
          </View>

          <View style={styles.statusBar}>
            <View style={styles.pendingDot} />
            <Text style={styles.pendingText}>Menunggu pembayaran...</Text>
          </View>
        </View>
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  headerSection: { marginTop: 60, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.text3 },

  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: FONTS.semibold, color: COLORS.text2, marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input, paddingHorizontal: 16, marginBottom: 16 },
  prefix: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.text3, marginRight: 8 },
  input: { flex: 1, fontSize: 28, fontWeight: FONTS.bold, color: COLORS.text, paddingVertical: 14 },

  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: '#EFF6FF', paddingVertical: 10, borderRadius: RADIUS.badge, alignItems: 'center' },
  quickBtnText: { fontSize: 12, fontWeight: FONTS.semibold, color: COLORS.primary },

  createBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.button, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  createBtnText: { color: 'white', fontSize: 16, fontWeight: FONTS.bold },

  resultCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  successIcon: { fontSize: 20 },
  successText: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.success },

  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultLabel: { fontSize: 14, color: COLORS.text3 },
  resultValue: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.text },

  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: COLORS.warningBg, padding: 12, borderRadius: RADIUS.badge },
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.warning },
  pendingText: { fontSize: 13, fontWeight: FONTS.semibold, color: COLORS.warning },
});
