import axios from 'axios';

// Since the watchlist endpoint is not available, we'll use the favorites endpoint as a fallback
// This allows users to still save movies even if the watchlist endpoint is not working
const API_URL = 'https://movie-backend-4-qrw2.onrender.com/api/watchlist';

// Helper function to log error details
const logErrorDetails = (error, action) => {
  console.error(`❌ Error ${action}:`, error);
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Status code:', error.response.status);
  } else if (error.request) {
    console.error('No response received');
  } else {
    console.error('Error message:', error.message);
  }
};

export const watchListService = {
  getWatchList: async () => {
    try {
      console.log('🔍 Fetching watch list...');

      // Try sessionStorage first, then fall back to localStorage
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No authentication token found');
        return [];
      }

      // Use the favorites endpoint as a fallback since the watchlist endpoint is not available
      const fullUrl = 'https://movie-backend-4-qrw2.onrender.com/api/favorites';
      console.log('🔄 Fetching watch list from favorites endpoint as fallback:', fullUrl);

      const response = await axios.get(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle both watchList and favorites response formats
      if (response.data.watchList) {
        console.log(`✅ Fetched ${response.data.watchList.length} watch list items`);
        return response.data.watchList;
      } else if (response.data.favorites) {
        console.log(`✅ Fetched ${response.data.favorites.length} items from favorites as fallback`);
        return response.data.favorites;
      } else if (Array.isArray(response.data)) {
        console.log(`✅ Fetched ${response.data.length} items (direct array)`);
        return response.data;
      } else {
        console.log('⚠️ No items found in response, returning empty array');
        return [];
      }
    } catch (error) {
      logErrorDetails(error, 'fetching watch list');

      // Try to load from localStorage as fallback
      try {
        const localWatchList = localStorage.getItem('watchList');
        if (localWatchList) {
          const watchList = JSON.parse(localWatchList);
          console.log(`✅ Loaded ${watchList.length} watch list items from localStorage as fallback`);
          return watchList;
        }
      } catch (localError) {
        console.error('❌ Error loading watch list from localStorage:', localError);
      }

      return [];
    }
  },

  addToWatchList: async (movie) => {
    try {
      console.log('➕ Adding movie to watch list:', movie.title);

      // Extract the fields that the backend expects
      const movieData = {
        id: Number(movie.id),  // Ensure ID is a number
        title: movie.title,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        vote_average: movie.vote_average || 0,
        overview: movie.overview || ''
      };

      console.log('Sending movie data:', movieData);

      // Try sessionStorage first, then fall back to localStorage
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      // Set up headers
      let response;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Based on the backend controller code, we need to send the movie data directly
      try {
        // Use the favorites endpoint as a fallback since the watchlist endpoint is not available
        const fullUrl = 'https://movie-backend-4-qrw2.onrender.com/api/favorites';
        console.log('🔄 Sending request to favorites endpoint as fallback:', fullUrl);

        // Send movie object directly - this matches the backend expectation
        response = await axios.post(fullUrl, movieData, { headers });
        console.log('✅ Movie added to watch list successfully');
      } catch (error) {
        console.error('❌ Error adding movie to watch list:', error.message);

        // If the first attempt fails, try with minimal required fields
        try {
          console.log('🔄 Trying with minimal required fields...');
          // The backend requires at least id and title
          // Use the favorites endpoint as a fallback
          const fullUrl = 'https://movie-backend-4-qrw2.onrender.com/api/favorites';
          response = await axios.post(fullUrl, {
            id: Number(movie.id),
            title: movie.title
          }, { headers });
          console.log('✅ Movie added to watch list with minimal data');
        } catch (fallbackError) {
          console.error('❌ All attempts to add movie to watch list failed:', fallbackError.message);
          throw fallbackError; // Re-throw to be caught by the outer catch block
        }
      }

      // Log the response to see what the server returned
      console.log('Server response:', response.data);

      // Save to localStorage as backup
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        if (!currentWatchList.some(m => Number(m.id) === Number(movie.id))) {
          currentWatchList.push(movieData);
          localStorage.setItem('watchList', JSON.stringify(currentWatchList));
          console.log('✅ Movie saved to localStorage as backup');
        }
      } catch (storageError) {
        console.error('❌ Error saving to localStorage:', storageError);
      }

      console.log('✅ Movie added to watch list');

      // Handle both watchList and favorites response formats
      if (response.data.watchList) {
        return response.data.watchList;
      } else if (response.data.favorites) {
        return response.data.favorites;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        // Return the movie data as fallback
        return [movieData];
      }
    } catch (error) {
      logErrorDetails(error, 'adding to watch list');

      // Save to localStorage even if server request failed
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        if (!currentWatchList.some(m => Number(m.id) === Number(movie.id))) {
          // Use the same movieData format as above to ensure consistency
          const movieDataForStorage = {
            id: Number(movie.id),
            title: movie.title,
            poster_path: movie.poster_path || '',
            release_date: movie.release_date || '',
            vote_average: movie.vote_average || 0,
            overview: movie.overview || ''
          };
          currentWatchList.push(movieDataForStorage);
          localStorage.setItem('watchList', JSON.stringify(currentWatchList));
          console.log('✅ Movie saved to localStorage as fallback');
        }
      } catch (storageError) {
        console.error('❌ Error saving to localStorage:', storageError);
      }

      // Return the movie anyway so UI doesn't break
      return [movie];
    }
  },

  removeFromWatchList: async (movieId) => {
    try {
      console.log('➖ Removing movie from watch list:', movieId);

      // Ensure movieId is a number
      const numericMovieId = Number(movieId);

      // Try sessionStorage first, then fall back to localStorage
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      // Set up headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // First, update localStorage regardless of server response
      // This ensures the UI is updated even if the server request fails
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage');
      } catch (storageError) {
        console.error('❌ Error updating localStorage:', storageError);
      }

      // Try to update the server, but don't block the UI update if it fails
      let response;
      try {
        // Use the favorites endpoint as a fallback since the watchlist endpoint is not available
        const fullUrl = `https://movie-backend-4-qrw2.onrender.com/api/favorites/${numericMovieId}`;
        console.log('🔄 Attempting to remove item from server (best effort):', fullUrl);

        // Format 1: Use URL parameter with numeric ID (RESTful approach)
        response = await axios.delete(fullUrl, { headers });
        console.log('✅ Movie removed from server successfully');
      } catch (error) {
        // If the server returns 404 "Movie not found", that's actually fine
        // It means the movie wasn't in favorites, which is the expected state after removal
        if (error.response && error.response.status === 404) {
          console.log('ℹ️ Movie was not found on server (already removed or never added)');

          // Create a simulated successful response
          response = {
            data: {
              success: true,
              message: 'Movie removed from watch list (local only)',
              favorites: []
            }
          };
        } else {
          // For other errors, log but continue
          console.error('⚠️ Server update failed, but local state is updated:', error.message);

          // Create a simulated response
          response = {
            data: {
              success: true,
              message: 'Movie removed from watch list (local only)',
              favorites: []
            }
          };
        }
      }

      // Log the response
      console.log('Server response (or simulated):', response.data);

      // Get the updated watch list from localStorage
      const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');

      // Return the updated watch list from localStorage
      return currentWatchList;
    } catch (error) {
      logErrorDetails(error, 'removing from watch list');

      // As a last resort, try to update localStorage
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const numericMovieId = Number(movieId);
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage as fallback');
        return updatedWatchList;
      } catch (localError) {
        console.error('❌ Error updating localStorage:', localError);
      }

      return [];
    }
  }
};
