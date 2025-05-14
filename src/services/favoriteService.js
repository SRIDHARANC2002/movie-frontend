import { axiosAuth } from './axiosConfig';

// Base URL for the favorites API - path will be appended to axiosAuth baseURL
const FAVORITES_PATH = 'https://movie-server-1-3u79.onrender.com/api/favorites';

// Helper function to log detailed error information
const logErrorDetails = (error, operation) => {
  console.error(`❌ Error ${operation}:`, error);

  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Headers:`, error.response.headers);
    console.error(`Data:`, error.response.data);
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }

  if (error.config) {
    console.error('Request config:', {
      url: error.config.url,
      method: error.config.method,
      data: error.config.data
    });
  }
};

export const favoriteService = {
  getFavorites: async () => {
    try {
      console.log('🔍 Fetching favorites from server...');
      const response = await axiosAuth.get(FAVORITES_PATH);

      if (response.data?.favorites) {
        console.log(`✅ Fetched ${response.data.favorites.length} favorites`);
        
        // Save to localStorage as backup
        try {
          localStorage.setItem('favorites', JSON.stringify(response.data.favorites));
          console.log('✅ Favorites saved to localStorage');
        } catch (storageError) {
          console.warn('⚠️ Could not save favorites to localStorage:', storageError);
        }

        return response.data.favorites;
      }

      console.log('⚠️ No favorites found in response');
      return [];
    } catch (error) {
      logErrorDetails(error, 'fetching favorites');

      // Try to get favorites from localStorage as fallback
      try {
        const localFavorites = localStorage.getItem('favorites');
        if (localFavorites) {
          const parsedFavorites = JSON.parse(localFavorites);
          console.log(`⚠️ Using ${parsedFavorites.length} favorites from localStorage as fallback`);
          return parsedFavorites;
        }
      } catch (localError) {
        console.error('❌ Error getting favorites from localStorage:', localError);
      }

      return [];
    }
  },

  addToFavorites: async (movie) => {
    try {
      console.log('➕ Adding movie to favorites:', movie.title);

      const movieData = {
        id: Number(movie.id),
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        overview: movie.overview
      };

      const response = await axiosAuth.post(FAVORITES_PATH, movieData);

      // Save to localStorage as backup
      try {
        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (!currentFavorites.some(m => Number(m.id) === Number(movie.id))) {
          currentFavorites.push(movieData);
          localStorage.setItem('favorites', JSON.stringify(currentFavorites));
        }
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }

      console.log('✅ Movie added to favorites');
      return response.data.favorites || [movieData];
    } catch (error) {
      logErrorDetails(error, 'adding to favorites');

      // Save to localStorage even if server request failed
      try {
        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        if (!currentFavorites.some(m => Number(m.id) === Number(movie.id))) {
          const movieData = {
            id: Number(movie.id),
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average
          };
          currentFavorites.push(movieData);
          localStorage.setItem('favorites', JSON.stringify(currentFavorites));
        }
      } catch (storageError) {
        console.error('Error saving to localStorage:', storageError);
      }

      // Return the movie anyway so UI doesn't break
      return [movie];
    }
  },

  removeFromFavorites: async (movieId) => {
    try {
      console.log('➖ Removing movie from favorites:', movieId);
      const numericMovieId = Number(movieId);

      const response = await axiosAuth.delete(`${FAVORITES_PATH}/${numericMovieId}`);

      // Update localStorage to keep it in sync
      try {
        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const updatedFavorites = currentFavorites.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      } catch (storageError) {
        console.error('Error updating localStorage:', storageError);
      }

      console.log('✅ Movie removed from favorites');
      return response.data.favorites || [];
    } catch (error) {
      logErrorDetails(error, 'removing from favorites');

      // Since all attempts failed, simulate success by returning filtered array
      try {
        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const updatedFavorites = currentFavorites.filter(movie => Number(movie.id) !== Number(movieId));
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        return updatedFavorites;
      } catch (localError) {
        console.error('Error handling local favorites:', localError);
      }

      return [];
    }
  }
};
