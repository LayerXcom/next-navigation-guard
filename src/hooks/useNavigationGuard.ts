import { NavigationGuardProviderContext } from "../components/NavigationGuardProviderContext";
import { NavigationGuard } from "../types";
import { useContext, useId } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// Should memoize callback func
export function useNavigationGuard(callback: NavigationGuard) {
  const callbackId = useId();
  const callbackMapRef = useContext(NavigationGuardProviderContext) ?? {
    current: new Map(),
  };
  if (!callbackMapRef)
    throw new Error(
      "useNavigationGuard must be used within a NavigationGuardProvider"
    );

  useIsomorphicLayoutEffect(() => {
    callbackMapRef.current.set(callbackId, callback);

    return () => {
      callbackMapRef.current.delete(callbackId);
    };
  }, [callback]);
}
