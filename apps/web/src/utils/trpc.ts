import {
  createTRPCProxyClient,
  httpBatchLink,
  createWSClient,
  wsLink,
} from "@trpc/client";

import type { AppRouter } from "trpc-server/src/router";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url: "/trpc",
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url: `${window.location.origin
            .replace("http", "ws")
            .replace(":3000", ":3333")}/trpc`,
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
