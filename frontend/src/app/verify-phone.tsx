import { useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  AuthLayout,
  BrandHeader,
  FormError,
  PrimaryButton
} from '@/components/auth/auth-screen';
import { FormField } from '@/components/auth/form-field';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth-context';
import { validateCode } from '@/lib/validation';

export default function VerifyPhoneScreen() {
  const params = useLocalSearchParams<{ email?: string; phone?: string }>();
  const email = (params.email ?? '').toString();
  const phone = (params.phone ?? '').toString();
  const { verify, resendVerification } = useAuth();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function onVerify() {
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verify(
        { email: email || undefined, phoneNumber: phone || undefined },
        code.trim()
      );
      setNotice('Verified! You can now sign in.');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setError('');
    setLoading(true);
    try {
      await resendVerification(
        { email: email || undefined, phoneNumber: phone || undefined }
      );
      setNotice('A new code has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <Pressable onPress={onResend} hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: '#3C5E45' }}>
            Resend code
          </ThemedText>
        </Pressable>
      }
    >
      <View style={styles.header}>
        <BrandHeader title="Verify your account" subtitle={`Enter the 6-digit code sent to ${email || phone}.`} />
      </View>

      <View style={styles.form}>
        <FormField
          label="Verification code"
          value={code}
          onChangeText={setCode}
          placeholder="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
        />
        <FormError message={error} />
        {notice ? <ThemedText type="small" themeColor="textSecondary">{notice}</ThemedText> : null}
        <PrimaryButton label="Verify account" onPress={onVerify} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: 0 },
  form: { gap: 16 }
});