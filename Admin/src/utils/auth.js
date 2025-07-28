//utils/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCache(token, name, email, phone, user_id, User_role) {
  try {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('name', name);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('phone', phone);
    await AsyncStorage.setItem('User_role', User_role); // Store user role
    
    if (user_id) await AsyncStorage.setItem('user_id', user_id.toString());
  } catch (error) {
    console.error('Error storing user info', error);
  }
};

export async function getCache() {
  try {
    const [token, name, email, phone, user_id, User_role] = await Promise.all([
      AsyncStorage.getItem('userToken'),
      AsyncStorage.getItem('name'),
      AsyncStorage.getItem('email'),
      AsyncStorage.getItem('phone'),
      AsyncStorage.getItem('user_id'),
      AsyncStorage.getItem('User_role'),
    ]);
    return { token, name, email, phone, user_id, User_role };
  } catch (error) {
    console.error('Error retrieving user info', error);
    return null;
  }
};

export async function clearCache() {
  await AsyncStorage.multiRemove([
    'userToken',
    'name',
    'email',
    'phone',
    'user_id',
    'User_role',
  ]);
}

export async function getToken() {
  return await AsyncStorage.getItem('userToken') || AsyncStorage.getItem('user_role') ;
}

