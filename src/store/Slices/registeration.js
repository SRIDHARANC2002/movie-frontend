import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
};

const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    registerUser: (state, action) => {
      state.users.push(action.payload);
    },
  },
});

export const { registerUser } = registrationSlice.actions;
export default registrationSlice.reducer;
