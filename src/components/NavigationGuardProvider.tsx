"use client";

import React, { useMemo, useRef } from "react";
import { useInterceptPageUnload } from "../hooks/useInterceptPageUnload";
import { useInterceptPopState } from "../hooks/useInterceptPopState";
import { useInterceptLinkClicks } from "../hooks/useInterceptLinkClicks";
import { useIsomorphicLayoutEffect } from "../hooks/useIsomorphicLayoutEffect";
import {
  DisableForTesting,
  GuardDef,
  NavigationGuardCallback,
} from "../types";
import { InterceptAppRouterProvider } from "./InterceptAppRouterProvider";
import { InterceptPagesRouterProvider } from "./InterceptPagesRouterProvider";
import {
  NavigationGuardContextValue,
  NavigationGuardProviderContext,
} from "./NavigationGuardProviderContext";

function resolveMockConfirm(
  disableForTesting: DisableForTesting | undefined
): NavigationGuardCallback | undefined {
  if (
    disableForTesting &&
    typeof disableForTesting === "object" &&
    "mockConfirm" in disableForTesting
  ) {
    return disableForTesting.mockConfirm;
  }
  return undefined;
}

export function NavigationGuardProvider({
  children,
  disableForTesting,
}: {
  children: React.ReactNode;
  /**
   * Disables host-environment hooks (popstate / beforeunload / click listeners
   * and `window.history` augmentation). Router context overrides remain in
   * place so navigation through Next.js routers still hits guards. Pass
   * `{ mockConfirm }` to additionally replace every guard's `confirm` during
   * evaluation. See {@link DisableForTesting} for the full contract.
   */
  disableForTesting?: DisableForTesting;
}) {
  const guardMapRef = useRef(new Map<string, GuardDef>());
  const disabled = !!disableForTesting;

  const mockConfirm = resolveMockConfirm(disableForTesting);
  const mockConfirmRef = useRef<NavigationGuardCallback | undefined>(
    mockConfirm
  );
  useIsomorphicLayoutEffect(() => {
    mockConfirmRef.current = mockConfirm;
  }, [mockConfirm]);

  useInterceptPopState({ guardMapRef, mockConfirmRef, disabled });
  useInterceptPageUnload({ guardMapRef, disabled });
  useInterceptLinkClicks({ guardMapRef, disabled });

  const contextValue = useMemo<NavigationGuardContextValue>(
    () => ({ guardMapRef, mockConfirmRef }),
    []
  );

  return (
    <NavigationGuardProviderContext.Provider value={contextValue}>
      <InterceptAppRouterProvider
        guardMapRef={guardMapRef}
        mockConfirmRef={mockConfirmRef}
      >
        <InterceptPagesRouterProvider
          guardMapRef={guardMapRef}
          mockConfirmRef={mockConfirmRef}
        >
          {children}
        </InterceptPagesRouterProvider>
      </InterceptAppRouterProvider>
    </NavigationGuardProviderContext.Provider>
  );
}
