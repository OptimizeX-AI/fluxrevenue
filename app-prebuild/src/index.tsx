// src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Log: início da execução do index.tsx
console.log('Iniciando index.tsx');

// 1. Confirme se o elemento root existe
const rootElement = document.getElementById('root');
console.log('Elemento root encontrado:', !!rootElement);

if (!rootElement) throw new Error('Root element not found');

// 2. Crie o root corretamente
const root = ReactDOM.createRoot(rootElement);
console.log('Root ReactDOM criado:', root);

// 3. Log antes de renderizar o App
console.log('Renderizando <App />...');

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log: fim da execução do index.tsx
console.log('index.tsx finalizado');
