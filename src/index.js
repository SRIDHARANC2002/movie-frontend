import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "./store/store";
import App from "./App";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import reportWebVitals from "./reportWebVitals";
import { LanguageProvider } from "./context/Language";
// Import WebSocket error suppression utility
import setupWebSocketErrorSuppression from "./utils/suppressWebSocketErrors";
// Import WebSocket handler
import { initDevWebSocket } from "./utils/webSocketHandler";

// Setup WebSocket error suppression
setupWebSocketErrorSuppression();

// Initialize development WebSocket connection with graceful error handling
if (process.env.NODE_ENV === 'development') {
  initDevWebSocket();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

reportWebVitals();
