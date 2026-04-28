import { MutableRefObject } from "react";
import { GuardDef } from "../types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export function useInterceptPageUnload({
  guardMapRef,
  disabled,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  disabled: boolean;
}) {
  useIsomorphicLayoutEffect(() => {
    if (disabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      for (const def of guardMapRef.current.values()) {
        // We does not support confirm() on beforeunload as
        // we cannot wait for async Promise resolution on beforeunload.
        const enabled = def.enabled({ to: "", type: "beforeunload" });
        if (enabled) {
          event.preventDefault();
          // As MDN says, custom message has already been unsupported in majority of browsers.
          // Chrome requires returnValue to be set.
          event.returnValue = "";
          return;
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [disabled]);
}
