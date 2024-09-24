import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import '@solana/wallet-adapter-react-ui/styles.css';  // Wallet adapter styles

// Create root only once and do not pass the container again to root.render
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
