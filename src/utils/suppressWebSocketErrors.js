/**
 * This utility suppresses WebSocket connection errors in the console
 * It's useful for development environments where WebSocket connections
 * might fail but aren't critical for the application to function
 */

// Store the original console.error function
const originalConsoleError = console.error;

// Override console.error to filter out WebSocket connection errors
console.error = function(...args) {
  // Check if this is a WebSocket connection error
  const isWebSocketError = args.some(arg => 
    typeof arg === 'string' && 
    (arg.includes('WebSocket connection') || 
     arg.includes('ws://localhost'))
  );

  // If it's not a WebSocket error, pass it through to the original console.error
  if (!isWebSocketError) {
    originalConsoleError.apply(console, args);
  }
};

export default function setupWebSocketErrorSuppression() {
  // This function doesn't need to do anything since the console.error override
  // happens when this module is imported
  console.log('WebSocket error suppression enabled');
}
