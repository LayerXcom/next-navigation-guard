"use client";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React, { MutableRefObject } from "react";
import { useInterceptedAppRouter } from "../hooks/useInterceptedAppRouter";
import { GuardDef } from "../types";

export function InterceptAppRouterProvider({
  guardMapRef,
  children,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  children: React.ReactNode;
}) {
  const interceptedRouter = useInterceptedAppRouter({ guardMapRef });
  if (!interceptedRouter) {
    return <>{children}</>;
  }

  return (
    <AppRouterContext.Provider value={interceptedRouter}>
      {children}
    </AppRouterContext.Provider>
  );
}
