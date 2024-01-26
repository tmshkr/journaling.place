import { createSlice } from "@reduxjs/toolkit";
import type { AppState } from "./index";

export interface LoadingState {
  user: boolean;
  editor: boolean;
}

const initialState: LoadingState = {
  user: true,
  editor: true,
};

export const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      for (const key in action.payload) {
        state[key] = action.payload[key];
      }
    },
  },
});

export const { setLoading } = loadingSlice.actions;
export const selectLoadingState = (state: AppState) => state.loading;
export default loadingSlice.reducer;
