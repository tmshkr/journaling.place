import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState, AppThunk } from "./index";

export interface PromptState {
  value: any | null;
}

const initialState: PromptState = {
  value: null,
};

export const promptSlice = createSlice({
  name: "prompt",
  initialState,
  reducers: {
    setPrompt: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setPrompt } = promptSlice.actions;
export const selectPrompt = (state: AppState) => state.prompt.value;
export default promptSlice.reducer;
