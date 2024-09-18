"use client";

import React, { MutableRefObject } from "react";
import { GuardDef } from "../types";

export const NavigationGuardProviderContext = React.createContext<
  MutableRefObject<Map<string, GuardDef>> | undefined
>(undefined);
NavigationGuardProviderContext.displayName = "NavigationGuardProviderContext";
