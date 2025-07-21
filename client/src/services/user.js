import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';
import api from './api';

// Sign In
export async function login(email, password) {
  try {
    const body = { email, password };
    const url = `${config.server}/users/signin`;
    console.log('Login request to:', url);
    const response = await axios.post(url, body);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Sign In Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
    };
  }
}

// Sign In
export async function adminlogin(email, password) {
  try {
    const body = { email, password };
    const url = `${config.server}/users/adminsignin`;
    console.log('Login request to:', url);
    const response = await axios.post(url, body);
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Sign In Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
    };
  }
}


// Sign Up
export async function signUp(name, email, password, phone) {
  try {
    const body = { name, email, password, phone };
    const url = `${config.server}/users/signup`;
    console.log('SignUp request to:', url);
    const response = await axios.post(url, body);
    console.log('SignUp response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Sign Up Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Registration failed' 
    };
  }
}

// Get User by Email (using api instance - recommended)
export const getUserByEmail = async (email) => {
  try {
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get(`/users/byemail/${encodeURIComponent(email)}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get User by Email Error:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    console.log('Fetching current user data');
    const { token } = await getCache();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await api.get(`/users/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Current user data fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Current User Error:', error.response?.data || error.message);
    throw error;
  }
};

// Get User by ID - Fixed to include authentication
export async function getUserById(user_id) {
  try {
    const { token } = await getCache();
    if (!token) {
      return { success: false, message: 'No authentication token found' };
    }
    
    const url = `${config.server}/users/${user_id}`;
    console.log('Get user by ID request to:', url);
    
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Get user by ID response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get User by ID Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to fetch user by ID' 
    };
  }
}

// 1. First, let's create a comprehensive debug version of updateUser
export const updateUser = async (user_id, userData, setLoading) => {
  try {
    console.log('=== UPDATE USER DEBUG START ===');
    console.log('1. Input parameters:');
    console.log('   user_id:', user_id);
    console.log('   userData:', JSON.stringify(userData, null, 2));
    
    if (setLoading) setLoading(true);
    
    // Debug: Check cache
    console.log('2. Getting cache...');
    const cache = await getCache();
    console.log('   Cache result:', cache);
    
    const { token } = cache;
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    // Debug: Build URL
    const url = `${config.server}/users/${user_id}`;
    console.log('3. Request URL:', url);
    console.log('   config.server:', config.server);
    
    // Debug: Build headers
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('4. Request headers:', headers);
    
    // Debug: Make request
    console.log('5. Making PUT request...');
    const response = await axios.put(url, userData, { headers });
    
    console.log('6. Response received:');
    console.log('   Status:', response.status);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
    console.log('=== UPDATE USER DEBUG END ===');
    
    return response.data;
    
  } catch (error) {
    console.log('=== UPDATE USER ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    console.log('Error response:', error.response);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      console.log('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.log('Request was made but no response:', error.request);
    }
    
    console.log('=== UPDATE USER ERROR END ===');
    
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || 'Failed to update user'
    };
  } finally {
    if (setLoading) setLoading(false);
  }
};

// 2. Alternative version using different HTTP methods
export const updateUserPatch = async (user_id, userData, setLoading) => {
  try {
    if (setLoading) setLoading(true);
    const { token } = await getCache();
    
    const response = await axios.patch(`${config.server}/users/${user_id}`, userData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PATCH Update Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update user with PATCH'
    };
  } finally {
    if (setLoading) setLoading(false);
  }
};

// 3. Version using the api instance (which should handle auth automatically)
export const updateUserWithApi = async (user_id, userData, setLoading) => {
  try {
    console.log('Using API instance for update');
    console.log('User ID:', user_id);
    console.log('Data:', userData);
    
    if (setLoading) setLoading(true);
    
    const response = await api.put(`/users/${user_id}`, userData);
    console.log('API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('API Update Error:', error.response?.data || error.message);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update user with API'
    };
  } finally {
    if (setLoading) setLoading(false);
  }
};

