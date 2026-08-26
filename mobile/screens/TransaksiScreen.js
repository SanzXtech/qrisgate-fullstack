import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Modal, Alert } from 'react-native';
import { COLORS, FONTS, RADIUS, BASE_URL, formatRupiah } from '../config';

export default function TransaksiScreen({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelId, setCancelId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/cancel-trx?id=${cancelId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Berhasil', 'Transaksi berhasil dihapus');
        fetchData();
      } else {
        Alert.alert('Gagal', data.error || 'Gagal membatalkan');
      }
    } catch (e) {
      Alert.alert('Error', 'Koneksi ke server gagal');
    }
    setCancelId(null);
  };

  const getStatusStyle = (status) => {
    if (status === 'success') return { bg: COLORS.successBg, color: COLORS.success, label: 'LUNAS' };
    if (status === 'pending') return { bg: COLORS.warningBg, color: COLORS.warning, label: 'PENDING' };
    return { bg: COLORS.dangerBg, color: COLORS.danger, label: 'GAGAL' };
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Riwayat Transaksi</Text>
          <Text style={styles.subtitle}>{transactions.length} transaksi tercatat</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
            <Text style={styles.summaryLabel}>Berhasil</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              {transactions.filter((t) => t.status === 'success').length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.warning }]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
              {transactions.filter((t) => t.status === 'pending').length}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
            <Text style={styles.summaryLabel}>Gagal</Text>
            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
              {transactions.filter((t) => t.status === 'failed').length}
            </Text>
          </View>
        </View>

        {/* Transaction List */}
        {transactions.map((trx) => {
          const s = getStatusStyle(trx.status);
          return (
            <View key={trx.id} style={styles.trxCard}>
              <View style={styles.trxTop}>
                <View style={styles.trxInfo}>
                  <Text style={styles.trxId}>{trx.id}</Text>
                  <Text style={styles.trxTime}>{trx.time}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>

              <View style={styles.trxBottom}>
                <View style={styles.trxDetail}>
                  <Text style={styles.detailLabel}>Nominal</Text>
                  <Text style={styles.detailValue}>Rp {formatRupiah(trx.nominal)}</Text>
                </View>
                <View style={styles.trxDetail}>
                  <Text style={styles.detailLabel}>Kode Unik</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primary }]}>+{trx.unique}</Text>
                </View>
                <View style={styles.trxDetail}>
                  <Text style={styles.detailLabel}>Total</Text>
                  <Text style={[styles.detailValue, { fontWeight: FONTS.bold }]}>Rp {formatRupiah(trx.total)}</Text>
                </View>
              </View>

              {trx.status === 'pending' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCancelId(trx.id)}>
                  <Text style={styles.cancelBtnText}>Batalkan Transaksi</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal visible={!!cancelId} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Text style={{ fontSize: 32 }}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Batalkan Transaksi?</Text>
            <Text style={styles.modalDesc}>
              Anda yakin ingin membatalkan transaksi <Text style={{ fontWeight: FONTS.bold }}>{cancelId}</Text>?
              Tindakan ini tidak dapat dikembalikan.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCancelId(null)}>
                <Text style={styles.modalBtnSecondaryText}>Kembali</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnDanger} onPress={handleCancel}>
                <Text style={styles.modalBtnDangerText}>Ya, Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerSection: { marginTop: 60, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.text3 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderLeftWidth: 3, elevation: 1 },
  summaryLabel: { fontSize: 11, fontWeight: FONTS.semibold, color: COLORS.text3, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: FONTS.bold },

  trxCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 18, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  trxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  trxInfo: {},
  trxId: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 2 },
  trxTime: { fontSize: 12, color: COLORS.text3 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.badge },
  badgeText: { fontSize: 11, fontWeight: FONTS.bold },

  trxBottom: { flexDirection: 'row', gap: 12 },
  trxDetail: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, padding: 10 },
  detailLabel: { fontSize: 10, fontWeight: FONTS.semibold, color: COLORS.text3, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: FONTS.semibold, color: COLORS.text },

  cancelBtn: { marginTop: 14, backgroundColor: COLORS.dangerBg, paddingVertical: 12, borderRadius: RADIUS.button, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  cancelBtnText: { color: COLORS.danger, fontWeight: FONTS.bold, fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 32, width: '100%', maxWidth: 360, alignItems: 'center' },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.dangerBg, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 12 },
  modalDesc: { fontSize: 14, color: COLORS.text2, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalBtnSecondaryText: { fontWeight: FONTS.bold, color: COLORS.text, fontSize: 14 },
  modalBtnDanger: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.danger, alignItems: 'center', shadowColor: COLORS.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  modalBtnDangerText: { fontWeight: FONTS.bold, color: 'white', fontSize: 14 },
});
