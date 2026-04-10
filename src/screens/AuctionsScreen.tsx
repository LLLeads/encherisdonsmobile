import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl,
  Modal, Linking, ScrollView,
} from 'react-native';
import { getAuctions, getDashboard } from '../services/api';
import { Auction } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/types';

type UnpaidOrder = {
  id: number;
  auction_title: string;
  auction_title_fr: string;
  auction_image: string | null;
  bid_amount: number;
  payment_url: string;
};

type Props = NativeStackScreenProps<MainTabParamList, 'Auctions'>;

export default function AuctionsScreen({ navigation }: Props) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [bidHistoryAuction, setBidHistoryAuction] = useState<any>(null);

  // Check for unpaid winner orders on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboard();
        const orders = res.data?.unpaid_orders || [];
        if (orders.length > 0) {
          setUnpaidOrders(orders);
          setShowPaymentPopup(true);
        }
      } catch (_) {}
    })();
  }, []);

  const fetchAuctions = async () => {
    try {
      const res = await getAuctions({ lang: 'fr' });
      setAuctions(res.data?.auction?.data || res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAuctions();
  }, []);

  // Sort: Active first, then Upcoming
  const sortedAuctions = [...auctions].sort((a: any, b: any) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;
    return 0;
  });

  const renderAuction = ({ item, index }: { item: any; index: number }) => {
    const isUpcoming = item.status === 'Upcoming';
    const prevItem = index > 0 ? sortedAuctions[index - 1] : null;
    const showSectionHeader = isUpcoming && (!prevItem || (prevItem as any).status !== 'Upcoming');

    return (
      <>
        {showSectionHeader && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>À venir</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.card, isUpcoming && styles.cardUpcoming]}
          onPress={() => (navigation as any).navigate('AuctionDetail', { slug: item.slug })}
        >
          {isUpcoming && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>À venir</Text>
            </View>
          )}
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.image} />
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.row}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Enchère minimale</Text>
                <Text style={styles.statValue}>
                  $ {item.highest_bid > 0 ? (item.highest_bid + 1).toFixed(2) : Math.max(item.price, 1).toFixed(2)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{isUpcoming ? 'Début' : 'Temps restant'}</Text>
                <Text style={styles.statValue}>{item.end_date}</Text>
              </View>
            </View>
            {/* Leading Bidder */}
            {item.leading_bidder && item.highest_bid > 0 && (
              <TouchableOpacity
                style={styles.leaderRow}
                onPress={item.bid_history?.length > 0 ? () => setBidHistoryAuction(item) : undefined}
                activeOpacity={item.bid_history?.length > 0 ? 0.7 : 1}
              >
                {item.leading_bidder.photo ? (
                  <Image source={{ uri: item.leading_bidder.photo }} style={styles.leaderPhoto} />
                ) : (
                  <View style={styles.leaderAvatar}>
                    <Text style={styles.leaderAvatarText}>{(item.leading_bidder.name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.leaderLabel}>Mise plus élevée</Text>
                  <Text style={styles.leaderName} numberOfLines={1}>{item.leading_bidder.username}</Text>
                </View>
                <Text style={styles.leaderAmount}>${item.highest_bid.toFixed(2)}</Text>
                {item.bid_history?.length > 0 && (
                  <Text style={styles.seeMoreInline}>Voir plus →</Text>
                )}
              </TouchableOpacity>
            )}

            {!isUpcoming && (
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => (navigation as any).navigate('AuctionDetail', { slug: item.slug })}
              >
                <Text style={styles.bidButtonText}>Miser</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dfbe79" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Unpaid Winner Payment Popup */}
      <Modal visible={showPaymentPopup} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupCard}>
            <View style={styles.popupHeader}>
              <Text style={styles.popupHeaderTitle}>🏆 Félicitations !</Text>
              <Text style={styles.popupHeaderSub}>Vous avez gagné une enchère ! Veuillez compléter votre paiement.</Text>
            </View>
            <View style={styles.popupBody}>
              {unpaidOrders.map((order) => (
                <View key={order.id} style={styles.popupOrder}>
                  {order.auction_image ? (
                    <Image source={{ uri: order.auction_image }} style={styles.popupOrderImage} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupOrderTitle} numberOfLines={1}>
                      {order.auction_title_fr || order.auction_title}
                    </Text>
                    <Text style={styles.popupOrderBid}>
                      Enchère gagnante : <Text style={{ fontWeight: '700', color: '#07162f' }}>${order.bid_amount?.toFixed(2)}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.popupPayBtn}
                    onPress={() => {
                      setShowPaymentPopup(false);
                      Linking.openURL(order.payment_url);
                    }}
                  >
                    <Text style={styles.popupPayBtnText}>Payer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.popupDismiss} onPress={() => setShowPaymentPopup(false)}>
              <Text style={styles.popupDismissText}>Me rappeler plus tard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bid History Modal */}
      <Modal visible={!!bidHistoryAuction} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle} numberOfLines={1}>Historique — {bidHistoryAuction?.title}</Text>
              <TouchableOpacity onPress={() => setBidHistoryAuction(null)}>
                <Text style={{ color: 'rgba(255,255,255,.5)', fontSize: 24 }}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyModalBody}>
              {bidHistoryAuction?.bid_history?.map((bh: any, i: number) => (
                <View key={bh.id || i} style={[styles.historyModalRow, i === 0 && { borderBottomColor: 'rgba(223,190,121,.15)' }]}>
                  {bh.bidder_photo ? (
                    <Image source={{ uri: bh.bidder_photo }} style={styles.historyModalPhoto} />
                  ) : (
                    <View style={[styles.historyModalAvatar, i === 0 && { backgroundColor: '#dfbe79' }]}>
                      <Text style={[styles.historyModalAvatarText, i === 0 && { color: '#07162f' }]}>{(bh.bidder || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#1f2937', fontWeight: '700', fontSize: 14 }}>{bh.bidder}</Text>
                      {i === 0 && <View style={{ backgroundColor: '#dfbe79', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ color: '#07162f', fontSize: 10, fontWeight: '700' }}>En tête</Text></View>}
                    </View>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>{bh.bid_date} {bh.bid_time}</Text>
                  </View>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: i === 0 ? '#b8860b' : '#1f2937' }}>${parseFloat(bh.bid_amount || 0).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FlatList
        data={sortedAuctions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAuction}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dfbe79" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune enchère disponible.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' },
  list: { padding: 16 },
  card: {
    borderRadius: 20, marginBottom: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
    backgroundColor: 'rgba(255,255,255,.06)',
  },
  image: { width: '100%', height: 200, resizeMode: 'cover' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 8 },
  statLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,.82)' },
  statValue: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 4 },
  bidButton: {
    borderRadius: 999, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#dfbe79',
  },
  bidButtonText: { fontSize: 16, fontWeight: '700', color: '#dfbe79' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: 'rgba(255,255,255,.65)', fontSize: 16 },
  sectionHeader: { marginTop: 12, marginBottom: 8 },
  sectionHeaderText: { color: '#dfbe79', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  cardUpcoming: { opacity: 0.75, borderColor: 'rgba(223,190,121,.3)' },
  upcomingBadge: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    backgroundColor: '#dfbe79', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  upcomingBadgeText: { color: '#07162f', fontSize: 12, fontWeight: '700' },
  // Payment popup styles
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.65)', justifyContent: 'center', padding: 20 },
  popupCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  popupHeader: { backgroundColor: '#07162f', padding: 20 },
  popupHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  popupHeaderSub: { color: 'rgba(255,255,255,.7)', fontSize: 14, marginTop: 6 },
  popupBody: { padding: 16 },
  popupOrder: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  popupOrderImage: { width: 54, height: 54, borderRadius: 10 },
  popupOrderTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  popupOrderBid: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  popupPayBtn: { backgroundColor: '#dfbe79', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  popupPayBtnText: { color: '#07162f', fontWeight: '700', fontSize: 13 },
  popupDismiss: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingVertical: 14, alignItems: 'center' },
  popupDismissText: { color: '#9ca3af', fontSize: 14, fontWeight: '500' },
  // Leading bidder on card
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(223,190,121,.08)', borderWidth: 1, borderColor: 'rgba(223,190,121,.2)' },
  leaderPhoto: { width: 26, height: 26, borderRadius: 13 },
  leaderAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#dfbe79', alignItems: 'center', justifyContent: 'center' },
  leaderAvatarText: { color: '#07162f', fontWeight: '700', fontSize: 11 },
  leaderLabel: { color: '#dfbe79', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  leaderName: { color: '#fff', fontWeight: '600', fontSize: 12 },
  leaderAmount: { color: '#dfbe79', fontWeight: '700', fontSize: 14 },
  seeMoreBtn: { alignItems: 'center', marginTop: 6 },
  seeMoreText: { color: '#dfbe79', fontSize: 12, fontWeight: '600' },
  seeMoreInline: { color: 'rgba(255,255,255,.5)', fontSize: 10, flexShrink: 0 },
  // Bid history modal
  historyModal: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '80%', overflow: 'hidden' },
  historyModalHeader: { backgroundColor: '#07162f', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyModalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 12 },
  historyModalBody: { padding: 12 },
  historyModalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  historyModalPhoto: { width: 38, height: 38, borderRadius: 19 },
  historyModalAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  historyModalAvatarText: { color: '#6b7280', fontWeight: '700', fontSize: 14 },
});
