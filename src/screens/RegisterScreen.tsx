import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { register } from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !confirmPassword) {
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

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#07162f" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Déjà un compte ? <Text style={styles.linkBold}>Connexion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
});
