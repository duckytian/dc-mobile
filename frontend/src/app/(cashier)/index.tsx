import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function CashierHome() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  // Cashier-only app: the dashboard tabs are the home.
  return <Redirect href="/(cashier)/(tabs)" />;
}


