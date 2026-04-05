import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { getAuctions } from '../services/api';
import { Auction } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainTabParamList, 'Auctions'>;

export default function AuctionsScreen({ navigation }: Props) {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
});
