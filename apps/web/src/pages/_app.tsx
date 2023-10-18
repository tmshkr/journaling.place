import "src/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import { sync } from "src/store/journal";
import { Provider as ReduxProvider } from "react-redux";
import axios from "axios";

import { DefaultSeo } from "next-seo";

import SEO from "../../next-seo.config";

import { QueryClient, QueryClientProvider } from "react-query";
import { trpc } from "src/utils/trpc";

import store from "src/store";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser, setUser, clearUser } from "src/store/user";
import { selectLoadingState, setLoading } from "src/store/loading";
import { setNetworkStatus } from "src/store/network";
import { AppShell } from "src/components/AppShell";
import { LoadingScreen } from "src/components/LoadingScreen";
import { handleKey } from "src/lib/crypto";

import { Modal } from "src/components/modals/ModalWrapper";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: (args) => sync(args),
    },
  },
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
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

export default App;

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
    if (user) {
      queryClient.prefetchQuery({ queryKey: "journal", staleTime: 5000 });
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
