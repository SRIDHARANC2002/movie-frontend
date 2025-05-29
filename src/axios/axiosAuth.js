import { logoutAndClearFavorites, login } from '../store/Slices/auth';
import axios from 'axios';
import { store } from '../store/store';

// API URL for authentication
const AUTH_API_URL = 'https://movie-backend-4-qrw2.onrender.com/api/users';

const axiosAuth = axios.create();

// Request interceptor
axiosAuth.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Error setting auth header:', error);
      // Continue with the request even if we couldn't set the auth header
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Token expired, attempting to refresh...');

        // Try to refresh the token
        const response = await axios.post(
          `${AUTH_API_URL}/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.token) {
          console.log('✅ Token refreshed successfully');

          // Store the new token
          localStorage.setItem('token', response.data.token);

          // If user data was also returned, update it
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // Update Redux state with new user data and token
            store.dispatch(login({
              token: response.data.token,
              user: response.data.user
            }));
          }

          // Update the failed request's auth header
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;

          // Retry the original request
          return axiosAuth(originalRequest);
        } else {
          console.warn('⚠️ No token received during refresh');
          throw new Error('No token received during refresh');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Only log out if this was a genuine auth failure
        // Some network errors shouldn't log the user out
        if (refreshError.response?.status === 401 ||
            refreshError.response?.status === 403) {
          console.log('🔒 Authentication failed, logging out user');
          store.dispatch(logoutAndClearFavorites());
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosAuth;