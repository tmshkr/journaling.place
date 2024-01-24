import { User } from "@prisma/client";
import { Session } from "next-auth";

export enum ColorScheme {
  light = "light",
  auto = "auto",
  dark = "dark",
}

export interface CustomSession extends Session {
  user: User;
}
