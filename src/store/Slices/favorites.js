import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { favoriteService } from "../../services/favoriteService";

// Helper function to save favorites to localStorage
const saveFavoritesToLocalStorage = (favorites) => {
  try {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

// Helper function to load favorites from localStorage
const loadFavoritesFromLocalStorage = () => {
  try {
    const favorites = localStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
    return [];
  }
};

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
  async (movie, { getState, rejectWithValue }) => {
    // Get current favorites from state
    const currentFavorites = getState().favorites.movies;

    try {
      // This will return [movie] or backend favorites on success
      // Our updated service will always return something and not throw
      const updatedFavorites = await favoriteService.addToFavorites(movie);

      // If we got back favorites, use them
      if (updatedFavorites && updatedFavorites.length > 0) {
        // Make sure we don't have duplicates
        const existingIds = new Set(updatedFavorites.map(m => m.id));
        const filteredCurrentFavorites = currentFavorites.filter(m => !existingIds.has(m.id));

        return [...filteredCurrentFavorites, ...updatedFavorites];
      }

      // Fallback: add to local favorites if not already there
      if (!currentFavorites.some(m => m.id === movie.id)) {
        return [...currentFavorites, movie];
      }

      return currentFavorites;
    } catch (error) {
      console.error('Unexpected error in addToFavoritesAsync thunk:', error);

      // Add to local favorites anyway
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
      // Our updated service will always return something and not throw
      const backendFavorites = await favoriteService.removeFromFavorites(movieId);

      // If we got back favorites from the backend, use them
      if (backendFavorites && backendFavorites.length > 0) {
        return backendFavorites;
      }

      // Otherwise, just filter out the movie from local favorites
      return currentFavorites.filter(movie => movie.id !== movieId);
    } catch (error) {
      console.error('Unexpected error in removeFromFavoritesAsync thunk:', error);

      // Remove from local favorites anyway
      return currentFavorites.filter(movie => movie.id !== movieId);
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    movies: loadFavoritesFromLocalStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    // Keep the synchronous actions for offline use or before API calls
    addToFavorites: (state, action) => {
      if (!state.movies.some(movie => movie.id === action.payload.id)) {
        state.movies.push(action.payload);
        // Save to localStorage
        saveFavoritesToLocalStorage(state.movies);
      }
    },
    removeFromFavorites: (state, action) => {
      // Convert IDs to numbers for consistent comparison
      const movieIdToRemove = Number(action.payload);
      state.movies = state.movies.filter(movie => Number(movie.id) !== movieIdToRemove);
      // Save to localStorage
      saveFavoritesToLocalStorage(state.movies);
      console.log('Movie removed from favorites, ID:', movieIdToRemove);
    },
    clearFavorites: (state) => {
      state.movies = [];
      // Save to localStorage
      saveFavoritesToLocalStorage([]);
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
        // Save to localStorage
        saveFavoritesToLocalStorage(action.payload);
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
        // Save to localStorage
        saveFavoritesToLocalStorage(action.payload);
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
        // Save to localStorage
        saveFavoritesToLocalStorage(action.payload);
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
