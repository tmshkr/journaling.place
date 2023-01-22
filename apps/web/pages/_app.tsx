import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Provider as ReduxProvider } from "react-redux";
import { DefaultSeo } from "next-seo";

import SEO from "../next-seo.config";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";

import store from "src/store";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser, setUser, clearUser } from "src/store/user";
import Head from "next/head";
import { AppShell } from "src/components/AppShell";
import { handleKey, clearKey } from "src/lib/crypto";

const queryClient = new QueryClient();

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Neuton&display=swap"
          rel="stylesheet"
        />
        <meta name="application-name" content="PWA App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PWA App" />
        <meta name="description" content="Best PWA App in the world" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <DefaultSeo {...SEO} />
      <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <ReduxProvider store={store}>
            <PageAuth {...{ Component, pageProps }} />
          </ReduxProvider>
        </QueryClientProvider>
      </SessionProvider>
    </>
  );
}

function PageAuth({ Component, pageProps }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  const handleSession = async () => {
    console.log("session", session, status);
    if (status === "authenticated") {
      const user: any = session.user;
      await handleKey(user.id, new Uint8Array(user.salt?.data));
      dispatch(setUser(session.user));
    } else if (status === "unauthenticated") {
      dispatch(clearUser());
    }
  };

  useEffect(() => {
    handleSession();
  }, [status]);

  if (status === "loading") return <div>Loading...</div>;

  return (
    <AppShell>
      <Component {...pageProps} />
    </AppShell>
  );
}
