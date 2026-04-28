import { MutableRefObject, useEffect, useRef } from "react";
import { GuardDef } from "../types";
import { debug } from "../utils/debug";

// Patch React.createElement to inject onNavigate prop into Link components
export function useReactElementPatch({
  guardMapRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
}) {
  const isPatchedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isPatchedRef.current) return;

    try {
      // Try to find React in various places
      const React = (window as any).React || require("react");
      if (!React || !React.createElement) {
        debug("React.createElement not found");
        return;
      }

      const originalCreateElement = React.createElement;

      // Check if already patched
      if ((originalCreateElement as any).__guardPatched) {
        debug("React.createElement already patched");
        return;
      }

      React.createElement = function (type: any, props: any, ...children: any[]) {
        // Check if this is a Next.js Link component
        if (
          type && 
          (type.name === "Link" || 
           type.displayName === "Link" ||
           (typeof type === "function" && type.toString().includes("next/link")))
        ) {
          debug("Intercepting Link component creation");

          // Inject onNavigate prop
          const enhancedProps = {
            ...props,
            onNavigate: async (event: { preventDefault: () => void }) => {
              // If there's already an onNavigate handler, call it first
              if (props?.onNavigate) {
                props.onNavigate(event);
              }

              const href = props?.href;
              if (!href) return;

              const navigateType = props?.replace ? "replace" : "push";
              debug(`Link onNavigate triggered: ${navigateType} to ${href}`);

              // Run through guards
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

              debug(`All guards passed, allowing navigation`);
            },
          };

          return originalCreateElement.call(this, type, enhancedProps, ...children);
        }

        // For all other components, use original behavior
        return originalCreateElement.call(this, type, props, ...children);
      };

      (React.createElement as any).__guardPatched = true;
      isPatchedRef.current = true;
      debug("Successfully patched React.createElement");

    } catch (error) {
      debug("Failed to patch React.createElement:", error);
    }
  }, [guardMapRef]);
}