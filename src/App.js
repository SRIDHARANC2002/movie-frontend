import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './components/Layout/JavaScript/Navbar';
import RoutesConfig from './routes/RoutesConfig';
// Removed unused import: import { login } from './store/Slices/auth';
import { fetchFavorites } from './store/Slices/favorites';
import { fetchWatchList } from './store/Slices/watchlist';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Function to restore auth state from localStorage
    const restoreAuthState = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
          console.log('ℹ️ No authentication data found in localStorage');
          return false;
        }

        try {
          // Parse the user data
          const user = JSON.parse(userStr);

          // Update Redux store directly without making API calls
          // This ensures we don't get logged out if the API is temporarily unavailable
          console.log('🔄 Restoring authentication state from localStorage');

          // Instead of using the login thunk which makes API calls,
          // we'll directly update the Redux store
          dispatch({
            type: 'auth/login/fulfilled',
            payload: { token, user }
          });

          // Fetch favorites from server with a slight delay to ensure token is set
          try {
            console.log('🔄 Fetching favorites from server after login restoration');

            // Wait a moment to ensure token is properly set
            setTimeout(() => {
              // Use the fetchFavorites thunk to get favorites from the server
              dispatch(fetchFavorites())
                .unwrap()
                .then((favorites) => {
                  console.log(`✅ Fetched ${favorites.length} favorites from server`);
                })
                .catch((error) => {
                  console.warn('⚠️ Error fetching favorites from server:', error);

                  // Try a second time with a different approach
                  console.log('🔄 Trying again with direct service call...');

                  // Use the service directly as a fallback
                  import('./services/favoriteService').then(({ favoriteService }) => {
                    favoriteService.getFavorites()
                      .then(favorites => {
                        console.log(`✅ Direct service call: Fetched ${favorites.length} favorites`);

                        // Update Redux store with favorites
                        dispatch({
                          type: 'favorites/fetchFavorites/fulfilled',
                          payload: favorites
                        });
                      })
                      .catch(serviceError => {
                        console.warn('⚠️ Direct service call failed:', serviceError);

                        // Fallback to localStorage if all server attempts fail
                        try {
                          const localFavorites = localStorage.getItem('favorites');
                          if (localFavorites) {
                            const favorites = JSON.parse(localFavorites);
                            // Update Redux store with favorites from localStorage
                            dispatch({
                              type: 'favorites/fetchFavorites/fulfilled',
                              payload: favorites
                            });
                            console.log(`✅ Loaded ${favorites.length} favorites from localStorage as fallback`);
                          }
                        } catch (localError) {
                          console.warn('⚠️ Error loading favorites from localStorage:', localError);
                        }
                      });
                  });
                });
              // Also fetch watchlist in parallel
              dispatch(fetchWatchList())
                .unwrap()
                .then((watchlist) => {
                  console.log(`✅ Fetched ${watchlist.length} watchlist items from server`);
                })
                .catch((error) => {
                  console.warn('⚠️ Error fetching watchlist from server:', error);

                  // Try to load from localStorage as fallback
                  try {
                    const localWatchList = localStorage.getItem('watchList');
                    if (localWatchList) {
                      const watchlist = JSON.parse(localWatchList);
                      // Update Redux store with watchlist from localStorage
                      dispatch({
                        type: 'watchList/fetchWatchList/fulfilled',
                        payload: watchlist
                      });
                      console.log(`✅ Loaded ${watchlist.length} watchlist items from localStorage as fallback`);
                    }
                  } catch (localError) {
                    console.warn('⚠️ Error loading watchlist from localStorage:', localError);
                  }
                });
            }, 1000); // Wait 1 second to ensure token is set
          } catch (error) {
            console.warn('⚠️ Error dispatching data fetching:', error);
          }

          return true; // Successfully restored auth state
        } catch (parseError) {
          console.error('❌ Error parsing user data from localStorage:', parseError);
          // Don't clear localStorage here, as it might be a temporary error
          return false;
        }
      } catch (error) {
        // Catch any unexpected errors in the entire process
        console.error('❌ Unexpected error restoring auth state:', error);
        return false;
      }
    };

    // Restore auth state immediately
    const restored = restoreAuthState();

    // If auth state was restored, set up a background token validation
    if (restored) {
      // Skip token validation for now to avoid unnecessary errors
      // We'll rely on the interceptors to handle token refresh when needed
      console.log('✅ Authentication state restored successfully');

      // No need for background validation since we've already restored the state
      const validateTokenTimeout = setTimeout(() => {}, 0);

      // Clean up the timeout when the component unmounts
      return () => clearTimeout(validateTokenTimeout);
    }
  }, [dispatch]);

  return (
    <div className="App">
      <Navbar />
      <RoutesConfig />
    </div>
  );
}

export default App;
