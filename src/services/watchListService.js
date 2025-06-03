import axios from 'axios';

// Using the proper watchlist endpoint now
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

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No authentication token found');
        return [];
      }

      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.watchList) {
        console.log(`✅ Fetched ${response.data.watchList.length} watch list items`);
        return response.data.watchList;
      } else if (Array.isArray(response.data)) {
        console.log(`✅ Fetched ${response.data.length} items (direct array)`);
        return response.data;
      } else {
        console.log('⚠️ No items found in response, returning empty array');
        return [];
      }
    } catch (error) {
      logErrorDetails(error, 'fetching watch list');

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

      const movieData = {
        id: Number(movie.id),
        title: movie.title,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        vote_average: movie.vote_average || 0,
        overview: movie.overview || ''
      };

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let response;

      try {
        response = await axios.post(API_URL, movieData, { headers });
        console.log('✅ Movie added to watch list successfully');
      } catch (error) {
        console.error('❌ Error adding movie to watch list:', error.message);

        try {
          console.log('🔄 Trying with minimal required fields...');
          response = await axios.post(API_URL, {
            id: Number(movie.id),
            title: movie.title
          }, { headers });
          console.log('✅ Movie added to watch list with minimal data');
        } catch (fallbackError) {
          console.error('❌ All attempts to add movie to watch list failed:', fallbackError.message);
          throw fallbackError;
        }
      }

      console.log('Server response:', response.data);

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

      if (response.data.watchList) {
        return response.data.watchList;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        return [movieData];
      }
    } catch (error) {
      logErrorDetails(error, 'adding to watch list');

      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        if (!currentWatchList.some(m => Number(m.id) === Number(movie.id))) {
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

      return [movie];
    }
  },

  removeFromWatchList: async (movieId) => {
    try {
      console.log('➖ Removing movie from watch list:', movieId);
      const numericMovieId = Number(movieId);

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage');
      } catch (storageError) {
        console.error('❌ Error updating localStorage:', storageError);
      }

      let response;
      try {
        const fullUrl = `${API_URL}/${numericMovieId}`;
        console.log('🔄 Attempting to remove item from server (best effort):', fullUrl);

        response = await axios.delete(fullUrl, { headers });
        console.log('✅ Movie removed from server successfully');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('ℹ️ Movie was not found on server (already removed or never added)');
          response = {
            data: {
              success: true,
              message: 'Movie removed from watch list (local only)',
              watchList: []
            }
          };
        } else {
          console.error('⚠️ Server update failed, but local state is updated:', error.message);
          response = {
            data: {
              success: true,
              message: 'Movie removed from watch list (local only)',
              watchList: []
            }
          };
        }
      }

      console.log('Server response (or simulated):', response.data);

      const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
      return currentWatchList;
    } catch (error) {
      logErrorDetails(error, 'removing from watch list');

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
