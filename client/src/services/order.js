import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

export const getOrders = async () => {
  try {
    console.log('Fetching user orders...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/orders', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Orders fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Orders Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch orders'
    };
  }
};

export const getOrderDetails = async (order_id) => {
  try {
    console.log('=== GET ORDER DETAILS DEBUG START ===');
    console.log('1. Input order_id:', order_id);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/orders/${order_id}`;
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
    console.log('=== GET ORDER DETAILS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== GET ORDER DETAILS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== GET ORDER DETAILS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to fetch order details'
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

export const formatOrderDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00';
  
  try {
    return `₹${parseFloat(amount).toFixed(2)}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `₹${amount}`;
  }
};

export const formatOrderAddress = (order) => {
  if (!order) return 'Address not available';
  
  const parts = [];
  if (order.building) parts.push(order.building);
  if (order.area) parts.push(order.area);
  if (order.pincode) parts.push(order.pincode);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};