// QRISGate Mobile - Design Tokens & API Config
export const COLORS = {
  primary: '#1D4ED8',
  primaryDark: '#1E40AF',
  primaryLight: '#3B82F6',
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  text2: '#334155',
  text3: '#64748B',
  text4: '#94A3B8',
};

export const FONTS = {
  bold: '800',
  semibold: '700',
  medium: '600',
  regular: '400',
};

export const RADIUS = {
  card: 20,
  button: 14,
  input: 12,
  badge: 10,
  full: 999,
};

export const BASE_URL = 'https://synopsis-dentists-gnome-unlikely.trycloudflare.com';

export const formatRupiah = (num) => {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString('id-ID');
};
