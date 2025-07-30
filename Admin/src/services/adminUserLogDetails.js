import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

// Get all user activity logs
export const getAllUserLogs = async () => {
  try {
    console.log('Fetching all user logs...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/logs', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('User logs fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get User Logs Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch user logs'
    };
  }
};

// Get logs for specific user
export const getUserLogsByUserId = async (user_id) => {
  try {
    console.log('=== GET USER LOGS BY USER ID DEBUG START ===');
    console.log('1. Input user_id:', user_id);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/admin/logs/user/${user_id}`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making GET request...');
    const response = await axios.get(url, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== GET USER LOGS BY USER ID DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== GET USER LOGS BY USER ID ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== GET USER LOGS BY USER ID ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to fetch user logs'
    };
  }
};

// Get today's activity logs
export const getTodayUserLogs = async () => {
  try {
    console.log('=== GET TODAY USER LOGS DEBUG START ===');
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/admin/logs/today`;
    console.log('1. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('2. Request headers:', headers);
    
    console.log('3. Making GET request...');
    const response = await axios.get(url, { headers });
    
    console.log('4. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== GET TODAY USER LOGS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== GET TODAY USER LOGS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== GET TODAY USER LOGS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to fetch today\'s user logs'
    };
  }
};

// Alternative version using api instance for all logs
export const getAllUserLogsWithApi = async () => {
  try {
    console.log('Using API instance for fetching all user logs');
    
    const response = await api.get('/admin/logs');
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API Get All User Logs Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch all user logs with API'
    };
  }
};

// Alternative version using api instance for user specific logs
export const getUserLogsByUserIdWithApi = async (user_id) => {
  try {
    console.log('Using API instance for fetching user logs by user ID');
    console.log('User ID:', user_id);
    
    const response = await api.get(`/admin/logs/user/${user_id}`);
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API Get User Logs By User ID Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch user logs by user ID with API'
    };
  }
};

// Alternative version using api instance for today's logs
export const getTodayUserLogsWithApi = async () => {
  try {
    console.log('Using API instance for fetching today\'s user logs');
    
    const response = await api.get('/admin/logs/today');
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API Get Today User Logs Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch today\'s user logs with API'
    };
  }
};

// Test function to check all endpoints
export const testUserLogsMethods = async (user_id) => {
  console.log('=== TESTING ALL USER LOGS METHODS ===');
  
  // Method 1: Get all user logs
  console.log('Testing Method 1: Get all user logs');
  const result1 = await getAllUserLogs();
  console.log('Result 1:', result1);
  
  // Method 2: Get user logs by user ID
  console.log('Testing Method 2: Get user logs by user ID');
  const result2 = await getUserLogsByUserId(user_id);
  console.log('Result 2:', result2);
  
  // Method 3: Get today's user logs
  console.log('Testing Method 3: Get today\'s user logs');
  const result3 = await getTodayUserLogs();
  console.log('Result 3:', result3);
  
  // Method 4: Get all user logs with API instance
  console.log('Testing Method 4: Get all user logs with API instance');
  const result4 = await getAllUserLogsWithApi();
  console.log('Result 4:', result4);
  
  return { result1, result2, result3, result4 };
};