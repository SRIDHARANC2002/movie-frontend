/**
 * WebSocket connection handler
 * This utility provides a graceful way to handle WebSocket connections
 * and automatically reconnect if needed
 */

class WebSocketHandler {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
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
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = (event) => {
        console.log(`WebSocket connected to ${this.url}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionHandlers.onOpen.forEach(handler => handler(event));
      };

      this.socket.onmessage = (event) => {
        this.messageHandlers.forEach(handler => handler(event.data));
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.connectionHandlers.onClose.forEach(handler => handler(event));
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.log('WebSocket error occurred');
        this.connectionHandlers.onError.forEach(handler => handler(error));
      };
    } catch (error) {
      console.log('Error creating WebSocket connection:', error);
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
 * Currently disabled to prevent connection errors
 */
export function initDevWebSocket() {
  // WebSocket functionality is disabled
  console.log('WebSocket functionality is disabled');

  // Return null instead of attempting to connect
  return null;
}

export default WebSocketHandler;
