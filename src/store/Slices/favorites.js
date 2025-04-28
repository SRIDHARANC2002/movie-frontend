import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { favoriteService } from "../../services/favoriteService";

// Async thunks for API calls
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { getState }) => {
    // Get current favorites from state
    const currentFavorites = getState().favorites.movies;

    try {
      // This will return [] on error instead of throwing
      const backendFavorites = await favoriteService.getFavorites();

      // If backend returned empty array but we have local favorites, keep them
      if (backendFavorites.length === 0 && currentFavorites.length > 0) {
        return currentFavorites;
      }

      return backendFavorites;
    } catch (error) {
      // This shouldn't happen with our updated service, but just in case
      console.error('Unexpected error in fetchFavorites thunk:', error);
      return currentFavorites;
    }
  }
);

export const addToFavoritesAsync = createAsyncThunk(
  'favorites/addToFavorites',
  async (movie, { getState }) => {
    // Get current favorites from state
    const currentFavorites = getState().favorites.movies;

    try {
      // This will return [movie] or backend favorites on success
      const updatedFavorites = await favoriteService.addFavorite(movie);

      // If backend returned just this movie but we have other favorites, merge them
      if (updatedFavorites.length === 1 && currentFavorites.length > 0) {
        // Check if movie is already in favorites
        if (!currentFavorites.some(m => m.id === movie.id)) {
          return [...currentFavorites, movie];
        }
        return currentFavorites;
      }

      return updatedFavorites;
    } catch (error) {
      // This shouldn't happen with our updated service, but just in case
      console.error('Unexpected error in addToFavoritesAsync thunk:', error);

      // Add to local favorites
      if (!currentFavorites.some(m => m.id === movie.id)) {
        return [...currentFavorites, movie];
      }
      return currentFavorites;
    }
  }
);

export const removeFromFavoritesAsync = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (movieId, { getState }) => {
    // Get current favorites from state
    const currentFavorites = getState().favorites.movies;

    try {
      // This will return [] or backend favorites on success
      const backendFavorites = await favoriteService.removeFavorite(movieId);

      // If backend returned empty array but we have local favorites, filter them
      if (backendFavorites.length === 0 && currentFavorites.length > 0) {
        return currentFavorites.filter(movie => movie.id !== movieId);
      }

      return backendFavorites;
    } catch (error) {
      // This shouldn't happen with our updated service, but just in case
      console.error('Unexpected error in removeFromFavoritesAsync thunk:', error);

      // Remove from local favorites
      return currentFavorites.filter(movie => movie.id !== movieId);
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    movies: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Keep the synchronous actions for offline use or before API calls
    addToFavorites: (state, action) => {
      if (!state.movies.some(movie => movie.id === action.payload.id)) {
        state.movies.push(action.payload);
      }
    },
    removeFromFavorites: (state, action) => {
      state.movies = state.movies.filter(movie => movie.id !== action.payload);
    },
    clearFavorites: (state) => {
      state.movies = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing favorites
        state.error = action.payload || "Failed to fetch favorites";
      })

      // Add to favorites
      .addCase(addToFavoritesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToFavoritesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
      })
      .addCase(addToFavoritesAsync.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing favorites
        state.error = action.payload || "Failed to add to favorites";
      })

      // Remove from favorites
      .addCase(removeFromFavoritesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromFavoritesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
      })
      .addCase(removeFromFavoritesAsync.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing favorites
        state.error = action.payload || "Failed to remove from favorites";
      });
  },
});

export const { addToFavorites, removeFromFavorites, clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
