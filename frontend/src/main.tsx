import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Inter with optical sizing (opsz): display cuts at large sizes, text cuts at small sizes.
import '@fontsource-variable/inter/opsz.css';
import '@/design-system/styles/index.css';
import { App } from '@/app/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
