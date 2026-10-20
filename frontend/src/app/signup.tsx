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

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import {
  firstError,
  validateEmail,
  validateNewPassword,
  validateRequired
} from '@/lib/validation';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const goToLogin = useToAuth('/');
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    const validationError = firstError(
      validateRequired(firstName, 'First name'),
      validateRequired(lastName, 'Last name'),
      validateRequired(username, 'Username'),
      validateEmail(email),
      validateRequired(phoneNumber, 'Phone number'),
      validateRequired(address, 'Address'),
      validateNewPassword(password)
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        address: address.trim()
      });
      router.push(
        `/verify-phone?phone=${encodeURIComponent(phoneNumber.trim())}&email=${encodeURIComponent(email.trim())}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <AuthFooterLink
          prompt="Already have an account?"
          link="Sign in"
          onPress={goToLogin}
        />
      }
    >
      <View style={styles.header}>
        <BrandHeader title="Create account" subtitle="Join DonClaudio's and get started." />
      </View>

      <View style={styles.form}>
        <FormField label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <FormField label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <FormField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
        <FormField label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="09xxxxxxxxx" keyboardType="phone-pad" />
        <FormField label="Address" value={address} onChangeText={setAddress} placeholder="House no., street, barangay, city" />
        <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 chars, mixed case, number & symbol" secureTextEntry autoComplete="password" />
        <FormField label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry autoComplete="password" />
        <FormError message={error} />
        <PrimaryButton label="Create account" onPress={onSubmit} loading={loading} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { gap: 0 },
  form: { gap: 16 }
});