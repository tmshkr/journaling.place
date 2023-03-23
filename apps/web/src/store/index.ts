import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import userReducer from "./user";
import loadingReducer from "./loading";
import modalReducer from "./modal";
import promptReducer from "./prompt";

export function makeStore() {
  return configureStore({
    reducer: {
      user: userReducer,
      loading: loadingReducer,
      modal: modalReducer,
      prompt: promptReducer,
    },
  });
}

const store = makeStore();

export type AppState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
// export const useAppDispatch = (args) => useDispatch<AppDispatch>(args);
// export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  AppState,
  unknown,
  Action<string>
>;

export default store;
