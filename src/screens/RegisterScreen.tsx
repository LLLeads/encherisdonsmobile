import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal, FlatList,
} from 'react-native';
import { register, getPage } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('Canada');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [provincePickerVisible, setProvincePickerVisible] = useState(false);

  const caProvinces = [
    { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' }, { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'Prince Edward Island' }, { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' },
  ];
  const usStates = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' }, { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  ];
  const regionList = country === 'United States' ? usStates : caProvinces;
  const regionLabel = country === 'United States' ? 'État' : 'Province';
  const selectedRegionName = regionList.find(r => r.code === province)?.name || '';
  const [termsVisible, setTermsVisible] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [termsLoading, setTermsLoading] = useState(false);

  const openTerms = async () => {
    setTermsVisible(true);
    setTermsLoading(true);
    try {
      const res = await getPage('terms-conditions');
      const content = res.data?.details || res.data?.description || '';
      setTermsContent(content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim());
    } catch (e) {
      setTermsContent('Impossible de charger les termes et conditions.');
    } finally {
      setTermsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !confirmPassword || !phone || !address || !city || !province || !zip) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        username,
        email,
        password,
        password_confirmation: confirmPassword,
        phone,
        address,
        city,
        province,
        zip,
        country,
        preferred_language: 'fr',
      });
      Alert.alert('Succès', 'Inscription réussie ! Veuillez vérifier votre courriel.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>EncherisDons</Text>
        <Text style={styles.subtitle}>Créez votre nouveau compte</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nom complet</Text>
          <TextInput style={styles.input} placeholder="Votre nom" placeholderTextColor="#6b788e" value={name} onChangeText={setName} />

          <Text style={styles.label}>Nom d'utilisateur</Text>
          <TextInput style={styles.input} placeholder="Votre nom d'utilisateur" placeholderTextColor="#6b788e" value={username} onChangeText={setUsername} autoCapitalize="none" />

          <Text style={styles.label}>Courriel</Text>
          <TextInput style={styles.input} placeholder="Votre courriel" placeholderTextColor="#6b788e" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} placeholder="Minimum 8 caractères" placeholderTextColor="#6b788e" value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput style={styles.input} placeholder="Confirmer le mot de passe" placeholderTextColor="#6b788e" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="(514) 555-1234"
            placeholderTextColor="#6b788e"
            value={phone}
            onChangeText={(t) => {
              const digits = t.replace(/\D/g, '').substring(0, 10);
              if (digits.length >= 7) setPhone('(' + digits.substring(0,3) + ') ' + digits.substring(3,6) + '-' + digits.substring(6));
              else if (digits.length >= 4) setPhone('(' + digits.substring(0,3) + ') ' + digits.substring(3));
              else if (digits.length > 0) setPhone('(' + digits);
              else setPhone('');
            }}
            keyboardType="phone-pad"
            maxLength={14}
          />

          <Text style={styles.label}>Adresse</Text>
          <TextInput style={styles.input} placeholder="Votre adresse" placeholderTextColor="#6b788e" value={address} onChangeText={setAddress} />

          <Text style={styles.label}>Pays</Text>
          <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}>
            <TouchableOpacity
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14 }}
              onPress={() => setCountry(country === 'Canada' ? 'United States' : 'Canada')}
            >
              <Text style={{ color: '#091e42', fontSize: 16 }}>{country}</Text>
              <Text style={{ color: '#6b788e', fontSize: 12 }}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Ville</Text>
              <TextInput style={styles.input} placeholder="Ville" placeholderTextColor="#6b788e" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{regionLabel}</Text>
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setProvincePickerVisible(true)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: province ? '#091e42' : '#6b788e', fontSize: 16 }}>
                    {selectedRegionName || '-- Sélectionner --'}
                  </Text>
                  <Text style={{ color: '#6b788e', fontSize: 12 }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            placeholder={country === 'United States' ? '12345' : 'H2X 1Y4'}
            placeholderTextColor="#6b788e"
            value={zip}
            onChangeText={(t) => {
              if (country === 'United States') {
                setZip(t.replace(/\D/g, '').substring(0, 5));
              } else {
                const clean = t.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
                setZip(clean.length > 3 ? clean.substring(0, 3) + ' ' + clean.substring(3) : clean);
              }
            }}
            autoCapitalize="characters"
            maxLength={country === 'United States' ? 5 : 7}
          />

          <View style={styles.termsRow}>
            <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              J'accepte tous les{' '}
              <Text style={styles.termsLink} onPress={openTerms}>
                Termes et conditions
              </Text>
            </Text>
          </View>

          <TouchableOpacity style={[styles.button, !termsAccepted && styles.buttonDisabled]} onPress={handleRegister} disabled={loading || !termsAccepted}>
            {loading ? <ActivityIndicator color="#07162f" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Déjà un compte ? <Text style={styles.linkBold}>Connexion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Province Picker Modal */}
      <Modal visible={provincePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{regionLabel}</Text>
              <TouchableOpacity onPress={() => setProvincePickerVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={regionList}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, province === item.code && styles.pickerItemActive]}
                  onPress={() => { setProvince(item.code); setProvincePickerVisible(false); }}
                >
                  <Text style={[styles.pickerItemText, province === item.code && styles.pickerItemTextActive]}>
                    {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal visible={termsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Termes et conditions</Text>
              <TouchableOpacity onPress={() => setTermsVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {termsLoading ? (
                <ActivityIndicator size="large" color="#dfbe79" style={{ marginTop: 40 }} />
              ) : (
                <Text style={styles.modalText}>{termsContent}</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setTermsVisible(false)}>
              <Text style={styles.modalBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#f4dfae', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,.82)', textAlign: 'center', marginBottom: 32 },
  form: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#091e42', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#ced2d9', borderRadius: 12, padding: 14,
    fontSize: 16, color: '#091e42', backgroundColor: '#fff',
  },
  button: {
    marginTop: 24, borderRadius: 999, paddingVertical: 16,
    alignItems: 'center', backgroundColor: '#dfbe79',
  },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#07162f' },
  link: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#091e42' },
  linkBold: { fontWeight: '700', color: '#dfbe79' },
  required: { color: '#FF4E59', fontWeight: '700' as const },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#ced2d9',
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  checkboxChecked: { backgroundColor: '#dfbe79', borderColor: '#dfbe79' },
  checkmark: { color: '#07162f', fontSize: 14, fontWeight: '700' as const },
  termsText: { fontSize: 14, color: '#091e42', flex: 1 },
  termsLink: { color: '#dfbe79', textDecorationLine: 'underline' as const },
  buttonDisabled: { opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0a1f46', borderRadius: 16, maxHeight: '80%', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.12)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalClose: { fontSize: 20, color: 'rgba(255,255,255,.5)', padding: 4 },
  modalBody: { padding: 16 },
  modalText: { fontSize: 14, color: 'rgba(255,255,255,.82)', lineHeight: 22 },
  modalBtn: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)' },
  modalBtnText: { fontSize: 14, fontWeight: '700', color: '#dfbe79' },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  pickerItemActive: { backgroundColor: 'rgba(223,190,121,.15)' },
  pickerItemText: { fontSize: 16, color: 'rgba(255,255,255,.82)' },
  pickerItemTextActive: { color: '#dfbe79', fontWeight: '700' as const },
});
