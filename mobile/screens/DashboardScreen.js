import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, BASE_URL, formatRupiah } from '../config';

export default function DashboardScreen({ token, settings, onNavigate }) {
  const [stats, setStats] = useState({ income: 0, success: 0, pending: 0, failed: 0 });
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data.stats || {});
      setTransactions(data.transactions || []);
    } catch (e) {
      console.log('Fetch error:', e.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const income30D = transactions
    .filter((t) => t.status === 'success' && new Date(t.created_at) > new Date(Date.now() - 30 * 86400000))
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  const incomeToday = transactions
    .filter((t) => t.status === 'success' && new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + Number(t.nominal || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Selamat datang 👋</Text>
          <Text style={styles.storeName}>{settings?.storeName || 'Toko Saya'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(settings?.storeName || 'T')[0]}</Text>
        </View>
      </View>

      {/* Blue Card - Total Pemasukan */}
      <View style={styles.blueCard}>
        <View style={styles.blueCircle} />
        <View style={{ zIndex: 1 }}>
          <Text style={styles.blueLabel}>TOTAL PEMASUKAN</Text>
          <Text style={styles.blueAmount}>Rp {formatRupiah(stats.income)}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.liveText}>Pemasukan tercatat - real-time</Text>
          </View>
        </View>

        {/* Mini Stats Row */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Text style={styles.miniLabel}>INCOME 30D</Text>
            <Text style={styles.miniValue}>Rp {formatRupiah(income30D)}</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniLabel}>TRX BERHASIL</Text>
            <Text style={styles.miniValue}>{stats.success} Trx</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={styles.miniLabel}>HARI INI</Text>
            <Text style={styles.miniValue}>Rp {formatRupiah(incomeToday)}</Text>
          </View>
        </View>
      </View>

      {/* Stat Cards Row */}
      <View style={styles.statRow}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Text>📊</Text>
          </View>
          <Text style={styles.statLabel}>Total Trx</Text>
          <Text style={styles.statValue}>{stats.success + stats.pending + (stats.failed || 0)}</Text>
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.statCard, { flex: 1 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.successBg }]}>
            <Text>✅</Text>
          </View>
          <Text style={styles.statLabel}>Berhasil</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.success}</Text>
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.statCard, { flex: 1 }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.warningBg }]}>
            <Text>⏳</Text>
          </View>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{stats.pending}</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          <TouchableOpacity onPress={() => onNavigate && onNavigate('Transaksi')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Belum ada riwayat transaksi.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {transactions.slice(0, 5).map((trx, i) => (
              <View
                key={trx.id}
                style={[styles.trxRow, i < Math.min(transactions.length, 5) - 1 && styles.trxBorder]}
              >
                <View style={styles.trxLeft}>
                  <View
                    style={[
                      styles.trxIcon,
                      {
                        backgroundColor:
                          trx.status === 'success' ? COLORS.successBg : trx.status === 'pending' ? COLORS.warningBg : COLORS.dangerBg,
                      },
                    ]}
                  >
                    <Text>{trx.status === 'success' ? '✅' : trx.status === 'pending' ? '⏳' : '❌'}</Text>
                  </View>
                  <View>
                    <Text style={styles.trxId}>{trx.id}</Text>
                    <Text style={styles.trxTime}>
                      {new Date(trx.created_at || Date.now()).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.trxAmount}>Rp {formatRupiah(trx.total)}</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor:
                          trx.status === 'success' ? COLORS.successBg : trx.status === 'pending' ? COLORS.warningBg : COLORS.dangerBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            trx.status === 'success' ? COLORS.success : trx.status === 'pending' ? COLORS.warning : COLORS.danger,
                        },
                      ]}
                    >
                      {trx.status === 'success' ? 'LUNAS' : trx.status === 'pending' ? 'PENDING' : 'GAGAL'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60, marginBottom: 24 },
  greeting: { fontSize: 14, color: COLORS.text3, fontWeight: FONTS.medium },
  storeName: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.text, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontWeight: FONTS.bold, fontSize: 18 },

  blueCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.card, padding: 28, marginBottom: 16, position: 'relative', overflow: 'hidden' },
  blueCircle: { position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  blueLabel: { fontSize: 12, fontWeight: FONTS.bold, letterSpacing: 1.5, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  blueAmount: { fontSize: 34, fontWeight: FONTS.bold, color: 'white', marginBottom: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, alignSelf: 'flex-start', gap: 6, marginBottom: 24 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#86EFAC' },
  liveText: { fontSize: 11, fontWeight: FONTS.semibold, color: 'white' },
  miniStatsRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  miniStat: { flex: 1 },
  miniLabel: { fontSize: 10, fontWeight: FONTS.bold, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 4 },
  miniValue: { fontSize: 15, fontWeight: FONTS.bold, color: 'white' },

  statRow: { flexDirection: 'row', marginBottom: 24 },
  statCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { fontSize: 11, fontWeight: FONTS.semibold, color: COLORS.text3, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.text },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.text },
  seeAll: { fontSize: 12, fontWeight: FONTS.semibold, color: COLORS.primaryLight },

  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 32, alignItems: 'center', elevation: 1 },
  emptyText: { color: COLORS.text3, fontSize: 14 },

  trxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  trxBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  trxLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trxIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  trxId: { fontSize: 13, fontWeight: FONTS.semibold, color: COLORS.text, marginBottom: 2 },
  trxTime: { fontSize: 11, color: COLORS.text3 },
  trxAmount: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.badge },
  badgeText: { fontSize: 10, fontWeight: FONTS.semibold },
});
