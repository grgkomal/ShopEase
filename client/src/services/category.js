
// src/services/category.js
import axios from 'axios';
import { config } from '../configuration/config';

// Get All Categories - No authentication required
export async function getAllCategories() {
  try {
    const url = `${config.server}/category`;
    console.log('Fetching categories from:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Categories API Response:', response.data);
    
    return response.data;
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to fetch categories',
      data: [],
    };
  }
}


// Products by Category
export async function getProductsByCategory(category_id) {
  try {
    const response = await axios.get(`${config.server}/category/${category_id}`);
    
    return {
      status: 'success',
      data: response.data,
    };
  } catch (error) {
    console.error('Get Products by Category Error:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to fetch products by category',
      data: [], 
    };
  }
}
