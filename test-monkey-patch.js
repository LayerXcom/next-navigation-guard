// PoC: Testing function replacement without webpack

// Simulate a module with a function component
const originalModule = {
  LinkComponent: function Link(props) {
    console.log('Original Link called with:', props);
    return { type: 'a', props: { href: props.href, children: props.children } };
  }
};

// Make it look like a real React component
originalModule.LinkComponent.displayName = 'Link';

console.log('=== Test 1: Direct function replacement ===');
const original = originalModule.LinkComponent;
originalModule.LinkComponent = function PatchedLink(props) {
  console.log('Patched Link intercepted props:', props);
  // Add our onNavigate handler
  const enhancedProps = {
    ...props,
    onNavigate: () => console.log('Navigation intercepted!')
  };
  return original(enhancedProps);
};

// Test it
originalModule.LinkComponent({ href: '/test1', children: 'Test 1' });

console.log('\n=== Test 2: Using Object.setPrototypeOf ===');
// Reset to original
originalModule.LinkComponent = original;

// Create a new function that wraps the original
function createPatchedLink(OriginalLink) {
  const PatchedLink = function(props) {
    console.log('Prototype-patched Link intercepted:', props);
    const enhancedProps = {
      ...props,
      onNavigate: () => console.log('Navigation intercepted via prototype!')
    };
    return OriginalLink(enhancedProps);
  };
  
  // Copy prototype chain
  Object.setPrototypeOf(PatchedLink, OriginalLink);
  Object.setPrototypeOf(PatchedLink.prototype, OriginalLink.prototype);
  
  // Copy static properties
  for (const key in OriginalLink) {
    if (OriginalLink.hasOwnProperty(key)) {
      PatchedLink[key] = OriginalLink[key];
    }
  }
  
  // Copy property descriptors
  Object.getOwnPropertyNames(OriginalLink).forEach(name => {
    if (name !== 'length' && name !== 'name' && name !== 'prototype') {
      const descriptor = Object.getOwnPropertyDescriptor(OriginalLink, name);
      if (descriptor) {
        Object.defineProperty(PatchedLink, name, descriptor);
      }
    }
  });
  
  return PatchedLink;
}

originalModule.LinkComponent = createPatchedLink(original);
originalModule.LinkComponent({ href: '/test2', children: 'Test 2' });

console.log('\n=== Test 3: Module replacement via require.cache ===');
// Simulate require.cache
const requireCache = {
  'next/link': {
    exports: {
      default: original
    }
  }
};

// Patch the cached module
const cachedModule = requireCache['next/link'];
const LinkComponent = cachedModule.exports.default;
cachedModule.exports.default = createPatchedLink(LinkComponent);

// Test the patched module
cachedModule.exports.default({ href: '/test3', children: 'Test 3' });

console.log('\n=== Test 4: Using Proxy for dynamic interception ===');
// Reset module
cachedModule.exports.default = original;

// Create a Proxy that intercepts all calls
cachedModule.exports.default = new Proxy(original, {
  apply(target, thisArg, args) {
    console.log('Proxy intercepted call with args:', args);
    const [props] = args;
    const enhancedProps = {
      ...props,
      onNavigate: () => console.log('Navigation intercepted via Proxy!')
    };
    return target.call(thisArg, enhancedProps);
  },
  // Proxy other operations to maintain compatibility
  get(target, prop) {
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  }
});

cachedModule.exports.default({ href: '/test4', children: 'Test 4' });

console.log('\n=== Test 5: Function.prototype.bind replacement ===');
// Another approach using bind to create a pre-configured version
const boundPatchedLink = function(OriginalLink, props) {
  console.log('Bound patched Link:', props);
  const enhancedProps = {
    ...props,
    onNavigate: () => console.log('Navigation intercepted via bind!')
  };
  return OriginalLink(enhancedProps);
}.bind(null, original);

// Copy properties from original
Object.setPrototypeOf(boundPatchedLink, original);
for (const key in original) {
  if (original.hasOwnProperty(key)) {
    try {
      boundPatchedLink[key] = original[key];
    } catch (e) {
      // Some properties might be read-only
    }
  }
}

boundPatchedLink({ href: '/test5', children: 'Test 5' });

console.log('\n=== Summary ===');
console.log('All methods successfully replaced the function behavior.');
console.log('Object.setPrototypeOf is useful for:');
console.log('1. Maintaining instanceof checks');
console.log('2. Preserving prototype chain');
console.log('3. Keeping static methods accessible');