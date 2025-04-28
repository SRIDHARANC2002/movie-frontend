import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  watchListValues: [],
};

const watchListSlice = createSlice({
  name: "watchList",
  initialState,
  reducers: {
    addMovie: (state, action) => {
      state.watchListValues.push(action.payload);
    },
    removeMovie: (state, action) => {
      state.watchListValues = state.watchListValues.filter(
        (movie) => movie.id !== action.payload
      );
    },
  },
});

export const { addMovie, removeMovie } = watchListSlice.actions;
export default watchListSlice.reducer;
