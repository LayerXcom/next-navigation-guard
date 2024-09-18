import { useCallback, useContext, useId, useState } from "react";
import { NavigationGuardProviderContext } from "../components/NavigationGuardProviderContext";
import { NavigationGuardCallback, NavigationGuardOptions } from "../types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// Should memoize callback func
export function useNavigationGuard(options: NavigationGuardOptions) {
  const callbackId = useId();
  const guardMapRef = useContext(NavigationGuardProviderContext);
  if (!guardMapRef)
    throw new Error(
      "useNavigationGuard must be used within a NavigationGuardProvider"
    );

  const [pendingState, setPendingState] = useState<{
    resolve: (accepted: boolean) => void;
  } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const callback: NavigationGuardCallback = (params) => {
      if (options.confirm) {
        return options.confirm(params);
      }

      return new Promise<boolean>((resolve) => {
        setPendingState({ resolve });
      });
    };

    const enabled = options.enabled;

    guardMapRef.current.set(callbackId, {
      enabled: typeof enabled === "function" ? enabled : () => enabled ?? true,
      callback,
    });

    return () => {
      guardMapRef.current.delete(callbackId);
    };
  }, [options.confirm, options.enabled]);

  const active = pendingState !== null;

  const accept = useCallback(() => {
    if (!pendingState) return;
    pendingState.resolve(true);
    setPendingState(null);
  }, [pendingState]);

  const reject = useCallback(() => {
    if (!pendingState) return;
    pendingState.resolve(false);
    setPendingState(null);
  }, [pendingState]);

  return { active, accept, reject };
}
