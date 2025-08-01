
// Check your api.js file - it should look something like this:
import axios from 'axios';
import { config } from '../configuration/config';
import { getCache } from '../utils/auth';

// Create axios instance
const api = axios.create({
  baseURL: config.server,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (requestConfig) => {
    try {
      const { token } = await getCache();
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      console.log('API Request:', requestConfig.method?.toUpperCase(), requestConfig.url);
      console.log('Headers:', requestConfig.headers);
      return requestConfig;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return requestConfig;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url);
    console.error('Error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.log('Unauthorized access - token might be expired');
    }
    
    return Promise.reject(error);
  }
);

export default api;