// 4. Test function to check all endpoints
export const testUpdateMethods = async (user_id, userData, setLoading) => {
  console.log('=== TESTING ALL UPDATE METHODS ===');
  
  // Method 1: PUT with axios
  console.log('Testing Method 1: PUT with axios');
  const result1 = await updateUser(user_id, userData, setLoading);
  console.log('Result 1:', result1);
  
  // Method 2: PATCH with axios
  console.log('Testing Method 2: PATCH with axios');
  const result2 = await updateUserPatch(user_id, userData, setLoading);
  console.log('Result 2:', result2);
  
  // Method 3: PUT with api instance
  console.log('Testing Method 3: PUT with api instance');
  const result3 = await updateUserWithApi(user_id, userData, setLoading);
  console.log('Result 3:', result3);
  
  return { result1, result2, result3 };
};


// Fixed Change Password function with multiple endpoint attempts
export async function changePassword(currentPassword, newPassword) {
  try {
    // Get cached data including user ID
    const cachedData = await getCache();
    if (!cachedData || !cachedData.token) {
      return { success: false, message: 'No authentication token found' };
    }

    const body = { 
      currentPassword, 
      newPassword,
      // Some APIs expect different field names
      oldPassword: currentPassword,
      password: newPassword
    };

    // Try different common endpoint patterns
    const endpoints = [
      // Most common patterns
      `${config.server}/users/changepassword`,
      
      // If user ID is available, try user-specific endpoints
      ...(cachedData.user_id ? [
        `${config.server}/users/${cachedData.user_id}/password`,
        `${config.server}/users/${cachedData.user_id}/changepassword`
      ] : []),
      
      // Original endpoint as fallback
      `${config.server}/users/changepassword`
    ];

    const headers = {
      Authorization: `Bearer ${cachedData.token}`,
      'Content-Type': 'application/json'
    };

    // Try each endpoint until one works
    for (const url of endpoints) {
      try {
        console.log(`Trying change password endpoint: ${url}`);
        
        // Try different HTTP methods
        const methods = ['PATCH', 'PUT', 'POST'];
        
        for (const method of methods) {
          try {
            console.log(`Trying ${method} ${url}`);
            
            const response = await axios({
              method: method.toLowerCase(),
              url: url,
              data: body,
              headers: headers
            });

            console.log('Change password response:', response.data);
            
            // Return success if we get here
            if (response.data) {
              return response.data.success !== false ? 
                { success: true, message: 'Password changed successfully', ...response.data } :
                response.data;
            }
            
            return { success: true, message: 'Password changed successfully' };
            
          } catch (methodError) {
            // If it's not a 404 or 405 (Method Not Allowed), this might be the right endpoint
            if (methodError.response && 
                methodError.response.status !== 404 && 
                methodError.response.status !== 405) {
              
              console.error(`Error with ${method} ${url}:`, methodError.response.data);
              return {
                success: false,
                message: methodError.response?.data?.message || 
                        methodError.response?.data?.error || 
                        'Password change failed'
              };
            }
            // Otherwise, continue trying other methods/endpoints
            console.log(`${method} ${url} failed, trying next...`);
          }
        }
        
      } catch (endpointError) {
        console.log(`Endpoint ${url} failed, trying next...`);
        continue;
      }
    }
    
    // If all endpoints failed
    return {
      success: false,
      message: 'Change password endpoint not found. Please check your API configuration.'
    };
    
  } catch (error) {
    console.error('Change Password Error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to change password'
    };
  }
}




// Forgot Password (public endpoint - no auth required)
export async function forgotPassword(email) {
  try {
    const body = { email };
    const url = `${config.server}/users/forgot-password`;
    console.log('Forgot password request to:', url);
    const response = await axios.post(url, body);
    console.log('Forgot password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to process forgot password request' 
    };
  }
}

// Verify OTP (public endpoint - no auth required)
export async function verifyOTP(email, otp) {
  try {
    const body = { email, otp };
    const url = `${config.server}/users/verify-otp`;
    console.log('Verify OTP request to:', url);
    const response = await axios.post(url, body);
    console.log('Verify OTP response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to verify OTP' 
    };
  }
}

// Reset Password (public endpoint - no auth required)
export async function resetPassword(resetToken, newPassword) {
  try {
    const body = { token: resetToken, newPassword };
    const url = `${config.server}/users/reset-password`;
    console.log('Reset password request to:', url);
    const response = await axios.post(url, body);
    console.log('Reset password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reset Password Error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to reset password' 
    };
  }
}
