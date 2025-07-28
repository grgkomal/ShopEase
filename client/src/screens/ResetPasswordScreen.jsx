// src/screens/ResetPasswordScreen.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  Snackbar,
  HelperText,
  ActivityIndicator
} from 'react-native-paper';
import { theme } from '../theme/theme';
import { resetPassword } from '../services/user';
import { styles } from '../theme/styles';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetToken, email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (newPassword.length > 128) {
      newErrors.newPassword = 'Password must be less than 128 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (newPassword && newPassword.length >= 6) {
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasLowerCase = /[a-z]/.test(newPassword);
      const hasNumbers = /\d/.test(newPassword);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        newErrors.newPassword = 'Password should contain uppercase, lowercase, and numbers';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSnackbar = (message, isError = false) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleResetPassword = async () => {
    setErrors({});

    if (!validateForm()) {
      showSnackbar('Please fix the errors below', true);
      return;
    }

    if (!resetToken) {
      showSnackbar('Reset token is missing. Please start the password reset process again.', true);
      return;
    }

    try {
      setLoading(true);
      console.log('Starting password reset process...');
      console.log('Reset token:', resetToken ? 'Present' : 'Missing');
      console.log('Email:', email);

      const result = await resetPassword(resetToken, newPassword);
      console.log('Reset password result:', result);

      if (result && (result.success || result.status === 'success')) {
        console.log('Password reset successful');
        showSnackbar('Password reset successfully! Redirecting to login...');
        
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        
        setTimeout(() => {
          navigation.replace('Login', {
            message: 'Password reset successful. Please log in with your new password.',
            email: email 
          });
        }, 2000);
        
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to reset password. Please try again.';
        console.error('Password reset failed:', errorMessage);
        showSnackbar(errorMessage, true);
        
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('expired') ||
            errorMessage.toLowerCase().includes('invalid')) {
          setTimeout(() => {
            navigation.replace('ForgotPassword', {
              message: 'Reset link has expired. Please request a new one.',
              email: email
            });
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.message.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        showSnackbar('Network error. Please check your connection and try again.', true);
      } else if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 400) {
          showSnackbar(errorData?.message || 'Invalid request. Please check your input.', true);
        } else if (statusCode === 401) {
          showSnackbar('Reset link has expired. Please request a new one.', true);
          setTimeout(() => {
            navigation.replace('ForgotPassword', { email: email });
          }, 3000);
        } else if (statusCode === 404) {
          showSnackbar('Reset service not found. Please contact support.', true);
        } else if (statusCode >= 500) {
          showSnackbar('Server error. Please try again later.', true);
        } else {
          showSnackbar(errorData?.message || 'An unexpected error occurred.', true);
        }
      } else {
        showSnackbar('Something went wrong. Please try again.', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.replace('Login', { email: email });
  };

  const navigateToForgotPassword = () => {
    navigation.replace('ForgotPassword', { 
      email: email,
      message: 'Need a new reset link?'
    });
  };

  const updateNewPassword = (value) => {
    setNewPassword(value);
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: '' }));
    }
  };

  const updateConfirmPassword = (value) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, text: '', color: theme.colors.outline };
    
    let strength = 0;
    const checks = [
      newPassword.length >= 6,
      /[A-Z]/.test(newPassword),
      /[a-z]/.test(newPassword),
      /\d/.test(newPassword),
      /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength <= 2) return { strength, text: 'Weak', color: theme.colors.error };
    if (strength <= 3) return { strength, text: 'Fair', color: '#ff9800' };
    if (strength <= 4) return { strength, text: 'Good', color: theme.colors.primary };
    return { strength, text: 'Strong', color: '#4caf50' };
  };

  const passwordStrength = getPasswordStrength();
  const SafeWrapper = Platform.OS === 'web' ? View : require('react-native-safe-area-context').SafeAreaView;

  return (
    <SafeWrapper style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Reset Password</Text>
          <Text style={styles.subtitle}>Create your new secure password</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>New Password</Title>
            
            <Text style={resetPasswordStyles.instructionText}>
              Choose a strong password with at least 6 characters including uppercase, lowercase, and numbers.
            </Text>

            {email && (
              <Text style={resetPasswordStyles.emailText}>Account: {email}</Text>
            )}
            
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={updateNewPassword}
              secureTextEntry={!showNewPassword}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showNewPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowNewPassword(!showNewPassword)}
                />
              }
              disabled={loading}
              error={!!errors.newPassword}
            />
            
            {newPassword.length > 0 && (
              <View style={resetPasswordStyles.strengthContainer}>
                <View style={resetPasswordStyles.strengthBar}>
                  <View 
                    style={[
                      resetPasswordStyles.strengthFill,
                      { 
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]} 
                  />
                </View>
                <Text style={[resetPasswordStyles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
            
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword}
            </HelperText>

            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={updateConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              mode="outlined"
              style={[styles.input, { marginTop: 0 }]}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              disabled={loading}
              error={!!errors.confirmPassword}
            />
            
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleResetPassword}
              style={[styles.loginButton, { marginTop: 10 }]}
              disabled={loading || !newPassword || !confirmPassword}
              loading={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <View style={resetPasswordStyles.actionButtons}>
              <Button
                mode="text"
                onPress={navigateToLogin}
                style={styles.forgotButton}
                disabled={loading}
              >
                Back to Login
              </Button>
              
              <Button
                mode="text"
                onPress={navigateToForgotPassword}
                style={styles.forgotButton}
                disabled={loading}
              >
                Get New Link
              </Button>
            </View>
          </Card.Content>
        </Card>

        {loading && (
          <View style={resetPasswordStyles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={resetPasswordStyles.loadingText}>Resetting your password...</Text>
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={6000}
        style={styles.snackbar}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeWrapper>
  );
};

const resetPasswordStyles = StyleSheet.create({
  instructionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    backgroundColor: theme.colors.primaryContainer,
    padding: 8,
    borderRadius: 4,
  },
  strengthContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ResetPasswordScreen;