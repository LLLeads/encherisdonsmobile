import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuctionsScreen from '../screens/AuctionsScreen';
import AuctionDetailScreen from '../screens/AuctionDetailScreen';
import DrawScreen from '../screens/DrawScreen';
import ProfileScreen from '../screens/ProfileScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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
        headerStyle: { backgroundColor: '#07162f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#07162f',
          borderTopColor: 'rgba(255,255,255,.12)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#dfbe79',
        tabBarInactiveTintColor: 'rgba(255,255,255,.5)',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <MainTab.Screen
        name="Auctions"
        component={AuctionsScreen}
        options={{ title: 'Enchères', tabBarLabel: 'Enchères' }}
      />
      <MainTab.Screen
        name="Draw"
        component={DrawScreen}
        options={{ title: 'Tirage', tabBarLabel: 'Tirage' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil', tabBarLabel: 'Profil' }}
      />
    </MainTab.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#07162f' }, headerTintColor: '#fff' }}>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ title: 'Détail de l\'enchère' }} />
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
