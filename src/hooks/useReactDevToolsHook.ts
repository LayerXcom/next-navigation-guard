import { MutableRefObject, useEffect, useRef } from "react";
import { GuardDef } from "../types";
import { debug } from "../utils/debug";

// Use React DevTools global hook to intercept component renders
export function useReactDevToolsHook({
  guardMapRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
}) {
  const isPatchedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isPatchedRef.current) return;

    // Install React DevTools hook if not present
    if (!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true,
        renderers: new Map(),
        onCommitFiberRoot: () => {},
        onCommitFiberUnmount: () => {},
        inject: () => {},
      };
    }

    const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const originalInject = hook.inject;

    // Patch the inject method to intercept React internals
    hook.inject = function (renderer: any) {
      debug("React DevTools hook inject called");

      if (renderer && renderer.findFiberByHostInstance) {
        const originalFindFiber = renderer.findFiberByHostInstance;
        
        renderer.findFiberByHostInstance = function (...args: any[]) {
          const fiber = originalFindFiber.apply(this, args);
          
          if (fiber && fiber.elementType && fiber.elementType.name === "Link") {
            debug("Found Link fiber, patching props");
            
            // Patch the fiber's props
            if (fiber.memoizedProps && !fiber.memoizedProps.__guardPatched) {
              const originalOnNavigate = fiber.memoizedProps.onNavigate;
              
              fiber.memoizedProps.onNavigate = async (event: { preventDefault: () => void }) => {
                if (originalOnNavigate) {
                  originalOnNavigate(event);
                }

                const href = fiber.memoizedProps.href;
                if (!href) return;

                const navigateType = fiber.memoizedProps.replace ? "replace" : "push";
                debug(`Link onNavigate intercepted via DevTools: ${navigateType} to ${href}`);

                const defs = [...guardMapRef.current.values()];
                for (const { enabled, callback } of defs) {
                  if (!enabled({ to: href, type: navigateType })) continue;

                  debug(`Calling guard callback for ${navigateType} to ${href}`);
                  const confirm = await callback({ to: href, type: navigateType });
                  debug(`Guard callback returned: ${confirm}`);

                  if (!confirm) {
                    debug(`Navigation blocked by guard`);
                    event.preventDefault();
                    return;
                  }
                }
              };

              fiber.memoizedProps.__guardPatched = true;
            }
          }
          
          return fiber;
        };
      }

      return originalInject.call(this, renderer);
    };

    isPatchedRef.current = true;
    debug("React DevTools hook installed for Link interception");

  }, [guardMapRef]);
}