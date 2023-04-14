import "src/styles/globals.scss";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { getJournals } from "src/store/journal";
import { Provider as ReduxProvider } from "react-redux";
import axios from "axios";

import { DefaultSeo } from "next-seo";

import SEO from "../../next-seo.config";

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
import { setNetworkStatus } from "src/store/network";
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
      await handleKey(user.salt ? new Uint8Array(user.salt.data) : undefined);
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

  useEffect(() => {
    if (user && !queryClient.isFetching("journal")) {
      queryClient.fetchQuery("journal", () => getJournals());
    }
  }, [user]);

  useEffect(() => {
    const { requestInterceptor, responseInterceptor } =
      registerInterceptors(dispatch);
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [dispatch]);

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

function registerInterceptors(dispatch) {
  let openRequests = 0;
  const requestInterceptor = axios.interceptors.request.use(
    function (config) {
      openRequests++;
      dispatch(setNetworkStatus("pending"));
      return config;
    },
    function (error) {
      openRequests--;
      dispatch(setNetworkStatus("failed"));
      return Promise.reject(error);
    }
  );
  const responseInterceptor = axios.interceptors.response.use(
    function (response) {
      openRequests--;
      if (openRequests === 0) {
        dispatch(setNetworkStatus("succeeded"));
      }
      return response;
    },
    function (error) {
      openRequests--;
      dispatch(setNetworkStatus("failed"));
      return Promise.reject(error);
    }
  );

  return { requestInterceptor, responseInterceptor };
}
