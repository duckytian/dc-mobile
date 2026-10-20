import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import {
  AuthLayout,
  AuthFooterLink,
  BrandHeader,
  FormError,
  PrimaryButton,
  useToAuth
} from '@/components/auth/auth-screen';
import { FormField } from '@/components/auth/form-field';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth-context';
import { validateCode, validateEmailOrPhone, validateNewPassword } from '@/lib/validation';

type Step = 'email' | 'code' | 'password';

function toIdentifier(value: string) {
  const identifier = value.trim();
  return identifier.includes('@')
    ? { email: identifier }
    : { phoneNumber: identifier };
}

export default function ForgotPasswordScreen() {
  const { forgotPassword, resetPassword } = useAuth();
  const goToLogin = useToAuth('/');

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  async function onRequestCode() {
    const validationError = validateEmailOrPhone(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await forgotPassword(toIdentifier(email));
      setStep('code');
      setNotice('If that account exists, a reset code has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode() {
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      setStep('password');
    } finally {
      setLoading(false);
    }
  }

  async function onReset() {
    const validationError = validateNewPassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword(toIdentifier(email), code.trim(), newPassword);
      setNotice('Password reset! Sign in with your new password.');
      setStep('email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      footer={
        step === 'email' ? (
          <AuthFooterLink prompt="Remembered it?" link="Sign in" onPress={goToLogin} />
        ) : undefined
      }>
      <BrandHeader
        title={
          step === 'email' ? 'Forgot password' : step === 'code' ? 'Enter reset code' : 'New password'
        }
        subtitle={
          step === 'email'
            ? 'Enter your email or phone number and we will send you a reset code.'
            : step === 'code'
            ? 'Enter the 6-digit reset code from your email.'
            : 'Choose a new password for your account.'
        }
      />

      <View style={styles.form}>
        {step === 'email' && (
          <>
            <FormField
              label="Email or phone"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com or 0917 123 4567"
              autoComplete="username"
            />
            <FormError message={error} />
            <PrimaryButton label="Send reset code" onPress={onRequestCode} loading={loading} />
          </>
        )}

        {step === 'code' && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {notice}
            </ThemedText>
            <FormField
              label="Reset code"
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
            />
            <FormError message={error} />
            <PrimaryButton label="Verify code" onPress={onVerifyCode} loading={loading} />
          </>
        )}

        {step === 'password' && (
          <>
            <FormField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min 8 chars, mixed case, number & symbol"
              secureTextEntry
              returnKeyType="done"
            />
            <FormError message={error} />
            <PrimaryButton label="Reset password" onPress={onReset} loading={loading} />
          </>
        )}

        {notice && step === 'email' && (
          <ThemedText type="small" themeColor="textSecondary">
            {notice}
          </ThemedText>
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 }
});
