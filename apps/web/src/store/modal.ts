import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppState, AppThunk } from "./index";

export interface ModalState {
  value: any | null;
}

const initialState: ModalState = {
  value: null,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    setModal: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setModal } = modalSlice.actions;
export const selectModal = (state: AppState) => state.modal.value;
export default modalSlice.reducer;
