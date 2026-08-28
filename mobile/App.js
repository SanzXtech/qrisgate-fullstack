import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View, AppState, Platform, Alert } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import BuatQrisScreen from './screens/BuatQrisScreen';
import TransaksiScreen from './screens/TransaksiScreen';
import ListenerScreen from './screens/ListenerScreen';
import SettingsScreen from './screens/SettingsScreen';
import { COLORS, FONTS, Config } from './config';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '📊',
  'Buat QRIS': '⚡',
  Listener: '🎧',
  Transaksi: '📋',
  Pengaturan: '⚙️',
};

export default function App() {
  const [token, setToken] = useState(null);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastTrxCount, setLastTrxCount] = useState(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadToken();

    // Listen for app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground — refresh data
        if (token) fetchSettings(token);
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, []);

  // Poll for new transactions (push notification simulation)
  useEffect(() => {
    if (!token) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${Config.BASE_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const currentCount = data.stats?.success || 0;

        if (lastTrxCount > 0 && currentCount > lastTrxCount) {
          // New transaction detected!
          Alert.alert(
            '💰 Pembayaran Masuk!',
            `${currentCount - lastTrxCount} transaksi baru berhasil!\nTotal: Rp ${Number(data.stats.income).toLocaleString('id-ID')}`
          );
        }
        setLastTrxCount(currentCount);
      } catch (e) {
        // Silent
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [token, lastTrxCount]);

  const loadToken = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('qris_token');
      const savedUrl = await AsyncStorage.getItem("custom_server_url");
      if (savedUrl) Config.BASE_URL = savedUrl;
      if (savedToken) {
        setToken(savedToken);
        fetchSettings(savedToken);
      }
    } catch (e) {
      console.log('Load token error:', e);
    }
    setIsLoading(false);
  };

  const fetchSettings = async (t) => {
    try {
      const res = await fetch(`${Config.BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        if (data.stats) {
          setLastTrxCount(data.stats.success || 0);
        }
      }
    } catch (e) {
      console.log('Settings fetch error:', e);
    }
  };

  const handleLogin = async (newToken) => {
    setToken(newToken);
    await AsyncStorage.setItem('qris_token', newToken);
    fetchSettings(newToken);
  };

  const handleLogout = async () => {
    setToken(null);
    setSettings({});
    setLastTrxCount(0);
    await AsyncStorage.removeItem('qris_token');
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
          <Text style={{ fontSize: 32, fontWeight: FONTS.bold, color: 'white' }}>Q</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: FONTS.bold, color: COLORS.primary }}>QRISGate</Text>
        <Text style={{ color: COLORS.text3, marginTop: 8 }}>Memuat...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.45 }}>
                {TAB_ICONS[route.name]}
              </Text>
            ),
            tabBarLabel: ({ focused }) => (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: focused ? FONTS.bold : FONTS.medium,
                  color: focused ? COLORS.primary : COLORS.text3,
                  marginBottom: Platform.OS === 'ios' ? 0 : 6,
                }}
              >
                {route.name}
              </Text>
            ),
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
              height: Platform.OS === 'ios' ? 88 : 68,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 28 : 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
          })}
        >
          <Tab.Screen name="Dashboard">
            {() => <DashboardScreen token={token} settings={settings} />}
          </Tab.Screen>
          <Tab.Screen name="Buat QRIS">
            {() => <BuatQrisScreen token={token} settings={settings} />}
          </Tab.Screen>
          <Tab.Screen name="Listener">
            {() => <ListenerScreen token={token} settings={settings} />}
          </Tab.Screen>
          <Tab.Screen name="Transaksi">
            {() => <TransaksiScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Pengaturan">
            {() => (
              <SettingsScreen
                token={token}
                settings={settings}
                onLogout={handleLogout}
                onSettingsChange={setSettings}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
