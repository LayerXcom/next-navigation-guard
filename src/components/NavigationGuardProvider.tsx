"use client";

import React, { useRef } from "react";
import { useInterceptPageUnload } from "../hooks/useInterceptPageUnload";
import { useInterceptPopState } from "../hooks/useInterceptPopState";
import { useInterceptLinkClicks } from "../hooks/useInterceptLinkClicks";
import { DisableForTesting, GuardDef } from "../types";
import { InterceptAppRouterProvider } from "./InterceptAppRouterProvider";
import { InterceptPagesRouterProvider } from "./InterceptPagesRouterProvider";
import { NavigationGuardProviderContext } from "./NavigationGuardProviderContext";

export function NavigationGuardProvider({
  children,
  disableForTesting,
}: {
  children: React.ReactNode;
  /**
   * Disables every library-side bridge into the host environment (popstate /
   * beforeunload / click listeners, history augmentation, Next.js router
   * context overrides). `useNavigationGuard` continues to register and runs
   * `enabled` / `confirm` / `active` / `accept` / `reject` as usual.
   * See {@link DisableForTesting} for the full contract.
   */
  disableForTesting?: DisableForTesting;
}) {
  const guardMapRef = useRef(new Map<string, GuardDef>());
  const disabled = !!disableForTesting;

  useInterceptPopState({ guardMapRef, disabled });
  useInterceptPageUnload({ guardMapRef, disabled });
  useInterceptLinkClicks({ guardMapRef, disabled });

  return (
    <NavigationGuardProviderContext.Provider value={guardMapRef}>
      {disabled ? (
        children
      ) : (
        <InterceptAppRouterProvider guardMapRef={guardMapRef}>
          <InterceptPagesRouterProvider guardMapRef={guardMapRef}>
            {children}
          </InterceptPagesRouterProvider>
        </InterceptAppRouterProvider>
      )}
    </NavigationGuardProviderContext.Provider>
  );
}
