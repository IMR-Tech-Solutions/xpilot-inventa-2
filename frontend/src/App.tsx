import AppRouter from "./Router/Router";
import { Suspense, useEffect } from "react";
import Loader from "./Loader/Loader";
import { Provider } from "react-redux";
import store from "./redux/store";
import AuthLoader from "./authentication/AuthLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { firebaseService } from "./firebase/firebaseService";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchInterval: 1 * 60 * 1000,
    },
  },
});

function AppContent() {
  useEffect(() => {
    firebaseService.onForegroundMessage((payload) => {
      console.log("Foreground notification received:", payload);
    });
  }, []);

  return (
    <>
      <Suspense fallback={<Loader />}>
        <AppRouter />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthLoader>
          <AppContent />
        </AuthLoader>
      </QueryClientProvider>
    </Provider>
  );
}
