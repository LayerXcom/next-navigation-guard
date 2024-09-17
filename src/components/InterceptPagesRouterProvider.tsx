"use client";

import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import React, { MutableRefObject } from "react";
import { useInterceptedPagesRouter } from "../hooks/useInterceptedPagesRouter";
import { NavigationGuard } from "../types";

export function InterceptPagesRouterProvider({
  callbackMapRef,
  children,
}: {
  callbackMapRef: MutableRefObject<Map<string, NavigationGuard>>;
  children: React.ReactNode;
}) {
  const interceptedRouter = useInterceptedPagesRouter({ callbackMapRef });
  if (!interceptedRouter) {
    return <>{children}</>;
  }

  return (
    <RouterContext.Provider value={interceptedRouter}>
      {children}
    </RouterContext.Provider>
  );
}
