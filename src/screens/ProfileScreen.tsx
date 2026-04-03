import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f', padding: 16, justifyContent: 'center' },
  card: {
    padding: 32, borderRadius: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#dfbe79',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#07162f' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,.65)' },
  logoutBtn: {
    marginTop: 24, borderRadius: 999, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FF4E59',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#FF4E59' },
});
