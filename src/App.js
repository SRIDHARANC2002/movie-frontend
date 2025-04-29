import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Navbar from './components/Layout/JavaScript/Navbar';
import RoutesConfig from './routes/RoutesConfig';
import { fetchFavorites } from './store/Slices/favorites';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If we have a token, fetch favorites
    if (token) {
      dispatch(fetchFavorites());
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
