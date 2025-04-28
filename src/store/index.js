import { configureStore } from "@reduxjs/toolkit";
import watchListSlice from "./Slices/watchlist.jsx";
import registerationSlice from "./Slices/registeration.jsx";
import authSlice from "./Slices/auth.js";
import favoritesSlice from "./Slices/favorites.js";

export const store = configureStore({
  reducer: {
    watchList: watchListSlice,
    registeration: registerationSlice,
    auth: authSlice,
    favorites: favoritesSlice,
  }
});
