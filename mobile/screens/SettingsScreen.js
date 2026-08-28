import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { COLORS, FONTS, RADIUS, Config } from '../config';

export default function SettingsScreen({ token, settings, onLogout, onSettingsChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    storeName: settings?.storeName || '',
    email: settings?.email || '',
    phone: settings?.phone || '',
  });

  const handleSave = async () => {
    try {
      await fetch(`${Config.BASE_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      onSettingsChange && onSettingsChange({ ...settings, ...editForm });
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (e) {
      Alert.alert('Error', 'Gagal menyimpan perubahan');
    }
  };

  const toggleSandbox = async () => {
    try {
      const newMode = !settings?.sandboxMode;
      await fetch(`${Config.BASE_URL}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sandboxMode: newMode }),
      });
      onSettingsChange && onSettingsChange({ ...settings, sandboxMode: newMode });
      Alert.alert(
        newMode ? 'Sandbox Aktif' : 'Production Aktif',
        newMode ? 'Data dummy untuk testing' : 'Data real-time aktif'
      );
    } catch (e) {
      Alert.alert('Error', 'Gagal mengubah mode');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Pengaturan</Text>
        <Text style={styles.subtitle}>Profil toko dan akun Anda</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileBanner} />
        <View style={styles.profileBody}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{(settings?.storeName || 'T')[0]}</Text>
          </View>
          <Text style={styles.profileName}>{settings?.storeName || 'Toko'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>User</Text>
          </View>
          <Text style={styles.profileHandle}>@SanzCEO</Text>
        </View>
      </View>

      {/* Settings Rows */}
      <View style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>⚙️ Pengaturan Akun</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.editBtn, { borderColor: COLORS.danger }]} onPress={() => setIsEditing(false)}>
                <Text style={[styles.editBtnText, { color: COLORS.danger }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editBtn, { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]} onPress={handleSave}>
                <Text style={[styles.editBtnText, { color: 'white' }]}>Simpan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <SettingRow label="Username" value="SanzCEO" />
        <SettingRow
          label="Nama Toko"
          value={editForm.storeName}
          editable={isEditing}
          onChangeText={(t) => setEditForm({ ...editForm, storeName: t })}
        />
        <SettingRow
          label="Email"
          value={editForm.email}
          editable={isEditing}
          onChangeText={(t) => setEditForm({ ...editForm, email: t })}
        />
        <SettingRow
          label="No. Handphone"
          value={editForm.phone}
          editable={isEditing}
          onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
          last
        />
      </View>

      {/* Sandbox Toggle */}
      <View style={styles.toggleCard}>
        <View>
          <Text style={styles.toggleLabel}>Mode Sandbox</Text>
          <Text style={styles.toggleDesc}>Gunakan data dummy untuk testing</Text>
        </View>
        <Switch
          value={settings?.sandboxMode || false}
          onValueChange={toggleSandbox}
          trackColor={{ true: COLORS.warning, false: COLORS.border }}
          thumbColor="white"
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>🚪 Keluar Akun</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function SettingRow({ label, value, editable, onChangeText, last }) {
  return (
    <View style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
      <Text style={styles.settingLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.settingInput}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={COLORS.text4}
        />
      ) : (
        <Text style={styles.settingValue}>{value || '-'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  headerSection: { marginTop: 60, marginBottom: 24 },
  title: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.text3 },

  profileCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, overflow: 'hidden', marginBottom: 20, elevation: 2 },
  profileBanner: { height: 80, backgroundColor: COLORS.primary },
  profileBody: { alignItems: 'center', marginTop: -32, paddingBottom: 20 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', borderWidth: 3, borderColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatarLargeText: { fontSize: 28, fontWeight: FONTS.bold, color: COLORS.primary },
  profileName: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.text, marginTop: 10 },
  roleBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 2, borderRadius: RADIUS.badge, marginTop: 6 },
  roleBadgeText: { fontSize: 11, fontWeight: FONTS.semibold, color: '#4338CA' },
  profileHandle: { fontSize: 13, color: COLORS.text3, marginTop: 4 },

  settingsCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 20, marginBottom: 16, elevation: 2 },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  settingsTitle: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.text },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  editBtnText: { fontSize: 12, fontWeight: FONTS.semibold, color: COLORS.text },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  settingLabel: { fontSize: 14, color: COLORS.text3 },
  settingValue: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.text },
  settingInput: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, minWidth: 160, textAlign: 'right', backgroundColor: COLORS.bg },

  toggleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 20, marginBottom: 16, elevation: 2 },
  toggleLabel: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.text },
  toggleDesc: { fontSize: 12, color: COLORS.text3, marginTop: 2 },

  logoutBtn: { backgroundColor: COLORS.dangerBg, paddingVertical: 16, borderRadius: RADIUS.button, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutBtnText: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.danger },
});
