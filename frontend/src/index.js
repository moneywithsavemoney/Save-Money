import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Capacitor Android/iOS অ্যাপে ক্র্যাশ এড়াতে সার্ভিস ওয়ার্কার Unregister করতে হবে
serviceWorkerRegistration.unregister();

reportWebVitals();
