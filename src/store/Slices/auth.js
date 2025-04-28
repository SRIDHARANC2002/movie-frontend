import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { fetchFavorites, clearFavorites } from "./favorites";

// Function to load user data from localStorage
const loadUserFromStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
      console.log('🔄 Loading user data from localStorage:', user);
      return {
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    }
  } catch (error) {
    console.error('❌ Error loading user from localStorage:', error);
  }

  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  };
};

// Initialize state from localStorage
const initialState = loadUserFromStorage();

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      // Format the data to match backend expectations
      const formattedData = {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword
      };

      console.log('📤 Sending formatted data to backend:', {
        ...formattedData,
        password: '[HIDDEN]',
        confirmPassword: '[HIDDEN]'
      });

      const response = await authService.register(formattedData);
      return response;
    } catch (error) {
      console.error('❌ Registration thunk error:', error);
      return rejectWithValue(error);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.login(credentials);

      // After successful login, fetch user's favorites
      dispatch(fetchFavorites());

      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// Thunk for logging out and clearing favorites
export const logoutAndClearFavorites = createAsyncThunk(
  'auth/logoutAndClearFavorites',
  async (_, { dispatch }) => {
    // First dispatch the logout action
    dispatch(authSlice.actions.logout());

    // Then clear the favorites
    dispatch(clearFavorites());

    return null;
  }
);

// Thunk for updating user details
export const updateUserDetailsAsync = createAsyncThunk(
  'auth/updateUserDetails',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('🔄 Updating user details in backend:', userData);
      const response = await authService.updateUserDetails(userData);
      return response;
    } catch (error) {
      console.error('❌ Update user details thunk error:', error);
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      authService.logout();
      // We'll handle clearing favorites in a separate thunk
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
        // Convert Error object to string to avoid React rendering issues
        state.error = action.payload instanceof Error
          ? action.payload.message
          : typeof action.payload === 'object' && action.payload !== null
            ? JSON.stringify(action.payload)
            : String(action.payload);
        console.error('❌ Registration failed:', action.payload);
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
        // Convert Error object to string to avoid React rendering issues
        state.error = action.payload instanceof Error
          ? action.payload.message
          : typeof action.payload === 'object' && action.payload !== null
            ? JSON.stringify(action.payload)
            : String(action.payload);
        console.error('❌ Login failed:', action.payload);
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
        console.log('✅ User details updated successfully:', action.payload);
      })
      .addCase(updateUserDetailsAsync.rejected, (state, action) => {
        state.loading = false;
        // Convert Error object to string to avoid React rendering issues
        state.error = action.payload instanceof Error
          ? action.payload.message
          : typeof action.payload === 'object' && action.payload !== null
            ? JSON.stringify(action.payload)
            : String(action.payload);
        console.error('❌ User details update failed:', action.payload);
      });
  }
});

export const { logout, updateUserDetails, clearError } = authSlice.actions;
export default authSlice.reducer;
