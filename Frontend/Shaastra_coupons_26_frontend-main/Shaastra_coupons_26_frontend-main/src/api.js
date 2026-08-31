// src/api.js
import axios from 'axios';

console.log("API URL:", import.meta.env.VITE_API_URL);

// Create an axios instance with a base URL from environment variables
const api = axios.create({
  baseURL:  'https://api.coupons.shaastra.org' // Fallback for safety
  // baseURL:'http://localhost:5000/'
});

// Create an interceptor to automatically add the Authorization header to every request
api.interceptors.request.use(
  (config) => {
    // Get the token from local storage
    const token = localStorage.getItem('token');
    
    // If the token exists, add it to the request headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Pass request setup errors along
    return Promise.reject(error);
  }
);

// Optional: You can add a response interceptor to handle global errors (e.g., auto-logout on 401)
api.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    // You could add logic here to trigger a logout if a 401 Unauthorized is received
    // For now, just logging the error and rejecting is fine.
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);


export default api;