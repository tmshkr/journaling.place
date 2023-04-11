import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState, AppThunk } from "./index";

export interface UserState {
  value: any | null;
  status: "idle" | "pending" | "succeeded" | "failed";
}

const initialState: UserState = {
  value: null,
  status: "idle",
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setUser: (state, action) => {
      const user = action.payload;
      delete user.salt;
      state.value = user;
      state.status = "succeeded";
    },
    clearUser: (state) => {
      state.value = null;
      state.status = "idle";
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectUser = (state: AppState) => state.user.value;

export default userSlice.reducer;
