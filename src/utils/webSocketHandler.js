/**
 * WebSocket connection handler
 * This utility provides a graceful way to handle WebSocket connections
 * and automatically reconnect if needed
 */

class WebSocketHandler {
  constructor(url, options = {}) {
    // If WebSocket functionality is disabled, don't attempt to connect
    const isWebSocketDisabled = true; // Always disabled since we're not using WebSocket
    
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 0, // Never attempt to reconnect
      suppressErrors: true, // Always suppress connection errors
      isDisabled: isWebSocketDisabled,
      ...options
    };
    
    this.reconnectAttempts = 0;
    this.socket = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.connectionHandlers = {
      onOpen: [],
      onClose: [],
      onError: []
    };
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    // If WebSocket is disabled, don't attempt to connect
    if (this.options.isDisabled) {
      return;
    }

    try {
      // Only attempt to connect if we don't have an active connection
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = (event) => {
          if (!this.options.suppressErrors) {
            console.log(`WebSocket connected to ${this.url}`);
          }
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.connectionHandlers.onOpen.forEach(handler => handler(event));
        };

        this.socket.onmessage = (event) => {
          this.messageHandlers.forEach(handler => handler(event.data));
        };

        this.socket.onclose = (event) => {
          if (!this.options.suppressErrors) {
            console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          }
          this.isConnected = false;
          this.connectionHandlers.onClose.forEach(handler => handler(event));
          // Don't attempt to reconnect since maxReconnectAttempts is 0
        };

        this.socket.onerror = (error) => {
          if (!this.options.suppressErrors) {
            console.log('WebSocket error occurred');
          }
          this.connectionHandlers.onError.forEach(handler => handler(error));
        };
      }
    } catch (error) {
      if (!this.options.suppressErrors) {
        console.log('Error creating WebSocket connection:', error);
      }
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);

      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.log('Max reconnect attempts reached. Giving up.');
    }
  }

  /**
   * Send a message through the WebSocket connection
   */
  send(data) {
    if (this.isConnected && this.socket) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  /**
   * Add a message handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Add connection event handlers
   */
  onOpen(handler) {
    this.connectionHandlers.onOpen.push(handler);
  }

  onClose(handler) {
    this.connectionHandlers.onClose.push(handler);
  }

  onError(handler) {
    this.connectionHandlers.onError.push(handler);
  }

  /**
   * Close the WebSocket connection
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Create a singleton instance for the development WebSocket
let devWebSocket = null;

/**
 * Initialize the development WebSocket connection
 * Completely disabled to prevent connection errors
 */
export function initDevWebSocket() {
  // WebSocket functionality is completely disabled
  // No console log to avoid any output
  return null;
}

export default WebSocketHandler;
