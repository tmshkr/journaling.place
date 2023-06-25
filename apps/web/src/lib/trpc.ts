import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import type { AppRouter } from "trpc-server/src";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url: `http://localhost:2022`,
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url: `ws://localhost:2022`,
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
