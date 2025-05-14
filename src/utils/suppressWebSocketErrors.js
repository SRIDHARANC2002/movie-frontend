/**
 * This utility completely suppresses WebSocket connection errors in the console
 * WebSocket functionality has been disabled, but this ensures any remaining errors are hidden
 */

// Store the original console.error function
const originalConsoleError = console.error;

// Override console.error to completely suppress WebSocket connection errors
console.error = function(...args) {
  // Check if this is a WebSocket connection error
  const isWebSocketError = args.some(arg =>
    typeof arg === 'string' &&
    (
      arg.includes('WebSocket') ||
      arg.includes('ws://') ||
      arg.includes('wss://') ||
      arg.includes('WebSocketClient') ||
      arg.includes('Failed to construct \'WebSocket\'') ||
      arg.includes('WebSocket connection to') ||
      arg.includes('WebSocket connection failed')
    )
  );

  // If it's a WebSocket error, completely suppress it
  if (!isWebSocketError) {
    // For all other errors, pass them through to the original console.error
    originalConsoleError.apply(console, args);
  }
};

// Also suppress WebSocket warnings
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
  // Check if this is a WebSocket warning
  const isWebSocketWarning = args.some(arg =>
    typeof arg === 'string' &&
    (
      arg.includes('WebSocket') ||
      arg.includes('ws://') ||
      arg.includes('wss://')
    )
  );

  // If it's a WebSocket warning, completely suppress it
  if (!isWebSocketWarning) {
    // For all other warnings, pass them through to the original console.warn
    originalConsoleWarn.apply(console, args);
  }
};

export default function setupWebSocketErrorSuppression() {
  // This function doesn't need to do anything since the console.error override
  // happens when this module is imported
  console.log('WebSocket errors and warnings are now completely suppressed');
}
