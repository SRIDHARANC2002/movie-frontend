import axios from 'axios';
// const API_URL = "http://localhost:5005/api/users";
const API_URL = "https://movie-backend-4-qrw2.onrender.com/api/users";
// Removed unused variable: const BACKEND_URL = "https://movie-backend-4-qrw2.onrender.com";
//const BACKEND_URL = "http://localhost:5005";
//const API_URL = `${BACKEND_URL}/api/users`;
//const API_URL = "http://localhost:5005/api/users";

const refreshAuthToken = async () => {
  try {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      throw new Error('No token found');
    }

    const response = await axios.post(`${API_URL}/refresh-token`, {}, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      // Also update user data in localStorage if provided
      if (response.data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...response.data.user
        }));
      }
      return response.data.token;
    }
    throw new Error('No token received from refresh endpoint');
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear token and user data if refresh fails
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw new Error('Session expired. Please log in again.');
  }
};

export const authService = {
    register: async (userData) => {
        try {
            console.log('🚀 Starting registration process...');
            console.log('📤 Sending registration data:', {
                ...userData,
                password: '[HIDDEN]',
                confirmPassword: '[HIDDEN]'
            });

            const response = await axios.post(`${API_URL}/register`, userData);
            console.log('✅ Registration successful:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Registration error:', {
                message: error.response?.data?.message || error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            // Get the status code and error message
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message;

            // Provide more specific error messages based on status code
            if (statusCode === 409) {
                throw new Error('Email already registered. Please use a different email or login.');
            } else if (errorMessage) {
                throw new Error(errorMessage);
            } else {
                throw new Error('Registration failed. Please try again later.');
            }
        }
    },

    login: async (credentials) => {
        try {
            console.log('🔑 Attempting login...');

            // Clear any existing tokens first
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            const response = await axios.post(`${API_URL}/login`, credentials);

            if (response.data.token) {
                // Store token and user data in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Store login timestamp for session tracking
                localStorage.setItem('loginTimestamp', Date.now().toString());

                // Log the user data for debugging
                console.log('👤 User data stored in localStorage:', response.data.user);
                if (response.data.user.profilePicture) {
                    console.log('🖼️ Profile picture URL:', response.data.user.profilePicture);
                }

                // Verify the token was stored correctly
                const storedToken = localStorage.getItem('token');
                if (storedToken !== response.data.token) {
                    console.warn('⚠️ Token storage verification failed!');
                }

                // Verify token with a test request
                try {
                    console.log('🔍 Verifying token with test request...');
                    await axios.get(`${API_URL}/test`, {
                        headers: {
                            'Authorization': `Bearer ${response.data.token}`
                        }
                    });
                    console.log('✅ Token verification successful');
                } catch (verifyError) {
                    console.warn('⚠️ Token verification failed:', verifyError.message);
                    // We'll continue anyway since we have the token
                }
            } else {
                console.warn('⚠️ No token received from server!');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Login error:', error.response?.data);

            // Get the status code and error message
            const statusCode = error.response?.status;
            const errorMessage = error.response?.data?.message;

            // Provide more specific error messages based on status code
            if (statusCode === 404) {
                throw new Error('User not registered. Please create an account first.');
            } else if (statusCode === 401) {
                throw new Error('Invalid email or password. Please try again.');
            } else if (errorMessage) {
                throw new Error(errorMessage);
            } else {
                throw new Error('Login failed. Please try again later.');
            }
        }
    },

    logout: () => {
        console.log('👋 Logging out...');

        try {
            // Remove auth data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginTimestamp');
            console.log('✅ Logout successful');

            // Clear any session cookies that might be present
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            return true;
        } catch (error) {
            console.error('❌ Error during logout:', error);
            return false;
        }
    },

    updateUserDetails: async (userData) => {
        try {
            console.log('🔄 Updating user details...');
            console.log('📊 User data to update:', userData);

            // Get token from localStorage
            let token = localStorage.getItem('token');
            if (!token) {
                throw new Error('User must be logged in to update details');
            }

            // Create a copy of userData to send to the server
            const dataToSend = { ...userData };

            try {
                const response = await axios.put(
                    `${API_URL}/update`,
                    dataToSend,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('✅ User details updated successfully on server:', response.data);

                // Update user data in localStorage
                if (response.data.user) {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    console.log('👤 Updated user data stored in localStorage:', response.data.user);
                }

                return response.data;
            } catch (serverError) {
                if (serverError.response?.status === 401) {
                    try {
                        // Try to refresh the token
                        token = await refreshAuthToken();

                        // Retry the update with the new token
                        const response = await axios.put(
                            `${API_URL}/update`,
                            dataToSend,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        return response.data;
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        throw new Error('Session expired. Please log in again.');
                    }
                }
                throw serverError;
            }
        } catch (error) {
            console.error('❌ Update user details error:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please log in again.');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Failed to update user details. Please try again.');
            }
        }
    },

    uploadProfilePicture: async (file) => {
        try {
            console.log('📸 Uploading profile picture...');

            // Get current token
            let token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Create form data
            const formData = new FormData();
            formData.append('profilePicture', file);

            try {
                const response = await axios.post(
                    `${API_URL}/profile-picture`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                if (response.data.user && response.data.user.profilePicture) {
                    // Update local storage with new profile picture
                    const userData = JSON.parse(localStorage.getItem('user') || '{}');
                    userData.profilePicture = response.data.user.profilePicture;
                    localStorage.setItem('user', JSON.stringify(userData));

                    console.log('🖼️ Profile picture URL:', response.data.user.profilePicture);
                    return response.data;
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    try {
                        // Try to refresh the token
                        token = await refreshAuthToken();

                        // Retry upload with new token
                        const response = await axios.post(
                            `${API_URL}/profile-picture`,
                            formData,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'multipart/form-data'
                                }
                            }
                        );

                        if (response.data.user && response.data.user.profilePicture) {
                            // Update local storage with new profile picture
                            const userData = JSON.parse(localStorage.getItem('user') || '{}');
                            userData.profilePicture = response.data.user.profilePicture;
                            localStorage.setItem('user', JSON.stringify(userData));

                            return response.data;
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        throw new Error('Session expired. Please log in again.');
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('❌ Profile picture update error:', error);
            if (error.response?.status === 401) {
                throw new Error('Session expired. Please log in again.');
            } else if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Failed to upload profile picture. Please try again.');
            }
        }
    }
};
