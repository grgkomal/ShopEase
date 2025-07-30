// src/screens/AccountScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { getCache, removeCache } from '../utils/auth';
import { theme } from '../theme/theme';

const AccountScreen = ({ navigation }) => {
  const [user, setUser] = useState({ first_name: 'Guest', last_name: '', email: '' });

  useEffect(() => {
    async function loadUser() {
      const cached = await getCache();
      if (cached) {
        setUser({
          first_name: cached.name || 'Guest',
          last_name: '',
          email: cached.email || '',
        });
      }
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await removeCache();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { title: 'My Profile', icon: '👤', onPress: () => navigation.navigate('Profile') },
    { title: 'Order History', icon: '📦', onPress: () => navigation.navigate('Order')  },
    { title: 'Addresses', icon: '📍', onPress: () => navigation.navigate('Location') },
    { title: 'Payment Methods', icon: '💳', onPress: () => Alert.alert('Coming Soon, CASH ON DELIVERY') },
    { title: 'Settings', icon: '⚙️', onPress: () => Alert.alert('Coming Soon, Settings coming soon!') },
    { title: 'Help & Support', icon: '❓', onPress: () => Alert.alert('Coming Soon, Help and Support coming soon!')},
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.first_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>ShopEase v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default AccountScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userInfo: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    marginBottom: 20,
    marginHorizontal: 20,
    marginTop:18,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuContainer: {
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    marginVertical: 40,
  },
  appInfoText: {
    fontSize: 14,
    color: '#999',
  },
});
