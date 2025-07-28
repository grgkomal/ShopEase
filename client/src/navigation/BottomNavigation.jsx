// src/components/BottomNavigation.jsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../theme/theme';

const navItems = [
  { name: 'Home', icon: 'home', route: 'Home' },
  { name: 'Products', icon: 'shopping-bag', route: 'Products' },
  { name: 'Order', icon: 'receipt', route: 'Order' },
  { name: 'Cart', icon: 'shopping-cart', route: 'Cart' },
  { name: 'Account', icon: 'person', route: 'Account' },
];

const BottomNavigation = ({ navigation, activeRoute }) => {
  return (
    <View style={styles.bottomNavigation}>
      {navItems.map(item => {
        const focused = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              focused && styles.activeNavItem
            ]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Icon
              name={item.icon}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text style={[
              styles.navText,
              focused && styles.activeNavText
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;

const styles = StyleSheet.create({
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.onSurfaceDisabled,
    elevation: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  activeNavItem: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  navText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  activeNavText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
