import './style.css';
import { App } from './ui/app.ts';

const root = document.getElementById('app');
if (root) {
  const app = new App(root);
  app.goTitle();
  // Expose for debugging from the console (`__vimlore.progress`, etc).
  (window as unknown as { __vimlore: App }).__vimlore = app;
}
