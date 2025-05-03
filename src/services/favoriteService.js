import axios from 'axios';

 //const API_URL = 'http://localhost:5005/api/favorites';
 const API_URL = "https://movie-backend-4-qrw2.onrender.com/api/favorites";

export const favoriteService = {
  // Get all favorites for the current user
  getFavorites: async () => {
    try {
      console.log('🔍 Fetching favorites...');

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found, user must be logged in');
        return []; // Return empty array instead of throwing error
      }

      try {
        const response = await axios.get(API_URL, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000 // Add timeout to prevent long waiting
        });

        console.log('✅ Favorites fetched successfully');
        return response.data.favorites || [];
      } catch (apiError) {
        // Handle connection errors gracefully
        if (apiError.code === 'ECONNREFUSED' || apiError.message.includes('Network Error')) {
          console.error('❌ Backend server not available:', apiError.message);
          return []; // Return empty array on connection error
        }

        // Handle other API errors
        console.error('❌ Error fetching favorites:', apiError.response?.data || apiError.message);
        return []; // Return empty array instead of throwing
      }
    } catch (error) {
      console.error('❌ Unexpected error in getFavorites:', error);
      return []; // Return empty array for any other errors
    }
  },

  // Add a movie to favorites
  addFavorite: async (movie) => {
    try {
      console.log('➕ Adding movie to favorites:', movie.title);

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found, user must be logged in');
        return [movie]; // Return array with just this movie for local-only storage
      }

      // Prepare movie data
      const movieData = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        overview: movie.overview
      };

      try {
        const response = await axios.post(API_URL, movieData, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 1500000  // 25 minutes in milliseconds

        });

        console.log('✅ Movie added to favorites successfully');
        return response.data.favorites || [movie];
      } catch (apiError) {
        // Handle connection errors gracefully
        if (apiError.code === 'ECONNREFUSED' || apiError.message.includes('Network Error')) {
          console.error('❌ Backend server not available:', apiError.message);
          return [movie]; // Return array with just this movie
        }

        console.error('❌ Error adding favorite:', apiError.response?.data || apiError.message);
        return [movie]; // Return array with just this movie
      }
    } catch (error) {
      console.error('❌ Unexpected error in addFavorite:', error);
      return [movie]; // Return array with just this movie
    }
  },

  // Remove a movie from favorites
  removeFavorite: async (movieId) => {
    try {
      console.log('➖ Removing movie from favorites:', movieId);

      // Get token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found, user must be logged in');
        return []; // Return empty array for local-only operation
      }

      try {
        const response = await axios.delete(`${API_URL}/${movieId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 5000 // Add timeout
        });

        console.log('✅ Movie removed from favorites successfully');
        return response.data.favorites || [];
      } catch (apiError) {
        // Handle connection errors gracefully
        if (apiError.code === 'ECONNREFUSED' || apiError.message.includes('Network Error')) {
          console.error('❌ Backend server not available:', apiError.message);
          // For removal, we'll return empty array since we can't know what's in the backend
          return [];
        }

        console.error('❌ Error removing favorite:', apiError.response?.data || apiError.message);
        return []; // Return empty array on error
      }
    } catch (error) {
      console.error('❌ Unexpected error in removeFavorite:', error);
      return []; // Return empty array for any other errors
    }
  }
};
