import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import type { AppRouter } from "trpc-server/src";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url: process.env.NEXT_PUBLIC_NEXTAUTH_URL
          ? process.env.NEXT_PUBLIC_NEXTAUTH_URL! + "/trpc"
          : `http://localhost:2222`,
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url: process.env.NEXT_PUBLIC_NEXTAUTH_URL
            ? process.env.NEXT_PUBLIC_NEXTAUTH_URL!.replace("https", "wss") +
              "/trpc"
            : `ws://localhost:2222`,
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
