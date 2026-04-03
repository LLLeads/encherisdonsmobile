import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { getDraws, getDrawParticipants, joinDraw } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Draw, DrawParticipant } from '../types';

export default function DrawScreen() {
  const { user } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [participants, setParticipants] = useState<DrawParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inscribing, setInscribing] = useState(false);
  const [justInscribed, setJustInscribed] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const drawRes = await getDraws('fr');
      setDraws(drawRes.data || []);
      if (user) {
        const partRes = await getDrawParticipants();
        setParticipants(partRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [user]);

  const getParticipant = (drawId: number) => participants.find((p) => p.draw_id === drawId);

  const handleJoin = async (drawId: number) => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous connecter pour participer.');
      return;
    }
    setInscribing(true);
    try {
      await joinDraw(drawId);
      setJustInscribed(drawId);
      const partRes = await getDrawParticipants();
      setParticipants(partRes.data || []);
      Alert.alert('Succès', 'Merci pour votre inscription !');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Erreur lors de l'inscription.");
    } finally {
      setInscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dfbe79" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dfbe79" />}
    >
      <Text style={styles.heading}>Tirage hebdomadaire</Text>
      <Text style={styles.subheading}>Participez et gagnez des cartes-cadeaux !</Text>
      <Text style={styles.desc}>
        Participez à notre tirage hebdomadaire pour gagner des cartes-cadeaux. 1 carte-cadeau par semaine !
      </Text>

      {draws.map((draw) => {
        const participant = getParticipant(draw.id);
        const isJust = justInscribed === draw.id;

        return (
          <View key={draw.id} style={styles.card}>
            <Text style={styles.cardSmall}>TIRAGE</Text>
            <Text style={styles.cardTitle}>{draw.name}</Text>
            <Text style={styles.cardInfo}>Fréquence: {draw.frequency}</Text>
            <Text style={styles.cardInfo}>Prix: {draw.prize_description}</Text>
            <Text style={styles.cardInfo}>Date du tirage: {draw.draw_date}</Text>

            {isJust ? (
              <View style={styles.successBtn}>
                <Text style={styles.successBtnText}>Merci pour votre inscription !</Text>
              </View>
            ) : participant ? (
              <View style={styles.registeredBtn}>
                <Text style={styles.registeredBtnText}>
                  Vous êtes inscrit — {participant.chances} chance{participant.chances > 1 ? 's' : ''}
                </Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(draw.id)} disabled={inscribing}>
                {inscribing ? (
                  <ActivityIndicator color="#07162f" />
                ) : (
                  <Text style={styles.joinBtnText}>S'inscrire (1 chance)</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {draws.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun tirage disponible.</Text>
        </View>
      )}

      {/* How to earn more chances */}
      <View style={styles.chancesCard}>
        <Text style={styles.chancesTitle}>Comment obtenir plus de chances</Text>
        {[
          { label: 'Première inscription', value: '1 chance', badge: '1' },
          { label: "Référer un ami", value: '+2 chances', badge: '+2' },
          { label: "Abonné à l'infolettre", value: '+2 chances', badge: '+2' },
          { label: 'Référer un OBNL', value: '+2 chances', badge: '+2' },
          { label: 'Réinscription au prochain tirage', value: '+2 chances', badge: '+2' },
        ].map((item, i) => (
          <View key={i} style={styles.chanceRow}>
            <View style={styles.chanceBadge}>
              <Text style={styles.chanceBadgeText}>{item.badge}</Text>
            </View>
            <View>
              <Text style={styles.chanceLabel}>{item.label}</Text>
              <Text style={styles.chanceValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' },
  heading: { fontSize: 16, fontWeight: '700', color: '#dfbe79', textAlign: 'center', marginBottom: 8 },
  subheading: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,.82)', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  card: {
    padding: 24, borderRadius: 20, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
  },
  cardSmall: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,.5)', letterSpacing: 1, marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  cardInfo: { fontSize: 14, color: 'rgba(255,255,255,.82)', marginBottom: 4 },
  joinBtn: {
    marginTop: 16, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#dfbe79',
  },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: '#07162f' },
  registeredBtn: {
    marginTop: 16, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center', backgroundColor: 'rgba(223,190,121,.15)',
    borderWidth: 1, borderColor: '#dfbe79',
  },
  registeredBtnText: { fontSize: 14, fontWeight: '700', color: '#dfbe79' },
  successBtn: {
    marginTop: 16, borderRadius: 999, paddingVertical: 14,
    alignItems: 'center', backgroundColor: '#2eb56b',
  },
  successBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: 'rgba(255,255,255,.65)', fontSize: 16 },
  chancesCard: {
    marginTop: 8, padding: 24, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
  },
  chancesTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16, textAlign: 'center' },
  chanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  chanceBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#dfbe79',
    alignItems: 'center', justifyContent: 'center',
  },
  chanceBadgeText: { fontSize: 14, fontWeight: '900', color: '#07162f' },
  chanceLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  chanceValue: { fontSize: 13, color: 'rgba(255,255,255,.65)' },
});
