/**
 * Plugin Manager - Interface para gerenciar plugins
 * Expose como modal opcional, não adiciona tab
 */

import React, { useState, useEffect } from 'react'
import { Cpu, X, Play } from 'lucide-react'
import { listPlugins, executePlugin } from '../lib/pluginSystem'
import { useCineWeaveAPI } from '../lib/pluginAPI'

export default function PluginManager({ projectId, onClose }) {
  const [plugins, setPlugins] = useState([])
  const [selectedPlugin, setSelectedPlugin] = useState(null)
  const [pluginLogs, setPluginLogs] = useState([])
  const [pluginResults, setPluginResults] = useState(null)
  const [pluginRunning, setPluginRunning] = useState(false)

  const { screenplay, log } = useCineWeaveAPI()

  useEffect(() => {
    const loadedPlugins = listPlugins()
    setPlugins(loadedPlugins)
    log('Plugins carregados')
  }, [])


  const handleRunPlugin = async (plugin) => {
    setSelectedPlugin(plugin)
    setPluginRunning(true)
    setPluginLogs([])
    setPluginResults(null)

    const logs = []
    const logMessage = (msg) => {
      const logEntry = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, message: msg, timestamp: Date.now() }
      logs.push(logEntry)
      setPluginLogs([...logs])
    }

    try {
      logMessage(`[Plugin] Inicializando plugin: ${plugin.name} v${plugin.version}...`)
      logMessage(`[Plugin] Tipo: ${plugin.type}`)

      const results = await executePlugin(plugin.id, {
        screenplay,
        projectId,
        api: { screenplay, log }
      })

      logMessage(`[Plugin] Plugin executado com sucesso`)
      logMessage(`[Plugin] Resultados retornados: ${JSON.stringify(results)}`)

      setPluginResults(results)
      logMessage(`[Plugin] Interface UI será exibida`)

    } catch (error) {
      logMessage(`[Plugin] ERRO: ${error.message}`)
      console.error('Plugin execution error:', error)
    } finally {
      setPluginRunning(false)
    }
  }

  const handleClose = () => {
    setSelectedPlugin(null)
    setPluginLogs([])
    setPluginResults(null)
    onClose?.()
  }

  return (
    <div className="plugin-manager-overlay">
      <div className="plugin-manager">
        <div className="plugin-manager-header">
          <div className="header-left">
            <Cpu size={24} />
            <h2>Plugin Store</h2>
          </div>
          <button onClick={handleClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        {!selectedPlugin ? (
          <>
            <div className="plugin-description">
              <p>Plugins que podem ser executados no seu roteiro. Todos os plugins são executados de forma isolada e não afetam seu trabalho atual.</p>
            </div>

            <div className="plugin-list">
              {plugins.length === 0 ? (
                <div className="no-plugins">
                  <p>Nenhum plugin instalado</p>
                  <small>Versão: 1.0.0</small>
                </div>
              ) : (
                plugins.map(plugin => (
                  <div key={plugin.id} className="plugin-card">
                    <div className="plugin-card-header">
                      <h3>{plugin.name}</h3>
                      <span className="plugin-version">v{plugin.version}</span>
                    </div>
                    <p className="plugin-description">{plugin.description}</p>
                    <div className="plugin-meta">
                      <span className={`plugin-type plugin-type-${plugin.type}`}>
                        {plugin.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRunPlugin(plugin)}
                      className="btn-primary btn-run-plugin"
                      disabled={pluginRunning}
                    >
                      {pluginRunning ? 'Executando...' : (
                        <>
                          <Play size={16} />
                          Executar Plugin
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="plugin-modal">
            <div className="plugin-modal-header">
              <div className="header-left">
                <Cpu size={24} />
                <div>
                  <h2>{selectedPlugin.name}</h2>
                  <small>v{selectedPlugin.version}</small>
                </div>
              </div>
              <button onClick={handleClose} className="btn-close">
                <X size={24} />
              </button>
            </div>

            <div className="plugin-modal-content">
              <div className="plugin-logs-section">
                <h4>Logs de Execução</h4>
                <div className="logs-container">
                  {pluginLogs.map(log => (
                    <div key={log.id} className="log-entry">
                      <span className="log-timestamp">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="log-message">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="plugin-result-section">
                <h4>Resultado</h4>
                {selectedPlugin.template ? (
                  <div className="plugin-result-template">
                    {selectedPlugin.template({ results: pluginResults, onClose: handleClose })}
                  </div>
                ) : (
                  <pre className="results-pre">
                    {JSON.stringify(pluginResults, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
