// This file replaces the WebSocket client with a no-op implementation
// to prevent unnecessary connection attempts when WebSocket features are not needed

class WebSocketClient {
  constructor() {
    this.isConnected = false;
  }

  connect() {
    // Do nothing - WebSocket functionality is disabled
    return Promise.resolve();
  }

  disconnect() {
    // Do nothing - WebSocket functionality is disabled
    return Promise.resolve();
  }

  send() {
    // Do nothing - WebSocket functionality is disabled
    return Promise.resolve();
  }
}

export default WebSocketClient;
