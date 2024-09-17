import { NavigationGuard } from "../types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export function useInterceptPageUnload({
  callbackMapRef,
}: {
  callbackMapRef: React.MutableRefObject<Map<string, NavigationGuard>>;
}) {
  useIsomorphicLayoutEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      for (const callback of callbackMapRef.current.values()) {
        const result = callback({ to: "", type: "beforeunload" });
        if (result instanceof Promise) {
          // We cannot wait for async Promise resolution on beforeunload.
          // Support `async () => true` by checking whether that promise is already resolved.
          const { value, resolved } = readResolvedPromiseValue(result);
          if (!resolved || value === false) {
            event.preventDefault();
            event.returnValue = "";
            return;
          }
        }
        if (result === false) {
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
  }, []);
}

function readResolvedPromiseValue<T>(
  promise: Promise<T>
): { value: T; resolved: true } | { value?: undefined; resolved: false } {
  let value: T;
  let resolved = false;

  promise.then((result) => {
    value = result;
    resolved = true;
  });

  return resolved ? { value: value!, resolved } : { resolved };
}
