import { createSlice } from "@reduxjs/toolkit";
import type { AppState } from "./index";

export enum NetworkStatus {
  idle = "idle",
  pending = "pending",
  succeeded = "succeeded",
  failed = "failed",
}
export interface NetworkState {
  status: NetworkStatus;
}

const initialState: NetworkState = {
  status: NetworkStatus.idle,
};

export const networkSlice = createSlice({
  name: "network",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setNetworkStatus: (state, action) => {
      state.status = action.payload;
    },
  },
});

export const { setNetworkStatus } = networkSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectNetworkStatus = (state: AppState) => state.network.status;

export default networkSlice.reducer;
