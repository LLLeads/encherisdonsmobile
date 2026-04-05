import React, { useEffect, useReducer } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { getAuctionDetail, placeBid } from '../services/api';
import { useAuth } from '../context/AuthContext';

const translations: Record<string, string> = {
  'Bid has been placed successfully': 'Mise placée avec succès',
  'Auction not found': 'Enchère introuvable',
  'Auction is not started yet': "L'enchère n'a pas encore commencé",
  'Auction is expired': "L'enchère est expirée",
  'Bid amount must be greater than 0': 'Le montant doit être supérieur à 0',
  'Bid amount must be greater than auction price': 'Le montant doit être supérieur au prix de l\'enchère',
  'Bid amount must be greater than highest bid amount': 'Le montant doit être supérieur à la mise la plus élevée',
  'You can not bid on your own auction': 'Vous ne pouvez pas miser sur votre propre enchère',
  'You are already the highest bidder': 'Vous êtes déjà le plus offrant',
  'You must be logged in to place a bid': 'Vous devez être connecté pour miser',
  'You must have an active membership to place bids': 'Vous devez avoir une adhésion active pour miser',
  'Your membership has expired. Please renew to place bids': 'Votre adhésion a expiré. Veuillez la renouveler pour miser',
};

function t(msg: string): string {
  return translations[msg] || msg;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

type State = {
  auction: any;
  loading: boolean;
  bidAmount: number;
  submitting: boolean;
};

type Action =
  | { type: 'LOADED'; auction: any; bidAmount: number }
  | { type: 'ERROR' }
  | { type: 'SET_BID'; amount: number }
  | { type: 'SUBMITTING'; value: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADED':
      return { ...state, auction: action.auction, bidAmount: action.bidAmount, loading: false };
    case 'ERROR':
      return { ...state, loading: false };
    case 'SET_BID':
      return { ...state, bidAmount: action.amount };
    case 'SUBMITTING':
      return { ...state, submitting: action.value };
    default:
      return state;
  }
}

export default function AuctionDetailScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const { user } = useAuth();

  const [state, dispatch] = useReducer(reducer, {
    auction: null,
    loading: true,
    bidAmount: 0,
    submitting: false,
  });

  const { auction, loading, bidAmount, submitting } = state;

  const fetchAndSet = () => {
    getAuctionDetail(slug)
      .then((res) => {
        const d = res.data;
        if (d) {
          const hb = parseFloat(d.highest_bid) || 0;
          const price = parseFloat(d.price) || 1;
          dispatch({ type: 'LOADED', auction: d, bidAmount: hb > 0 ? hb + 1 : Math.max(price, 1) });
        } else {
          dispatch({ type: 'ERROR' });
        }
      })
      .catch(() => dispatch({ type: 'ERROR' }));
  };

  useEffect(() => {
    fetchAndSet();
  }, [slug]);


  const handleMembershipPayment = () => {
    navigation.navigate('MembershipPayment');
  };


  const handleBid = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous connecter pour miser.');
      return;
    }
    if (!auction || bidAmount <= 0) return;

    dispatch({ type: 'SUBMITTING', value: true });
    try {
      const res = await placeBid(auction.id, bidAmount);
      if (res.requires_membership) {
        Alert.alert(
          'Adhésion requise',
          'Pour miser, vous devez avoir une adhésion active.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Payer maintenant', onPress: () => handleMembershipPayment() },
          ]
        );
      } else if (res.status === false || res.status === 'error') {
        Alert.alert('Erreur', t(res.message || res.error?.message || 'Échec de la mise.'));
      } else {
        Alert.alert('Succès', t(res.message || 'Mise placée avec succès !'));
        const updated = await getAuctionDetail(slug);
        if (updated.data) {
          const hb = parseFloat(updated.data.highest_bid) || 0;
          const price = parseFloat(updated.data.price) || 1;
          dispatch({ type: 'LOADED', auction: updated.data, bidAmount: hb > 0 ? hb + 1 : Math.max(price, 1) });
        }
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Échec de la mise.');
    } finally {
      dispatch({ type: 'SUBMITTING', value: false });
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
        <Text style={styles.emptyText}>Chargement de l'enchère...</Text>
        <ActivityIndicator size="large" color="#dfbe79" style={{ marginTop: 16 }} />
      </View>
    );
  }

  const minBid = (parseFloat(auction.highest_bid) || 0) > 0
    ? parseFloat(auction.highest_bid) + 1
    : Math.max(parseFloat(auction.price) || 1, 1);

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
            <Text style={styles.statValue}>$ {(parseFloat(auction.highest_bid) || 0).toFixed(2)}</Text>
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
          <Text style={styles.bidInfo}>Enchère la plus élevée: $ {(parseFloat(auction.highest_bid) || 0).toFixed(2)}</Text>

          <View style={styles.bidRow}>
            <TouchableOpacity
              style={styles.bidBtn}
              onPress={() => dispatch({ type: 'SET_BID', amount: Math.max(1, bidAmount - 1) })}
            >
              <Text style={styles.bidBtnText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.bidInput}
              value={`$ ${bidAmount.toFixed(2)}`}
              onChangeText={(t) => {
                const num = parseFloat(t.replace(/[^0-9.]/g, ''));
                if (!isNaN(num)) dispatch({ type: 'SET_BID', amount: num });
              }}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.bidBtn}
              onPress={() => dispatch({ type: 'SET_BID', amount: bidAmount + 1 })}
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
            <Text style={styles.descText}>{stripHtml(auction.description)}</Text>
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

