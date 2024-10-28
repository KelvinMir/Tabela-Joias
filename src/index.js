import React from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App.js';

const root = createRoot(document.getElementById('root'));
root.render(
  <Router basename="/Tabela-Joias">
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  </Router>
);

