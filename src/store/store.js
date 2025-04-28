import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/auth';
import favoritesReducer from './Slices/favorites';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
  },
});

export default store;
