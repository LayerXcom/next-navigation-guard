"use client";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React, { MutableRefObject } from "react";
import { useInterceptedAppRouter } from "../hooks/useInterceptedAppRouter";
import { NavigationGuard } from "../types";

export function InterceptAppRouterProvider({
  callbackMapRef,
  children,
}: {
  callbackMapRef: MutableRefObject<Map<string, NavigationGuard>>;
  children: React.ReactNode;
}) {
  const interceptedRouter = useInterceptedAppRouter({ callbackMapRef });
  if (!interceptedRouter) {
    return <>{children}</>;
  }

  return (
    <AppRouterContext.Provider value={interceptedRouter}>
      {children}
    </AppRouterContext.Provider>
  );
}
