import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import RoutesConfig from './routes/RoutesConfig';
import { login } from './store/Slices/auth';
import './App.css';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for existing auth state on app load
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      dispatch(login({ token, user: JSON.parse(user) }));
    }
  }, [dispatch]);

  return <RoutesConfig />;
}

export default App;
