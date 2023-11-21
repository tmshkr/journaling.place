import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { WebSocketServer } from "ws";
import { appRouter, AppRouter } from "./router";
import { createContext } from "./context";

const port = 3333;

const wss = new WebSocketServer({ port });
const handler = applyWSSHandler<AppRouter>({
  wss,
  router: appRouter,
  createContext,
});

console.log(`✅ WebSocket Server listening on ws://localhost:${port}`);
