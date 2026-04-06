import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Stripe native SDK is only available in custom builds, not Expo Go
const StripeWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function App() {
  return (
    <StripeWrapper>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </StripeWrapper>
  );
}
