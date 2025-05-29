import { axiosAuth } from '../axios/config';

const API_URL = "https://movie-backend-4-qrw2.onrender.com/api/favorites";

export const favoriteService = {
  getFavorites: async () => {
    try {
      console.log('🔍 Fetching favorites...');
      const response = await axiosAuth.get(API_URL);
      console.log('✅ Favorites fetched successfully');
      return response.data.favorites || [];
    } catch (error) {
      console.error('❌ Error fetching favorites:', error);
      return [];
    }
  },

  addToFavorites: async (movie) => {
    try {
      console.log('➕ Adding movie to favorites:', movie.title);
      const response = await axiosAuth.post(API_URL, { movie });
      console.log('✅ Movie added to favorites');
      return response.data.favorites;
    } catch (error) {
      console.error('❌ Error adding to favorites:', error);
      throw error;
    }
  },

  removeFromFavorites: async (movieId) => {
    try {
      console.log('➖ Removing movie from favorites:', movieId);
      const response = await axiosAuth.delete(`${API_URL}/${movieId}`);
      console.log('✅ Movie removed from favorites');
      return response.data.favorites;
    } catch (error) {
      console.error('❌ Error removing from favorites:', error);
      throw error;
    }
  }
};
