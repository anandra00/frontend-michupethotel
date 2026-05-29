import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>,
)
