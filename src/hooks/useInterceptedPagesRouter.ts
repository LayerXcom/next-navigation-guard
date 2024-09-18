import { NextRouter } from "next/dist/client/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { Url } from "next/dist/shared/lib/router/router";
import { MutableRefObject, useContext, useMemo } from "react";
import { GuardDef } from "../types";

export function useInterceptedPagesRouter({
  guardMapRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
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
      const defs = [...guardMapRef.current.values()];
      for (const { enabled, callback } of defs) {
        if (!enabled({ to, type })) continue;

        const confirm = await callback({ to, type });
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
