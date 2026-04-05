import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getUserDetails, updateProfile, changePassword, getDashboard } from '../services/api';

type Section = 'profile' | 'edit' | 'password';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [dashData, setDashData] = useState<any>(null);

  // Edit profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [province, setProvince] = useState('');

  // Change password fields
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const [userRes, dashRes] = await Promise.all([getUserDetails(), getDashboard()]);
      const u = userRes.data?.user;
      setDetails(u);
      setDashData(dashRes.data);
      if (u) {
        setName(u.name || '');
        setPhone(u.phone || '');
        setAddress(u.address || '');
        setCity(u.city || '');
        setZip(u.zip || '');
        setProvince(u.province || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone, address, city, zip, province });
      Alert.alert('Succès', 'Profil mis à jour.');
      fetchDetails();
      setSection('profile');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSaving(true);
    try {
      const res = await changePassword(oldPass, newPass, confirmPass);
      if (res.status === 200) {
        Alert.alert('Succès', 'Mot de passe changé.');
        setOldPass(''); setNewPass(''); setConfirmPass('');
        setSection('profile');
      } else {
        Alert.alert('Erreur', res.message || 'Échec du changement.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec du changement.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dfbe79" />
      </View>
    );
  }

  const d = details || user;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* Profile Info */}
        {section === 'profile' && (
          <>
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{d?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <Text style={styles.name}>{d?.name}</Text>
              <Text style={styles.email}>{d?.email}</Text>
            </View>

            {/* Membership Status */}
            <View style={[styles.infoCard, {
              borderColor: d?.membership_paid && d?.membership_expires_at ? '#2eb56b' : '#dfbe79',
              borderWidth: 1,
            }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: d?.membership_paid && d?.membership_expires_at ? '#2eb56b' : '#dfbe79',
                }}>
                  <Text style={{ color: '#fff', fontSize: 18 }}>🛡</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Adhésion</Text>
                  {d?.membership_paid && d?.membership_expires_at ? (
                    <Text style={{ color: '#2eb56b', fontSize: 13 }}>
                      Active — Expire le {new Date(d.membership_expires_at).toLocaleDateString('fr-CA')}
                    </Text>
                  ) : (
                    <Text style={{ color: '#dfbe79', fontSize: 13 }}>Aucune adhésion active</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <InfoRow label="Nom d'utilisateur" value={d?.username} />
              <InfoRow label="Téléphone" value={d?.phone} />
              <InfoRow label="Adresse" value={d?.address} />
              <InfoRow label="Ville" value={d?.city} />
              <InfoRow label="Code postal" value={d?.zip} />
              <InfoRow label="Province" value={d?.province} />
              <InfoRow label="Pays" value={d?.country} />
            </View>

            {/* Recent Transactions */}
            {dashData?.transactions?.data && dashData.transactions.data.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Transactions récentes</Text>
                {dashData.transactions.data.map((tx: any, i: number) => (
                  <View key={i} style={{ borderBottomWidth: i < dashData.transactions.data.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,.08)', paddingBottom: 12, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: 'rgba(255,255,255,.65)', fontSize: 13 }}>{tx.date || tx.created_at}</Text>
                      <Text style={{ color: tx.type === '+' ? '#2eb56b' : '#FF4E59', fontSize: 15, fontWeight: '700' }}>
                        {tx.type === '+' ? '+' : '-'} $ {parseFloat(tx.amount || 0).toFixed(2)}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,.82)', fontSize: 14 }} numberOfLines={1}>{tx.details || tx.remark || ''}</Text>
                    <Text style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 2 }}>ID: {tx.trnx || tx.id}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setSection('edit')}>
              <Text style={styles.primaryBtnText}>Modifier le profil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSection('password')}>
              <Text style={styles.secondaryBtnText}>Changer le mot de passe</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Edit Profile */}
        {section === 'edit' && (
          <>
            <Text style={styles.sectionTitle}>Modifier le profil</Text>
            <Field label="Nom" value={name} onChangeText={setName} />
            <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Adresse" value={address} onChangeText={setAddress} />
            <Field label="Ville" value={city} onChangeText={setCity} />
            <Field label="Code postal" value={zip} onChangeText={setZip} />
            <Field label="Province" value={province} onChangeText={setProvince} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile} disabled={saving}>
              <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSection('profile')}>
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Change Password */}
        {section === 'password' && (
          <>
            <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
            <Field label="Mot de passe actuel" value={oldPass} onChangeText={setOldPass} secureTextEntry />
            <Field label="Nouveau mot de passe" value={newPass} onChangeText={setNewPass} secureTextEntry />
            <Field label="Confirmer le mot de passe" value={confirmPass} onChangeText={setConfirmPass} secureTextEntry />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword} disabled={saving}>
              <Text style={styles.primaryBtnText}>{saving ? 'Enregistrement...' : 'Changer le mot de passe'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSection('profile')}>
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, secureTextEntry, keyboardType }: {
  label: string; value: string; onChangeText: (t: string) => void;
  secureTextEntry?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="rgba(255,255,255,.35)"
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' },
  card: {
    padding: 32, borderRadius: 20, alignItems: 'center', marginBottom: 16,
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
  infoCard: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)',
  },
  infoLabel: { fontSize: 14, color: 'rgba(255,255,255,.55)', flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  fieldLabel: { fontSize: 14, color: 'rgba(255,255,255,.65)', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16,
    backgroundColor: 'rgba(255,255,255,.06)',
  },
  primaryBtn: {
    borderRadius: 999, paddingVertical: 16, alignItems: 'center',
    backgroundColor: '#dfbe79', marginBottom: 12,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#07162f' },
  secondaryBtn: {
    borderRadius: 999, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#dfbe79', marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: '#dfbe79' },
  logoutBtn: {
    marginTop: 8, borderRadius: 999, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#FF4E59',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#FF4E59' },
});
