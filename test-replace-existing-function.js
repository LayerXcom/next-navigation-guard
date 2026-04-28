// POC: Replace body of an existing function while keeping its reference

// Existing regular function
function existingFunction(a, b) {
  console.log("Original body: adding", a, b);
  return a + b;
}

// Store reference
const ref = existingFunction;

console.log("=== Before replacement ===");
console.log("Result:", existingFunction(2, 3));
console.log("Reference check:", ref === existingFunction);

// Method 1: Override toString and use Function constructor
const originalToString = existingFunction.toString();
const functionMatch = originalToString.match(/function\s*(\w*)\s*\((.*?)\)\s*\{([\s\S]*)\}/);
const functionName = functionMatch[1];
const params = functionMatch[2];
const originalBody = functionMatch[3];

console.log("\nFunction parts:");
console.log("Name:", functionName);
console.log("Params:", params);
console.log("Original body:", originalBody.trim());

// Create new implementation
const newBody = `
  console.log("Replaced body: multiplying", a, b);
  return a * b;
`;

// This creates a new function, breaking the reference
const newFunction = new Function(params, newBody);

// Method 2: Monkey patch by wrapping
// Store original implementation
const originalImpl = existingFunction;

// Override the function in place using eval
eval(`
  existingFunction = function ${functionName}(${params}) {
    ${newBody}
  }
`);

console.log("\n=== After replacement (breaks reference) ===");
console.log("Result:", existingFunction(2, 3));
console.log("Reference check:", ref === existingFunction);

// Method 3: True in-place replacement using Object.assign
// First, let's define a function we can truly modify
function targetFunction(x, y) {
  console.log("Target original:", x, y);
  return x - y;
}

const targetRef = targetFunction;

// Create a wrapper that we'll use to replace the internals
const implementation = {
  current: targetFunction
};

// Replace targetFunction with a wrapper that delegates
const wrapper = function(...args) {
  return implementation.current.apply(this, args);
};

// Copy properties to maintain identity
Object.setPrototypeOf(wrapper, Object.getPrototypeOf(targetFunction));
Object.defineProperty(wrapper, 'name', { value: targetFunction.name });

// Now we can change implementation
console.log("\n=== Using delegation pattern ===");
console.log("Before:", wrapper(10, 3));

implementation.current = function(x, y) {
  console.log("Replaced implementation:", x, y);
  return x * y;
};

console.log("After:", wrapper(10, 3));

// Method 4: Using eval to redefine but keeping a reference through a proxy
function proxyTarget(m, n) {
  console.log("Proxy target original");
  return m + n;
}

let proxyRef = proxyTarget;

// Create a mutable reference
const mutable = { fn: proxyTarget };

// Replace the global function with one that delegates
eval(`
  proxyTarget = function ${proxyTarget.name}(...args) {
    return mutable.fn(...args);
  }
`);

console.log("\n=== Using mutable reference ===");
console.log("Before replacement:");
proxyTarget(5, 5);

// Now we can replace the implementation
mutable.fn = function(m, n) {
  console.log("New implementation via mutable reference");
  return m * n;
};

console.log("\nAfter replacement:");
proxyTarget(5, 5);

// Method 5: The only true way - modifying the function's internal [[Code]]
// This is not possible in JavaScript without native extensions
console.log("\n=== Note ===");
console.log("True in-place function body replacement (keeping the exact same reference)");
console.log("is not possible in standard JavaScript. The function object's internal");
console.log("[[Code]] property cannot be modified after creation.");
console.log("\nWorkarounds include:");
console.log("1. Wrapper functions with delegation");
console.log("2. Proxy objects");
console.log("3. Reassigning the function (breaks references)");
console.log("4. Using eval with mutable closures");