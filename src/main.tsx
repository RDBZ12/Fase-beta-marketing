import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PayPalScriptProvider options={{
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID as string,
      currency: 'USD',
    }}>
      <App />
    </PayPalScriptProvider>
  </StrictMode>,
)
