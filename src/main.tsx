import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
<<<<<<< HEAD
<<<<<<< HEAD

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
=======
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
import { AuthProvider } from './contexts/AuthContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
<<<<<<< HEAD
>>>>>>> origin/Shubh
=======
>>>>>>> 787091f9f38680e0d38925c2fcaef447ce69b9f6
  </StrictMode>,
)
