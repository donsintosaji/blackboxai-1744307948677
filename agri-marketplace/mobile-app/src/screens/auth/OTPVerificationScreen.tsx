import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  OTPVerification: { email: string };
  Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if current input is filled
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/verify-otp', { email, otp: otpString });
      Alert.alert('Success', 'Email verified successfully', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error instanceof Error ? error.message : 'Invalid OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await api.post('/auth/resend-otp', { email });
      setCountdown(30);
      Alert.alert('Success', 'OTP has been resent to your email');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to resend OTP'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Verify Your Email
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Enter the 6-digit code sent to {email}
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.otpInput}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
            mode="outlined"
            selectTextOnFocus
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                inputRefs.current[index - 1]?.focus();
              }
            }}
          />
        ))}
      </View>

      <Button
        mode="contained"
        onPress={handleVerify}
        loading={loading}
        disabled={loading || otp.join('').length !== 6}
        style={styles.button}
      >
        Verify
      </Button>

      <Button
        mode="text"
        onPress={handleResendOTP}
        disabled={countdown > 0}
        style={styles.resendButton}
      >
        {countdown > 0
          ? `Resend code in ${countdown}s`
          : 'Resend code'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 45,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  button: {
    width: '100%',
    marginBottom: 16,
    padding: 4,
    backgroundColor: '#2E7D32',
  },
  resendButton: {
    width: '100%',
  },
});

export default OTPVerificationScreen;
