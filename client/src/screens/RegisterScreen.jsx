// src/screens/RegisterScreen.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { register } = getCache();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword, phone } = formData;

    if (!name.trim()) {
      setSnackbarMessage('Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      setSnackbarMessage('Please enter your email address');
      return false;
    }

    if (!isValidEmail(email)) {
      setSnackbarMessage('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setSnackbarMessage('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      return false;
    }

    if (!phone.trim()) {
      setSnackbarMessage('Please enter your phone number');
      return false;
    }

    if (phone.length < 10) {
      setSnackbarMessage('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        User_role: 'customer',
      };

      const result = await register(userData);
      
      if (result.success) {
        setSnackbarMessage('Registration successful! Please login to continue.');
        setSnackbarVisible(true);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        setSnackbarMessage(result.message || 'Registration failed');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Registration failed. Please try again.');
      setSnackbarVisible(true);
    }
    setLoading(false);
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subtitle}>Join GroceryStore today</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Sign Up</Title>
            
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
            />

            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              error={formData.email && !isValidEmail(formData.email)}
            />

            <TextInput
              label="Phone Number"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
            />

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              error={formData.confirmPassword && formData.password !== formData.confirmPassword}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Button
            mode="text"
            onPress={navigateToLogin}
            style={styles.loginButton}
          >
            Login
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={300}
        style={[styles.snackbar, { backgroundColor: snackbarMessage.includes('successful') ? theme.colors.primary : theme.colors.error }]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

export default RegisterScreen;
