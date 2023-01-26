import NextAuth from "next-auth";
import { prisma } from "src/lib/prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { sendVerificationRequest } from "src/auth/sendVerificationRequest";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

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
      const user = await prisma.user.findUnique({
        where: { id: BigInt(token.sub) },
      });
      session.user = user;
      return session;
    },
  },
};

export default NextAuth(authOptions);
