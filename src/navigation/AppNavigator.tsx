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
      <RootStack.Screen name="AuctionDetail" component={AuctionDetailScreen} options={{ title: "Détail de l'enchère" }} />
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
