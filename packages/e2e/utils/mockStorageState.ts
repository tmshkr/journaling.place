import { User } from "@prisma/client";
import { getRandomValues } from "crypto";
import { encode } from "next-auth/jwt";

export async function mockStorageState(user: User, baseURL: URL) {
  function randomString(size: number) {
    const i2hex = (i: number) => ("0" + i.toString(16)).slice(-2);
    const r = (a: string, i: number): string => a + i2hex(i);
    const bytes = getRandomValues(new Uint8Array(size));
    return Array.from(bytes).reduce(r, "");
  }
  const isSecure = baseURL.protocol === "https:";
  const state = JSON.stringify({
    cookies: [
      {
        name: `${isSecure ? "__Host-" : ""}next-auth.csrf-token`,
        value: randomString(32),
        domain: baseURL.hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
      },
      {
        name: `${isSecure ? "__Secure-" : ""}next-auth.callback-url`,
        value: encodeURIComponent(baseURL.toString()),
        domain: baseURL.hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
      },
      {
        name: `${isSecure ? "__Secure-" : ""}next-auth.session-token`,
        value: await encode({
          token: {
            name: null,
            email: user.email,
            picture: null,
            sub: user.id.toString(),
            user,
          },
          secret: process.env.NEXTAUTH_SECRET,
        }),
        domain: baseURL.hostname,
        path: "/",
        expires: new Date().setDate(new Date().getDate() + 30) / 1000,
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
      },
    ],
    origins: [
      {
        origin: baseURL.origin,
        localStorage: [
          {
            name: "nextauth.message",
            value: JSON.stringify({
              event: "session",
              data: { trigger: "getSession" },
              timestamp: Math.floor(Date.now() / 1000),
            }),
          },
        ],
      },
    ],
  });

  return state;
}
