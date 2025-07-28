
// src/services/product.js
import { config } from '../configuration/config';

const API_BASE_URL = config.server;

// Get all products
export async function getAllProducts() {
  try {
    const url = `${API_BASE_URL}/product`;
    console.log('Fetching all products from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('All Products API Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching all products:', error);
    
    return {
      status: 'error',
      message: error.message || 'Failed to fetch products',
      data: [],
    };
  }
}

// Get products by category ID
export async function getProductsByCategory(category_id) {
  try {
    const url = `${API_BASE_URL}/product/category/${category_id}`;
    console.log('Fetching products for category:', category_id, 'from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Products by Category API Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    
    return {
      status: 'error',
      message: error.message || 'Failed to fetch products for this category',
      data: [],
    };
  }
}

// Get single product by ID
export async function getProductById(product_id) {
  try {
    const url = `${API_BASE_URL}/product/${product_id}`;
    console.log('Fetching product by ID:', product_id, 'from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Product by ID API Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    
    return {
      status: 'error',
      message: error.message || 'Failed to fetch product',
      data: null,
    };
  }
}
