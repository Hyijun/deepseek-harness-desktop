import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import { ToastProvider } from './components/toast-provider'
import './style/main.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>,
)
