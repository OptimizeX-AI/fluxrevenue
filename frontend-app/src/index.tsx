// src/index.tsx - ENTERPRISE APPLICATION BOOTSTRAP SIMPLIFICADO

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// === ENVIRONMENT SETUP ===
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

console.log(`🚀 Flux Revenue Dashboard v2.0.0`);
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`⚡ React Version: ${React.version}`);

// === PERFORMANCE MONITORING SIMPLES ===
const startTime = performance.now();

// Core Web Vitals - Simple Implementation
const observeWebVitals = () => {
  if ('PerformanceObserver' in window) {
    try {
      // FCP - First Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log(`📊 FCP: ${entry.startTime.toFixed(2)}ms`);
        });
      }).observe({ entryTypes: ['paint'] });

      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('⚠️ Performance monitoring not supported:', error);
    }
  }
};

// === ERROR TRACKING SIMPLES ===
const setupErrorTracking = () => {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Send to monitoring service in production only
    if (isProduction && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(event.error);
    }
  });

  // Promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    if (isProduction && typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(event.reason);
    }
  });

  console.log('✅ Error tracking initialized');
};

// === BROWSER COMPATIBILITY CHECK ===
const checkBrowserSupport = (): boolean => {
  const requiredFeatures = {
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    localStorage: (() => {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    es6: (() => {
      try {
        // Test arrow functions and const/let
        eval('const test = () => true; test();');
        return true;
      } catch {
        return false;
      }
    })()
  };

  const unsupported = Object.entries(requiredFeatures)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature);

  if (unsupported.length > 0) {
    console.error('❌ Browser não suportado. Recursos faltando:', unsupported);
    
    // Show fallback for unsupported browsers
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F2F2F7;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        text-align: center;
        padding: 24px;
      ">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 48px;
          max-width: 400px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        ">
          <h2 style="color: #FF3B30; margin: 0 0 16px 0;">Browser Não Suportado</h2>
          <p style="color: #6D6D70; margin: 0 0 24px 0;">
            Por favor, atualize seu navegador para usar o Flux Revenue Dashboard.
          </p>
          <a href="https://browsehappy.com/" target="_blank" style="
            background: #007AFF;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            display: inline-block;
          ">Atualizar Navegador</a>
        </div>
      </div>
    `;
    return false;
  }

  console.log('✅ Browser compatível');
  return true;
};

// === SERVICE WORKER SIMPLES ===
const setupServiceWorker = async () => {
  if ('serviceWorker' in navigator && isProduction) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
    } catch (error) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
};

// === MAIN INITIALIZATION ===
const initializeApp = async () => {
  try {
    console.log('🔧 Initializing Flux Revenue Dashboard...');

    // 1. Check browser support
    if (!checkBrowserSupport()) {
      return;
    }

    // 2. Setup error tracking
    setupErrorTracking();

    // 3. Setup performance monitoring
    observeWebVitals();

    // 4. Get root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // 5. Create React root
    const root = ReactDOM.createRoot(rootElement);

    // 6. Setup service worker
    await setupServiceWorker();

    // 7. Render application
    console.log('🎨 Rendering Flux Revenue App...');
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // 8. Log successful initialization
    const initTime = performance.now() - startTime;
    console.log(`✅ Flux Revenue Dashboard loaded in ${initTime.toFixed(2)}ms`);

  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    
    // Show fallback error UI
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #F2F2F7;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        text-align: center;
        padding: 24px;
      ">
        <div style="
          background: white;
          border-radius: 20px;
          padding: 48px;
          max-width: 400px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        ">
          <h2 style="color: #FF3B30; margin: 0 0 16px 0;">Erro na Inicialização</h2>
          <p style="color: #6D6D70; margin: 0 0 24px 0;">
            Não foi possível carregar o Flux Revenue Dashboard. Tente recarregar a página.
          </p>
          <button onclick="window.location.reload()" style="
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
          ">Recarregar</button>
        </div>
      </div>
    `;
  }
};

// === START APPLICATION ===
initializeApp();
