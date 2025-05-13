import { logoutAndClearFavorites } from '../store/Slices/auth';

const axiosAuth = axios.create();

// Request interceptor
axiosAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
        // Try to refresh the token
        const response = await axios.post(
          'https://movie-backend-4-qrw2.onrender.com/api/users/refresh-token',
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.token) {
          // Store the new token
          localStorage.setItem('token', response.data.token);
          // Update the failed request's auth header
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          // Retry the original request
          return axiosAuth(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        store.dispatch(logoutAndClearFavorites());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosAuth;