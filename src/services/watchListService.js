import axios from 'axios';
import { axiosAuth } from './axiosConfig';

const API_URL = '/api/watchlist';

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

      const response = await axiosAuth.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Fetched ${response.data.watchList.length} watch list items`);
      return response.data.watchList;
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
        // Send movie object directly - this matches the backend expectation
        response = await axiosAuth.post(API_URL, movieData, { headers });
        console.log('✅ Movie added to watch list successfully');
      } catch (error) {
        console.error('❌ Error adding movie to watch list:', error.message);
        
        // If the first attempt fails, try with minimal required fields
        try {
          console.log('🔄 Trying with minimal required fields...');
          // The backend requires at least id and title
          response = await axiosAuth.post(API_URL, {
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
      return response.data.watchList || [movieData];
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

      // Based on the backend code, we should use the RESTful approach with the ID in the URL
      let response;
      try {
        // Format 1: Use URL parameter with numeric ID (RESTful approach)
        // This matches the backend route: router.delete('/:id', removeFromWatchList);
        response = await axiosAuth.delete(`${API_URL}/${numericMovieId}`, { headers });
        console.log('✅ Movie removed from watch list successfully');
      } catch (error) {
        console.error('❌ Error removing movie from watch list:', error.message);
        
        // If the first attempt fails, try with the ID as a string
        try {
          console.log('🔄 Trying with ID as string...');
          response = await axiosAuth.delete(`${API_URL}/${String(numericMovieId)}`, { headers });
          console.log('✅ Movie removed from watch list with string ID');
        } catch (fallbackError) {
          console.error('❌ All attempts to remove movie from watch list failed:', fallbackError.message);
          throw fallbackError; // Re-throw to be caught by the outer catch block
        }
      }

      // Log the response to see what the server returned
      console.log('Server response:', response.data);

      // Update localStorage
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage');
      } catch (storageError) {
        console.error('❌ Error updating localStorage:', storageError);
      }

      return response.data.watchList || [];
    } catch (error) {
      logErrorDetails(error, 'removing from watch list');

      // Update localStorage even if server request failed
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== Number(movieId));
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage as fallback');
        return updatedWatchList;
      } catch (storageError) {
        console.error('❌ Error updating localStorage:', storageError);
      }

      return [];
    }
  }
};
