import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-muted-foreground">Loading...</div>}>
      <App />
    </Suspense>
  </StrictMode>,
)
