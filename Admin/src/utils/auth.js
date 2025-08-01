
// utils/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setCache(token, name, email, phone, user_id, User_role) {
  try {
    const cacheData = {
      userToken: token,
      name: name,
      email: email,
      phone: phone,
      user_id: user_id?.toString(),
      User_role: User_role
    };

    // Store all data
    await Promise.all([
      AsyncStorage.setItem('userToken', token || ''),
      AsyncStorage.setItem('name', name || ''),
      AsyncStorage.setItem('email', email || ''),
      AsyncStorage.setItem('phone', phone || ''),
      AsyncStorage.setItem('user_id', user_id?.toString() || ''),
      AsyncStorage.setItem('User_role', User_role || ''),
    ]);

    console.log('User data cached successfully:', cacheData);
  } catch (error) {
    console.error('Error storing user info:', error);
    throw error;
  }
}

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
    console.error('Error retrieving user info:', error);
    return null;
  }
}

export async function clearCache() {
  try {
    await AsyncStorage.multiRemove([
      'userToken',
      'name',
      'email',
      'phone',
      'user_id',
      'User_role',
    ]);
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
}

export async function getToken() {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function isAdmin() {
  try {
    const userRole = await AsyncStorage.getItem('User_role');
    return userRole === 'ADMIN';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
