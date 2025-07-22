// src/screens/SplashScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { theme } from '../theme/theme';
import { getCache } from '../utils/auth';
const SplashScreen = ({ navigation }) => {
  const [checking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cached = await getCache();  // await the stored data
      const token = cached?.token;
      const nextScreen = token ? 'Account' : 'Login';
      

      setTimeout(() => {
        navigation.replace(nextScreen);
      }, 1000);
    };

    init();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logoText}>🛒</Text>
        <Text style={styles.title}>SHOP EASE</Text>
        <Text style={styles.subtitle}>
          Refreshingly Easy Groceries | Shop Smart, Eat Happy!
        </Text>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 100,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});

export default SplashScreen;