import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";
import ws from "ws";
import type { AppRouter } from ".";

globalThis.WebSocket = ws as any;

const wsClient = createWSClient({
  url: `ws://localhost:2022`,
});
const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    wsLink({
      client: wsClient,
    }),
  ],
});

async function main() {
  const helloResponse = await trpc.greeting.hello.query({
    name: "world",
  });

  console.log("helloResponse", helloResponse);

  const createPostRes = await trpc.post.createPost.mutate({
    title: "hello world",
    text: "check out https://tRPC.io",
  });
  console.log("createPostResponse", createPostRes);

  let count = 0;
  await new Promise<void>((resolve) => {
    const subscription = trpc.post.randomNumber.subscribe(undefined, {
      onData(data) {
        // ^ note that `data` here is inferred
        console.log("received", data);
        count++;
        if (count > 3) {
          // stop after 3 pulls
          subscription.unsubscribe();
          resolve();
        }
      },
      onError(err) {
        console.error("error", err);
      },
    });
  });
  wsClient.close();
}

void main();
