import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, RADIUS, BASE_URL } from '../config';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.token) {
        onLogin(data.token);
      } else {
        setError(data.error || 'Email atau password salah');
      }
    } catch (e) {
      setError('Koneksi ke server gagal. Pastikan server aktif.');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <Text style={styles.appName}>QRISGate</Text>
          <Text style={styles.appDesc}>Payment Gateway Dashboard</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Masuk ke Akun</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@sanz.com"
            placeholderTextColor={COLORS.text4}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.text4}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Masuk</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>QRISGate v1.0 • © 2026 SanzCEO</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: FONTS.bold, color: 'white' },
  appName: { fontSize: 28, fontWeight: FONTS.bold, color: COLORS.text },
  appDesc: { fontSize: 14, color: COLORS.text3, marginTop: 4 },

  formCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.card, padding: 28, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  formTitle: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.text, marginBottom: 24, textAlign: 'center' },

  errorBanner: { backgroundColor: COLORS.dangerBg, padding: 12, borderRadius: RADIUS.badge, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: COLORS.danger, fontSize: 13, fontWeight: FONTS.semibold, textAlign: 'center' },

  label: { fontSize: 13, fontWeight: FONTS.semibold, color: COLORS.text2, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: RADIUS.input, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: FONTS.medium, color: COLORS.text, backgroundColor: COLORS.bg, marginBottom: 18 },

  loginBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.button, alignItems: 'center', marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: FONTS.bold },

  footer: { textAlign: 'center', color: COLORS.text4, fontSize: 12, marginTop: 32 },
});
