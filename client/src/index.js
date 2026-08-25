import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { JourneyProvider } from './contexts/JourneyContext';
import { MapsProvider } from './contexts/MapsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MapsProvider>
          <JourneyProvider>
            <App />
          </JourneyProvider>
        </MapsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
