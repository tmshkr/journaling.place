import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import type { AppRouter } from "trpc-server/src";

const trpcUrl = process.env.NEXTAUTH_URL + "/api/trpc";

function getLink() {
  return typeof window === "undefined"
    ? httpBatchLink({
        url: trpcUrl,
      })
    : wsLink<AppRouter>({
        client: createWSClient({
          url: trpcUrl
            .replace("http", "ws")
            .replace(
              "3000",
              process.env.NODE_ENV === "development" ? "3001" : "3000"
            ),
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
