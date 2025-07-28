// src/screens/VerifyOTPScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  Snackbar
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { verifyOTP, forgotPassword } from '../services/user';
import { styles } from '../theme/styles';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [timer, setTimer] = useState(600);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setSnackbarMessage('Please enter the OTP');
      setSnackbarVisible(true);
      return;
    }

    if (otp.length !== 4) {
      setSnackbarMessage('OTP must be 4 digits');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otp);
      
      if (result.status === 'success' || result.success !== false) {
        setSnackbarMessage('OTP verified successfully');
        setSnackbarVisible(true);
        
        setTimeout(() => {
          navigation.navigate('ResetPassword', { 
            resetToken: result.data?.resetToken || result.resetToken,
            email: email 
          });
        }, 1500);
      } else {
        setSnackbarMessage(result.message || 'Invalid OTP. Please try again.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setSnackbarMessage('Something went wrong. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const result = await forgotPassword(email);
      
      if (result.status === 'success' || result.success !== false) {
        setSnackbarMessage('New OTP sent to your email');
        setSnackbarVisible(true);
        
        setTimer(600);
        setCanResend(false);
        setOtp(''); 
      } else {
        setSnackbarMessage(result.message || 'Failed to resend OTP. Please try again.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setSnackbarMessage('Something went wrong. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setResendLoading(false);
    }
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const SafeWrapper = Platform.OS === 'web' ? View : require('react-native-safe-area-context').SafeAreaView;

  return (
    <SafeWrapper style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Verify OTP</Text>
          <Text style={styles.subtitle}>Check your email for the verification code</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Enter OTP</Title>
            
            <Text style={otpStyles.instructionText}>
              We've sent a 4-digit verification code to:
            </Text>
            <Text style={otpStyles.emailText}>{email}</Text>
            
            <TextInput
              label="Enter 4-digit OTP"
              value={otp}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                setOtp(numericText);
              }}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, otpStyles.otpInput]}
              left={<TextInput.Icon icon="key" />}
              disabled={loading}
              maxLength={4}
            />

            <View style={otpStyles.timerContainer}>
              {!canResend ? (
                <Text style={otpStyles.timerText}>
                  Resend OTP in: {formatTime(timer)}
                </Text>
              ) : (
                <Button
                  mode="text"
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                  loading={resendLoading}
                  style={otpStyles.resendButton}
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Button>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleVerifyOTP}
              style={styles.loginButton}
              disabled={loading || !otp}
              loading={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <Button
              mode="text"
              onPress={navigateBack}
              style={styles.forgotButton}
              disabled={loading}
            >
              Back
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeWrapper>
  );
};

const otpStyles = StyleSheet.create({
  instructionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  resendButton: {
    marginTop: -8,
  },
});

export default VerifyOTPScreen;