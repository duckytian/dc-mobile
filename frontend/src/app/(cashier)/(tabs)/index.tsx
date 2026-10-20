import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrderQueue } from '@/components/staff/order-queue';
import { Palette } from '@/constants/design';
import { ThemedText } from '@/components/themed-text';

export default function CashierQueueScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: Palette.brand }}>
      <View className="px-4 py-3">
        <ThemedText className="text-lg font-semibold" style={{ color: '#fff' }}>Order Queue</ThemedText>
      </View>
      <OrderQueue basePath="/(cashier)" withCounts showViewToggle />
    </SafeAreaView>
  );
}
