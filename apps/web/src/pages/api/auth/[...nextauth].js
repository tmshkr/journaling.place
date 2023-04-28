import NextAuth from "next-auth";
import { prisma } from "src/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { sendVerificationRequest } from "src/auth/sendVerificationRequest";
import { sendWelcomeEmail } from "mailer";

const path = require("path");

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  theme: {
    colorScheme: "light",
  },
  callbacks: {
    async session(args) {
      const { session, token } = args;
      session.user = token.user;
      return session;
    },
    async jwt({ token, isNewUser }) {
      token.user = await prisma.user.findUnique({
        where: { id: token.sub },
      });

      if (isNewUser) {
        sendWelcomeEmail(
          token.user.email,
          path.resolve(process.cwd(), "../../packages/mailer")
        );
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
