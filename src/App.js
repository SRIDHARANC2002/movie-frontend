import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './components/Layout/JavaScript/Navbar';
import RoutesConfig from './routes/RoutesConfig';
// Removed unused import: import { login } from './store/Slices/auth';
import { fetchFavorites } from './store/Slices/favorites';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Function to check if there's a fresh login
    const checkFreshLogin = () => {
      const freshLogin = sessionStorage.getItem('freshLogin');
      if (freshLogin === 'true') {
        console.log('✅ Fresh login detected, no need to restore auth state');
        // Clear the flag
        sessionStorage.removeItem('freshLogin');
        return true;
      }
      return false;
    };

    // Function to restore auth state from localStorage
    const restoreAuthState = async () => {
      // If there's a fresh login, skip restoration
      if (checkFreshLogin()) {
        return true;
      }

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

          console.log('🔄 Restoring authentication state from localStorage');

          // Update Redux store directly to maintain login state
          dispatch({
            type: 'auth/login/fulfilled',
            payload: { token, user }
          });

          // Fetch favorites from server with a slight delay to ensure token is set
          setTimeout(() => {
            dispatch(fetchFavorites())
              .unwrap()
              .then((favorites) => {
                console.log(`✅ Fetched ${favorites.length} favorites after restoring auth state`);
              })
              .catch((error) => {
                console.warn('⚠️ Error fetching favorites after restoring auth state:', error);
              });
          }, 500);

          return true; // Successfully restored auth state
        } catch (parseError) {
          console.error('❌ Error parsing user data from localStorage:', parseError);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }
      } catch (error) {
        // Catch any unexpected errors in the entire process
        console.error('❌ Unexpected error restoring auth state:', error);
        return false;
      }
    };

    // Restore auth state immediately
    restoreAuthState();
  }, [dispatch]);

  return (
    <div className="App">
      <Navbar />
      <RoutesConfig />
    </div>
  );
}

export default App;
