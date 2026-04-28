// test-check-link.js - Check if Link component is patched
const linkModule = require('next/link');
const Link = linkModule.default || linkModule;

function checkPatched() {
  console.log('=== Checking Link Component ===');
  console.log('Module type:', typeof linkModule);
  console.log('Module keys:', Object.keys(linkModule));
  console.log('Link component type:', typeof Link);
  console.log('Link component name:', Link.name || 'N/A');
  console.log('Link.__guardPatched:', Link.__guardPatched || false);
  
  // Test if it's a ForwardRef component
  if (Link.$$typeof && Link.render) {
    console.log('Link is a ForwardRef component');
    console.log('Link.render name:', Link.render.name);
  }
  
  // Test the actual behavior
  console.log('\n=== Testing Link Component Behavior ===');
  
  // Create a test to verify the patch is actually working
  let patchDetected = false;
  let onNavigateInjected = false;
  
  if (Link.$$typeof && Link.render) {
    try {
      // Create props WITHOUT onNavigate
      const testProps = {
        href: '/behavior-test',
        children: 'Test Link'
      };
      
      console.log('Testing with props (no onNavigate):', testProps);
      
      // Mock React internals to capture what happens
      const mockReactElement = (type, props) => {
        console.log('Mock createElement called with props:', Object.keys(props));
        if (props.onNavigate && !testProps.onNavigate) {
          console.log('✅ DETECTED: onNavigate was injected by patch!');
          onNavigateInjected = true;
          patchDetected = true;
        }
        return { type, props };
      };
      
      // Temporarily override React.createElement
      const originalCreateElement = global.React?.createElement;
      if (global.React) {
        global.React.createElement = mockReactElement;
      }
      
      // Try to render
      try {
        Link.render(testProps, null);
      } catch (e) {
        // Expected to fail due to missing React context
        // But we should still see our console logs if patch is working
      }
      
      // Restore React.createElement
      if (global.React && originalCreateElement) {
        global.React.createElement = originalCreateElement;
      }
      
    } catch (error) {
      console.log('Error during behavior test:', error.message);
    }
  }
  
  // Alternative test: Check if render function contains our patch code
  if (Link.render) {
    const renderCode = Link.render.toString();
    if (renderCode.includes('[PATCH]') || renderCode.includes('[CACHE-PATCH]')) {
      console.log('✅ DETECTED: Patch code found in render function!');
      patchDetected = true;
    }
    
    // Show a preview of the render function
    console.log('\nRender function preview:');
    console.log(renderCode.substring(0, 200) + '...');
  }
  
  // Final verdict
  console.log('\n=== Patch Detection Results ===');
  console.log('__guardPatched flag:', Link.__guardPatched || false);
  console.log('Patch behavior detected:', patchDetected);
  console.log('onNavigate injection detected:', onNavigateInjected);
  
  if (patchDetected) {
    console.log('\n✅ Link component is TRULY PATCHED (behavior verified)');
  } else if (Link.__guardPatched) {
    console.log('\n⚠️  Link has __guardPatched flag but patch behavior not detected');
  } else {
    console.log('\n❌ Link component is NOT patched');
  }
}

module.exports = { checkPatched, Link };