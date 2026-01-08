import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initial render
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
