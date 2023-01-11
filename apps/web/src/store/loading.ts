import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState, AppThunk } from "./index";

export interface LoadingState {
  value: any | null;
}

const initialState: LoadingState = {
  value: null,
};

export const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setLoading } = loadingSlice.actions;
export const selectLoadingState = (state: AppState) => state.user.value;
export default loadingSlice.reducer;
