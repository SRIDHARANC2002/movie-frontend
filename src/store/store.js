import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/auth';
import favoritesReducer from './Slices/favorites';
import watchListReducer from './Slices/watchlist';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favorites: favoritesReducer,
    watchList: watchListReducer,
  },
});

export default store;
