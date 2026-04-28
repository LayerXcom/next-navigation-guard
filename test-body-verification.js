// test-body-verification.js - Verify function body is actually replaced

// First, let's capture the original Link render function
const originalLinkModule = require('next/link');
const originalRender = originalLinkModule.render;

console.log('=== Original Link Render Function ===');
console.log('Original render type:', typeof originalRender);
console.log('Original render name:', originalRender.name);
console.log('Original render code preview:', originalRender.toString().substring(0, 150) + '...');

// Now apply the patch
require('./test-patch-link');

// Get the patched version
const patchedLinkModule = require('next/link');
const patchedRender = patchedLinkModule.render;

console.log('\n=== Patched Link Render Function ===');
console.log('Patched render type:', typeof patchedRender);
console.log('Patched render name:', patchedRender.name);
console.log('Patched render code preview:', patchedRender.toString().substring(0, 150) + '...');

console.log('\n=== Function Body Comparison ===');
console.log('Are they the same function?', originalRender === patchedRender);
console.log('Original contains [PATCH]?', originalRender.toString().includes('[PATCH]'));
console.log('Patched contains [PATCH]?', patchedRender.toString().includes('[PATCH]'));

console.log('\n=== Behavior Test ===');
// Test actual behavior difference
let originalCallDetected = false;
let patchedCallDetected = false;

// Create a simple interceptor to detect calls
const interceptProps = (label) => {
  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'href') {
        console.log(`${label}: href accessed`);
        return '/test';
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === 'onNavigate') {
        console.log(`${label}: onNavigate was set!`);
        if (label === 'PATCHED') patchedCallDetected = true;
      }
      target[prop] = value;
      return true;
    }
  });
};

// Test original
console.log('\nTesting ORIGINAL render:');
try {
  const origProps = interceptProps('ORIGINAL');
  originalRender(origProps, null);
} catch (e) {
  console.log('Original render error (expected):', e.message.substring(0, 50) + '...');
}

// Test patched
console.log('\nTesting PATCHED render:');
try {
  const patchProps = interceptProps('PATCHED');
  patchedRender(patchProps, null);
} catch (e) {
  console.log('Patched render error (expected):', e.message.substring(0, 50) + '...');
}

console.log('\n=== Verification Summary ===');
if (originalRender !== patchedRender) {
  console.log('✅ Functions are different objects');
} else {
  console.log('❌ Functions are the same object');
}

if (patchedRender.toString().includes('[PATCH]') || patchedRender.toString().includes('onNavigate')) {
  console.log('✅ Patch code detected in function body');
} else {
  console.log('❌ Patch code NOT detected in function body');
}

if (patchedCallDetected) {
  console.log('✅ Patch behavior detected during execution');
} else {
  console.log('⚠️  Patch behavior not detected (may be due to React context)');
}

// One more test: Call the render with console.log capture
console.log('\n=== Console Output Test ===');
const originalLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(' '));
  originalLog(...args);
};

try {
  patchedRender({ href: '/console-test' }, null);
} catch (e) {
  // Ignore error
}

console.log = originalLog;

const patchLogs = logs.filter(log => log.includes('[PATCH]') || log.includes('[CACHE-PATCH]'));
if (patchLogs.length > 0) {
  console.log('✅ Patch console output detected:');
  patchLogs.forEach(log => console.log('  -', log));
} else {
  console.log('❌ No patch console output detected');
}