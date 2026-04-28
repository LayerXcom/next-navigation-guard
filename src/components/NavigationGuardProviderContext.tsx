"use client";

import React, { MutableRefObject } from "react";
import { GuardDef, NavigationGuardCallback } from "../types";

export interface NavigationGuardContextValue {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  mockConfirmRef: MutableRefObject<NavigationGuardCallback | undefined>;
}

export const NavigationGuardProviderContext = React.createContext<
  NavigationGuardContextValue | undefined
>(undefined);
NavigationGuardProviderContext.displayName = "NavigationGuardProviderContext";
