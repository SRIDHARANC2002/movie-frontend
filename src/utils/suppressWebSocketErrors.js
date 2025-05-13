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
      arg.includes('WebSocketClient')
    )
  );

  // If it's a WebSocket error, completely suppress it
  if (!isWebSocketError) {
    // For all other errors, pass them through to the original console.error
    originalConsoleError.apply(console, args);
  }
};

export default function setupWebSocketErrorSuppression() {
  // This function doesn't need to do anything since the console.error override
  // happens when this module is imported
  console.log('WebSocket errors are now completely suppressed');
}
