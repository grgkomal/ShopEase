//services/user.js
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
    
    console.log('2. Getting cache...');
    const cache = await getCache();
    console.log('   Cache result:', cache);
    
    const { token } = cache;
    if (!token) {
      console.log('❌ No token found in cache');
      return { success: false, message: 'No authentication token found' };
    }
    console.log('✅ Token found:', token.substring(0, 20) + '...');
    
    const url = `${config.server}/users/${user_id}`;
    console.log('3. Request URL:', url);
    console.log('   config.server:', config.server);
    
    const headers = { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    console.log('4. Request headers:', headers);
    
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
  
  console.log('Testing Method 1: PUT with axios');
  const result1 = await updateUser(user_id, userData, setLoading);
  console.log('Result 1:', result1);
  
  console.log('Testing Method 2: PATCH with axios');
  const result2 = await updateUserPatch(user_id, userData, setLoading);
  console.log('Result 2:', result2);
  
  console.log('Testing Method 3: PUT with api instance');
  const result3 = await updateUserWithApi(user_id, userData, setLoading);
  console.log('Result 3:', result3);
  
  return { result1, result2, result3 };
};


// Change Password function with multiple endpoint attempts
export async function changePassword(currentPassword, newPassword) {
  try {
    const cachedData = await getCache();
    if (!cachedData || !cachedData.token) {
      return { success: false, message: 'No authentication token found' };
    }

    const body = { 
      currentPassword, 
      newPassword,
      oldPassword: currentPassword,
      password: newPassword
    };

    const endpoints = [
      `${config.server}/users/changepassword`,
      
      ...(cachedData.user_id ? [
        `${config.server}/users/${cachedData.user_id}/password`,
        `${config.server}/users/${cachedData.user_id}/changepassword`
      ] : []),
      
      `${config.server}/users/changepassword`
    ];

    const headers = {
      Authorization: `Bearer ${cachedData.token}`,
      'Content-Type': 'application/json'
    };

    for (const url of endpoints) {
      try {
        console.log(`Trying change password endpoint: ${url}`);
        
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
            
            if (response.data) {
              return response.data.success !== false ? 
                { success: true, message: 'Password changed successfully', ...response.data } :
                response.data;
            }
            
            return { success: true, message: 'Password changed successfully' };
            
          } catch (methodError) {
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
            console.log(`${method} ${url} failed, trying next...`);
          }
        }
        
      } catch (endpointError) {
        console.log(`Endpoint ${url} failed, trying next...`);
        continue;
      }
    }
    
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

