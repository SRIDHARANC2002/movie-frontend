import axios from 'axios';

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
        console.log('⚠️ No items found in response');
        return [];
      }
    } catch (error) {
      logErrorDetails(error, 'fetching watch list');

      try {
        const localWatchList = localStorage.getItem('watchList');
        if (localWatchList) {
          const watchList = JSON.parse(localWatchList);
          console.log(`✅ Loaded ${watchList.length} items from localStorage as fallback`);
          return watchList;
        }
      } catch (localError) {
        console.error('❌ Error loading from localStorage:', localError);
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
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(API_URL, movieData, { headers });
      console.log('✅ Movie added to watch list');

      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        if (!currentWatchList.some(m => Number(m.id) === Number(movie.id))) {
          currentWatchList.push(movieData);
          localStorage.setItem('watchList', JSON.stringify(currentWatchList));
          console.log('💾 Saved to localStorage');
        }
      } catch (storageError) {
        console.error('❌ Error saving to localStorage:', storageError);
      }

      return response.data.watchList || [movieData];
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
          console.log('✅ Saved to localStorage as fallback');
        }
      } catch (storageError) {
        console.error('❌ Error saving fallback to localStorage:', storageError);
      }

      return [movie];
    }
  },

  removeFromWatchList: async (movieId) => {
    try {
      console.log('➖ Removing movie from watch list:', movieId);

      const numericMovieId = Number(movieId);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // LocalStorage update
      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Watch list updated in localStorage');
      } catch (storageError) {
        console.error('❌ Error updating localStorage:', storageError);
      }

      const fullUrl = `${API_URL}/${numericMovieId}`;
      const response = await axios.delete(fullUrl, { headers });

      console.log('✅ Movie removed from server:', response.data);

      const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
      return currentWatchList;
    } catch (error) {
      logErrorDetails(error, 'removing from watch list');

      try {
        const currentWatchList = JSON.parse(localStorage.getItem('watchList') || '[]');
        const updatedWatchList = currentWatchList.filter(movie => Number(movie.id) !== Number(movieId));
        localStorage.setItem('watchList', JSON.stringify(updatedWatchList));
        console.log('✅ Updated localStorage as fallback');
        return updatedWatchList;
      } catch (localError) {
        console.error('❌ Local fallback failed:', localError);
      }

      return [];
    }
  }
};
