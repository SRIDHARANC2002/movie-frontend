import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './components/Layout/JavaScript/Navbar';
import RoutesConfig from './routes/RoutesConfig';
import { login } from './store/Slices/auth';
import { fetchFavorites } from './store/Slices/favorites';
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

          // Load favorites from localStorage instead of fetching from server
          try {
            const localFavorites = localStorage.getItem('favorites');
            if (localFavorites) {
              const favorites = JSON.parse(localFavorites);
              // Update Redux store with favorites from localStorage
              dispatch({
                type: 'favorites/fetchFavorites/fulfilled',
                payload: favorites
              });
              console.log('✅ Favorites loaded from localStorage');
            }
          } catch (favError) {
            console.warn('⚠️ Error loading favorites from localStorage:', favError);
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
