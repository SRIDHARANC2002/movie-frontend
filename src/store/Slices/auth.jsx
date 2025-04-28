import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    login: null,
    isAuthenticated: false,
  },
  reducers: {
    setLoginData: (state, action) => {
      state.login = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.login = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setLoginData, logout } = authSlice.actions;
export default authSlice.reducer;

