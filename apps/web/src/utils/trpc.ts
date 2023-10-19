import {
  createTRPCProxyClient,
  httpBatchLink,
  createWSClient,
  wsLink,
} from "@trpc/client";

import type { AppRouter } from "trpc-server/src/router";

const trpcUrl = process.env.NEXTAUTH_URL!.replace(":3000", ":2222") + "/trpc";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url: trpcUrl,
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url: trpcUrl.replace("http", "ws"),
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
