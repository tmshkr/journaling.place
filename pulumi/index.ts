import { AppStack } from "./stack.ts";

export default async () => {
  const stack = new AppStack();
  return stack.outputs;
};
