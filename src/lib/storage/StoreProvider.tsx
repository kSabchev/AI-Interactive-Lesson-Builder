"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth/client";
import { accountStore, browserStore, type LessonStore } from "./store";

/** `isDemo` marks a demo account, which has a placeholder email and lives in one browser. */
export type AccountUser = { id: string; email: string; name: string; isDemo: boolean };

export type StoreState =
  | { status: "loading" }
  | { status: "ready"; store: LessonStore; user: AccountUser | null };

const StoreContext = createContext<StoreState>({ status: "loading" });

const noopSubscribe = () => () => {};

/** False during server rendering and hydration, true afterwards. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Chooses where lessons are saved: the account when signed in, this browser otherwise. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  // The session is only known in the browser, so the server and the hydrating client both render "loading";
  // otherwise their HTML differs and React throws the server markup away.
  const hydrated = useHydrated();
  const value: StoreState = !hydrated || isPending
    ? { status: "loading" }
    : data
      ? {
          status: "ready",
          store: accountStore,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            isDemo: Boolean(data.user.isAnonymous),
          },
        }
      : { status: "ready", store: browserStore, user: null };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreState {
  return useContext(StoreContext);
}

/** For components that only render once a lesson has loaded, which implies the store is ready. */
export function useReadyStore() {
  const state = useStore();
  if (state.status !== "ready") throw new Error("useReadyStore called before the store was ready");
  return state.store;
}
