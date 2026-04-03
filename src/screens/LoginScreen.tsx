import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Connexion échouée.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>EncherisDons</Text>
        <Text style={styles.subtitle}>Bon retour ! Veuillez vous connecter</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Courriel</Text>
          <TextInput
            style={styles.input}
            placeholder="Veuillez entrer votre courriel"
            placeholderTextColor="#6b788e"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Veuillez entrer votre mot de passe"
            placeholderTextColor="#6b788e"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#07162f" />
            ) : (
              <Text style={styles.buttonText}>Connexion</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Pas de compte ? <Text style={styles.linkBold}>Créer un compte</Text>
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
    alignItems: 'center',
    backgroundColor: '#dfbe79',
  },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#07162f' },
  link: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#091e42' },
  linkBold: { fontWeight: '700', color: '#dfbe79' },
});
