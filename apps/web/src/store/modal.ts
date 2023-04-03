import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState, AppThunk } from "./index";

export interface ModalState {
  value: any | null;
  isVisible: boolean;
}

const initialState: ModalState = {
  value: null,
  isVisible: false,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    setModal: (state, action) => {
      state.value = action.payload.value;
      state.isVisible = action.payload.isVisible;
    },
  },
});

export const { setModal } = modalSlice.actions;
export const selectModal = (state: AppState) => state.modal;
export default modalSlice.reducer;
