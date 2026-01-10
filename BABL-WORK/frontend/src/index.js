import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import App from './App';
import store from './store/store';

function renderApp() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root container not found. Waiting for DOMContentLoaded...');
    return false;
  }
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </React.StrictMode>
  );
  return true;
}

if (!renderApp()) {
  window.addEventListener('DOMContentLoaded', () => {
    renderApp();
  });
}