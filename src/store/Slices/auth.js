import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/authService";
import { fetchFavorites, clearFavorites } from "./favorites";

// Initialize state
const initialState = {
  user: null,
  isAuthenticated: false,
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
      const response = await authService.login(credentials);
      dispatch(fetchFavorites());
      return response;
    } catch (error) {
      return rejectWithValue(error);
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
      state.isAuthenticated = false;
      state.user = null;
      authService.logout();
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
        state.error = action.payload?.message || 'Login failed';
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
