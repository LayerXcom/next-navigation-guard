import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { useContext } from "react";
import { GuardDef, RenderedState } from "../types";
import { DEBUG } from "../utils/debug";
import {
  newToken,
  setupHistoryAugmentationOnce,
} from "../utils/historyAugmentation";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// Based on https://github.com/vercel/next.js/discussions/47020#discussioncomment-7826121

const renderedStateRef: { current: RenderedState } = {
  current: { index: -1, token: "" },
};

export function useInterceptPopState({
  guardMapRef,
}: {
  guardMapRef: React.MutableRefObject<Map<string, GuardDef>>;
}) {
  const pagesRouter = useContext(RouterContext);

  useIsomorphicLayoutEffect(() => {
    // NOTE: Called before Next.js router setup which is useEffect().
    // https://github.com/vercel/next.js/blob/50b9966ba9377fd07a27e3f80aecd131fa346482/packages/next/src/client/components/app-router.tsx#L518
    const { writeState } = setupHistoryAugmentationOnce({ renderedStateRef });

    const handlePopState = createHandlePopState(guardMapRef, writeState);

    if (pagesRouter) {
      pagesRouter.beforePopState(() => handlePopState(history.state));

      return () => {
        pagesRouter.beforePopState(() => true);
      };
    } else {
      const onPopState = (event: PopStateEvent) => {
        if (!handlePopState(event.state)) {
          event.stopImmediatePropagation();
        }
      };

      // NOTE: Called before Next.js router setup which is useEffect().
      // https://github.com/vercel/next.js/blob/50b9966ba9377fd07a27e3f80aecd131fa346482/packages/next/src/client/components/app-router.tsx#L518
      // NOTE: capture on popstate listener is not working on Chrome.
      window.addEventListener("popstate", onPopState);

      return () => {
        window.removeEventListener("popstate", onPopState);
      };
    }
  }, [pagesRouter]);
}

function createHandlePopState(
  guardMapRef: React.MutableRefObject<Map<string, GuardDef>>,
  writeState: () => void
) {
  let dispatchedState: unknown;

  return (nextState: any): boolean => {
    const token: string | undefined = nextState.__next_navigation_guard_token;
    const nextIndex: number =
      Number(nextState.__next_navigation_guard_stack_index) || 0;

    if (!token || token !== renderedStateRef.current.token) {
      if (DEBUG)
        console.log(
          `useInterceptPopState(): token mismatch, skip handling (current: ${renderedStateRef.current.token}, next: ${token})`
        );
      renderedStateRef.current.token = token || newToken();
      renderedStateRef.current.index = token ? nextIndex : 0;
      writeState();
      return true;
    }

    const delta = nextIndex - renderedStateRef.current.index;
    // When go(-delta) is called, delta should be zero.
    if (delta === 0) {
      if (DEBUG)
        console.log(
          `useInterceptPopState(): discard popstate event: delta is 0`
        );
      return false;
    }

    if (DEBUG)
      console.log(
        `useInterceptPopState(): __next_navigation_guard_stack_index is ${nextState.__next_navigation_guard_stack_index}`
      );

    const to = location.pathname + location.search;

    const defs = [...guardMapRef.current.values()];

    if (nextState === dispatchedState || defs.length === 0) {
      if (DEBUG)
        console.log(
          `useInterceptPopState(): Accept popstate event, index: ${nextIndex}`
        );
      dispatchedState = null;
      renderedStateRef.current.index = nextIndex;
      return true;
    }

    if (DEBUG)
      console.log(
        `useInterceptPopState(): Suspend popstate event, index: ${nextIndex}`
      );

    // Wait for all callbacks to be resolved
    (async () => {
      for (const def of defs) {
        if (!def.enabled({ to, type: "popstate" })) continue;

        const confirm = await def.callback({ to, type: "popstate" });
        // TODO: check cancel while waiting for navigation guard
        if (!confirm) {
          if (DEBUG) {
            console.log(
              `useInterceptPopState(): Cancel popstate event, go(): ${
                renderedStateRef.current
              } - ${nextIndex} = ${-delta}`
            );
          }
          if (delta !== 0) {
            window.history.go(-delta);
          }
          return;
        }

        // accept
        dispatchedState = nextState;
        window.dispatchEvent(
          new PopStateEvent("popstate", { state: nextState })
        );
      }
    })();

    // Return false to call stopImmediatePropagation()
    return false;
  };
}
