import {
  createTRPCProxyClient,
  httpBatchLink,
  createWSClient,
  wsLink,
} from "@trpc/client";

import type { AppRouter } from "trpc-server/src/router";

let wsClient: ReturnType<typeof createWSClient>;
export let trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});

function getLink(resolve?: (value?: any) => void) {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: "/trpc",
    });
  }

  wsClient = createWSClient({
    url: `${window.location.origin
      .replace("http", "ws")
      .replace(":3000", ":3333")}/trpc`,
    onOpen: () => {
      if (resolve) {
        resolve();
      }
    },
  });

  return wsLink<AppRouter>({
    client: wsClient,
  });
}

export async function resetTRPC() {
  wsClient.close();
  await new Promise((resolve) => {
    trpc = createTRPCProxyClient<AppRouter>({
      links: [getLink(resolve)],
    });
  });
}
