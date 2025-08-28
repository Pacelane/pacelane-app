import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize i18n
import './services/i18n.js'

createRoot(document.getElementById("root")!).render(<App />);
