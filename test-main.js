// test-main.js - Main test file
console.log('=== Starting Link Patch Test ===\n');

// First, check the original state
console.log('1. Checking Link before patch...');
const checkBefore = require('./test-check-link');
checkBefore.checkPatched();

console.log('\n' + '='.repeat(50) + '\n');

// Apply the patch
console.log('2. Applying patch...');
require('./test-patch-link');

console.log('\n' + '='.repeat(50) + '\n');

// Check after patch
console.log('3. Checking Link after patch...');
// Force a fresh require to get the patched version
delete require.cache[require.resolve('./test-check-link')];
const checkAfter = require('./test-check-link');
checkAfter.checkPatched();

console.log('\n' + '='.repeat(50) + '\n');

// Test with the patched Link
console.log('4. Testing patched Link behavior...');
const Link = require('next/link').default || require('next/link');

console.log('Creating a Link instance...');
try {
  const testProps = {
    href: '/test-navigation',
    children: 'Click me',
    replace: false,
    onClick: () => console.log('Regular onClick fired'),
  };
  
  console.log('Props:', testProps);
  const linkResult = Link(testProps);
  console.log('Link created successfully');
  
  // Try to trigger onNavigate if it exists
  if (testProps.onNavigate) {
    console.log('\nTriggering onNavigate...');
    testProps.onNavigate({ preventDefault: () => console.log('preventDefault called') });
  }
} catch (error) {
  console.error('Error creating Link:', error.message);
}

console.log('\n=== Test Complete ===');