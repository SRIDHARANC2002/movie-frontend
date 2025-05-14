import axios from 'axios';

// Create an axios instance with default config
export const axiosAuth = axios.create({
  baseURL: 'http://localhost:5005',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to requests
axiosAuth.interceptors.request.use(
  (config) => {
    // Try sessionStorage first, then fall back to localStorage
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
axiosAuth.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.status, error.response.data);

      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Unauthorized access, redirecting to login...');
        // Clear auth data
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosAuth;
