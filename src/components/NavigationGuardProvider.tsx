"use client";

import React, { useRef } from "react";
import { useInterceptPageUnload } from "../hooks/useInterceptPageUnload";
import { useInterceptPopState } from "../hooks/useInterceptPopState";
import { NavigationGuard } from "../types";
import { InterceptAppRouterProvider } from "./InterceptAppRouterProvider";
import { InterceptPagesRouterProvider } from "./InterceptPagesRouterProvider";
import { NavigationGuardProviderContext } from "./NavigationGuardProviderContext";

export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const callbackMapRef = useRef(new Map<string, NavigationGuard>());

  useInterceptPopState({ callbackMapRef });
  useInterceptPageUnload({ callbackMapRef });

  return (
    <NavigationGuardProviderContext.Provider value={callbackMapRef}>
      <InterceptAppRouterProvider callbackMapRef={callbackMapRef}>
        <InterceptPagesRouterProvider callbackMapRef={callbackMapRef}>
          {children}
        </InterceptPagesRouterProvider>
      </InterceptAppRouterProvider>
    </NavigationGuardProviderContext.Provider>
  );
}
