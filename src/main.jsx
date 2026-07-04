import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MaintenancePage from './MaintenancePage.jsx'

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isMaintenanceMode ? <MaintenancePage /> : <App />}
  </StrictMode>,
)
