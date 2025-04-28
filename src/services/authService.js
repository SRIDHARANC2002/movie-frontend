import axios from 'axios';

//const API_URL = 'http://localhost:5005/api/users';
const API_URL = "https://movie-backend-4-nwi2.onrender.com/api/users";

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
            // Use Error object instead of string literal to fix ESLint warning
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    login: async (credentials) => {
        try {
            console.log('🔑 Attempting login...');
            const response = await axios.post(`${API_URL}/login`, credentials);

            if (response.data.token) {
                // Clear any existing tokens first
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Store token in localStorage
                const token = response.data.token.trim(); // Ensure no whitespace
                localStorage.setItem('token', token);
                console.log('🔑 Token stored in localStorage:', token.substring(0, 15) + '...');

                // Also store user data in localStorage for persistence
                const userData = response.data.user;
                localStorage.setItem('user', JSON.stringify(userData));

                console.log('✅ Login successful');
                console.log('👤 User data stored in localStorage:', userData);

                // Verify the token was stored correctly
                const storedToken = localStorage.getItem('token');
                if (storedToken !== token) {
                    console.warn('⚠️ Token storage verification failed!');
                }
            } else {
                console.warn('⚠️ No token received from server!');
            }

            return response.data;
        } catch (error) {
            console.error('❌ Login error:', error.response?.data);
            // Use Error object instead of string literal to fix ESLint warning
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    logout: () => {
        console.log('👋 Logging out...');
        // Remove both token and user data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('✅ Logout successful');
    },

    updateUserDetails: async (userData) => {
        try {
            console.log('🔄 Updating user details...');

            // Get token from localStorage
            const token = localStorage.getItem('token');
            console.log('🔑 Token from localStorage:', token ? `${token.substring(0, 15)}...` : 'No token');

            if (!token) {
                console.log('❌ No token found, user must be logged in');
                // Use Error object instead of string literal to fix ESLint warning
                throw new Error('User must be logged in to update details');
            }

            // Ensure token is properly formatted
            const authHeader = `Bearer ${token.trim()}`;
            console.log('📝 Authorization header:', `${authHeader.substring(0, 20)}...`);

            // Get user data from localStorage for debugging
            const storedUser = JSON.parse(localStorage.getItem('user'));
            console.log('👤 User data from localStorage:', storedUser);

            const response = await axios.put(
                `${API_URL}/update`,
                userData,
                {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ User details updated successfully:', response.data);

            // Update user data in localStorage
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
                console.log('👤 Updated user data stored in localStorage:', response.data.user);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Update user details error:', {
                message: error.response?.data?.message || error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            // Use Error object instead of string literal to fix ESLint warning
            throw new Error(error.response?.data?.message || 'Failed to update user details');
        }
    }
};
