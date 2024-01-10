import { createSlice } from "@reduxjs/toolkit";
import type { AppState } from "./index";

export interface ModalState {
  name: string | null;
  isVisible: boolean;
  keepOpen?: boolean;
}

const initialState: ModalState = {
  name: null,
  isVisible: false,
  keepOpen: false,
};

export const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    setModal: (state, action) => {
      for (const key in action.payload) {
        state[key] = action.payload[key];
      }
    },
  },
});

export const { setModal } = modalSlice.actions;
export const selectModal = (state: AppState) => state.modal;
export default modalSlice.reducer;
