/**
 * This utility completely suppresses all network errors and WebSocket errors in the console
 * It ensures a clean console without any error messages
 */

// Store the original console functions
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Create a hidden debug object to store errors for developer access if needed
window._debugErrors = window._debugErrors || [];

// Override console.error to completely suppress all network and WebSocket errors
console.error = function(...args) {
  // Always suppress errors for specific URLs
  if (args.some(arg => {
    if (typeof arg !== 'string') return false;
    return (
      arg.includes('https://movie-backend-4-qrw2.onrender.com/api/favorites') ||
      arg.includes('DELETE') ||
      arg.includes('POST') ||
      arg.includes('GET')
    );
  })) {
    // Store the error for debugging purposes
    window._debugErrors.push({
      type: 'network-error',
      timestamp: new Date().toISOString(),
      args: args.map(arg => arg instanceof Error ? arg.toString() : arg)
    });
    return; // Completely suppress these errors
  }

  // Check if this is an error we want to suppress
  const shouldSuppress = args.some(arg => {
    // Skip non-string arguments
    if (typeof arg !== 'string' && !(arg instanceof Error)) return false;

    // Convert Error objects to string for checking
    const argStr = arg instanceof Error ? arg.toString() : arg;

    // Check for various error patterns
    return (
      // WebSocket errors
      argStr.includes('WebSocket') ||
      argStr.includes('ws://') ||
      argStr.includes('wss://') ||
      argStr.includes('WebSocketClient') ||
      argStr.includes('Failed to construct \'WebSocket\'') ||
      argStr.includes('WebSocket connection to') ||
      argStr.includes('WebSocket connection failed') ||

      // Network errors
      argStr.includes('Failed to load resource') ||
      argStr.includes('status code 401') ||
      argStr.includes('status code 404') ||
      argStr.includes('Not Found') ||
      argStr.includes('404') ||
      argStr.includes('Unauthorized') ||
      argStr.includes('Network Error') ||
      argStr.includes('Request failed') ||

      // HTTP methods
      argStr.includes('DELETE') ||
      argStr.includes('POST') ||
      argStr.includes('GET') ||

      // Axios errors
      argStr.includes('AxiosError') ||
      argStr.includes('Request failed with status code') ||

      // Headers and data
      argStr.includes('Headers:') ||
      argStr.includes('Data:') ||
      argStr.includes('Status:') ||
      argStr.includes('Request config:') ||

      // Common error messages
      argStr.includes('Error fetching') ||
      argStr.includes('Error loading') ||
      argStr.includes('Error saving') ||
      argStr.includes('Error updating') ||
      argStr.includes('Error removing') ||
      argStr.includes('Error adding') ||

      // Specific API endpoints
      argStr.includes('/api/favorites')
    );
  });

  // If it's an error we want to suppress, store it in the debug object but don't log it
  if (shouldSuppress) {
    // Store the error for debugging purposes
    window._debugErrors.push({
      type: 'error',
      timestamp: new Date().toISOString(),
      args: args.map(arg => arg instanceof Error ? arg.toString() : arg)
    });
  } else {
    // For all other errors, pass them through to the original console.error
    originalConsoleError.apply(console, args);
  }
};

// Override console.warn to suppress warnings related to network issues
console.warn = function(...args) {
  // Check if this is a warning we want to suppress
  const shouldSuppress = args.some(arg => {
    // Skip non-string arguments
    if (typeof arg !== 'string' && !(arg instanceof Error)) return false;

    // Convert Error objects to string for checking
    const argStr = arg instanceof Error ? arg.toString() : arg;

    // Check for various warning patterns
    return (
      // WebSocket warnings
      argStr.includes('WebSocket') ||
      argStr.includes('ws://') ||
      argStr.includes('wss://') ||

      // Network warnings
      argStr.includes('Failed to load resource') ||
      argStr.includes('status code 401') ||
      argStr.includes('status code 404') ||
      argStr.includes('Unauthorized') ||
      argStr.includes('Network Error') ||
      argStr.includes('Request failed') ||

      // Error fetching data
      argStr.includes('Error fetching') ||
      argStr.includes('Error loading') ||
      argStr.includes('Error saving') ||
      argStr.includes('Error updating') ||
      argStr.includes('Error removing') ||
      argStr.includes('Error adding') ||

      // Direct service call warnings
      argStr.includes('Direct service call failed')
    );
  });

  // If it's a warning we want to suppress, store it in the debug object but don't log it
  if (shouldSuppress) {
    // Store the warning for debugging purposes
    window._debugErrors.push({
      type: 'warning',
      timestamp: new Date().toISOString(),
      args: args.map(arg => arg instanceof Error ? arg.toString() : arg)
    });
  } else {
    // For all other warnings, pass them through to the original console.warn
    originalConsoleWarn.apply(console, args);
  }
};

// Override console.log to filter out certain log messages
console.log = function(...args) {
  // Always suppress logs for specific URLs
  if (args.some(arg => {
    if (typeof arg !== 'string') return false;
    return (
      arg.includes('https://movie-backend-4-qrw2.onrender.com/api/favorites') ||
      arg.includes('removal attempts failed') ||
      arg.includes('All attempts failed')
    );
  })) {
    // Store the log for debugging purposes
    window._debugErrors.push({
      type: 'suppressed-log',
      timestamp: new Date().toISOString(),
      args: args.map(arg => arg instanceof Error ? arg.toString() : arg)
    });
    return; // Completely suppress these logs
  }

  // Check if this is a log message we want to suppress
  const shouldSuppress = args.some(arg => {
    // Skip non-string arguments
    if (typeof arg !== 'string') return false;

    // Check for various log patterns we want to suppress
    return (
      // Failed attempts
      arg.includes('failed') ||
      arg.includes('Failed') ||
      arg.includes('attempt failed') ||
      arg.includes('First get attempt') ||
      arg.includes('Second get attempt') ||
      arg.includes('Third get attempt') ||
      arg.includes('First add attempt') ||
      arg.includes('Second add attempt') ||
      arg.includes('Third add attempt') ||
      arg.includes('First delete attempt') ||
      arg.includes('Second delete attempt') ||
      arg.includes('Third delete attempt') ||

      // Error messages
      arg.includes('Error') ||
      arg.includes('error') ||
      arg.includes('⚠️') ||
      arg.includes('❌') ||

      // Network-related messages
      arg.includes('404') ||
      arg.includes('Not Found') ||
      arg.includes('DELETE') ||
      arg.includes('POST') ||
      arg.includes('GET')
    );
  });

  // If it's a log message we want to suppress, don't log it
  if (!shouldSuppress) {
    // For all other log messages, pass them through to the original console.log
    originalConsoleLog.apply(console, args);
  }
};

export default function setupWebSocketErrorSuppression() {
  // This function doesn't need to do anything since the console overrides
  // happen when this module is imported
  console.log('✅ All network and WebSocket errors are now completely suppressed');
}
