import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuctionsScreen from '../screens/AuctionsScreen';
import AuctionDetailScreen from '../screens/AuctionDetailScreen';
import DrawScreen from '../screens/DrawScreen';
import ProfileScreen from '../screens/ProfileScreen';
// MembershipPaymentScreen requires native Stripe SDK (custom build only)
// In Expo Go, show a fallback screen
let MembershipPaymentScreen: React.ComponentType<any>;
try {
  MembershipPaymentScreen = require('../screens/MembershipPaymentScreen').default;
} catch {
  MembershipPaymentScreen = ({ navigation }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View style={{ flex: 1, backgroundColor: '#07162f', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>Adhésion requise</Text>
        <Text style={{ color: 'rgba(255,255,255,.7)', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
          Le paiement natif nécessite une version compilée de l'application. Veuillez utiliser le site web pour compléter votre adhésion.
        </Text>
        <TouchableOpacity style={{ borderRadius: 999, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.2)' }} onPress={() => navigation.goBack()}>
          <Text style={{ color: 'rgba(255,255,255,.65)', fontWeight: '600' }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  };
}

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#07162f', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#07162f',
          borderTopColor: 'rgba(255,255,255,0.12)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#dfbe79',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
      }}
    >
      <MainTab.Screen
        name="Auctions"
        component={AuctionsScreen}
        options={{
          title: 'Enchères',
          tabBarLabel: 'Enchères',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏷</Text>,
        }}
      />
      <MainTab.Screen
        name="Draw"
        component={DrawScreen}
        options={{
          title: 'Tirage',
          tabBarLabel: 'Tirage',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎁</Text>,
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </MainTab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#07162f', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#fff',
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ title: "Détail de l'enchère", headerBackTitle: 'Retour' }} />
      <RootStack.Screen name="MembershipPayment" component={MembershipPaymentScreen} options={{ title: 'Adhésion', headerBackTitle: 'Retour' }} />
    </RootStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07162f' }}>
        <ActivityIndicator size="large" color="#dfbe79" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