// Reset Password function with multiple endpoint attempts (similar to changePassword logic)
export async function resetPassword(resetToken, newPassword) {
  try {
    console.log('=== RESET PASSWORD DEBUG START ===');
    console.log('1. Input parameters:');
    console.log('   resetToken:', resetToken ? 'Present' : 'Missing');
    console.log('   newPassword length:', newPassword ? newPassword.length : 0);

    if (!resetToken) {
      console.log('❌ No reset token provided');
      return { success: false, message: 'Reset token is required' };
    }

    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Invalid password');
      return { success: false, message: 'Password must be at least 6 characters long' };
    }

    const body = {
      token: resetToken,
      newPassword: newPassword,
      resetToken: resetToken,
      password: newPassword,
      newPass: newPassword
    };

    console.log('2. Request body prepared:', { ...body, newPassword: '[HIDDEN]', password: '[HIDDEN]', newPass: '[HIDDEN]' });

    const endpoints = [
      `${config.server}/users/reset-password`,
      `${config.server}/users/resetpassword`,
      `${config.server}/users/password-reset`,
      `${config.server}/auth/reset-password`,
      `${config.server}/auth/resetpassword`,
      
      `${config.server}/users/reset`,
      `${config.server}/password/reset`,
      `${config.server}/api/users/reset-password`,
      `${config.server}/api/auth/reset-password`
    ];

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log('3. Trying endpoints:', endpoints.length);

    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      
      try {
        console.log(`4.${i + 1}. Trying reset password endpoint: ${url}`);
        
        const methods = ['POST', 'PUT', 'PATCH'];
        
        for (const method of methods) {
          try {
            console.log(`   Trying ${method} ${url}`);
            
            const response = await axios({
              method: method.toLowerCase(),
              url: url,
              data: body,
              headers: headers,
              timeout: 30000 
            });

            console.log(`✅ Success with ${method} ${url}`);
            console.log('   Response status:', response.status);
            console.log('   Response data:', response.data);
            
            if (response.data) {
              
              if (response.data.success === true || 
                  response.data.status === 'success' || 
                  response.data.message?.toLowerCase().includes('success') ||
                  response.status === 200) {
                
                console.log('=== RESET PASSWORD SUCCESS ===');
                return {
                  success: true,
                  status: 'success',
                  message: response.data.message || 'Password reset successfully',
                  ...response.data
                };
              }
              
              if (response.data.success !== false && response.status === 200) {
                console.log('=== RESET PASSWORD SUCCESS (assumed) ===');
                return {
                  success: true,
                  status: 'success',
                  message: response.data.message || 'Password reset successfully',
                  ...response.data
                };
              }
              
              console.log('❌ API returned error in response data');
              return {
                success: false,
                message: response.data.message || response.data.error || 'Password reset failed',
                ...response.data
              };
            }
            
            if (response.status === 200 || response.status === 201) {
              console.log('=== RESET PASSWORD SUCCESS (no data) ===');
              return { 
                success: true, 
                status: 'success',
                message: 'Password reset successfully' 
              };
            }
            
          } catch (methodError) {
            console.log(`   ${method} ${url} failed:`, methodError.response?.status || methodError.message);
            
            if (methodError.response && 
                methodError.response.status !== 404 && 
                methodError.response.status !== 405 &&
                methodError.response.status !== 501) { 
              
              const errorData = methodError.response.data;
              const statusCode = methodError.response.status;
              
              console.error(`❌ Error with ${method} ${url}:`, errorData);
              
              let errorMessage = 'Password reset failed';
              
              if (statusCode === 400) {
                errorMessage = errorData?.message || 'Invalid reset token or password';
              } else if (statusCode === 401) {
                errorMessage = errorData?.message || 'Reset token has expired or is invalid';
              } else if (statusCode === 403) {
                errorMessage = errorData?.message || 'Access denied';
              } else if (statusCode === 422) {
                errorMessage = errorData?.message || 'Invalid input data';
              } else if (statusCode >= 500) {
                errorMessage = errorData?.message || 'Server error. Please try again later';
              } else {
                errorMessage = errorData?.message || errorData?.error || 'Password reset failed';
              }
              
              return {
                success: false,
                status: 'error',
                message: errorMessage,
                statusCode: statusCode,
                ...errorData
              };
            }
          
          }
        }
        
      } catch (endpointError) {
        console.log(`   Endpoint ${url} completely failed:`, endpointError.message);
        continue;
      }
    }
    
    console.log('❌ All reset password endpoints failed');
    console.log('=== RESET PASSWORD DEBUG END ===');
    
    return {
      success: false,
      status: 'error',
      message: 'Reset password service is currently unavailable. Please try again later or contact support.'
    };
    
  } catch (error) {
    console.log('=== RESET PASSWORD ERROR DEBUG ===');
    console.log('Error object:', error);
    console.log('Error message:', error.message);
    console.log('Error response:', error.response);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      console.log('Response headers:', error.response.headers);
    }
    
    if (error.request) {
      console.log('Request was made but no response:', error.request);
    }
    
    console.log('=== RESET PASSWORD ERROR END ===');
    
    let errorMessage = 'Failed to reset password';
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.response) {
      errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
    }
    
    return {
      success: false,
      status: 'error',
      message: errorMessage
    };
  }
}

// Alternative simplified version if the above is too complex
export async function resetPasswordSimple(resetToken, newPassword) {
  try {
    const body = { token: resetToken, newPassword };
    const url = `${config.server}/users/reset-password`;
    
    console.log('Reset password request to:', url);
    console.log('Reset token present:', !!resetToken);
    
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Reset password response:', response.data);
    
    // Handle different response formats
    if (response.data.success !== false && (response.status === 200 || response.status === 201)) {
      return {
        success: true,
        status: 'success',
        message: response.data.message || 'Password reset successfully',
        ...response.data
      };
    }
    
    return response.data;
    
  } catch (error) {
    console.error('Reset Password Error:', error);
    
    if (error.response) {
      const errorData = error.response.data;
      const statusCode = error.response.status;
      
      return {
        success: false,
        status: 'error',
        message: errorData?.message || errorData?.error || 'Failed to reset password',
        statusCode: statusCode
      };
    }
    
    return { 
      success: false, 
      status: 'error',
      message: error.message.includes('Network') ? 
        'Network error. Please check your connection.' : 
        'Failed to reset password. Please try again.'
    };
  }
}

// Test function to help debug reset password issues
export async function testResetPassword(resetToken, newPassword) {
  console.log('=== TESTING RESET PASSWORD ===');
  
  // Test with enhanced version
  console.log('Testing enhanced version...');
  const result1 = await resetPassword(resetToken, newPassword);
  console.log('Enhanced result:', result1);
  
  // Test with simple version
  console.log('Testing simple version...');
  const result2 = await resetPasswordSimple(resetToken, newPassword);
  console.log('Simple result:', result2);
  
  return { enhanced: result1, simple: result2 };
}