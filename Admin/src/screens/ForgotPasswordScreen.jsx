// src/screens/ForgotPasswordScreen.jsx
import React, { useState } from 'react';
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
import { forgotPassword } from '../services/user';
import { styles } from '../theme/styles';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      setSnackbarMessage('Please enter your email address');
      setSnackbarVisible(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);
      
      if (result.status === 'success' || result.success !== false) {
        setSnackbarMessage('OTP sent to your email successfully');
        setSnackbarVisible(true);
        
        setTimeout(() => {
          navigation.navigate('VerifyOTP', { email: email });
        }, 2000);
      } else {
        setSnackbarMessage(result.message || 'Failed to send OTP. Please try again.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setSnackbarMessage('Something went wrong. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const SafeWrapper = Platform.OS === 'web' ? View : require('react-native-safe-area-context').SafeAreaView;

  return (
    <SafeWrapper style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email to receive an OTP</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Reset Password</Title>
            
            <Text style={forgotPasswordStyles.instructionText}>
              Enter the email address associated with your account and we'll send you an OTP to reset your password.
            </Text>
            
            <TextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              disabled={loading}
            />

            <Button
              mode="contained"
              onPress={handleForgotPassword}
              style={styles.loginButton}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>

            <Button
              mode="text"
              onPress={navigateToLogin}
              style={styles.forgotButton}
              disabled={loading}
            >
              Back to Login
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

const forgotPasswordStyles = StyleSheet.create({
  instructionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
});

export default ForgotPasswordScreen;