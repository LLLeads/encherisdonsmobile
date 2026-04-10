import React, { useEffect, useReducer, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput, Switch, Modal,
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
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);
  const [autoBidMax, setAutoBidMax] = useState('');
  const [showBidHistory, setShowBidHistory] = useState(false);

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
      const maxVal = parseFloat(autoBidMax) || 0;
      const res = await placeBid(auction.id, bidAmount, autoBidEnabled, autoBidEnabled ? maxVal : undefined);
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

        {/* Leading Bidder */}
        {auction.leading_bidder && (
          <TouchableOpacity
            style={styles.leaderCard}
            onPress={auction.auction_history?.length > 0 ? () => setShowBidHistory(true) : undefined}
            activeOpacity={auction.auction_history?.length > 0 ? 0.7 : 1}
          >
            {auction.leading_bidder.photo ? (
              <Image source={{ uri: auction.leading_bidder.photo }} style={styles.leaderPhoto} />
            ) : (
              <View style={styles.leaderAvatar}>
                <Text style={styles.leaderAvatarText}>{(auction.leading_bidder.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.leaderLabel}>Mise plus élevée</Text>
              <Text style={styles.leaderName}>{auction.leading_bidder.username}</Text>
            </View>
            <Text style={styles.leaderAmount}>${(parseFloat(auction.highest_bid) || 0).toFixed(2)}</Text>
            {auction.auction_history?.length > 0 && (
              <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>Voir plus →</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Bid History Modal */}
        <Modal visible={showBidHistory} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, maxHeight: '80%', overflow: 'hidden' }}>
              <View style={{ backgroundColor: '#07162f', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }} numberOfLines={1}>Historique — {auction.title}</Text>
                <TouchableOpacity onPress={() => setShowBidHistory(false)}>
                  <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 24 }}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 12 }}>
                {auction.auction_history?.map((bh: any, i: number) => (
                  <View key={bh.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < (auction.auction_history?.length || 0) - 1 ? 1 : 0, borderBottomColor: '#f0f0f0' }}>
                    {bh.bidder_photo ? (
                      <Image source={{ uri: bh.bidder_photo }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                    ) : (
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: i === 0 ? '#dfbe79' : '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: i === 0 ? '#07162f' : '#6b7280' }}>{(bh.bidder || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: '#1f2937' }}>{bh.bidder}</Text>
                        {i === 0 && <View style={{ backgroundColor: '#dfbe79', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ color: '#07162f', fontSize: 10, fontWeight: '700' }}>En tête</Text></View>}
                      </View>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>{bh.bid_date} {bh.bid_time || ''}</Text>
                    </View>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: i === 0 ? '#b8860b' : '#1f2937' }}>${parseFloat(bh.bid_amount || 0).toFixed(2)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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

          {/* Auto-Bid Toggle */}
          <View style={styles.autoBidBox}>
            <View style={styles.autoBidHeader}>
              <Text style={styles.autoBidLabel}>Mise automatique</Text>
              <Switch
                value={autoBidEnabled}
                onValueChange={setAutoBidEnabled}
                trackColor={{ false: 'rgba(255,255,255,.2)', true: '#dfbe79' }}
                thumbColor="#fff"
              />
            </View>
            {autoBidEnabled && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.autoBidDesc}>Montant maximum</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>$</Text>
                  <TextInput
                    style={styles.autoBidInput}
                    value={autoBidMax}
                    onChangeText={setAutoBidMax}
                    keyboardType="decimal-pad"
                    placeholder="Entrer le montant max"
                    placeholderTextColor="rgba(255,255,255,.35)"
                  />
                </View>
                <Text style={styles.autoBidHint}>Le système misera automatiquement jusqu'à ce montant lorsque quelqu'un vous surenchérit.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bid History */}
        {auction.auction_history && auction.auction_history.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.historyTitle}>Historique des enchères</Text>
            {auction.auction_history.map((bid: any, i: number) => (
              <View key={bid.id || i} style={[styles.historyRow, i === 0 && styles.historyRowLeader]}>
                {bid.bidder_photo ? (
                  <Image source={{ uri: bid.bidder_photo }} style={styles.historyPhoto} />
                ) : (
                  <View style={[styles.historyAvatar, i === 0 && { backgroundColor: '#dfbe79' }]}>
                    <Text style={[styles.historyAvatarText, i === 0 && { color: '#07162f' }]}>{(bid.bidder || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.historyBidder}>{bid.bidder}</Text>
                    {i === 0 && <View style={styles.leaderBadge}><Text style={styles.leaderBadgeText}>En tête</Text></View>}
                  </View>
                  <Text style={styles.historyDate}>{bid.bid_date} {bid.bid_time || ''}</Text>
                </View>
                <Text style={[styles.historyAmount, i === 0 && { color: '#dfbe79' }]}>${parseFloat(bid.bid_amount || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

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
  autoBidBox: { marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  autoBidHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoBidLabel: { color: '#fff', fontWeight: '700', fontSize: 14 },
  autoBidDesc: { color: 'rgba(255,255,255,.65)', fontSize: 13 },
  autoBidInput: { flex: 1, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 16, fontWeight: '600' },
  autoBidHint: { color: 'rgba(255,255,255,.4)', fontSize: 11, marginTop: 8, lineHeight: 16 },
  // Leading bidder
  leaderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 14, backgroundColor: 'rgba(223,190,121,.1)', borderWidth: 1, borderColor: 'rgba(223,190,121,.25)' },
  leaderPhoto: { width: 40, height: 40, borderRadius: 20 },
  leaderAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dfbe79', alignItems: 'center', justifyContent: 'center' },
  leaderAvatarText: { color: '#07162f', fontWeight: '700', fontSize: 16 },
  leaderLabel: { color: '#dfbe79', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  leaderName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  leaderAmount: { color: '#dfbe79', fontWeight: '700', fontSize: 18 },
  // Bid history
  historyBox: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  historyTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  historyRowLeader: { borderBottomColor: 'rgba(223,190,121,.15)' },
  historyPhoto: { width: 36, height: 36, borderRadius: 18 },
  historyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  historyAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  historyBidder: { color: '#fff', fontWeight: '600', fontSize: 14 },
  leaderBadge: { backgroundColor: '#dfbe79', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  leaderBadgeText: { color: '#07162f', fontSize: 10, fontWeight: '700' },
  historyDate: { color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 1 },
  historyAmount: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

