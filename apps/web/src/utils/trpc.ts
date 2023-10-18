import { httpBatchLink, createWSClient, wsLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
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
              process.env.NODE_ENV === "development" ? "3001" : "3000"
            ),
        }),
      });
}

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [getLink()],
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
});
