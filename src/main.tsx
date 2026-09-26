import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
<<<<<<< HEAD

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
=======
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
>>>>>>> origin/Shubh
  </StrictMode>,
)
