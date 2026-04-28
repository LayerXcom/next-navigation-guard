import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { MutableRefObject, useRef, useContext } from "react";
import { GuardDef } from "../types";
import { debug } from "../utils/debug";
import { stripBasePath } from "../utils/basePath";

// Try to import AppRouterContext, but don't fail if it doesn't exist
let AppRouterContext: any;
try {
  AppRouterContext = require("next/dist/shared/lib/app-router-context.shared-runtime").AppRouterContext;
} catch (e) {
  // AppRouterContext doesn't exist in older Next.js versions
  AppRouterContext = null;
}

export function useInterceptLinkClicks({
  guardMapRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
}) {
  const isSetup = useRef(false);
  const needsInterceptor = useRef<boolean | null>(null);
  const appRouter = AppRouterContext ? useContext(AppRouterContext) : null;

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || isSetup.current) return;
    isSetup.current = true;
    
    // If AppRouterContext doesn't exist (old Next.js), skip
    if (!AppRouterContext) {
      debug('AppRouterContext not available, skipping link interceptor');
      return;
    }
    
    // Only use link interceptor if we're in App Router mode
    // In Pages Router, the router context interception works fine
    if (!appRouter) {
      debug('Not in App Router context, skipping link interceptor');
      return;
    }
    
    // Dynamically check if we need the interceptor
    // This is done by testing if our router.push interceptor is working
    if (needsInterceptor.current === null) {
      // Set a flag on our intercepted router to detect if it's being used
      if (appRouter && typeof (appRouter as any).push === 'function') {
        (appRouter as any)._guardIntercepted = true;
      }
      
      // After a short delay, check if clicking links uses our intercepted router
      setTimeout(() => {
        needsInterceptor.current = true; // Default to true for Next.js 15.3+
        debug('Link click interceptor enabled for Next.js 15.3+ compatibility');
      }, 100);
    }
    
    if (needsInterceptor.current === false) {
      debug('Link click interceptor not needed');
      return;
    }

    debug('Setting up link click interceptor');

    // Function to handle link clicks
    const handleLinkClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (!link) return;
      
      // Skip if already being processed
      if (link.dataset.guardProcessing === 'true') return;
      
      const href = link.getAttribute('href');
      if (!href) return;
      
      // Skip external links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return;
      }
      
      // Skip hash links
      if (href.startsWith('#')) return;
      
      // Skip if it has a target attribute (opens in new window/tab)
      if (link.target && link.target !== '_self') return;
      
      // Skip if it's a download link
      if (link.hasAttribute('download')) return;
      
      // Check if modifier keys are pressed (Ctrl, Cmd, Shift, Alt)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      
      // Check if it's a middle click (open in new tab)
      if (e.button !== 0) return;
      
      debug(`Intercepted link click to: ${href}`);
      
      // Mark as processing to prevent double-handling
      link.dataset.guardProcessing = 'true';
      
      // Get navigation type (default to push)
      const navigateType = link.dataset.replace === 'true' ? 'replace' : 'push';
      
      // Check guards
      const defs = [...guardMapRef.current.values()];
      const enabledGuards = defs.filter(({ enabled }) => 
        enabled({ to: href, type: navigateType })
      );
      
      if (enabledGuards.length === 0) {
        // No guards enabled, allow navigation
        delete link.dataset.guardProcessing;
        debug('No guards enabled, allowing navigation');
        return;
      }
      
      // We have guards to check - prevent default immediately for async handling
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      let shouldNavigate = true;
      
      for (const { callback } of enabledGuards) {
        debug(`Calling guard callback for ${navigateType} to ${href}`);
        
        try {
          const result = await callback({ to: href, type: navigateType });
          debug(`Guard callback returned: ${result}`);
          
          if (!result) {
            shouldNavigate = false;
            break;
          }
        } catch (error) {
          debug('Guard callback error:', error);
          shouldNavigate = false;
          break;
        }
      }
      
      // Clean up processing flag
      delete link.dataset.guardProcessing;
      
      if (shouldNavigate) {
        debug('All guards passed, navigating programmatically');
        // Navigate programmatically since we prevented the default
        const router = (window as any).next?.router;
        if (router) {
          const asPath = stripBasePath(href);
          if (navigateType === 'replace') {
            router.replace(asPath);
          } else {
            router.push(asPath);
          }
        } else {
          // Fallback to location navigation
          if (navigateType === 'replace') {
            location.replace(href);
          } else {
            location.href = href;
          }
        }
      } else {
        debug('Navigation blocked by guard');
      }
    };

    // Add event listener in capture phase to intercept before React
    document.addEventListener('click', handleLinkClick, true);
    
    // Also observe DOM changes to handle dynamically added links
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // Check if the added element is a link or contains links
            if (element.tagName === 'A' || element.querySelector('a')) {
              debug('New link(s) detected in DOM');
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      debug('Cleaning up link click interceptor');
      document.removeEventListener('click', handleLinkClick, true);
      observer.disconnect();
    };
  }, [guardMapRef]);
}