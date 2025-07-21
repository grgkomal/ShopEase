//utils/auth.js

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCache(token, name, email, phone, user_id) {
  try {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('name', name);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('phone', phone);
    if (user_id) await AsyncStorage.setItem('user_id', user_id.toString());
  } catch (error) {
    console.error('Error storing user info', error);
  }
};

export async function getCache() {
  try {
    const [token, name, email, phone, user_id] = await Promise.all([
      AsyncStorage.getItem('userToken'),
      AsyncStorage.getItem('name'),
      AsyncStorage.getItem('email'),
      AsyncStorage.getItem('phone'),
      AsyncStorage.getItem('user_id'),
    ]);
    return { token, name, email, phone, user_id };
  } catch (error) {
    console.error('Error retrieving user info', error);
    return null;
  }
};


// Remove all cached items
export async function clearCache() {
  await AsyncStorage.multiRemove([
    'userToken',
    'name',
    'email',
    'phone',
    'user_id',
  ]);
}

// Fetch only the token
export async function getToken() {
  return await AsyncStorage.getItem('userToken');
}

