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
import { selectLoadingState, setLoading } from "src/store/loading";
import Head from "next/head";
import { AppShell } from "src/components/AppShell";
import { LoadingScreen } from "src/components/LoadingScreen";
import { handleKey, clearKey } from "src/lib/crypto";

import { Modal } from "src/components/modals/ModalWrapper";

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
  const { data: session, status } = useSession();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoadingState);
  const dispatch = useAppDispatch();

  const handleSession = async () => {
    if (status === "authenticated") {
      const user: any = session.user;
      await handleKey(
        user.id,
        user.salt ? new Uint8Array(user.salt.data) : undefined
      );
      dispatch(setUser(session.user));
    } else if (status === "unauthenticated") {
      dispatch(clearUser());
    }

    if (status === "loading") {
      dispatch(setLoading({ ...loading, user: true }));
    } else {
      dispatch(setLoading({ ...loading, user: false }));
    }
  };

  useEffect(() => {
    handleSession();
  }, [status]);

  return user ? (
    <>
      <LoadingScreen />
      <AppShell>
        <Component {...pageProps} />
        <Modal />
      </AppShell>
    </>
  ) : (
    <>
      <LoadingScreen />
      <Component {...pageProps} />
    </>
  );
}
