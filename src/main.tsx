import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initAgentTheme } from './theme';

initAgentTheme();

if (typeof window !== 'undefined') {
  document.documentElement.dataset.inputModality = 'pointer';
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      document.documentElement.dataset.inputModality = 'keyboard';
    }
  }, true);
  window.addEventListener('pointerdown', () => {
    document.documentElement.dataset.inputModality = 'pointer';
  }, true);
  window.addEventListener('mousedown', () => {
    document.documentElement.dataset.inputModality = 'pointer';
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
