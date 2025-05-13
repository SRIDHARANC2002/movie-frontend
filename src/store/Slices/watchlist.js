import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { watchListService } from "../../services/watchListService";

// Helper function to save watch list to localStorage
const saveWatchListToLocalStorage = (watchList) => {
  try {
    localStorage.setItem('watchList', JSON.stringify(watchList));
  } catch (error) {
    console.error('Error saving watch list to localStorage:', error);
  }
};

// Helper function to load watch list from localStorage
const loadWatchListFromLocalStorage = () => {
  try {
    const watchList = localStorage.getItem('watchList');
    return watchList ? JSON.parse(watchList) : [];
  } catch (error) {
    console.error('Error loading watch list from localStorage:', error);
    return [];
  }
};

// Async thunks for API calls
export const fetchWatchList = createAsyncThunk(
  'watchList/fetchWatchList',
  async (_, { getState, rejectWithValue }) => {
    // Get current watch list from state
    const currentWatchList = getState().watchList.movies;
    const isAuthenticated = getState().auth.isAuthenticated;

    // If not authenticated, just return current watch list
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated, using local watch list only');
      return currentWatchList;
    }

    try {
      console.log('🔍 Fetching watch list from server in thunk...');
      // This will return [] on error instead of throwing
      const backendWatchList = await watchListService.getWatchList();

      console.log(`📊 Server returned ${backendWatchList.length} watch list items`);

      // If backend returned empty but we have local items, try to sync them
      if (backendWatchList.length === 0 && currentWatchList.length > 0) {
        console.log('🔄 Backend watch list is empty but local has items, syncing...');

        // Try to sync local watch list to server
        try {
          // Add each local watch list item to the server
          for (const movie of currentWatchList) {
            console.log(`🔄 Syncing movie to server: ${movie.title}`);
            await watchListService.addToWatchList(movie);
          }

          // Fetch again after syncing
          const updatedWatchList = await watchListService.getWatchList();
          console.log(`✅ After sync: Server has ${updatedWatchList.length} watch list items`);
          return updatedWatchList.length > 0 ? updatedWatchList : currentWatchList;
        } catch (syncError) {
          console.error('❌ Error syncing watch list to server:', syncError);
          return currentWatchList;
        }
      }

      return backendWatchList;
    } catch (error) {
      console.error('❌ Unexpected error in fetchWatchList thunk:', error);
      return rejectWithValue('Failed to fetch watch list from server');
    }
  }
);

export const addToWatchListAsync = createAsyncThunk(
  'watchList/addToWatchList',
  async (movie, { getState, rejectWithValue }) => {
    // Get current watch list from state
    const currentWatchList = getState().watchList.movies;

    try {
      // This will return [movie] or backend watch list on success
      // Our updated service will always return something and not throw
      const updatedWatchList = await watchListService.addToWatchList(movie);

      // If we got back watch list, use it
      if (updatedWatchList && updatedWatchList.length > 0) {
        // Make sure we don't have duplicates
        const existingIds = new Set(updatedWatchList.map(m => m.id));
        const filteredCurrentWatchList = currentWatchList.filter(m => !existingIds.has(m.id));

        return [...filteredCurrentWatchList, ...updatedWatchList];
      }

      // Fallback: add to local watch list if not already there
      if (!currentWatchList.some(m => m.id === movie.id)) {
        return [...currentWatchList, movie];
      }

      return currentWatchList;
    } catch (error) {
      console.error('Unexpected error in addToWatchListAsync thunk:', error);

      // Add to local watch list anyway
      if (!currentWatchList.some(m => m.id === movie.id)) {
        return [...currentWatchList, movie];
      }

      return currentWatchList;
    }
  }
);

export const removeFromWatchListAsync = createAsyncThunk(
  'watchList/removeFromWatchList',
  async (movieId, { getState }) => {
    // Get current watch list from state
    const currentWatchList = getState().watchList.movies;

    try {
      // This will return [] or backend watch list on success
      // Our updated service will always return something and not throw
      const backendWatchList = await watchListService.removeFromWatchList(movieId);

      // If we got back watch list from the backend, use it
      if (backendWatchList && backendWatchList.length > 0) {
        return backendWatchList;
      }

      // Otherwise, just filter out the movie from local watch list
      return currentWatchList.filter(movie => movie.id !== movieId);
    } catch (error) {
      console.error('Unexpected error in removeFromWatchListAsync thunk:', error);

      // Remove from local watch list anyway
      return currentWatchList.filter(movie => movie.id !== movieId);
    }
  }
);

const watchListSlice = createSlice({
  name: "watchList",
  initialState: {
    movies: loadWatchListFromLocalStorage(),
    loading: false,
    error: null
  },
  reducers: {
    // Keep the synchronous actions for offline use or before API calls
    addToWatchList: (state, action) => {
      if (!state.movies.some(movie => movie.id === action.payload.id)) {
        state.movies.push(action.payload);
        // Save to localStorage
        saveWatchListToLocalStorage(state.movies);
      }
    },
    removeFromWatchList: (state, action) => {
      // Convert IDs to numbers for consistent comparison
      const movieIdToRemove = Number(action.payload);
      state.movies = state.movies.filter(movie => Number(movie.id) !== movieIdToRemove);
      // Save to localStorage
      saveWatchListToLocalStorage(state.movies);
      console.log('Movie removed from watch list, ID:', movieIdToRemove);
    },
    clearWatchList: (state) => {
      state.movies = [];
      // Save to localStorage
      saveWatchListToLocalStorage([]);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch watch list
      .addCase(fetchWatchList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWatchList.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
        // Save to localStorage
        saveWatchListToLocalStorage(action.payload);
      })
      .addCase(fetchWatchList.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing watch list
        state.error = action.payload || "Failed to fetch watch list";
      })

      // Add to watch list
      .addCase(addToWatchListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWatchListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
        // Save to localStorage
        saveWatchListToLocalStorage(action.payload);
      })
      .addCase(addToWatchListAsync.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing watch list
        state.error = action.payload || "Failed to add to watch list";
      })

      // Remove from watch list
      .addCase(removeFromWatchListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWatchListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload;
        state.error = null; // Clear any previous errors
        // Save to localStorage
        saveWatchListToLocalStorage(action.payload);
      })
      .addCase(removeFromWatchListAsync.rejected, (state, action) => {
        state.loading = false;
        // Don't update state.movies here to keep existing watch list
        state.error = action.payload || "Failed to remove from watch list";
      });
  },
});

export const { addToWatchList, removeFromWatchList, clearWatchList } = watchListSlice.actions;
export default watchListSlice.reducer;
