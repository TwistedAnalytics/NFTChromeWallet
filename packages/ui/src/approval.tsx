import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApprovalPrompt } from './components/ApprovalPrompt';
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ApprovalPrompt />
    </React.StrictMode>
  );
}
