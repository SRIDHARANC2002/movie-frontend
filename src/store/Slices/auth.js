import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { fetchFavorites, clearFavorites } from "./favorites";

// Initialize state from localStorage
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        return rejectWithValue('Email and password are required');
      }

      console.log('🔑 Logging in user...');
      const response = await authService.login(credentials);
      console.log('✅ Login successful, fetching favorites...');

      // Store login timestamp for session tracking
      localStorage.setItem('loginTimestamp', Date.now().toString());

      // Wait a moment to ensure token is properly set before fetching favorites
      setTimeout(() => {
        dispatch(fetchFavorites())
          .unwrap()
          .then(favorites => {
            console.log(`✅ Successfully fetched ${favorites.length} favorites after login`);
          })
          .catch(error => {
            console.error('❌ Error fetching favorites after login:', error);
          });
      }, 500);

      return response;
    } catch (error) {
      // Convert Error object to a serializable format
      console.error('❌ Login failed:', error);

      // Clear any partial auth data on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        'Invalid email or password. Please try again.'
      );
    }
  }
);

export const logoutAndClearFavorites = createAsyncThunk(
  'auth/logoutAndClearFavorites',
  async (_, { dispatch }) => {
    dispatch(authSlice.actions.logout());
    dispatch(clearFavorites());
    return null;
  }
);

export const updateUserDetailsAsync = createAsyncThunk(
  'auth/updateUserDetails',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.updateUserDetails(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const uploadProfilePictureAsync = createAsyncThunk(
  'auth/uploadProfilePicture',
  async (file, { rejectWithValue }) => {
    try {
      const response = await authService.uploadProfilePicture(file);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // Update state
      state.isAuthenticated = false;
      state.user = null;

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTimestamp');

      // Call service logout
      authService.logout();

      console.log('👋 Logging out...');
    },
    updateUserDetails: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        console.log('✅ Registration successful:', action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        // Handle serialized error message
        state.error = action.payload || 'Login failed';

        // Don't clear authentication state on login failure
        // This ensures users stay logged in if they reload during a failed login attempt
      })
      // Update User Details
      .addCase(updateUserDetailsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserDetailsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
      })
      .addCase(updateUserDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update user details';
      })
      // Upload Profile Picture
      .addCase(uploadProfilePictureAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfilePictureAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (action.payload.user) {
          state.user = {
            ...state.user,
            ...action.payload.user
          };
        }
      })
      .addCase(uploadProfilePictureAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to upload profile picture';
      });
  }
});

export const { logout, updateUserDetails, clearError } = authSlice.actions;
export default authSlice.reducer;
