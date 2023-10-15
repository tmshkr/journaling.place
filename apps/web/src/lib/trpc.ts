import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import type { AppRouter } from "trpc-server/src";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url:
          process.env.NODE_ENV === "development"
            ? `http://localhost:2022`
            : process.env.NEXTAUTH_URL! + "/trpc",
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url:
            process.env.NODE_ENV === "development"
              ? `ws://localhost:2022`
              : process.env.NEXTAUTH_URL!.replace("https", "wss") + "/trpc",
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
