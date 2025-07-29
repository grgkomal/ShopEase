
import { getCache } from '../utils/auth';
import api from './api';

export const getAllOrders = async () => {
  try {
    console.log('Fetching all orders for admin...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/orders', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Orders fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get All Orders Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch orders'
    };
  }
};

export const getDashboardSummary = async () => {
  try {
    console.log('Fetching dashboard summary...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/dashboard', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Dashboard summary fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Dashboard Summary Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch dashboard summary'
    };
  }
};

export const getOrderDetails = async (orderId) => {
  try {
    console.log('=== GET ORDER DETAILS DEBUG START ===');
    console.log('1. Input orderId:', orderId);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const response = await api.get(`/admin/orders/${orderId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order details fetched successfully:', response.data);
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

export const updateOrderStatus = async (orderId, orderStatus) => {
  try {
    console.log('=== UPDATE ORDER STATUS DEBUG START ===');
    console.log('1. Input parameters:');
    console.log('   orderId:', orderId);
    console.log('   orderStatus:', orderStatus);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const requestData = { order_status: orderStatus };
    console.log('4. Request data:', requestData);
    
    const response = await api.patch(`/admin/orders/${orderId}/status`, requestData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Order status updated successfully:', response.data);
    console.log('=== UPDATE ORDER STATUS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== UPDATE ORDER STATUS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== UPDATE ORDER STATUS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update order status'
    };
  }
};

// Get customer orders
export const getCustomerOrders = async () => {
  try {
    console.log('Fetching customer orders...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/orders/CUSTOMER', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Customer orders fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Customer Orders Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch customer orders'
    };
  }
};

// Get orders summary for dashboard
export const getOrdersSummary = async () => {
  try {
    console.log('Fetching orders summary...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/orders/summary', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Orders summary fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Orders Summary Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch orders summary'
    };
  }
};
