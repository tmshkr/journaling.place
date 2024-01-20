import NextAuth, {
  AuthOptions,
  CallbacksOptions,
  SessionStrategy,
} from "next-auth";
import { prisma } from "src/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { sendVerificationRequest } from "src/auth/sendVerificationRequest";
import { sendWelcomeEmail } from "mailer";

const path = require("path");

enum ColorScheme {
  light = "light",
  auto = "auto",
  dark = "dark",
}

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  theme: {
    colorScheme: ColorScheme.light,
  },
  callbacks: {
    async session(params: Parameters<CallbacksOptions["session"]>[0]) {
      const { session, token } = params;
      (session as any).user = token.user;
      return session;
    },
    async jwt(params: Parameters<CallbacksOptions["jwt"]>[0]) {
      const { token, trigger } = params;
      token.user = await prisma.user.findUniqueOrThrow({
        where: { id: token.sub },
      });

      switch (trigger) {
        case "signUp":
          sendWelcomeEmail(
            (token as any).user.email,
            path.resolve(process.cwd(), "../../packages/mailer")
          );
          // subscribeUserToPromptOfTheDay(token.user.email);
          break;
        default:
          break;
      }

      return token;
    },
  },
};

export default NextAuth(authOptions);
