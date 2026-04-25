import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { useThemeStore } from './store/useThemeStore.js'
import './index.css'

const theme = useThemeStore.getState().theme
document.documentElement.setAttribute('data-theme', theme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)