import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { appRouter, AppRouter } from "./router";
import { createContext } from "./context";

const port = 2222;

const wss = new ws.Server({ port });
const handler = applyWSSHandler<AppRouter>({
  wss,
  router: appRouter,
  createContext,
});

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});

console.log(`✅ WebSocket Server listening on ws://localhost:${port}`);
process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
