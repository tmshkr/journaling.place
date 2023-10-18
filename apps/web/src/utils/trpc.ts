import {
  createTRPCProxyClient,
  httpBatchLink,
  createWSClient,
  wsLink,
} from "@trpc/client";
import type { AppRouter } from "src/server/routers/_app";

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
              process.env.NODE_ENV === "development" ? "2222" : "3000"
            ),
        }),
      });
}

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [getLink()],
});
