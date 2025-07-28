
// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { theme } from './src/theme/theme';

import SplashScreen from './src/screens/SplashScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import AccountScreen from './src/screens/AccountScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
  
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: '#fff',
          }}
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ title: 'Sign In' }}
          />
        
          <Stack.Screen 
            name="ForgotPassword" 
            component={ForgotPasswordScreen} 
            options={{ title: 'Forgot Password' }}
          />

          <Stack.Screen 
            name="Account" 
            component={AccountScreen} 
            options={{ title: 'My Account' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Profile' }}
          />

        </Stack.Navigator>
      </NavigationContainer>
                                                    
    </PaperProvider>
  );
}

