import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerPlugin, hydratePlugins } from './lib/pluginSystem/index.js'
import BechdelPlugin from './plugins/BechdelPlugin'
import CleanerPlugin from './plugins/CleanerPlugin'
import LinterPlugin from './plugins/LinterPlugin'

// Register plugin implementations so they're available in the pluginImplRegistry
registerPlugin(BechdelPlugin)
registerPlugin(CleanerPlugin)
registerPlugin(LinterPlugin)

// Hydrate any persisted plugin metadata and reattach implementations
hydratePlugins()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
