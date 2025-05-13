import { axiosAuth } from '../axios/config';

// Base URL for the favorites API
const API_URL = "https://movie-backend-4-qrw2.onrender.com/api/favorites";
// Removed unused variable: const API_URL_LOCAL = "MONGODB_URI=mongodb+srv://sridharan:sridharan@cluster0.wsrdh.mongodb.net/tamilMovie-DB?retryWrites=true&w=majority&appName=Cluster0"
// Helper function to log detailed error information
const logErrorDetails = (error, operation) => {
  console.error(`❌ Error ${operation}:`, error);

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error(`Status: ${error.response.status}`);
    console.error(`Headers:`, error.response.headers);
    console.error(`Data:`, error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
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

      // Log the token to verify it's being sent
      const token = localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      // Set up explicit headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Try different endpoint formats
      let response;

      try {
        // Format 1: Standard endpoint
        response = await axiosAuth.get(API_URL, { headers });
        console.log('Format 1 succeeded (standard endpoint)');
      } catch (error1) {
        console.log('First get attempt failed:', error1.message);

        try {
          // Format 2: Try with /user suffix
          response = await axiosAuth.get(`${API_URL}/user`, { headers });
          console.log('Format 2 succeeded (/user suffix)');
        } catch (error2) {
          console.log('Second get attempt failed:', error2.message);

          try {
            // Format 3: Try with /me suffix
            response = await axiosAuth.get(`${API_URL}/me`, { headers });
            console.log('Format 3 succeeded (/me suffix)');
          } catch (error3) {
            console.log('Third get attempt failed:', error3.message);

            // Format 4: Try with query parameter
            response = await axiosAuth.get(`${API_URL}?userId=me`, { headers });
            console.log('Format 4 succeeded (query parameter)');
          }
        }
      }

      // Log the full response for debugging
      console.log('Server response:', response.data);

      if (response.data && response.data.favorites) {
        console.log(`✅ Favorites fetched successfully: ${response.data.favorites.length} movies`);

        // Save to localStorage as a backup
        try {
          localStorage.setItem('favorites', JSON.stringify(response.data.favorites));
          console.log('✅ Favorites saved to localStorage');
        } catch (storageError) {
          console.warn('⚠️ Could not save favorites to localStorage:', storageError);
        }

        return response.data.favorites;
      } else if (response.data && Array.isArray(response.data)) {
        // Some APIs return the favorites array directly
        console.log(`✅ Favorites fetched successfully (direct array): ${response.data.length} movies`);

        // Save to localStorage as a backup
        try {
          localStorage.setItem('favorites', JSON.stringify(response.data));
          console.log('✅ Favorites saved to localStorage');
        } catch (storageError) {
          console.warn('⚠️ Could not save favorites to localStorage:', storageError);
        }

        return response.data;
      } else {
        console.log('⚠️ No favorites found in server response');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching favorites:', error);
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

      // Extract the fields that the backend expects
      // The backend controller expects: id, title, poster_path, release_date, vote_average, overview
      const movieData = {
        id: Number(movie.id),  // Ensure ID is a number
        title: movie.title,
        poster_path: movie.poster_path || '',
        release_date: movie.release_date || '',
        vote_average: movie.vote_average || 0,
        overview: movie.overview || ''  // Add overview field which backend might expect
      };

      console.log('Sending movie data:', movieData);

      // Log the token to verify it's being sent
      const token = localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      // Try different request formats with explicit headers
      let response;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Based on the backend code, we need to send the movie data directly
      // The backend expects: id, title, poster_path, release_date, vote_average, overview
      try {
        // Format 1: Send movie object directly - this matches the backend expectation
        response = await axiosAuth.post(API_URL, movieData, { headers });
        console.log('Format 1 succeeded (movie object directly)');
      } catch (error1) {
        console.log('First add attempt failed:', error1.message);

        // If the first attempt fails, try with minimal required fields
        try {
          // Format 2: Send minimal required fields (id and title are required by backend)
          response = await axiosAuth.post(API_URL, {
            id: Number(movie.id),
            title: movie.title,
            poster_path: movie.poster_path || '',
            release_date: movie.release_date || '',
            vote_average: movie.vote_average || 0
          }, { headers });
          console.log('Format 2 succeeded (minimal required fields)');
        } catch (error2) {
          console.log('Second add attempt failed:', error2.message);

          // Last resort - try with just the required fields
          response = await axiosAuth.post(API_URL, {
            id: Number(movie.id),
            title: movie.title
          }, { headers });
          console.log('Format 3 succeeded (id and title only)');
        }
      }

      // Log the response to see what the server returned
      console.log('Server response:', response.data);

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
          // Use the same movieData format as above to ensure consistency
          const movieDataForStorage = {
            id: Number(movie.id),
            title: movie.title,
            poster_path: movie.poster_path || '',
            release_date: movie.release_date || '',
            vote_average: movie.vote_average || 0,
            overview: movie.overview || ''
          };
          currentFavorites.push(movieDataForStorage);
          localStorage.setItem('favorites', JSON.stringify(currentFavorites));
          console.log('✅ Movie saved to localStorage as fallback');
        }
      } catch (storageError) {
        console.error('❌ Error saving to localStorage:', storageError);
      }

      // Return the movie anyway so UI doesn't break
      return [movie];
    }
  },

  removeFromFavorites: async (movieId) => {
    try {
      console.log('➖ Removing movie from favorites:', movieId);

      // Ensure movieId is a number
      const numericMovieId = Number(movieId);

      // Log the token to verify it's being sent
      const token = localStorage.getItem('token');
      console.log('Using token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'No token');

      // Set up headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Try multiple endpoint formats to see which one works
      let response;

      // Based on the backend code, we should use the RESTful approach with the ID in the URL
      try {
        // Format 1: Use URL parameter with numeric ID (RESTful approach)
        // This matches the backend route: router.delete('/:id', removeFavorite);
        response = await axiosAuth.delete(`${API_URL}/${numericMovieId}`, { headers });
        console.log('Format 1 succeeded (URL parameter with numeric ID)');
      } catch (error1) {
        console.log('First delete attempt failed:', error1.message);

        try {
          // Format 2: Use URL parameter with string ID (in case backend expects string)
          response = await axiosAuth.delete(`${API_URL}/${String(numericMovieId)}`, { headers });
          console.log('Format 2 succeeded (URL parameter with string ID)');
        } catch (error2) {
          console.log('Second delete attempt failed:', error2.message);

          try {
            // Format 3: Send id in request body (not standard but might work)
            response = await axiosAuth.delete(`${API_URL}`, {
              headers,
              data: { id: numericMovieId }
            });
            console.log('Format 3 succeeded (request body with id)');
          } catch (error3) {
            console.log('Third delete attempt failed:', error3.message);

            // Format 4: Last resort - try with POST method and /remove endpoint
            response = await axiosAuth.post(`${API_URL}/remove`, {
              id: numericMovieId
            }, { headers });
            console.log('Format 4 succeeded (POST with /remove endpoint)');
          }
        }
      }

      // Log the response to see what the server returned
      console.log('Server response:', response.data);

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
      // This ensures the UI updates even if the server request fails
      console.log('⚠️ All removal attempts failed, simulating success locally');

      // Update localStorage to keep it in sync
      try {
        const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const numericMovieId = Number(movieId);
        const updatedFavorites = currentFavorites.filter(movie => Number(movie.id) !== numericMovieId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));

        // Return the updated favorites
        return updatedFavorites;
      } catch (localError) {
        console.error('Error handling local favorites:', localError);
      }

      // Return empty array as last resort
      return [];
    }
  }
};
