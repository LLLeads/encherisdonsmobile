import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { createMembershipPaymentIntent, confirmMembershipPayment } from '../services/api';

export default function MembershipPaymentScreen({ navigation }: any) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      const res = await createMembershipPaymentIntent();
      if (!res.status) {
        Alert.alert('Erreur', res.message || 'Impossible d\'initier le paiement.');
        navigation.goBack();
        return;
      }

      setPaymentData(res.data);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: res.data.client_secret,
        merchantDisplayName: 'EncherisDons',
        style: 'automatic',
      });

      if (error) {
        Alert.alert('Erreur', error.message);
        navigation.goBack();
        return;
      }

      setReady(true);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur de connexion.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!paymentData) return;
    setProcessing(true);

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code !== 'Canceled') {
        Alert.alert('Erreur', error.message);
      }
      setProcessing(false);
      return;
    }

    // Payment succeeded — confirm with admin
    try {
      const confirmRes = await confirmMembershipPayment(
        paymentData.payment_id,
        paymentData.client_secret.split('_secret_')[0]
      );

      if (confirmRes.status) {
        Alert.alert('Succès', 'Adhésion activée ! Vous pouvez maintenant miser.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Erreur', confirmRes.message || 'Impossible de confirmer le paiement.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Erreur lors de la confirmation.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#dfbe79" />
        <Text style={styles.loadingText}>Préparation du paiement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Adhésion EncherisDons</Text>
      <Text style={styles.desc}>
        Pour miser sur les enchères, vous devez avoir une adhésion active.
      </Text>

      {paymentData && (
        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Adhésion</Text>
            <Text style={styles.rowValue}>$ {parseFloat(paymentData.membership_cost).toFixed(2)}</Text>
          </View>
          {paymentData.tax_breakdown?.map((tax: any, i: number) => (
            <View style={styles.row} key={i}>
              <Text style={styles.rowLabel}>{tax.type} ({(tax.rate * 100).toFixed(2)}%)</Text>
              <Text style={styles.rowValue}>$ {parseFloat(tax.amount).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$ {parseFloat(paymentData.amount).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.payBtn, (!ready || processing) && { opacity: 0.5 }]}
        onPress={handlePay}
        disabled={!ready || processing}
      >
        {processing ? (
          <ActivityIndicator color="#07162f" />
        ) : (
          <Text style={styles.payBtnText}>Payer maintenant</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07162f' },
  scroll: { padding: 24, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' },
  loadingText: { color: 'rgba(255,255,255,.65)', marginTop: 16, fontSize: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 12 },
  desc: { fontSize: 15, color: 'rgba(255,255,255,.7)', lineHeight: 22, marginBottom: 24 },
  summary: {
    padding: 20, borderRadius: 16, marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 15, color: 'rgba(255,255,255,.65)' },
  rowValue: { fontSize: 15, color: '#fff', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.12)', paddingTop: 12, marginTop: 8,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#dfbe79' },
  payBtn: {
    borderRadius: 999, paddingVertical: 18, alignItems: 'center',
    backgroundColor: '#dfbe79', marginBottom: 12,
  },
  payBtnText: { fontSize: 18, fontWeight: '700', color: '#07162f' },
  cancelBtn: {
    borderRadius: 999, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.2)',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,.65)' },
});
