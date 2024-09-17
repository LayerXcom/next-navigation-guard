import { NextRouter } from "next/dist/client/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { Url } from "next/dist/shared/lib/router/router";
import { MutableRefObject, useContext, useMemo } from "react";
import { NavigationGuard } from "../types";

export function useInterceptedPagesRouter({
  callbackMapRef,
}: {
  callbackMapRef: MutableRefObject<Map<string, NavigationGuard>>;
}) {
  const origRouter = useContext(RouterContext);

  return useMemo((): NextRouter | null => {
    if (!origRouter) return null;

    const guarded = async (
      type: "push" | "replace" | "refresh",
      to: Url,
      accepted: () => Promise<boolean>
    ): Promise<boolean> => {
      const callbacks = [...callbackMapRef.current.values()];
      for (const callback of callbacks) {
        const confirm = await callback({
          to: typeof to === "string" ? to : to.href ?? "",
          type,
        });
        if (!confirm) return false;
      }
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
  }, [origRouter]);
}
