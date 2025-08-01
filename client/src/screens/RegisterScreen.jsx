// src/screens/RegisterScreen.jsx
import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp } from '../services/user';
import { styles } from '../theme/styles';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      setSnackbarMessage('Please fill in all fields');
      setSnackbarVisible(true);
      return;
    }

    if (!validateEmail(email)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarVisible(true);
      return;
    }

    if (!validatePhone(phone)) {
      setSnackbarMessage('Please enter a valid 10-digit phone number');
      setSnackbarVisible(true);
      return;
    }

    if (password.length < 6) {
      setSnackbarMessage('Password must be at least 6 characters long');
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage('Passwords do not match');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(name, email, password, phone);
      
      if (result.status === 'success' || result.success === true) {
        setSnackbarMessage('Registration successful! Please login.');
        setSnackbarVisible(true);
        
        // Clear form
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        
        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        setSnackbarMessage(result.message || 'Registration failed');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setSnackbarMessage('Registration failed. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
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
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              autoCapitalize="words"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="phone" />}
              placeholder="10-digit phone number"
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
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
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.loginButton}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Already have an account? </Text>
          <Button
            mode="text"
            onPress={navigateToLogin}
            style={styles.registerButton}
          >
            Login
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

export default RegisterScreen;