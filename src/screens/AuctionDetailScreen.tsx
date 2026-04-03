import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { getAuctionDetail, placeBid } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Auction } from '../types';

export default function AuctionDetailScreen({ route }: any) {
  const { slug } = route.params;
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await getAuctionDetail(slug);
      const data = res.data;
      setAuction(data);
      const minBid = data.highest_bid > 0 ? data.highest_bid + 1 : Math.max(data.price, 1);
      setBidAmount(minBid);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [slug]);

  const handleBid = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous connecter pour miser.');
      return;
    }
    if (!auction || bidAmount <= 0) return;

    setSubmitting(true);
    try {
      await placeBid(auction.id, bidAmount);
      Alert.alert('Succès', 'Mise placée avec succès !');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de la mise.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dfbe79" />
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Enchère introuvable.</Text>
      </View>
    );
  }

  const minBid = auction.highest_bid > 0 ? auction.highest_bid + 1 : Math.max(auction.price, 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {auction.image && (
        <Image source={{ uri: auction.image }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{auction.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Enchère minimale</Text>
            <Text style={styles.statValue}>$ {minBid.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Enchère la plus élevée</Text>
            <Text style={styles.statValue}>$ {auction.highest_bid.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Temps restant</Text>
          <Text style={styles.statValue}>{auction.end_date}</Text>
        </View>

        {/* Bid Form */}
        <View style={styles.bidPanel}>
          <Text style={styles.bidTitle}>MISER MAINTENANT</Text>
          <Text style={styles.bidInfo}>Enchère minimale: $ {minBid.toFixed(2)}</Text>
          <Text style={styles.bidInfo}>Enchère la plus élevée: $ {auction.highest_bid.toFixed(2)}</Text>

          <View style={styles.bidRow}>
            <TouchableOpacity
              style={styles.bidBtn}
              onPress={() => setBidAmount((v) => Math.max(1, v - 1))}
            >
              <Text style={styles.bidBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.bidInput}
              value={`$ ${bidAmount.toFixed(2)}`}
              onChangeText={(t) => {
                const num = parseFloat(t.replace(/[^0-9.]/g, ''));
                if (!isNaN(num)) setBidAmount(num);
              }}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.bidBtn}
              onPress={() => setBidAmount((v) => v + 1)}
            >
              <Text style={styles.bidBtnText}>+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bidSubmit}
              onPress={handleBid}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#07162f" size="small" />
              ) : (
                <Text style={styles.bidSubmitText}>Miser</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {auction.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.descText}>{auction.description}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  scroll: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' },
  emptyText: { color: 'rgba(255,255,255,.65)', fontSize: 16 },
  image: { width: '100%', height: 280, resizeMode: 'cover' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 12,
    padding: 12, alignItems: 'center', marginBottom: 8,
  },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,.82)', fontWeight: '600' },
  statValue: { fontSize: 16, color: '#fff', fontWeight: '700', marginTop: 4 },
  bidPanel: {
    marginTop: 16, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
    backgroundColor: 'rgba(255,255,255,.06)',
  },
  bidTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 8 },
  bidInfo: { fontSize: 14, color: 'rgba(255,255,255,.82)', marginBottom: 4 },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  bidBtn: {
    width: 48, height: 48, borderRadius: 10, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  bidBtnText: { fontSize: 22, fontWeight: '700', color: '#091e42' },
  bidInput: {
    flex: 1, height: 48, borderRadius: 10, backgroundColor: '#fff',
    textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#091e42',
  },
  bidSubmit: {
    height: 48, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: '#dfbe79', alignItems: 'center', justifyContent: 'center',
  },
  bidSubmitText: { fontSize: 16, fontWeight: '700', color: '#07162f' },
  descBox: { marginTop: 20 },
  descTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  descText: { fontSize: 14, color: 'rgba(255,255,255,.82)', lineHeight: 22 },
});
