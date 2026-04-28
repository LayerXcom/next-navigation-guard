import {
  AppRouterContext,
  AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { MutableRefObject, useContext, useMemo } from "react";
import { GuardDef, NavigationGuardCallback } from "../types";
import { debug } from "../utils/debug";
import { evaluateGuards } from "../utils/evaluateGuards";

export function useInterceptedAppRouter({
  guardMapRef,
  mockConfirmRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  mockConfirmRef: MutableRefObject<NavigationGuardCallback | undefined>;
}) {
  const origRouter = useContext(AppRouterContext);

  return useMemo((): AppRouterInstance | null => {
    if (!origRouter) {
      debug("No original router found");
      return null;
    }
    debug("Creating intercepted router");

    const guarded = async (
      type: "push" | "replace" | "refresh",
      to: string,
      accepted: () => void
    ) => {
      const ok = await evaluateGuards(guardMapRef, mockConfirmRef, {
        to,
        type,
      });
      if (ok) accepted();
    };

    return {
      ...origRouter,
      push: (href, ...args) => {
        debug(`push called with href: ${href}`);
        guarded("push", href, () => origRouter.push(href, ...args));
      },
      replace: (href, ...args) => {
        guarded("replace", href, () => origRouter.replace(href, ...args));
      },
      refresh: (...args) => {
        guarded("refresh", location.href, () => origRouter.refresh(...args));
      },
    };
  }, [origRouter, guardMapRef, mockConfirmRef]);
}
