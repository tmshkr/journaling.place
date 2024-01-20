import "src/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { sync } from "src/store/journal";
import { Provider as ReduxProvider } from "react-redux";
import axios from "axios";

import { DefaultSeo } from "next-seo";

import SEO from "../../next-seo.config";

import { QueryClient, QueryClientProvider } from "react-query";

import store from "src/store";
import { useAppDispatch, useAppSelector } from "src/store";
import { selectUser, setUser, clearUser } from "src/store/user";
import { selectLoadingState, setLoading } from "src/store/loading";
import { setNetworkStatus } from "src/store/network";
import { AppShell } from "src/components/AppShell";
import { LoadingScreen } from "src/components/LoadingScreen";
import { setKey } from "src/lib/crypto";

import { Modal } from "src/components/modals/ModalWrapper";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: (args) => sync(args),
    },
  },
});

function App({ Component, pageProps: { ...pageProps } }: AppProps) {
  return (
    <SessionProvider>
      <DefaultSeo {...SEO} />
      <QueryClientProvider client={queryClient}>
        <ReduxProvider store={store}>
          <PageAuth {...{ Component, pageProps }} />
        </ReduxProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default App;

export let authSession: ReturnType<typeof useSession>;
function PageAuth({ Component, pageProps }) {
  authSession = useSession();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectLoadingState);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSession = async () => {
    if (user?.updating) return;

    switch (authSession.status) {
      case "loading":
        dispatch(setLoading({ ...loading, user: true }));
        break;
      case "authenticated":
        dispatch(setUser(authSession.data.user));
        dispatch(setLoading({ ...loading, user: false }));
        await setKey();
        break;
      case "unauthenticated":
        dispatch(clearUser());
        dispatch(setLoading({ ...loading, user: false }));
        if (Component.auth) {
          router.push("/");
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    handleSession();
  }, [authSession.status]);

  useEffect(() => {
    const { requestInterceptor, responseInterceptor } =
      registerInterceptors(dispatch);
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [dispatch]);

  if (user) {
    return (
      <>
        <LoadingScreen />
        <AppShell>
          <Component {...pageProps} />
          <Modal />
        </AppShell>
      </>
    );
  }

  if (Component.auth) {
    return null;
  }

  return (
    <>
      <LoadingScreen />
      <Component {...pageProps} />
      <Modal />
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
