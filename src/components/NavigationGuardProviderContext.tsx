"use client";

import React, { MutableRefObject } from "react";
import { NavigationGuard } from "../types";

export const NavigationGuardProviderContext = React.createContext<
  MutableRefObject<Map<string, NavigationGuard>> | undefined
>(undefined);
NavigationGuardProviderContext.displayName = "NavigationGuardProviderContext";
