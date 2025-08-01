import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

// Get all active employees
export const getAllEmployees = async () => {
  try {
    console.log('Fetching all active employees...');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get('/admin/employees', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Active employees fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Active Employees Error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch active employees'
    };
  }
};

// Get all inactive employees
export const getInactiveEmployees = async () => {
  try {
    console.log('=== GET INACTIVE EMPLOYEES DEBUG START ===');
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const response = await api.get('/admin/employees/inactive', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('4. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== GET INACTIVE EMPLOYEES DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== GET INACTIVE EMPLOYEES ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== GET INACTIVE EMPLOYEES ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to fetch inactive employees'
    };
  }
};

// Get all customers
export const getAllCustomers = async () => {
  try {
    console.log('=== GET ALL CUSTOMERS DEBUG START ===');
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const response = await api.get('/admin/customers', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('4. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== GET ALL CUSTOMERS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== GET ALL CUSTOMERS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== GET ALL CUSTOMERS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to fetch customers'
    };
  }
};

// Toggle employee status (activate/deactivate)
export const toggleEmployeeStatus = async (email, isActive) => {
  try {
    console.log('=== TOGGLE EMPLOYEE STATUS DEBUG START ===');
    console.log('1. Input email:', email);
    console.log('2. Input isActive:', isActive);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const requestData = { is_active: isActive };
    console.log('5. Request data:', requestData);
    
    console.log('6. Making PATCH request...');
    const response = await api.patch(`/admin/employees/${email}/toggle`, requestData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('7. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== TOGGLE EMPLOYEE STATUS DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== TOGGLE EMPLOYEE STATUS ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== TOGGLE EMPLOYEE STATUS ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to toggle employee status'
    };
  }
};

// Update user role
export const updateUserRole = async (userId, role) => {
  try {
    console.log('=== UPDATE USER ROLE DEBUG START ===');
    console.log('1. Input userId:', userId);
    console.log('2. Input role:', role);
    
    const { token } = await getCache();
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const requestData = { role: role };
    console.log('5. Request data:', requestData);
    
    console.log('6. Making PATCH request...');
    const response = await api.patch(`/admin/role/${userId}`, requestData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('7. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== UPDATE USER ROLE DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== UPDATE USER ROLE ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('=== UPDATE USER ROLE ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update user role'
    };
  }
};