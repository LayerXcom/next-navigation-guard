"use client";

import type { LinkProps } from "next/dist/client/link";
import NextLink from "next/dist/client/link";
import React, { forwardRef, useContext } from "react";
import { NavigationGuardProviderContext } from "./NavigationGuardProviderContext";
import { evaluateGuards } from "../utils/evaluateGuards";

type NavigationEvent = {
  preventDefault: () => void;
  href: string;
  as?: string;
  replace?: boolean;
};

export type GuardedLinkProps = LinkProps & {
  onNavigate?: (event: NavigationEvent) => void | Promise<void>;
};

export const Link = forwardRef<HTMLAnchorElement, GuardedLinkProps>(
  ({ onNavigate, onClick, replace, ...props }, ref) => {
    const guardMapRef = useContext(NavigationGuardProviderContext);

    const onNavigateHandler: LinkProps = (prevent) => {
      evaluateGuards;
    };

    return <NextLink {...props} ref={ref} onNavigate={onNavigateHandler} />;
  }
);

Link.displayName = "GuardedLink";
