import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RS3Y2RQDwfkgOq9mllWGDXOZefsn5BOmTVMh3M4DwISKEaOr9jaIYOEPcB3jrZcjq8byyk9TjbJjgcOIotmPCBe00cFMJjzso';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </StripeProvider>
  );
}
