

import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

// Get all user's delivery addresses
export const getAddresses = async () => {
  try {
    console.log('Fetching delivery addresses...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/addresses', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Addresses fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Addresses Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch addresses'
    };
  }
};

// Add new delivery address
export const addAddress = async (addressData) => {
  try {
    console.log('=== ADD ADDRESS DEBUG START ===');
    console.log('1. Input addressData:', JSON.stringify(addressData, null, 2));
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/addresses`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making POST request...');
    const response = await axios.post(url, addressData, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== ADD ADDRESS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== ADD ADDRESS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== ADD ADDRESS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to add address'
    };
  }
};

// Update delivery address
export const updateAddress = async (address_id, addressData) => {
  try {
    console.log('=== UPDATE ADDRESS DEBUG START ===');
    console.log('1. Input parameters:');
    console.log('   address_id:', address_id);
    console.log('   addressData:', JSON.stringify(addressData, null, 2));
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/addresses/${address_id}`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making PUT request...');
    const response = await axios.put(url, addressData, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== UPDATE ADDRESS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== UPDATE ADDRESS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== UPDATE ADDRESS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update address'
    };
  }
};

// Delete delivery address
export const deleteAddress = async (address_id) => {
  try {
    console.log('=== DELETE ADDRESS DEBUG START ===');
    console.log('1. Input address_id:', address_id);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/addresses/${address_id}`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making DELETE request...');
    const response = await axios.delete(url, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== DELETE ADDRESS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== DELETE ADDRESS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== DELETE ADDRESS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to delete address'
    };
  }
};
