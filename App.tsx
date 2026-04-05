import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RS3Y2RQDwfkgOq9mllWGDXOZefsn5BOmTVMh3M4DwISKEaOr9jaIYOEPcB3jrZcjq8byyk9TjbJjgcOIotmPCBe00cFMJjzso';

// StripeProvider requires a native build — wrap conditionally
let StripeWrapper: React.ComponentType<{ children: React.ReactNode }>;
try {
  const { StripeProvider } = require('@stripe/stripe-react-native');
  StripeWrapper = ({ children }: { children: React.ReactNode }) => (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>{children}</StripeProvider>
  );
} catch {
  StripeWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
}

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
