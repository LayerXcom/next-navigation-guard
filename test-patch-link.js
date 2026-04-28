// test-patch-link.js - Patch the Link component
const Module = require('module');

console.log('=== Starting Link Component Patch ===');

// Store the original require
const originalRequire = Module.prototype.require;

// Override require to intercept 'next/link'
Module.prototype.require = function(id) {
  const module = originalRequire.apply(this, arguments);
  
  if (id === 'next/link') {
    console.log('Intercepted next/link require!');
    console.log('Module structure:', {
      type: typeof module,
      keys: Object.keys(module),
      defaultType: typeof module.default,
      hasRender: 'render' in module
    });
    
    // Next.js Link is a ForwardRef component
    if (module && module.$$typeof && module.render && !module.__guardPatched) {
      console.log('Patching Link ForwardRef component...');
      
      const OriginalLink = module;
      const originalRender = module.render;
      
      // Create a patched render function
      const patchedRender = function(props, ref) {
        console.log('[PATCH] Link render called with href:', props?.href);
        
        // Enhance props with our navigation guard logic
        const enhancedProps = {
          ...props,
          onNavigate: function(event) {
            console.log('[PATCH] Navigation intercepted! href:', props?.href);
            
            // Call original onNavigate if it exists
            if (props?.onNavigate) {
              console.log('[PATCH] Calling original onNavigate');
              props.onNavigate(event);
            }
            
            // Here we would check navigation guards
            console.log('[PATCH] Would check navigation guards here');
          }
        };
        
        // Call the original render with enhanced props
        return originalRender.call(this, enhancedProps, ref);
      };
      
      // Create a new ForwardRef with the patched render
      const PatchedLink = {
        $$typeof: module.$$typeof,
        render: patchedRender,
        default: null, // Will be set below
        __guardPatched: true
      };
      
      // Self-reference for default export
      PatchedLink.default = PatchedLink;
      
      // Copy any other properties
      for (const key in OriginalLink) {
        if (key !== '$$typeof' && key !== 'render' && key !== 'default' && key !== '__guardPatched') {
          try {
            PatchedLink[key] = OriginalLink[key];
          } catch (e) {
            console.log(`Could not copy property ${key}:`, e.message);
          }
        }
      }
      
      console.log('Link component patched successfully!');
      return PatchedLink;
    }
  }
  
  return module;
};

// Also try to patch if already loaded in cache
const patchExistingCache = () => {
  for (const key in require.cache) {
    if (key.includes('next/link') || (key.includes('next') && key.includes('link'))) {
      console.log('Found next/link in cache:', key);
      
      const cachedModule = require.cache[key];
      if (cachedModule && cachedModule.exports) {
        const exports = cachedModule.exports;
        
        // Check if this is a ForwardRef component
        if (exports.$$typeof && exports.render && !exports.__guardPatched) {
          console.log('Found ForwardRef Link component in cache');
          
          const originalRender = exports.render;
          
          // Patch the render function
          exports.render = function(props, ref) {
            console.log('[CACHE-PATCH] Link render called with href:', props?.href);
            
            const enhancedProps = {
              ...props,
              onNavigate: function(event) {
                console.log('[CACHE-PATCH] Navigation intercepted!');
                if (props?.onNavigate) {
                  props.onNavigate(event);
                }
              }
            };
            
            return originalRender.call(this, enhancedProps, ref);
          };
          
          exports.__guardPatched = true;
          console.log('Cached ForwardRef Link component patched!');
        } else {
          console.log('Module exports:', Object.keys(exports));
        }
      }
    }
  }
};

// Try to patch existing cache
patchExistingCache();

console.log('=== Link Component Patch Setup Complete ===');