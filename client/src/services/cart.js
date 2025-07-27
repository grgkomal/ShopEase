
import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

// Get user's cart items
export const getCart = async () => {
  try {
    console.log('Fetching cart items...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/cart', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Cart items fetched successfully:', response.data);
    return response.data;
    } catch (error) {
    console.error('Get Cart Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch cart items'
    };
  }
};

// Add item to cart
export const addToCart = async (cartData) => {
  try {
    console.log('=== ADD TO CART DEBUG START ===');
    console.log('1. Input cartData:', JSON.stringify(cartData, null, 2));
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/cart`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making POST request...');
    const response = await axios.post(url, cartData, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== ADD TO CART DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== ADD TO CART ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== ADD TO CART ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to add item to cart'
    };
  }
};

// Update cart item quantity
export const updateCartItem = async (cart_id, cartData) => {
  try {
    console.log('=== UPDATE CART ITEM DEBUG START ===');
    console.log('1. Input parameters:');
    console.log('   cart_id:', cart_id);
    console.log('   cartData:', JSON.stringify(cartData, null, 2));
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/cart/${cart_id}`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making PUT request...');
    const response = await axios.put(url, cartData, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== UPDATE CART ITEM DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== UPDATE CART ITEM ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== UPDATE CART ITEM ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update cart item'
    };
  }
};

// Remove item from cart
export const removeCartItem = async (cart_id) => {
  try {
    console.log('=== REMOVE CART ITEM DEBUG START ===');
    console.log('1. Input cart_id:', cart_id);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/cart/${cart_id}`;
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
    console.log('=== REMOVE CART ITEM DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== REMOVE CART ITEM ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== REMOVE CART ITEM ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to remove cart item'
    };
  }
};

// Clear entire cart
export const clearCart = async () => {
  try {
    console.log('=== CLEAR CART DEBUG START ===');
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/cart/clear`;
    console.log('1. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('2. Request headers:', headers);
    
    console.log('3. Making DELETE request...');
    const response = await axios.delete(url, { headers });
    
    console.log('4. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== CLEAR CART DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== CLEAR CART ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== CLEAR CART ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to clear cart'
    };
  }
};


export const clearCartWithApi = async () => {
  try {
    console.log('Using API instance for clearing cart');
    
    const response = await api.delete('/cart/clear');
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API Clear Cart Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to clear cart with API'
    };
  }
};

export const createOrder = async (orderData) => {
  try {
    console.log('=== CREATE ORDER DEBUG START ===');
    console.log('1. Input orderData:', JSON.stringify(orderData, null, 2));
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/orders`;
    console.log('2. Request URL:', url);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('3. Request headers:', headers);
    
    console.log('4. Making POST request...');
    const response = await axios.post(url, orderData, { headers });
    
    console.log('5. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== CREATE ORDER DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== CREATE ORDER ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== CREATE ORDER ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to create order'
    };
  }
};