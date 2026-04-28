"use client";

import { Link as GuardedLink } from "./components/Link";

export function patchNextLink() {
  console.log('[next-navigation-guard] patchNextLink called, window:', typeof window);
  
  if (typeof window === 'undefined') {
    console.log('[next-navigation-guard] Skipping patch on server side');
    return;
  }
  
  try {
    console.log('[next-navigation-guard] Attempting to patch Next.js Link...');
    
    // Patch the default export
    const nextLinkModule = require('next/link');
    console.log('[next-navigation-guard] nextLinkModule:', nextLinkModule);
    console.log('[next-navigation-guard] nextLinkModule.default before:', nextLinkModule.default);
    
    nextLinkModule.default = GuardedLink;
    
    // Also patch named export if it exists
    if (nextLinkModule.Link) {
      nextLinkModule.Link = GuardedLink;
    }
    
    console.log('[next-navigation-guard] nextLinkModule.default after:', nextLinkModule.default);
    console.log('[next-navigation-guard] Successfully patched Next.js Link component');
  } catch (error) {
    console.error('[next-navigation-guard] Failed to patch Next.js Link component:', error);
  }
}