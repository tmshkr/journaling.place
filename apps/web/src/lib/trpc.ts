import { wsLink, createWSClient } from "@trpc/client/links/wsLink";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { createTRPCNext } from "@trpc/next";
import type { AppRouter } from "trpc-server/src";

function getEndingLink() {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: `http://localhost:2022`,
    });
  }
  const client = createWSClient({
    url: `ws://localhost:2022`,
  });
  return wsLink<AppRouter>({
    client,
  });
}

export const trpc = createTRPCNext<AppRouter>({
  config(opts) {
    return {
      links: [getEndingLink()],
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
});
