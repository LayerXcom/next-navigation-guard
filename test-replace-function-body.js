// POC: Replace function body while keeping its reference

// Original function
function myFunction() {
  console.log("Original function body");
  return "original";
}

// Store reference
const functionRef = myFunction;

// Display original behavior
console.log("=== Before replacement ===");
console.log("Function name:", myFunction.name);
console.log("Reference check:", functionRef === myFunction);
myFunction();
console.log("Return value:", myFunction());

// Replace function body by converting to string and creating new function
const originalFunctionString = myFunction.toString();
const functionName = myFunction.name;
const newBody = `
  console.log("Replaced function body");
  return "replaced";
`;

// Method 1: Using eval (not recommended for production)
eval(`myFunction = function ${functionName}() {${newBody}}`);  // Added braces for function body

console.log("\n=== After replacement (Method 1) ===");
console.log("Function name:", myFunction.name);
console.log("Reference check:", functionRef === myFunction, "(reference broken)");
myFunction();
console.log("Return value:", myFunction());

// Method 2: Modifying the function's prototype and internal behavior
// Reset to original
myFunction = functionRef;

// Create a wrapper that preserves the reference
const originalFunction = myFunction;
const handler = {
  apply: function(target, thisArg, argumentsList) {
    console.log("Intercepted function call - replaced body");
    return "intercepted";
  }
};

// Create proxy to intercept calls while keeping same reference
const proxyFunction = new Proxy(originalFunction, handler);

// This doesn't work as we can't reassign the original reference
// But we can demonstrate the concept

console.log("\n=== Using Proxy (Method 2) ===");
console.log("Proxy function name:", proxyFunction.name);
proxyFunction();
console.log("Return value:", proxyFunction());

// Method 3: Monkey patching by modifying shared state
let functionBehavior = "original";

function statefulFunction() {
  if (functionBehavior === "original") {
    console.log("Original stateful function body");
    return "original";
  } else {
    console.log("Replaced stateful function body");
    return "replaced";
  }
}

console.log("\n=== Stateful function (Method 3) ===");
console.log("Before state change:");
statefulFunction();

functionBehavior = "replaced";
console.log("\nAfter state change:");
statefulFunction();
console.log("Reference preserved:", statefulFunction === statefulFunction);

// Method 4: Using closure to modify behavior
function createModifiableFunction() {
  let implementation = () => {
    console.log("Original implementation");
    return "original";
  };
  
  const wrapper = function modifiableFunction() {
    return implementation();
  };
  
  wrapper.replaceImplementation = (newImpl) => {
    implementation = newImpl;
  };
  
  return wrapper;
}

const modifiable = createModifiableFunction();

console.log("\n=== Modifiable function with closure (Method 4) ===");
console.log("Before replacement:");
modifiable();

modifiable.replaceImplementation(() => {
  console.log("Replaced implementation via closure");
  return "replaced via closure";
});

console.log("\nAfter replacement:");
modifiable();
console.log("Reference preserved:", modifiable === modifiable);