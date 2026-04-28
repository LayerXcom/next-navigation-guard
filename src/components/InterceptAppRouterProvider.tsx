"use client";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React, { MutableRefObject } from "react";
import { useInterceptedAppRouter } from "../hooks/useInterceptedAppRouter";
import { GuardDef, NavigationGuardCallback } from "../types";

export function InterceptAppRouterProvider({
  guardMapRef,
  mockConfirmRef,
  children,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  mockConfirmRef: MutableRefObject<NavigationGuardCallback | undefined>;
  children: React.ReactNode;
}) {
  const interceptedRouter = useInterceptedAppRouter({
    guardMapRef,
    mockConfirmRef,
  });
  if (!interceptedRouter) {
    return <>{children}</>;
  }

  return (
    <AppRouterContext.Provider value={interceptedRouter}>
      {children}
    </AppRouterContext.Provider>
  );
}
