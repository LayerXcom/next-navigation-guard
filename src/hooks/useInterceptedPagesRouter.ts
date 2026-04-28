import { NextRouter } from "next/dist/client/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { Url } from "next/dist/shared/lib/router/router";
import { MutableRefObject, useContext, useMemo } from "react";
import { GuardDef, NavigationGuardCallback } from "../types";
import { evaluateGuards } from "../utils/evaluateGuards";

export function useInterceptedPagesRouter({
  guardMapRef,
  mockConfirmRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  mockConfirmRef: MutableRefObject<NavigationGuardCallback | undefined>;
}) {
  const origRouter = useContext(RouterContext);

  return useMemo((): NextRouter | null => {
    if (!origRouter) return null;

    const guarded = async (
      type: "push" | "replace" | "refresh",
      toUrl: Url,
      accepted: () => Promise<boolean>
    ): Promise<boolean> => {
      const to = typeof toUrl === "string" ? toUrl : toUrl.href ?? "";
      const ok = await evaluateGuards(guardMapRef, mockConfirmRef, {
        to,
        type,
      });
      if (!ok) return false;
      return await accepted();
    };

    return {
      ...origRouter,
      push: (href, ...args) => {
        return guarded("push", href, () => origRouter.push(href, ...args));
      },
      replace: (href, ...args) => {
        return guarded("replace", href, () =>
          origRouter.replace(href, ...args)
        );
      },
      reload: (...args) => {
        guarded("refresh", location.href, async () => {
          origRouter.reload(...args); // void
          return true;
        });
      },
    };
  }, [origRouter, guardMapRef, mockConfirmRef]);
}
