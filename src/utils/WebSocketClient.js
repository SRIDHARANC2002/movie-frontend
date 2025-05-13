/**
 * Simple WebSocket Client
 * This is a lightweight wrapper around the browser's native WebSocket API
 */

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      debug: true,
      ...options
    };
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = [];
    this.eventHandlers = {
      open: [],
      close: [],
      error: []
    };
    
    // Connect immediately if autoConnect is true
    if (options.autoConnect !== false) {
      this.connect();
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  connect() {
    try {
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }
      
      // Create a new WebSocket connection
      this.socket = new WebSocket(this.url);
      
      if (this.options.debug) {
        console.log(`Attempting to connect to WebSocket server at ${this.url}`);
      }
      
      // Set up event handlers
      this.socket.onopen = (event) => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        if (this.options.debug) {
          console.log(`WebSocket connection established to ${this.url}`);
        }
        
        // Call all registered open handlers
        this.eventHandlers.open.forEach(handler => handler(event));
      };
      
      this.socket.onmessage = (event) => {
        if (this.options.debug) {
          console.log(`WebSocket message received:`, event.data);
        }
        
        // Parse the message if it's JSON
        let parsedData;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          parsedData = event.data;
        }
        
        // Call all registered message handlers
        this.messageHandlers.forEach(handler => handler(parsedData, event));
      };
      
      this.socket.onclose = (event) => {
        this.isConnected = false;
        
        if (this.options.debug) {
          console.log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`);
        }
        
        // Call all registered close handlers
        this.eventHandlers.close.forEach(handler => handler(event));
        
        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        if (this.options.debug) {
          console.error(`WebSocket error occurred:`, error);
        }
        
        // Call all registered error handlers
        this.eventHandlers.error.forEach(handler => handler(error));
      };
      
      return true;
    } catch (error) {
      console.error(`Failed to create WebSocket connection:`, error);
      return false;
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  attemptReconnect() {
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      if (this.options.debug) {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
      }
      
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.log(`Max reconnect attempts (${this.options.maxReconnectAttempts}) reached. Giving up.`);
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param {any} data - The data to send (will be JSON stringified if not a string)
   * @returns {boolean} - Whether the message was sent successfully
   */
  send(data) {
    if (!this.isConnected || !this.socket) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      
      if (this.options.debug) {
        console.log(`WebSocket message sent:`, message);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to send WebSocket message:`, error);
      return false;
    }
  }
  
  /**
   * Register a handler for WebSocket messages
   * @param {Function} handler - The handler function
   */
  onMessage(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
    }
  }
  
  /**
   * Register a handler for WebSocket open events
   * @param {Function} handler - The handler function
   */
  onOpen(handler) {
    if (typeof handler === 'function') {
      this.eventHandlers.open.push(handler);
    }
  }
  
  /**
   * Register a handler for WebSocket close events
   * @param {Function} handler - The handler function
   */
  onClose(handler) {
    if (typeof handler === 'function') {
      this.eventHandlers.close.push(handler);
    }
  }
  
  /**
   * Register a handler for WebSocket error events
   * @param {Function} handler - The handler function
   */
  onError(handler) {
    if (typeof handler === 'function') {
      this.eventHandlers.error.push(handler);
    }
  }
  
  /**
   * Close the WebSocket connection
   * @param {number} code - The close code (default: 1000)
   * @param {string} reason - The close reason
   */
  disconnect(code = 1000, reason = 'Normal closure') {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
      this.isConnected = false;
      
      if (this.options.debug) {
        console.log(`WebSocket connection closed manually`);
      }
    }
  }
}

export default WebSocketClient;
