import '@training/ui/styles/index.css';
import '@training/ui/fonts';
import './app.css';

import { createApp } from './app.ts';
import { registerServiceWorker } from './offline.ts';

const root = document.getElementById('app');
if (root) {
  createApp(root);
  registerServiceWorker();
}
