import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { CacheProvider } from './context/CacheContext'

createRoot(document.getElementById('root')).render(
  <CacheProvider>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </CacheProvider>,
)
