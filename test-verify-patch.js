// test-verify-patch.js - Verify the patch is working

// Apply the patch first
require('./test-patch-link');

// Now require Link
const Link = require('next/link');

console.log('=== Verifying Link Patch ===');
console.log('Link.__guardPatched:', Link.__guardPatched);
console.log('Link.render type:', typeof Link.render);
console.log('Link.render name:', Link.render.name);

// Simulate what React would do when rendering the Link
console.log('\n=== Simulating React render ===');
const testProps = {
  href: '/test-navigation',
  children: 'Click me',
  replace: false,
  onClick: () => console.log('Regular onClick fired')
};

// Call the render function directly (React would do this internally)
try {
  console.log('Calling Link.render with props...');
  const result = Link.render(testProps, null);
  console.log('Render successful!');
  
  // Test if onNavigate was added
  if (testProps.onNavigate) {
    console.log('\n✅ SUCCESS: onNavigate was injected by our patch!');
    console.log('Testing onNavigate handler...');
    testProps.onNavigate({ preventDefault: () => console.log('preventDefault called') });
  } else {
    console.log('\n❌ FAIL: onNavigate was not injected');
  }
} catch (error) {
  console.error('Error during render:', error.message);
}

console.log('\n=== Patch Verification Complete ===');