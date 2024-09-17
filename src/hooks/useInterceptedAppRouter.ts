import {
  AppRouterContext,
  AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MutableRefObject, useContext, useMemo } from "react";
import { NavigationGuard } from "../types";

export function useInterceptedAppRouter({
  callbackMapRef,
}: {
  callbackMapRef: MutableRefObject<Map<string, NavigationGuard>>;
}) {
  const origRouter = useContext(AppRouterContext);

  return useMemo((): AppRouterInstance | null => {
    if (!origRouter) return null;

    const guarded = async (
      type: "push" | "replace" | "refresh",
      to: string,
      accepted: () => void
    ) => {
      const callbacks = [...callbackMapRef.current.values()];
      for (const callback of callbacks) {
        const confirm = await callback({ to, type });
        if (!confirm) return;
      }
      accepted();
    };

    return {
      ...origRouter,
      push: (href, ...args) => {
        guarded("push", href, () => origRouter.push(href, ...args));
      },
      replace: (href, ...args) => {
        guarded("replace", href, () => origRouter.replace(href, ...args));
      },
      refresh: (...args) => {
        guarded("refresh", location.href, () => origRouter.refresh(...args));
      },
    };
  }, [origRouter]);
}
